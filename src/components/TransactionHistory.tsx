import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrencyAmount, getCurrencySymbol, getCurrencyInfo } from '../utils/currency';
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
  DollarSign
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
  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [downloading, setDownloading] = useState(false);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Error fetching transactions from Supabase:', fetchErr);
        setError('Failed to load transaction history.');
      } else {
        setTransactions(data || []);
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

    // Subscribe to realtime updates for this user's transactions if supported
    if (user?.id) {
      const channel = supabase
        .channel(`public:transactions:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
          () => {
            fetchTransactions(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
      // Tab filter
      const isDeposit = t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'credit';
      const isWithdrawal = t.type === 'withdrawal' || t.type === 'transfer_out' || t.type === 'debit' || t.type === 'transfer' || t.type === 'payment';

      if (activeTab === 'deposits' && !isDeposit) return false;
      if (activeTab === 'withdrawals' && !isWithdrawal) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const typeMatch = (t.type || '').toLowerCase().includes(query);
        const amountMatch = (t.amount || '').toString().includes(query);
        const statusMatch = (t.status || '').toLowerCase().includes(query);
        return descMatch || typeMatch || amountMatch || statusMatch;
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
      // default: newest
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
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Transaction History</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Real-time breakdown of deposits, withdrawals, and transfers</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={() => fetchTransactions(true)} 
            disabled={refreshing || loading}
            title="Refresh Transactions"
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button 
            onClick={() => handleDownloadStatement('Current_Month', new Date().getMonth(), new Date().getFullYear())} 
            disabled={downloading || transactions.length === 0} 
            className="px-4 py-2 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Download PDF</span>
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</p>
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
            { month: 'July', index: 6, year: 2026 },
            { month: 'June', index: 5, year: 2026 },
            { month: 'May', index: 4, year: 2026 }
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
        <div className="flex p-1 bg-white rounded-xl shadow-xs border border-gray-200/60 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'all' ? 'bg-[#0A3D36] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            All Activity
          </button>
          <button 
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'deposits' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Deposits
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'withdrawals' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
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
              placeholder="Search by description or amount..." 
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
              {searchTerm ? 'Try adjusting your search criteria or active filter tab.' : 'Your account has no recorded transactions yet.'}
            </p>
          </div>
        ) : (
          filteredTransactions.map(t => {
            const isCredit = isCreditType(t.type);
            const formattedAmount = Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const status = (t.status || 'completed').toLowerCase();

            return (
              <div 
                key={t.id || Math.random()} 
                className="flex items-center justify-between p-4 bg-gray-50/60 hover:bg-gray-50 border border-gray-100/80 rounded-2xl transition-all duration-150"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isCredit 
                      ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' 
                      : 'bg-rose-100/80 text-rose-700 shadow-xs'
                  }`}>
                    {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{t.description || (isCredit ? 'Deposit / Transfer In' : 'Withdrawal / Payment')}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span className="capitalize font-semibold text-gray-600">{t.type || 'Transaction'}</span>
                      <span>•</span>
                      <span>{formatDate(t.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <span className={`font-bold text-base sm:text-lg tracking-tight ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {isCredit ? '+' : '-'}{formatCurrencyAmount(t.amount, user?.currency_code || user?.currency || user?.country)}
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
    </div>
  );
}
