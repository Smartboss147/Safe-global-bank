import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrencyAmount } from '../utils/currency';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Calendar,
  DollarSign,
  Coins,
  ShieldCheck,
  X,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionHistoryProps {
  user: any;
  limit?: number;
}

export default function TransactionHistory({ user, limit }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bank' | 'crypto' | 'deposits' | 'withdrawals'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [downloading, setDownloading] = useState(false);
  const [selectedAuditTx, setSelectedAuditTx] = useState<any | null>(null);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Fiat / Bank transactions from Supabase
      let bankQuery = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        bankQuery = bankQuery.limit(limit);
      }

      const { data: bankData, error: bankErr } = await bankQuery;

      // 2. Fetch Crypto transactions from Supabase
      let cryptoQuery = supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        cryptoQuery = cryptoQuery.limit(limit);
      }

      const { data: cryptoData, error: cryptoErr } = await cryptoQuery;

      if (bankErr && cryptoErr) {
        console.warn('Error fetching transactions from Supabase:', bankErr || cryptoErr);
        setError('Failed to load transaction history.');
      } else {
        const normalizedBank = (bankData || []).map((t: any) => ({
          ...t,
          categoryType: 'bank',
          formattedCategory: 'Bank / Fiat Transfer'
        }));

        const normalizedCrypto = (cryptoData || []).map((c: any) => {
          const isDep = c.type === 'deposit' || c.type === 'incoming';
          return {
            id: c.id,
            user_id: c.user_id,
            amount: c.amount,
            type: isDep ? 'deposit' : 'withdrawal',
            status: c.status || 'completed',
            description: `Crypto ${isDep ? 'Deposit' : 'Transfer Out'} (${c.asset || 'BTC'}) ${c.network ? 'via ' + c.network : ''}`,
            created_at: c.created_at,
            categoryType: 'crypto',
            asset: c.asset,
            network: c.network,
            address: c.address,
            formattedCategory: 'Crypto Wallet Transfer'
          };
        });

        // Combine both bank and crypto transaction feeds chronologically
        const combined = [...normalizedBank, ...normalizedCrypto].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setTransactions(combined);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching transactions:', err);
      setError('An error occurred while loading transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchTransactions();

    if (user?.id) {
      const channel1 = supabase
        .channel(`public:transactions:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => fetchTransactions(true)
        )
        .subscribe();

      const channel2 = supabase
        .channel(`public:crypto_transactions:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'crypto_transactions', filter: `user_id=eq.${user.id}` },
          () => fetchTransactions(true)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel1);
        supabase.removeChannel(channel2);
      };
    }
  }, [fetchTransactions, user?.id]);

  // Derived calculations
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'transfer_out' || t.type === 'debit' || t.type === 'transfer' || t.type === 'payment')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Filter transactions
  const filteredTransactions = transactions
    .filter(t => {
      // Category & Tab filter
      const isDeposit = t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'credit';
      const isWithdrawal = t.type === 'withdrawal' || t.type === 'transfer_out' || t.type === 'debit' || t.type === 'transfer' || t.type === 'payment';

      if (activeTab === 'bank' && t.categoryType !== 'bank') return false;
      if (activeTab === 'crypto' && t.categoryType !== 'crypto') return false;
      if (activeTab === 'deposits' && !isDeposit) return false;
      if (activeTab === 'withdrawals' && !isWithdrawal) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const typeMatch = (t.type || '').toLowerCase().includes(query);
        const amountMatch = (t.amount || '').toString().includes(query);
        const statusMatch = (t.status || '').toLowerCase().includes(query);
        const assetMatch = (t.asset || '').toLowerCase().includes(query);
        const refMatch = (t.id || '').toLowerCase().includes(query);
        return descMatch || typeMatch || amountMatch || statusMatch || assetMatch || refMatch;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === 'highest') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const handleDownloadStatement = (monthName: string, monthIndex: number, year: number) => {
    setDownloading(true);
    try {
      const doc = new jsPDF();

      const statementTransactions = transactions.filter(t => {
        if (!t.created_at) return false;
        const date = new Date(t.created_at);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });

      doc.setFontSize(20);
      doc.text(`Monthly Statement - ${monthName} ${year}`, 14, 22);

      doc.setFontSize(10);
      doc.text(`Account Holder ID: ${user?.id || 'N/A'}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

      if (statementTransactions.length === 0) {
        doc.setFontSize(12);
        doc.text("No transactions recorded for this billing period.", 14, 48);
      } else {
        const userCurr = user?.currency_code || user?.currency || user?.country || 'USD';
        const tableData = statementTransactions.map(t => [
          new Date(t.created_at).toLocaleDateString() + ' ' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          t.description || 'General Transaction',
          (t.type || '').toUpperCase(),
          (t.status || 'completed').toUpperCase(),
          `${t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'credit' ? '+' : '-'}${formatCurrencyAmount(t.amount, userCurr)}`
        ]);

        autoTable(doc, {
          startY: 44,
          head: [['Date & Time', 'Description', 'Type', 'Status', 'Amount']],
          body: tableData,
          headStyles: { fillColor: [10, 61, 54] },
          styles: { fontSize: 9 }
        });
      }

      doc.save(`Statement_${monthName}_${year}.pdf`);
    } catch (err) {
      console.error("Error generating statement PDF:", err);
      alert("Unable to download PDF statement. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const userCurr = user?.currency_code || user?.currency || user?.country || 'USD';
    const headers = ['Reference ID', 'Date', 'Type', 'Category', 'Description', 'Asset/Currency', 'Amount', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.id || 'N/A',
      t.created_at ? new Date(t.created_at).toISOString() : '',
      t.type || 'transaction',
      t.formattedCategory || 'General',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.asset || userCurr,
      t.amount || 0,
      t.status || 'completed'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Account_Transactions_Audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const isCreditType = (type?: string) => {
    const t = (type || '').toLowerCase();
    return t === 'deposit' || t === 'transfer_in' || t === 'credit';
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100/80 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-[#0A3D36]" size={26} />
            <span>Transaction History &amp; Audit Log</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time database ledger of bank transfers, crypto movements &amp; account credits</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <button 
            onClick={() => fetchTransactions(true)} 
            disabled={refreshing || loading}
            title="Refresh Ledger"
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition flex items-center justify-center disabled:opacity-50 border border-gray-200"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-200 disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => handleDownloadStatement('Current_Month', new Date().getMonth(), new Date().getFullYear())} 
            disabled={downloading || transactions.length === 0} 
            className="px-4 py-2 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={15} />
            <span>PDF Statement</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Deposits</p>
            <p className="text-xl font-black text-emerald-900 mt-1">
              {formatCurrencyAmount(totalDeposits, user?.currency_code || user?.currency || user?.country)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Withdrawals</p>
            <p className="text-xl font-black text-rose-900 mt-1">
              {formatCurrencyAmount(totalWithdrawals, user?.currency_code || user?.currency || user?.country)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Database Records</p>
            <p className="text-xl font-black text-slate-900 mt-1">{transactions.length} items</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Quick Monthly Statements Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Statements</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { month: 'August', index: 7, year: 2026 },
            { month: 'July', index: 6, year: 2026 },
            { month: 'June', index: 5, year: 2026 }
          ].map(item => (
            <button 
              key={item.month} 
              onClick={() => handleDownloadStatement(item.month, item.index, item.year)} 
              className="shrink-0 flex items-center gap-3 p-3.5 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/70 rounded-2xl transition w-48 text-left"
            >
              <div className="p-2 bg-red-100/80 text-red-600 rounded-xl shrink-0">
                <FileText size={18} />
              </div>
              <div className="truncate">
                <p className="font-bold text-xs text-gray-900">{item.month} {item.year}</p>
                <p className="text-[11px] text-gray-500">PDF Monthly Record</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-gray-50/80 p-2 rounded-2xl border border-gray-100">
        {/* Filter Tabs */}
        <div className="flex p-1 bg-white rounded-xl shadow-xs border border-gray-200/60 w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'all' ? 'bg-[#0A3D36] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            All Activity
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'bank' ? 'bg-[#0A3D36] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Bank / Fiat
          </button>
          <button 
            onClick={() => setActiveTab('crypto')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'crypto' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Crypto
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'deposits' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Deposits
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'withdrawals' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Withdrawals
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ref, desc, asset, amount..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0A3D36] outline-none"
            />
          </div>

          {/* Sort Select */}
          <select 
            value={sortBy} 
            onChange={(e: any) => setSortBy(e.target.value)}
            className="py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#0A3D36]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Filter className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="font-bold text-gray-700 text-sm">No transactions found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search criteria or active filter tab.' : 'Your account has no recorded transactions in the database.'}
            </p>
          </div>
        ) : (
          filteredTransactions.map(t => {
            const isCredit = isCreditType(t.type);
            const status = (t.status || 'completed').toLowerCase();
            const isCrypto = t.categoryType === 'crypto';

            return (
              <div 
                key={t.id || Math.random()} 
                onClick={() => setSelectedAuditTx(t)}
                className="flex items-center justify-between p-4 bg-gray-50/60 hover:bg-gray-100/80 border border-gray-100/80 hover:border-gray-300/80 rounded-2xl transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isCrypto 
                      ? 'bg-blue-100/80 text-blue-700 shadow-xs' 
                      : isCredit 
                        ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' 
                        : 'bg-rose-100/80 text-rose-700 shadow-xs'
                  }`}>
                    {isCrypto ? <Coins size={20} /> : isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#0A3D36] transition-colors">
                      {t.description || (isCredit ? 'Deposit / Transfer In' : 'Withdrawal / Payment')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span className="capitalize font-semibold text-gray-700">{t.formattedCategory || t.type}</span>
                      <span>•</span>
                      <span>{formatDate(t.created_at)}</span>
                      {t.id && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-gray-400 truncate max-w-[100px]">Ref: {t.id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <span className={`font-bold text-base sm:text-lg tracking-tight ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {isCredit ? '+' : '-'}{isCrypto && t.asset ? `${t.amount} ${t.asset}` : formatCurrencyAmount(t.amount, user?.currency_code || user?.currency || user?.country)}
                  </span>
                  <div className="mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TRANSACTION AUDIT MODAL */}
      {selectedAuditTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-[#0A3D36] rounded-2xl">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Transaction Audit Record</h3>
                  <p className="text-xs text-gray-500">Official Database Entry Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAuditTx(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Reference ID:</span>
                <span className="font-mono font-bold text-slate-800 select-all">{selectedAuditTx.id || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Date &amp; Timestamp:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedAuditTx.created_at)}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Transaction Type:</span>
                <span className="font-bold text-slate-800 capitalize">{selectedAuditTx.type}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Category / Source:</span>
                <span className="font-bold text-slate-800">{selectedAuditTx.formattedCategory || 'Account Activity'}</span>
              </div>

              {selectedAuditTx.network && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Blockchain Network:</span>
                  <span className="font-bold text-blue-700">{selectedAuditTx.network}</span>
                </div>
              )}

              {selectedAuditTx.address && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Destination Address:</span>
                  <span className="font-mono text-[11px] text-slate-800 truncate max-w-[200px] select-all">{selectedAuditTx.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Audit Status:</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                  <CheckCircle size={12} /> {selectedAuditTx.status || 'Completed'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900">Recorded Amount:</span>
              <span className="text-lg font-black text-emerald-800">
                {selectedAuditTx.categoryType === 'crypto' && selectedAuditTx.asset
                  ? `${selectedAuditTx.amount} ${selectedAuditTx.asset}`
                  : formatCurrencyAmount(selectedAuditTx.amount, user?.currency_code || user?.currency || user?.country)}
              </span>
            </div>

            <button
              onClick={() => setSelectedAuditTx(null)}
              className="w-full py-3 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              Close Audit Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

