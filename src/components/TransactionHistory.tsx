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
  Calendar,
  DollarSign,
  ShieldCheck,
  X,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Filtering & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bank' | 'crypto' | 'deposits' | 'withdrawals'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [downloading, setDownloading] = useState(false);
  const [selectedAuditTx, setSelectedAuditTx] = useState<any | null>(null);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      let query = supabase
        .from('transaction_history_audit_log')
        .select('entry_id, entry_category, source_table, transaction_type, amount, currency, status, narration, reference, balance_after, occurred_at, details')
        .order('occurred_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      } else {
        query = query.limit(100);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // Also load local storage transactions/credits for instant sync
      let localTxs = [];
      try {
        const stored = localStorage.getItem(`safe_bank_local_txs_${user.id}`);
        if (stored) localTxs = JSON.parse(stored);
      } catch (e) {}

      const normalizedView = (data || []).map((row: any) => {
        const type = (row.transaction_type || row.entry_category || 'transaction').toLowerCase();
        const cat = (row.entry_category || '').toLowerCase();
        const isDep = type.includes('deposit') || type.includes('credit') || type.includes('in') || type.includes('receive') || type.includes('topup') || type.includes('add') || cat.includes('deposit') || cat.includes('credit');
        
        return {
          id: row.entry_id || row.reference || `TX-${Math.random().toString(36).substring(2, 9)}`,
          entry_id: row.entry_id,
          entry_category: row.entry_category || 'General',
          source_table: row.source_table || 'transactions',
          type: isDep ? 'deposit' : 'withdrawal',
          transaction_type: row.transaction_type || 'Credit',
          amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
          currency: row.currency || user?.currency_code || 'USD',
          status: row.status || 'completed',
          description: row.narration || row.transaction_type || row.entry_category || 'Account Credit',
          narration: row.narration || row.transaction_type || 'Account Credit',
          reference: row.reference,
          balance_after: row.balance_after,
          created_at: row.occurred_at || new Date().toISOString(),
          occurred_at: row.occurred_at,
          details: row.details,
          categoryType: cat.includes('crypto') ? 'crypto' : 'bank',
          formattedCategory: row.entry_category || 'Account Ledger'
        };
      });

      const normalizedLocal = localTxs.map((l: any) => ({
        id: l.id || `LOCAL-${Math.random()}`,
        entry_id: l.id,
        entry_category: l.formattedCategory || 'Bank / Fiat Deposit',
        source_table: 'local_storage',
        type: l.type || 'deposit',
        transaction_type: l.type || 'deposit',
        amount: Number(l.amount || 0),
        currency: user?.currency_code || 'USD',
        status: l.status || 'completed',
        description: l.description || 'Account Deposit / Credit',
        narration: l.description || 'Account Deposit / Credit',
        reference: l.id,
        balance_after: null,
        created_at: l.created_at || new Date().toISOString(),
        occurred_at: l.created_at || new Date().toISOString(),
        details: l,
        categoryType: 'bank',
        formattedCategory: 'Bank / Fiat Deposit'
      }));

      const combined = [...normalizedView, ...normalizedLocal];
      // Deduplicate by reference or id
      const unique = Array.from(new Map(combined.map(item => [item.id || item.reference, item])).values());
      unique.sort((a, b) => new Date(b.occurred_at || b.created_at || 0).getTime() - new Date(a.occurred_at || a.created_at || 0).getTime());

      setTransactions(unique);
    } catch (err: any) {
      console.error('Error loading transaction history audit log:', err);
      setErrorMessage(err.message || 'Failed to load transaction history audit log.');
      
      // Fallback to local storage if view query fails
      let localTxs = [];
      try {
        const stored = localStorage.getItem(`safe_bank_local_txs_${user.id}`);
        if (stored) localTxs = JSON.parse(stored);
      } catch (e) {}
      
      setTransactions(localTxs.map((l: any) => ({
        id: l.id || `LOCAL-${Math.random()}`,
        entry_id: l.id,
        entry_category: l.formattedCategory || 'Bank / Fiat Deposit',
        source_table: 'local_storage',
        type: l.type || 'deposit',
        transaction_type: l.type || 'deposit',
        amount: Number(l.amount || 0),
        currency: user?.currency_code || 'USD',
        status: l.status || 'completed',
        description: l.description || 'Account Deposit / Credit',
        narration: l.description || 'Account Deposit / Credit',
        reference: l.id,
        balance_after: null,
        created_at: l.created_at || new Date().toISOString(),
        occurred_at: l.created_at || new Date().toISOString(),
        details: l,
        categoryType: 'bank',
        formattedCategory: 'Bank / Fiat Deposit'
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchTransactions();

    if (user?.id) {
      const channel = supabase
        .channel(`public:transaction_history_audit_log:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => fetchTransactions(true)
        )
        .subscribe();

      const handleSync = () => fetchTransactions(true);
      window.addEventListener('user_registered_or_updated', handleSync);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('user_registered_or_updated', handleSync);
      };
    }
  }, [fetchTransactions, user?.id]);

  // Unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.entry_category).filter(Boolean)));

  const isCreditType = (type?: string, category?: string) => {
    const t = (type || '').toLowerCase();
    const c = (category || '').toLowerCase();
    return t.includes('deposit') || t.includes('credit') || t.includes('in') || t.includes('receive') || t.includes('topup') || t.includes('add') || c.includes('deposit') || c.includes('credit');
  };

  // Derived calculations
  const totalDeposits = transactions
    .filter(t => isCreditType(t.transaction_type || t.type, t.entry_category))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter(t => !isCreditType(t.transaction_type || t.type, t.entry_category))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Filter transactions
  const filteredTransactions = transactions
    .filter(t => {
      const isDeposit = isCreditType(t.transaction_type || t.type, t.entry_category);
      const isWithdrawal = !isDeposit;

      if (activeTab === 'bank' && t.categoryType !== 'bank') return false;
      if (activeTab === 'crypto' && t.categoryType !== 'crypto') return false;
      if (activeTab === 'deposits' && !isDeposit) return false;
      if (activeTab === 'withdrawals' && !isWithdrawal) return false;

      // Category filter
      if (selectedCategory !== 'all' && t.entry_category !== selectedCategory) {
        return false;
      }

      // Date range filter
      const tDate = new Date(t.occurred_at || t.created_at).getTime();
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (!isNaN(start) && tDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59').getTime();
        if (!isNaN(end) && tDate > end) return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const typeMatch = (t.transaction_type || '').toLowerCase().includes(query);
        const amountMatch = (t.amount || '').toString().includes(query);
        const statusMatch = (t.status || '').toLowerCase().includes(query);
        const catMatch = (t.entry_category || '').toLowerCase().includes(query);
        const refMatch = (t.reference || t.entry_id || '').toLowerCase().includes(query);
        return descMatch || typeMatch || amountMatch || statusMatch || catMatch || refMatch;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.occurred_at || a.created_at || 0).getTime() - new Date(b.occurred_at || b.created_at || 0).getTime();
      }
      if (sortBy === 'highest') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      return new Date(b.occurred_at || b.created_at || 0).getTime() - new Date(a.occurred_at || a.created_at || 0).getTime();
    });

  const handleDownloadStatement = (monthName: string, monthIndex: number, year: number) => {
    setDownloading(true);
    try {
      const doc = new jsPDF();

      const statementTransactions = transactions.filter(t => {
        const dt = t.occurred_at || t.created_at;
        if (!dt) return false;
        const date = new Date(dt);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });

      doc.setFontSize(20);
      doc.text(`Audit Statement - ${monthName} ${year}`, 14, 22);

      doc.setFontSize(10);
      doc.text(`Account Holder ID: ${user?.id || 'N/A'}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

      if (statementTransactions.length === 0) {
        doc.setFontSize(12);
        doc.text("No audit records recorded for this billing period.", 14, 48);
      } else {
        const userCurr = user?.currency_code || user?.currency || user?.country || 'USD';
        const tableData = statementTransactions.map(t => [
          new Date(t.occurred_at || t.created_at).toLocaleDateString() + ' ' + new Date(t.occurred_at || t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          t.narration || t.description || 'Audit Entry',
          (t.transaction_type || '').toUpperCase(),
          (t.status || 'completed').toUpperCase(),
          t.amount !== null ? `${isCreditType(t.transaction_type, t.entry_category) ? '+' : '-'}${t.amount} ${t.currency || userCurr}` : 'N/A'
        ]);

        autoTable(doc, {
          startY: 44,
          head: [['Date & Time', 'Narration / Description', 'Type', 'Status', 'Amount']],
          body: tableData,
          headStyles: { fillColor: [10, 61, 54] },
          styles: { fontSize: 9 }
        });
      }

      doc.save(`Audit_Statement_${monthName}_${year}.pdf`);
    } catch (err) {
      console.error("Error generating statement PDF:", err);
      alert("Unable to download PDF statement. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Entry ID', 'Category', 'Source Table', 'Type', 'Amount', 'Currency', 'Status', 'Narration', 'Reference', 'Occurred At'];
    const rows = filteredTransactions.map(t => [
      t.entry_id || 'N/A',
      t.entry_category || '',
      t.source_table || '',
      t.transaction_type || '',
      t.amount !== null ? t.amount : '',
      t.currency || '',
      t.status || '',
      `"${(t.narration || t.description || '').replace(/"/g, '""')}"`,
      t.reference || '',
      t.occurred_at || t.created_at ? new Date(t.occurred_at || t.created_at).toISOString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Transaction_History_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
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

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100/80 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-[#0A3D36]" size={26} />
            <span>Transaction History &amp; Audit Log</span>
          </h2>
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

      {/* Error Message State */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle size={20} className="shrink-0 text-rose-600" />
          <div>
            <p className="font-bold">Notice</p>
            <p className="text-xs mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Credits</p>
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
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Total Debits</p>
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Records</p>
            <p className="text-xl font-black text-slate-900 mt-1">{transactions.length} entries</p>
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
                <p className="text-[11px] text-gray-500">PDF Audit Statement</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search, Category & Date Range Filter Bar */}
      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Filter Tabs */}
          <div className="flex p-1 bg-white rounded-xl shadow-xs border border-gray-200/60 w-full md:w-auto overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'all' ? 'bg-[#0A3D36] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All Entries
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
              Credits
            </button>
            <button 
              onClick={() => setActiveTab('withdrawals')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${activeTab === 'withdrawals' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Debits
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search narration, ref..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0A3D36] outline-none"
              />
            </div>

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

        {/* Category & Date Range Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#0A3D36]"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-600">From:</span>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#0A3D36]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-600">To:</span>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#0A3D36]"
            />
          </div>

          {(selectedCategory !== 'all' || startDate || endDate || searchTerm || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
                setActiveTab('all');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions / Audit Log List */}
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
            <p className="font-bold text-gray-700 text-sm">No audit log entries found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || selectedCategory !== 'all' || startDate || endDate ? 'Try adjusting your search criteria, category filter, or date range.' : 'No audit records recorded yet.'}
            </p>
          </div>
        ) : (
          filteredTransactions.map(t => {
            const isCredit = isCreditType(t.transaction_type || t.type, t.entry_category);
            const status = (t.status || 'completed').toLowerCase();
            const hasAmount = t.amount !== null && t.amount !== undefined && !isNaN(Number(t.amount));
            const displayNarration = t.narration || t.description || 'Deposit / Credit';

            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedAuditTx(t)}
                className="flex items-center justify-between p-4 bg-gray-50/60 hover:bg-gray-100/80 border border-gray-100/80 hover:border-gray-300/80 rounded-2xl transition-all duration-150 cursor-pointer group"
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
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#0A3D36] transition-colors">
                      {displayNarration}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span className="capitalize font-semibold text-gray-700">{isCredit ? 'Credit' : 'Debit'}</span>
                      <span>•</span>
                      <span>{formatDate(t.occurred_at || t.created_at)}</span>
                      {t.reference && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">Ref: {t.reference}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  {hasAmount && (
                    <span className={`font-bold text-base sm:text-lg tracking-tight ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {isCredit ? '+' : '-'}{formatCurrencyAmount(t.amount, t.currency || user?.currency_code || user?.currency || user?.country)}
                    </span>
                  )}
                  {status && (
                    <div className="mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {status}
                      </span>
                    </div>
                  )}
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
                  <h3 className="font-bold text-base text-gray-900">Audit Log Record Details</h3>
                  <p className="text-xs text-gray-500">Verified Professional Ledger</p>
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
                <span className="font-mono font-bold text-slate-800 select-all">{selectedAuditTx.reference || selectedAuditTx.entry_id || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Narration:</span>
                <span className="font-bold text-slate-800">{selectedAuditTx.narration || selectedAuditTx.description}</span>
              </div>

              {selectedAuditTx.balance_after !== null && selectedAuditTx.balance_after !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Balance After:</span>
                  <span className="font-bold text-slate-800">{formatCurrencyAmount(selectedAuditTx.balance_after, selectedAuditTx.currency || user?.currency_code)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Occurred At:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedAuditTx.occurred_at || selectedAuditTx.created_at)}</span>
              </div>

              {selectedAuditTx.status && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                    <CheckCircle size={12} /> {selectedAuditTx.status}
                  </span>
                </div>
              )}
            </div>

            {selectedAuditTx.amount !== null && selectedAuditTx.amount !== undefined && (
              <div className="flex justify-between items-center p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-900">Amount &amp; Type:</span>
                <span className="text-lg font-black text-emerald-800">
                  {isCreditType(selectedAuditTx.transaction_type, selectedAuditTx.entry_category) ? '+' : '-'}{formatCurrencyAmount(selectedAuditTx.amount, selectedAuditTx.currency || user?.currency_code || user?.currency || user?.country)}
                </span>
              </div>
            )}

            <button
              onClick={() => setSelectedAuditTx(null)}
              className="w-full py-3 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
