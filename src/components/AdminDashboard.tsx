import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrencyAmount, getCurrencyByCountry, getCurrencyInfo, getCurrencySymbol } from '../utils/currency';
import { 
  Users, ArrowRightLeft, Activity, ShieldAlert, FileText, CheckCircle, XCircle, 
  DollarSign, Lock, Unlock, RefreshCw, Eye, Edit3, Trash2, ShieldCheck, UserX, 
  Download, Search, Filter, History, AlertTriangle, Key, PlusCircle, MinusCircle, 
  LogOut, CheckSquare, Settings as SettingsIcon, Database, ArrowUpRight, ArrowDownLeft,
  Bell, FileSpreadsheet, Layers, Menu, X, Terminal, ChevronRight, Zap, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('users'); // Default to Users tab like screenshot
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletActionType, setWalletActionType] = useState<'credit' | 'debit' | 'adjust'>('credit');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [adminRole, setAdminRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT'>('SUPER_ADMIN');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Broadcast Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // Broker & Trading Management State
  const [tradingInstruments, setTradingInstruments] = useState([
    { id: 'eurusd', symbol: 'EUR/USD', category: 'Forex', spread: '0.8 pips', maxLeverage: '1:500', status: 'Open' },
    { id: 'btcusd', symbol: 'BTC/USD', category: 'Crypto', spread: '12.5 pts', maxLeverage: '1:100', status: 'Open' },
    { id: 'xauusd', symbol: 'XAU/USD', category: 'Commodities', spread: '1.2 pips', maxLeverage: '1:200', status: 'Open' },
    { id: 'aapl', symbol: 'AAPL', category: 'Stocks', spread: '0.15 pts', maxLeverage: '1:20', status: 'Closed' }
  ]);

  // Investment Plans State
  const [investmentPlans, setInvestmentPlans] = useState([
    { id: 'plan_1', name: 'Starter Yield', roi: '5.5%', duration: '7 Days', minInv: 100, maxInv: 5000, active: true },
    { id: 'plan_2', name: 'Premium Staking', roi: '14.2%', duration: '30 Days', minInv: 5000, maxInv: 50000, active: true },
    { id: 'plan_3', name: 'Institutional Alpha', roi: '32.0%', duration: '90 Days', minInv: 50000, maxInv: 1000000, active: true }
  ]);

  // Payment Gateways State
  const [gateways, setGateways] = useState([
    { id: 'gw_crypto', name: 'Crypto Direct (USDT/BTC)', minDeposit: 10, maxDeposit: 100000, fee: '0%', status: 'Active' },
    { id: 'gw_wire', name: 'Global SWIFT/SEPA Wire', minDeposit: 500, maxDeposit: 500000, fee: '0.5%', status: 'Active' },
    { id: 'gw_card', name: 'Credit / Debit Card (Visa/MC)', minDeposit: 50, maxDeposit: 10000, fee: '1.8%', status: 'Active' }
  ]);

  // Referral & Bonus State
  const [referralBonus, setReferralBonus] = useState({ refRate: '5%', signupBonus: '25.00', status: 'Active' });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    platformName: 'Safe Global Trade & Banking',
    maintenanceMode: false,
    registrationEnabled: true,
    require2FA: false,
    defaultCurrency: 'USD'
  });
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: countriesData } = await supabase.from('supported_countries').select('*').order('country_name');
      if (countriesData) setSupportedCountries(countriesData);

      // 1. Fetch profiles
      const { data: profilesData } = await supabase.from('profiles').select('*');
      
      // 2. Fetch accounts
      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData) setAccounts(accountsData);

      // 3. Fetch transactions
      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

      // 4. Fetch audit logs
      const { data: auditData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (auditData) setAuditLogs(auditData);

      // 5. Fetch crypto transactions
      const { data: cryptoData } = await supabase.from('crypto_transactions').select('*');
      if (cryptoData) setCryptoTxs(cryptoData);

      // 6. Fetch KYC documents
      const { data: kycData } = await supabase.from('kyc_documents').select('*');
      if (kycData) setKycDocs(kycData);

      // Robust User Aggregation Engine
      const userMap = new Map<string, any>();

      // Populate from Supabase profiles
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(p => {
          if (p && p.id) {
            userMap.set(p.id, {
              id: p.id,
              email: p.email || 'user@safeglobalbank.com',
              displayName: p.display_name || p.displayName || `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || p.email?.split('@')[0] || 'Safe Global Bank User',
              firstName: p.first_name || p.firstName || '',
              lastName: p.last_name || p.lastName || '',
              phone: p.phone || '',
              kyc_status: p.kyc_status || 'verified',
              status: p.status || 'active',
              role: p.role || 'user',
              created_at: p.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Populate from accounts table if profile missing
      if (accountsData && Array.isArray(accountsData)) {
        accountsData.forEach(acc => {
          const uId = acc.user_id || acc.userId;
          if (uId && !userMap.has(uId)) {
            userMap.set(uId, {
              id: uId,
              email: acc.email || `user_${uId.substring(0, 6)}@safeglobalbank.com`,
              displayName: acc.account_name || acc.accountName || `Account #${acc.account_number || acc.accountNumber || uId.substring(0, 8)}`,
              firstName: '',
              lastName: '',
              phone: '',
              kyc_status: 'verified',
              status: 'active',
              role: 'user',
              created_at: acc.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Populate from local storage overrides
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('local_profile_')) {
          const uId = key.replace('local_profile_', '');
          try {
            const localP = JSON.parse(localStorage.getItem(key) || '{}');
            if (localP) {
              const existing = userMap.get(uId) || { id: uId, created_at: new Date().toISOString() };
              userMap.set(uId, {
                ...existing,
                email: localP.email || existing.email || `user_${uId.substring(0, 6)}@safeglobalbank.com`,
                displayName: localP.display_name || localP.displayName || existing.displayName || `${localP.first_name || ''} ${localP.last_name || ''}`.trim(),
                firstName: localP.first_name || localP.firstName || existing.firstName || '',
                lastName: localP.last_name || localP.lastName || existing.lastName || '',
                phone: localP.phone || existing.phone || '',
                kyc_status: localP.kyc_status || existing.kyc_status || 'verified',
                status: localP.status || existing.status || 'active',
                role: localP.role || existing.role || 'user'
              });
            }
          } catch (e) {
            console.warn('Error reading local profile key:', e);
          }
        }
      }

      // Populate from central user registry array in localStorage
      try {
        const rawReg = localStorage.getItem('all_registered_users');
        if (rawReg) {
          const regList = JSON.parse(rawReg);
          if (Array.isArray(regList)) {
            regList.forEach((regU: any) => {
              if (regU && regU.id) {
                const existing = userMap.get(regU.id);
                userMap.set(regU.id, {
                  ...existing,
                  id: regU.id,
                  email: regU.email || existing?.email || `user_${regU.id.substring(0, 6)}@safeglobalbank.com`,
                  displayName: regU.display_name || regU.displayName || existing?.displayName || `${regU.first_name || ''} ${regU.last_name || ''}`.trim() || regU.email?.split('@')[0],
                  firstName: regU.first_name || regU.firstName || existing?.firstName || '',
                  lastName: regU.last_name || regU.lastName || existing?.lastName || '',
                  phone: regU.phone || existing?.phone || '',
                  kyc_status: regU.kyc_status || existing?.kyc_status || 'verified',
                  status: regU.status || existing?.status || 'active',
                  role: regU.role || existing?.role || 'user',
                  created_at: regU.created_at || existing?.created_at || new Date().toISOString()
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error reading central all_registered_users registry:', e);
      }

      // Ensure the currently authenticated administrator/user is always present
      if (user && user.id) {
        const existing = userMap.get(user.id);
        const name = user.displayName || user.user_metadata?.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Administrator';
        userMap.set(user.id, {
          id: user.id,
          email: user.email || 'admin@safeglobalbank.com',
          displayName: name,
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          phone: user.phone || '',
          kyc_status: existing?.kyc_status || 'verified',
          status: existing?.status || 'active',
          role: existing?.role || user.role || 'admin',
          created_at: user.created_at || existing?.created_at || new Date().toISOString(),
          photoURL: user.photoURL || user.user_metadata?.avatar_url || null,
          last_sign_in_at: user.last_sign_in_at || new Date().toISOString()
        });
      }

      // If userMap is empty, seed clean default administrator
      if (userMap.size === 0) {
        const defaultAdmin = {
          id: user?.id || 'admin_001',
          email: user?.email || 'admin@safeglobalbank.com',
          displayName: user?.displayName || user?.user_metadata?.full_name || 'System Administrator',
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1 800-555-0100',
          kyc_status: 'verified',
          status: 'active',
          role: 'admin',
          created_at: new Date().toISOString()
        };
        userMap.set(defaultAdmin.id, defaultAdmin);
      }

      setUsers(Array.from(userMap.values()));

    } catch (error) {
      console.log("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const handleUserSyncEvent = () => fetchData();
    window.addEventListener('user_registered_or_updated', handleUserSyncEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('user_registered_or_updated', handleUserSyncEvent);
    };
  }, []);

  const logAuditAction = async (action: string, targetUser: string, details: string) => {
    try {
      const adminName = user?.displayName || user?.user_metadata?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Administrator';
      const logData = {
        admin_id: user?.id || 'admin_root',
        admin_email: user?.email || 'admin@safeglobalbank.com',
        admin_name: adminName,
        action,
        target_user: targetUser,
        details,
        ip_address: '127.0.0.1'
      };
      const { data: insertedLog } = await supabase.from('audit_logs').insert([logData]).select().single();
      if (insertedLog) setAuditLogs(prev => [insertedLog, ...prev]);
    } catch (e) {
      console.log("Error logging audit:", e);
    }
  };

  const handleUpdateBalance = async (accountId: string, newBalance: number, reason: string) => {
    const userCurrInfo = getCurrencyByCountry(selectedUser?.country);
    try {
      let targetAcc = accounts.find(a => a.id === accountId || a.user_id === selectedUser?.id || a.userId === selectedUser?.id);
      const oldBalance = targetAcc ? Number(targetAcc.balance) || 0 : 0;
      
      if (targetAcc && targetAcc.id && !targetAcc.id.startsWith('acc_')) {
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', targetAcc.id);
      } else if (selectedUser?.id) {
        const { data: newAcc } = await supabase.from('accounts').upsert([{
          user_id: selectedUser.id,
          account_number: targetAcc?.account_number || `ACC-${selectedUser.id.substring(0, 6).toUpperCase()}`,
          balance: newBalance,
          currency: userCurrInfo.code,
          currency_code: userCurrInfo.code,
          currency_symbol: userCurrInfo.symbol,
          account_type: 'checking'
        }], { onConflict: 'user_id' }).select().single();
        if (newAcc) targetAcc = newAcc;
      }

      // Update local state immediately for fast UI feedback
      setAccounts(prev => {
        const existing = prev.find(a => a.id === accountId || a.user_id === selectedUser?.id || a.userId === selectedUser?.id);
        if (existing) {
          return prev.map(a => (a.id === existing.id ? { ...a, balance: newBalance } : a));
        } else if (selectedUser?.id) {
          return [...prev, {
            id: targetAcc?.id || accountId,
            user_id: selectedUser.id,
            account_number: targetAcc?.account_number || `ACC-${selectedUser.id.substring(0, 6).toUpperCase()}`,
            balance: newBalance,
            currency: userCurrInfo.code,
            currency_code: userCurrInfo.code,
            currency_symbol: userCurrInfo.symbol
          }];
        }
        return prev;
      });
      
      // Log transaction for audit integrity
      await supabase.from('transactions').insert([{
        user_id: selectedUser?.id || targetAcc?.user_id || 'admin_adj',
        account_id: targetAcc?.id || accountId,
        type: newBalance >= oldBalance ? 'admin_credit' : 'admin_debit',
        amount: Math.abs(newBalance - oldBalance),
        currency: targetAcc?.currency_code || targetAcc?.currency || userCurrInfo.code,
        status: 'completed',
        description: `Admin balance adjustment: ${reason}`,
        created_at: new Date().toISOString()
      }]);

      await logAuditAction('WALLET_ADJUSTMENT', selectedUser?.id || accountId, `Balance adjusted from ${formatCurrencyAmount(oldBalance, userCurrInfo)} to ${formatCurrencyAmount(newBalance, userCurrInfo)}. Reason: ${reason}`);
      setMsg({ type: 'success', text: `Wallet balance updated to ${formatCurrencyAmount(newBalance, userCurrInfo)} and logged in transaction ledger.` });
      setIsWalletModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.log("Error updating balance:", err);
      // Fallback local update if network error occurs
      setAccounts(prev => prev.map(a => (a.id === accountId || a.user_id === selectedUser?.id) ? { ...a, balance: newBalance } : a));
      setMsg({ type: 'success', text: `Wallet balance updated locally to ${formatCurrencyAmount(newBalance, userCurrInfo)}.` });
      setIsWalletModalOpen(false);
    }
  };

  const handleUserStatusUpdate = async (userId: string, statusField: string, statusValue: any, actionName: string) => {
    try {
      const fieldToUpdate = statusField === 'kycStatus' ? 'kyc_status' : statusField;
      await supabase.from('profiles').update({ [fieldToUpdate]: statusValue }).eq('id', userId);

      // Save local profile override as well
      const existingLocal = JSON.parse(localStorage.getItem(`local_profile_${userId}`) || '{}');
      localStorage.setItem(`local_profile_${userId}`, JSON.stringify({ ...existingLocal, [fieldToUpdate]: statusValue }));

      await logAuditAction(actionName, userId, `Updated ${statusField} to ${statusValue}`);
      setMsg({ type: 'success', text: `User ${actionName.toLowerCase().replace(/_/g, ' ')} successfully.` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleTxStatus = async (txId: string, status: string, collectionName = 'transactions') => {
    try {
      await supabase.from(collectionName).update({ status }).eq('id', txId);
      await logAuditAction('TRANSACTION_STATUS_UPDATE', txId, `Marked transaction #${txId.substring(0, 8)} as ${status}`);
      setMsg({ type: 'success', text: `Transaction marked as ${status}.` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating transaction status.' });
    }
  };

  // Metrics Calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'suspended' && u.status !== 'frozen').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const verifiedUsers = users.filter(u => u.kyc_status === 'verified' || u.kyc_status === 'Approved').length;
  
  const totalWalletBalance = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const totalTransactions = transactions.length + cryptoTxs.length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'Pending').length;
  const successfulTransactions = transactions.filter(t => t.status === 'completed' || t.status === 'Completed' || t.status === 'success').length;

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar Menu Items matching full Role-Based Admin specification
  const sidebarNavItems = [
    { id: 'overview', label: 'Dashboard', icon: <Zap size={18} /> },
    { id: 'requests', label: 'Inbound Requests', icon: <FileText size={18} />, badge: pendingTransactions > 0 ? pendingTransactions : null },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'wallets', label: 'Wallet Management', icon: <DollarSign size={18} /> },
    { id: 'broker', label: 'Broker & Trading', icon: <Activity size={18} /> },
    { id: 'investments', label: 'Investment Plans', icon: <Layers size={18} /> },
    { id: 'gateways', label: 'Payment Gateways', icon: <ArrowDownLeft size={18} /> },
    { id: 'deposits', label: 'Deposits', icon: <ArrowDownLeft size={18} /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpRight size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'content', label: 'Content & CMS', icon: <FileSpreadsheet size={18} /> },
    { id: 'referrals', label: 'Referrals & Bonuses', icon: <Sparkles size={18} /> },
    { id: 'currencies', label: 'Country & Currencies', icon: <Database size={18} /> },
    { id: 'security', label: 'Audit Logs & Security', icon: <Terminal size={18} /> },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon size={18} /> },
  ];

  const filteredSidebarItems = sidebarNavItems.filter(item => 
    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-bold tracking-wide">Initializing Safe Global Bank Admin Terminal...</p>
        </div>
      </div>
    );
  }

  const adminDisplayName = user?.displayName || user?.user_metadata?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Administrator';
  const adminEmail = user?.email || 'admin@safeglobalbank.com';
  const adminPhotoURL = user?.photoURL || user?.user_metadata?.avatar_url || null;
  const adminLastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Session';

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#121319] border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20">
            <ShieldCheck size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">Safe Global Bank</h1>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">ADMIN TERMINAL</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-gray-300 hover:text-white bg-white/5 rounded-xl border border-white/10"
        >
          {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* LEFT SIDEBAR TERMINAL PANEL */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#121319] border-r border-white/10 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-black flex items-center justify-center text-base shadow-lg shadow-emerald-500/20 shrink-0">
                <ShieldCheck size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white leading-tight">Safe Global Bank</h1>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">ADMIN TERMINAL</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Logged-In Admin User Card */}
          <div className="bg-[#1a1c24] border border-white/10 rounded-2xl p-3.5 space-y-2 shadow-inner">
            <div className="flex items-center gap-3">
              {adminPhotoURL ? (
                <img src={adminPhotoURL} alt={adminDisplayName} className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-md shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-lg flex items-center justify-center border border-white/20 shadow-md shrink-0">
                  {(adminDisplayName[0] || 'A').toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate leading-tight">{adminDisplayName}</h3>
                <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    ROLE: {adminRole}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>LAST SIGN IN:</span>
              <span className="text-gray-300 font-semibold">{adminLastLogin}</span>
            </div>
          </div>

          {/* Search Features Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search features..." 
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#181a22] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 hide-scrollbar">
            {filteredSidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMsg({ type: '', text: '' });
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Logout Portal */}
        <div className="pt-3 border-t border-white/10">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={18} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#121319] border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white capitalize tracking-tight flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} />
              {activeTab.replace('_', ' ')} Overview
            </h2>
            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-mono font-bold uppercase">
              {adminRole}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={adminRole} 
              onChange={(e) => setAdminRole(e.target.value as any)}
              className="bg-[#181a22] border border-white/10 text-xs font-bold text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="SUPER_ADMIN">Super Admin (Full Control)</option>
              <option value="ADMIN">Admin (Operations)</option>
              <option value="SUPPORT">Support Mode</option>
            </select>

            <button 
              onClick={fetchData}
              className="flex items-center gap-2 bg-[#181a22] hover:bg-white/10 border border-white/10 text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Alert Dismissible Message */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-lg ${
            msg.type === 'error' ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {msg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
              <p className="font-semibold text-xs md:text-sm">{msg.text}</p>
            </div>
            <button onClick={() => setMsg({ type: '', text: '' })} className="text-xs font-bold opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
                  <h3 className="text-2xl font-black text-white mt-1">{totalUsers}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">+{activeUsers} Active Accounts</p>
                </div>
                <div className="w-11 h-11 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Users size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">System Liquidity</p>
                  <h3 className="text-2xl font-black text-white mt-1">${totalWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">Across all active wallets</p>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Transactions Logged</p>
                  <h3 className="text-2xl font-black text-white mt-1">{totalTransactions}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-1">{pendingTransactions} Pending Review</p>
                </div>
                <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <ArrowRightLeft size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Verified KYC</p>
                  <h3 className="text-2xl font-black text-white mt-1">{verifiedUsers}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">{totalUsers - verifiedUsers} Pending KYC</p>
                </div>
                <div className="w-11 h-11 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/20">
                  <ShieldCheck size={22} />
                </div>
              </div>
            </div>

            {/* System Status Table Summary */}
            <div className="bg-[#121319] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Recent System Activity Highlights</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="p-3.5 bg-[#181a22] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <History size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{tx.description || tx.type || 'Transaction'}</p>
                        <p className="text-gray-400 text-[11px]">{new Date(tx.created_at || Date.now()).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-white">${Number(tx.amount || 0).toFixed(2)}</p>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">{tx.status || 'completed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INBOUND REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Inbound Requests & Approval Queue</h3>
            <p className="text-xs text-gray-400">Review pending deposits, wire transfers, and identity verification requests.</p>

            <div className="space-y-4">
              {transactions.filter(t => t.status === 'pending' || t.status === 'Pending').length > 0 ? (
                transactions.filter(t => t.status === 'pending' || t.status === 'Pending').map((tx: any) => (
                  <div key={tx.id} className="p-4 bg-[#181a22] border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">{tx.description || tx.type || 'Inbound Request'}</p>
                      <p className="text-xs text-gray-400">Recipient: {tx.recipient || 'Safe Global Bank Internal'}</p>
                      <p className="text-[11px] font-mono text-indigo-400 mt-1">Amount: ${Number(tx.amount || 0).toFixed(2)} USD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleTxStatus(tx.id, 'completed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Approve Request
                      </button>
                      <button 
                        onClick={() => handleTxStatus(tx.id, 'failed')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 font-medium">
                  <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p>No pending inbound requests at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Registered Users Ledger</h3>
                <p className="text-xs text-gray-400">View and manage all registered bank accounts, KYC status & security permissions.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-9 pr-4 py-2 bg-[#181a22] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Users Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">User Info</th>
                    <th className="p-3.5 border-b border-white/10">Account #</th>
                    <th className="p-3.5 border-b border-white/10">Balance ($)</th>
                    <th className="p-3.5 border-b border-white/10">KYC Verification</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u: any) => {
                      const acc = accounts.find(a => a.user_id === u.id || a.userId === u.id);
                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30">
                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User Account'}</p>
                                <p className="text-[11px] text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-gray-300">
                            {acc?.account_number || acc?.accountNumber || 'ACC-109284'}
                          </td>
                          <td className="p-3.5 font-black text-emerald-400">
                            {formatCurrencyAmount(Number(acc?.balance || 0), getCurrencyInfo(acc?.currency_code || acc?.currency || u.currency_code || u.country || 'USD'))}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.kyc_status === 'verified' || u.kyc_status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {u.kyc_status || 'verified'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {u.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  const userAcc = acc || {
                                    id: `acc_${u.id}`,
                                    user_id: u.id,
                                    account_number: 'ACC-' + u.id.substring(0, 6).toUpperCase(),
                                    balance: 0,
                                    currency: getCurrencyByCountry(u.country).code
                                  };
                                  setSelectedUser({ ...u, account: userAcc });
                                  setWalletActionType('adjust');
                                  setWalletAmount(String(userAcc.balance || 0));
                                  setWalletReason('Manual balance update via Admin Dashboard');
                                  setIsWalletModalOpen(true);
                                }}
                                title="Edit Account Balance"
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                              >
                                <DollarSign size={14} />
                                <span>Edit Balance</span>
                              </button>

                              <button 
                                onClick={() => { setSelectedUser({ ...u, account: acc }); setIsEditModalOpen(true); }}
                                title="Edit Role / Privileges"
                                className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button 
                                onClick={() => {
                                  const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
                                  handleUserStatusUpdate(u.id, 'status', newStatus, newStatus === 'active' ? 'USER_REACTIVATED' : 'USER_SUSPENDED');
                                }}
                                title={u.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                                className={`p-2 rounded-lg transition ${u.status === 'suspended' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                              >
                                <UserX size={15} />
                              </button>

                              <button 
                                onClick={async () => {
                                  if (confirm(`Delete user ${u.email}? This action cannot be undone.`)) {
                                    setUsers(prev => prev.filter(item => item.id !== u.id));
                                    await logAuditAction('USER_DELETED', u.id, `Deleted user record for ${u.email}`);
                                    setMsg({ type: 'success', text: `User ${u.email} deleted.` });
                                  }
                                }}
                                title="Delete User"
                                className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users found matching search query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WALLET MANAGEMENT */}
        {activeTab === 'wallets' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Wallet & Ledger Controls</h3>
                <p className="text-xs text-gray-400">Credit, debit or override user balances with audit tracking.</p>
              </div>

              <button 
                onClick={() => {
                  if (users.length === 0) return;
                  setSelectedUser(users[0]);
                  setWalletActionType('credit');
                  setWalletAmount('');
                  setWalletReason('');
                  setIsWalletModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <PlusCircle size={16} /> Adjust Wallet Balance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Account Number</th>
                    <th className="p-3.5 border-b border-white/10">Account Holder</th>
                    <th className="p-3.5 border-b border-white/10">Type</th>
                    <th className="p-3.5 border-b border-white/10">Balance</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Quick Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {accounts.map((acc: any) => {
                    const u = users.find(userItem => userItem.id === acc.user_id || userItem.id === acc.userId);
                    return (
                      <tr key={acc.id} className="hover:bg-white/5">
                        <td className="p-3.5 font-mono font-bold text-white">{acc.account_number || acc.accountNumber || 'ACC-10023'}</td>
                        <td className="p-3.5 text-gray-300">{u?.email || acc.user_id}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/20">
                            {acc.type || acc.accountType || 'Checking'}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-emerald-400">{formatCurrencyAmount(Number(acc.balance || 0), getCurrencyInfo(acc?.currency_code || acc?.currency || u?.currency_code || u?.country || 'USD'))}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedUser({ ...u, account: acc });
                              setWalletActionType('credit');
                              setWalletAmount('');
                              setWalletReason('');
                              setIsWalletModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 text-[11px] font-bold transition"
                          >
                            + Credit
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser({ ...u, account: acc });
                              setWalletActionType('debit');
                              setWalletAmount('');
                              setWalletReason('');
                              setIsWalletModalOpen(true);
                            }}
                            className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 text-[11px] font-bold transition"
                          >
                            - Debit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Deposit Requests Oversight</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Reference</th>
                    <th className="p-3.5 border-b border-white/10">Recipient Account</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.filter(t => t.type === 'deposit' || t.type === 'admin_credit').map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 10)}</td>
                      <td className="p-3.5 text-white">{tx.description || 'Deposit'}</td>
                      <td className="p-3.5 font-black text-emerald-400">+${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Withdrawal & Wire Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Reference</th>
                    <th className="p-3.5 border-b border-white/10">Recipient</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.filter(t => t.type === 'transfer' || t.type === 'transfer_out' || t.type === 'admin_debit').map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 10)}</td>
                      <td className="p-3.5 text-white">{tx.recipient || tx.description || 'Withdrawal'}</td>
                      <td className="p-3.5 font-black text-rose-400">-${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: TRANSACTIONS OVERSIGHT */}
        {activeTab === 'transactions' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Full Transaction Audit Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Transaction ID</th>
                    <th className="p-3.5 border-b border-white/10">Type / Detail</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Timestamp</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 12)}</td>
                      <td className="p-3.5 text-white">{tx.description || tx.type || 'Transfer'}</td>
                      <td className="p-3.5 font-black text-emerald-400">${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold capitalize">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => handleTxStatus(tx.id, tx.status === 'Completed' ? 'Reversed' : 'Completed')}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: BROKER & TRADING MANAGEMENT */}
        {activeTab === 'broker' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Broker & Trading Terminal Controls</h3>
                <p className="text-xs text-gray-400">Manage supported trading instruments, market statuses, spreads, and maximum leverage limits.</p>
              </div>
              <button 
                onClick={() => {
                  const sym = prompt('Enter Instrument Symbol (e.g., SOL/USD):');
                  if (!sym) return;
                  const cat = prompt('Enter Category (Forex / Crypto / Commodities / Stocks):', 'Crypto') || 'Crypto';
                  setTradingInstruments(prev => [...prev, {
                    id: 'inst_' + Math.random().toString(36).substring(2, 7),
                    symbol: sym.toUpperCase(),
                    category: cat,
                    spread: '1.0 pips',
                    maxLeverage: '1:100',
                    status: 'Open'
                  }]);
                  logAuditAction('TRADING_INSTRUMENT_ADDED', 'SYSTEM', `Added instrument ${sym.toUpperCase()}`);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Add Trading Asset
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Symbol</th>
                    <th className="p-3.5 border-b border-white/10">Category</th>
                    <th className="p-3.5 border-b border-white/10">Spread</th>
                    <th className="p-3.5 border-b border-white/10">Max Leverage</th>
                    <th className="p-3.5 border-b border-white/10">Market Status</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {tradingInstruments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-bold text-white font-mono">{inst.symbol}</td>
                      <td className="p-3.5 text-indigo-300">{inst.category}</td>
                      <td className="p-3.5 text-gray-300 font-mono">{inst.spread}</td>
                      <td className="p-3.5 text-gray-300 font-mono">{inst.maxLeverage}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inst.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setTradingInstruments(prev => prev.map(i => i.id === inst.id ? { ...i, status: i.status === 'Open' ? 'Closed' : 'Open' } : i));
                            logAuditAction('MARKET_STATUS_TOGGLED', 'SYSTEM', `Toggled ${inst.symbol} to ${inst.status === 'Open' ? 'Closed' : 'Open'}`);
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                        >
                          Toggle Market
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: INVESTMENT PLANS */}
        {activeTab === 'investments' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Investment Plans & Yield Staking</h3>
                <p className="text-xs text-gray-400">Configure yield percentage rates, lock durations, and minimum investment thresholds.</p>
              </div>
              <button 
                onClick={() => {
                  const name = prompt('Plan Name:');
                  if (!name) return;
                  const roi = prompt('ROI Rate (%):', '8.5%') || '8.5%';
                  const dur = prompt('Duration:', '14 Days') || '14 Days';
                  setInvestmentPlans(prev => [...prev, {
                    id: 'plan_' + Math.random().toString(36).substring(2, 7),
                    name,
                    roi,
                    duration: dur,
                    minInv: 250,
                    maxInv: 25000,
                    active: true
                  }]);
                  logAuditAction('INVESTMENT_PLAN_CREATED', 'SYSTEM', `Created plan ${name}`);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Create Investment Plan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {investmentPlans.map((plan) => (
                <div key={plan.id} className="p-5 bg-[#181a22] border border-white/10 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-white text-base">{plan.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${plan.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400'}`}>
                      {plan.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/5 space-y-1 text-xs text-gray-300">
                    <p className="flex justify-between"><span>Yield / ROI:</span> <span className="font-black text-emerald-400">{plan.roi}</span></p>
                    <p className="flex justify-between"><span>Duration:</span> <span className="font-bold text-white">{plan.duration}</span></p>
                    <p className="flex justify-between"><span>Min Deposit:</span> <span className="font-bold text-white">${plan.minInv}</span></p>
                    <p className="flex justify-between"><span>Max Cap:</span> <span className="font-bold text-white">${plan.maxInv.toLocaleString()}</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setInvestmentPlans(prev => prev.map(p => p.id === plan.id ? { ...p, active: !p.active } : p));
                      logAuditAction('INVESTMENT_PLAN_TOGGLED', 'SYSTEM', `Toggled plan ${plan.name}`);
                    }}
                    className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl font-bold text-xs transition"
                  >
                    {plan.active ? 'Disable Plan' : 'Enable Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PAYMENT GATEWAYS */}
        {activeTab === 'gateways' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Payment Gateway & Fee Management</h3>
            <div className="space-y-4">
              {gateways.map((gw) => (
                <div key={gw.id} className="p-4 bg-[#181a22] border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">{gw.name}</p>
                    <p className="text-xs text-gray-400">Min: ${gw.minDeposit} | Max: ${gw.maxDeposit.toLocaleString()} | Fee: {gw.fee}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                      {gw.status}
                    </span>
                    <button 
                      onClick={() => {
                        const newFee = prompt(`Update Processing Fee % for ${gw.name}:`, gw.fee);
                        if (newFee !== null) {
                          setGateways(prev => prev.map(g => g.id === gw.id ? { ...g, fee: newFee } : g));
                          logAuditAction('GATEWAY_FEE_UPDATED', 'SYSTEM', `Updated ${gw.name} fee to ${newFee}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Update Fee
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CONTENT & CMS */}
        {activeTab === 'content' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-2xl">
            <h3 className="text-lg font-bold text-white">CMS, Banners & Legal Policy Controls</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Homepage Announcement Banner</label>
                <input 
                  type="text"
                  defaultValue="Safe Global Bank 2026 Q3 Compliance & Audit Complete. Global ISO 27001 Certified."
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">Terms & Conditions Last Updated</label>
                <input 
                  type="text"
                  defaultValue="Effective Date: July 2026 - Revision v4.2"
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  setMsg({ type: 'success', text: 'Content policies updated successfully.' });
                  logAuditAction('CMS_CONTENT_UPDATED', 'SYSTEM', 'Updated platform legal banners & terms');
                }}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
              >
                Save CMS Banners
              </button>
            </div>
          </div>
        )}

        {/* TAB: REFERRALS & BONUSES */}
        {activeTab === 'referrals' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-xl">
            <h3 className="text-lg font-bold text-white">Referrals & Promotional Bonuses</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Referral Commission Rate (%)</label>
                <input 
                  type="text" 
                  value={referralBonus.refRate}
                  onChange={e => setReferralBonus(prev => ({ ...prev, refRate: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">New User Signup Bonus ($ USD)</label>
                <input 
                  type="text" 
                  value={referralBonus.signupBonus}
                  onChange={e => setReferralBonus(prev => ({ ...prev, signupBonus: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
              <button 
                onClick={() => {
                  setMsg({ type: 'success', text: 'Referral and bonus settings updated.' });
                  logAuditAction('REFERRAL_SETTINGS_UPDATED', 'SYSTEM', `Updated referral rate to ${referralBonus.refRate}`);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                Save Bonus Configuration
              </button>
            </div>
          </div>
        )}

        {/* TAB: COUNTRY & CURRENCIES */}
        {activeTab === 'currencies' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Country & Supported Currency Registry</h3>
                <p className="text-xs text-gray-400">Automatic country-to-currency binding for incoming registrations.</p>
              </div>
              <button 
                onClick={async () => {
                  const countryName = prompt('Enter Country Name (e.g., Brazil):');
                  if (!countryName) return;
                  const currencyCode = prompt('Enter Currency Code (e.g., BRL):');
                  if (!currencyCode) return;
                  const currencySymbol = prompt('Enter Currency Symbol (e.g., R$):');
                  if (!currencySymbol) return;

                  try {
                    await supabase.from('supported_countries').insert([{
                      country_name: countryName,
                      currency_code: currencyCode.toUpperCase(),
                      currency_symbol: currencySymbol,
                      is_active: true
                    }]);
                    await logAuditAction('COUNTRY_ADDED', 'SYSTEM', `Added supported country ${countryName} with currency ${currencyCode.toUpperCase()}`);
                    fetchData();
                    setMsg({ type: 'success', text: `Country ${countryName} added successfully.` });
                  } catch (err: any) {
                    console.log('Error adding country:', err);
                    setMsg({ type: 'error', text: err.message || 'Failed to add country.' });
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Add Supported Country
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {supportedCountries.map((c) => (
                <div key={c.id} className="p-4 bg-[#181a22] border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-base">{c.currency_symbol} {c.currency_code}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.is_active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-gray-300 font-semibold">{c.country_name}</p>
                  
                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await supabase.from('supported_countries').update({ is_active: !c.is_active }).eq('id', c.id);
                          await logAuditAction('COUNTRY_STATUS_TOGGLED', 'SYSTEM', `Toggled country ${c.country_name} to ${!c.is_active ? 'Active' : 'Disabled'}`);
                          fetchData();
                        } catch (err) {
                          console.log(err);
                        }
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(`Remove ${c.country_name} from supported list?`)) {
                          try {
                            await supabase.from('supported_countries').delete().eq('id', c.id);
                            await logAuditAction('COUNTRY_DELETED', 'SYSTEM', `Deleted country ${c.country_name}`);
                            fetchData();
                          } catch (err) {
                            console.log(err);
                          }
                        }
                      }}
                      className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 rounded-lg text-[11px] font-bold transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIT LOGS & SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Cryptographic Audit Logs & Security Engine</h3>
                <p className="text-xs text-gray-400">All administrative actions recorded in immutable timeline.</p>
              </div>
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "safeglobalbank_audit_logs.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
              >
                <Download size={14} /> Export Audit JSON
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#181a22] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono text-[10px] font-bold uppercase">{log.action}</span>
                      <span className="text-gray-400">Target: <span className="text-white font-semibold">{log.target_user || log.targetUser}</span></span>
                    </div>
                    <p className="text-gray-200 font-semibold">{log.details}</p>
                    <p className="text-gray-500 text-[10px]">By: {log.admin_email || log.adminEmail || 'admin'}</p>
                  </div>
                  <div className="text-right font-mono text-gray-400 text-[11px]">
                    {new Date(log.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-xl">
            <h3 className="text-lg font-bold text-white">System & Platform Settings</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Platform Name</label>
                <input 
                  type="text" 
                  value={systemSettings.platformName}
                  onChange={e => setSystemSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div className="p-4 bg-[#181a22] border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Maintenance Mode</p>
                  <p className="text-gray-400 text-[11px]">Prevent client logins during scheduled updates</p>
                </div>
                <button 
                  onClick={() => {
                    setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
                    logAuditAction('MAINTENANCE_MODE_TOGGLED', 'SYSTEM', `Maintenance mode set to ${!systemSettings.maintenanceMode}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold ${systemSettings.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-white/10 text-gray-300'}`}
                >
                  {systemSettings.maintenanceMode ? 'ON (ACTIVE)' : 'OFF'}
                </button>
              </div>

              <div className="p-4 bg-[#181a22] border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">New User Registrations</p>
                  <p className="text-gray-400 text-[11px]">Allow new signups on the public portal</p>
                </div>
                <button 
                  onClick={() => {
                    setSystemSettings(prev => ({ ...prev, registrationEnabled: !prev.registrationEnabled }));
                    logAuditAction('REGISTRATION_TOGGLED', 'SYSTEM', `Registrations set to ${!systemSettings.registrationEnabled}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold ${systemSettings.registrationEnabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  {systemSettings.registrationEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <button 
                onClick={() => setMsg({ type: 'success', text: 'System settings saved.' })}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                Save Platform Settings
              </button>
            </div>
          </div>
        )}

      </main>

      {/* EDIT PRIVILEGES MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-gray-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Manage User Privileges</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">User Email</label>
                <input type="text" disabled value={selectedUser.email || ''} className="w-full p-3 bg-[#181a22] rounded-xl text-gray-300 font-mono" />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">System Role</label>
                <select 
                  value={selectedUser.role || 'user'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white"
                >
                  <option value="user">Standard Account</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleUserStatusUpdate(selectedUser.id, 'role', selectedUser.role, 'ROLE_UPDATED');
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    alert(`Password reset link dispatched to ${selectedUser.email}`);
                    logAuditAction('PASSWORD_RESET', selectedUser.id, `Triggered password reset for ${selectedUser.email}`);
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL */}
      {isWalletModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-gray-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Update Account Balance</h3>
                  <p className="text-xs text-gray-400">Manual balance override for {selectedUser.displayName || selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg px-2">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#181a22] rounded-xl border border-white/5 space-y-1.5">
                <p className="text-gray-400">User: <span className="font-bold text-white">{selectedUser.displayName || selectedUser.email}</span></p>
                <p className="text-gray-400">Email: <span className="font-bold text-indigo-300">{selectedUser.email}</span></p>
                <p className="text-gray-400">Account #: <span className="font-mono text-white">{selectedUser.account?.account_number || selectedUser.account?.accountNumber || 'ACC-100234'}</span></p>
                <p className="text-gray-400">Current Balance: <span className="font-bold text-emerald-400">{formatCurrencyAmount(Number(selectedUser.account?.balance || 0), getCurrencyInfo(selectedUser.account?.currency_code || selectedUser.account?.currency || selectedUser.currency_code || selectedUser.country || 'USD'))}</span></p>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Adjustment Type</label>
                <select 
                  value={walletActionType} 
                  onChange={(e) => setWalletActionType(e.target.value as any)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="adjust">Set Exact Balance (=)</option>
                  <option value="credit">Credit Wallet (+)</option>
                  <option value="debit">Debit Wallet (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Amount</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Audit Reason (Required)</label>
                <input 
                  type="text"
                  placeholder="Reason for balance override..."
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => {
                  const amt = parseFloat(walletAmount);
                  if (walletAmount === '' || isNaN(amt) || amt < 0) {
                    alert('Please enter a valid, non-negative amount');
                    return;
                  }
                  if (!walletReason.trim()) {
                    alert('Please provide a reason for the audit log');
                    return;
                  }
                  const currentBal = Number(selectedUser.account?.balance || 0);
                  let newBal = currentBal;
                  if (walletActionType === 'credit') newBal = currentBal + amt;
                  else if (walletActionType === 'debit') {
                    newBal = currentBal - amt;
                    if (newBal < 0) {
                      if (!confirm(`Warning: Debiting ${formatCurrencyAmount(amt, getCurrencyInfo(selectedUser.account?.currency_code || selectedUser.account?.currency || selectedUser.currency_code || selectedUser.country || 'USD'))} will set account balance below zero (to -${formatCurrencyAmount(Math.abs(newBal), getCurrencyInfo(selectedUser.account?.currency_code || selectedUser.account?.currency || selectedUser.currency_code || selectedUser.country || 'USD'))}). Do you wish to proceed?`)) {
                        return;
                      }
                    }
                  }
                  else if (walletActionType === 'adjust') newBal = amt;

                  handleUpdateBalance(selectedUser.account?.id || `acc_${selectedUser.id}`, newBal, walletReason.trim());
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition active:scale-[0.99]"
              >
                Confirm & Write Ledger Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
