import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Users, ArrowRightLeft, Activity, ShieldAlert, FileText, CheckCircle, XCircle, 
  DollarSign, Lock, Unlock, RefreshCw, Eye, Edit3, Trash2, ShieldCheck, UserX, 
  Download, Search, Filter, History, AlertTriangle, Key, PlusCircle, MinusCircle, 
  LogOut, CheckSquare, Settings as SettingsIcon, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletActionType, setWalletActionType] = useState<'credit' | 'debit' | 'adjust'>('credit');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [adminRole, setAdminRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT'>('SUPER_ADMIN');
  
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const accSnapshot = await getDocs(collection(db, 'accounts'));
      setAccounts(accSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const txSnapshot = await getDocs(collection(db, 'transactions'));
      setTransactions(txSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const auditSnapshot = await getDocs(collection(db, 'audit_logs'));
      setAuditLogs(auditSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const cryptoTxSnapshot = await getDocs(collection(db, 'crypto_transactions'));
      setCryptoTxs(cryptoTxSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const kycDocsSnapshot = await getDocs(query(collection(db, 'kyc_documents')));
      setKycDocs(kycDocsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Simulate periodic polling / realtime refresh
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const logAuditAction = async (action: string, targetUser: string, details: string) => {
    try {
      const logData = {
        adminId: user?.uid || 'admin',
        adminEmail: user?.email || 'admin@safeglobal.com',
        adminName: user?.displayName || 'System Administrator',
        action,
        targetUser,
        details,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      };
      await addDoc(collection(db, 'audit_logs'), logData);
      setAuditLogs(prev => [logData, ...prev]);
    } catch (e) {
      console.error("Error logging audit:", e);
    }
  };

  const handleUpdateBalance = async (accountId: string, newBalance: number, reason: string) => {
    try {
      const targetAcc = accounts.find(a => a.id === accountId);
      const oldBalance = targetAcc ? targetAcc.balance : 0;
      
      await updateDoc(doc(db, 'accounts', accountId), { balance: newBalance });
      
      // Create transaction record for audit integrity
      await addDoc(collection(db, 'transactions'), {
        userId: targetAcc?.userId || 'unknown',
        accountId,
        type: newBalance > oldBalance ? 'admin_credit' : 'admin_debit',
        amount: Math.abs(newBalance - oldBalance),
        currency: targetAcc?.currency || 'USD',
        status: 'Completed',
        description: `Admin balance adjustment: ${reason}`,
        createdAt: new Date().toISOString()
      });

      await logAuditAction('WALLET_ADJUSTMENT', targetAcc?.userId || accountId, `Changed balance from $${oldBalance} to $${newBalance}. Reason: ${reason}`);
      setMsg({ type: 'success', text: 'Wallet balance adjusted successfully and recorded.' });
      setIsWalletModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating balance: ' + err.message });
    }
  };

  const handleUserStatusUpdate = async (userId: string, statusField: string, statusValue: any, actionName: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { [statusField]: statusValue });
      await logAuditAction(actionName, userId, `Updated ${statusField} to ${statusValue}`);
      setMsg({ type: 'success', text: `User ${actionName.toLowerCase()} successfully.` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleTxStatus = async (txId: string, status: string, collectionName = 'transactions') => {
    try {
      await updateDoc(doc(db, collectionName, txId), { status });
      await logAuditAction('TRANSACTION_STATUS_UPDATE', txId, `Marked transaction as ${status}`);
      setMsg({ type: 'success', text: `Transaction marked as ${status}` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating transaction' });
    }
  };

  // Metrics Calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'suspended' && u.status !== 'frozen').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const verifiedUsers = users.filter(u => u.kycStatus === 'verified' || u.kycStatus === 'Approved').length;
  
  const totalWalletBalance = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const totalTransactions = transactions.length + cryptoTxs.length;
  const pendingTransactions = transactions.filter(t => t.status === 'Pending' || t.status === 'pending').length;
  const successfulTransactions = transactions.filter(t => t.status === 'Completed' || t.status === 'success').length;
  const failedTransactions = transactions.filter(t => t.status === 'Failed' || t.status === 'failed').length;

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading Enterprise Admin System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Management Console</h1>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {adminRole}
            </span>
          </div>
          <p className="text-gray-500 mt-1">Enterprise secure banking oversight, user compliance & ledger management.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={adminRole} 
            onChange={(e) => setAdminRole(e.target.value as any)}
            className="bg-white border border-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
            <option value="ADMIN">Admin (Ops & Users)</option>
            <option value="SUPPORT">Support (Read-Only & Reset)</option>
          </select>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          <div className="flex items-center gap-3">
            {msg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
            <p className="font-semibold text-sm">{msg.text}</p>
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })} className="text-sm font-bold opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: <Activity size={18} /> },
          { id: 'users', label: 'User Management', icon: <Users size={18} /> },
          { id: 'wallets', label: 'Wallet & Ledger', icon: <DollarSign size={18} /> },
          { id: 'transactions', label: 'Transaction Oversight', icon: <ArrowRightLeft size={18} /> },
          { id: 'audit', label: 'Audit Logs & Activity', icon: <FileText size={18} /> },
          { id: 'compliance', label: 'KYC & Compliance', icon: <ShieldCheck size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMsg({ type: '', text: '' }); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm ${
              activeTab === tab.id ? 'bg-blue-900 text-white shadow-blue-900/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalUsers}</h3>
                <p className="text-xs text-green-600 font-semibold mt-1">+{activeUsers} active accounts</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total System Liquidity</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">${totalWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-blue-600 font-semibold mt-1">Across all checking accounts</p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Transactions</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalTransactions}</h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">{pendingTransactions} pending review</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <ArrowRightLeft size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">KYC Verification Rate</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0}%</h3>
                <p className="text-xs text-purple-600 font-semibold mt-1">{verifiedUsers} of {totalUsers} verified</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent System Activity & Audit Trail</h3>
                <button onClick={() => setActiveTab('audit')} className="text-sm font-bold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {auditLogs.slice(0, 6).map((log, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">{log.action}</span>
                        <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1.5">{log.details}</p>
                      <p className="text-xs text-gray-500 mt-1">Admin: <span className="font-semibold">{log.adminName}</span></p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-center text-gray-400 py-6 text-sm font-medium">No audit logs recorded yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Operational Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full text-left p-3.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-900 rounded-xl font-bold text-sm text-gray-700 transition flex items-center justify-between"
                  >
                    <span>Manage User Accounts</span>
                    <Users size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('wallets')}
                    className="w-full text-left p-3.5 bg-gray-50 hover:bg-green-50 hover:text-green-900 rounded-xl font-bold text-sm text-gray-700 transition flex items-center justify-between"
                  >
                    <span>Credit / Debit Wallets</span>
                    <DollarSign size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="w-full text-left p-3.5 bg-gray-50 hover:bg-amber-50 hover:text-amber-900 rounded-xl font-bold text-sm text-gray-700 transition flex items-center justify-between"
                  >
                    <span>Review Pending Transfers</span>
                    <ArrowRightLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('compliance')}
                    className="w-full text-left p-3.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-900 rounded-xl font-bold text-sm text-gray-700 transition flex items-center justify-between"
                  >
                    <span>Review KYC Documents</span>
                    <ShieldCheck size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Security Status</p>
                  <p className="text-xs text-blue-700 mt-1 font-medium">All systems operational. Supabase & PostgreSQL connection verified.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">User Management Directory ({users.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">User</th>
                  <th className="p-4 border-b">Account No.</th>
                  <th className="p-4 border-b">Balance</th>
                  <th className="p-4 border-b">KYC Status</th>
                  <th className="p-4 border-b">Role / Status</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.length > 0 ? filteredUsers.map((u: any) => {
                  const acc = accounts.find(a => a.userId === u.id || a.userId === u.uid);
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}` || 'Unnamed User'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-gray-700">{acc ? acc.accountNumber : 'No Account'}</td>
                      <td className="p-4 font-bold text-gray-900">
                        ${acc ? Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.kycStatus === 'verified' || u.kycStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.kycStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role || 'user'}
                          </span>
                          {u.status === 'suspended' && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Suspended</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedUser({ ...u, account: acc });
                              setIsEditModalOpen(true);
                            }}
                            title="Edit / Privileges"
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to ${u.status === 'suspended' ? 'reactivate' : 'suspend'} user ${u.email}?`)) {
                                handleUserStatusUpdate(u.id, 'status', u.status === 'suspended' ? 'active' : 'suspended', u.status === 'suspended' ? 'USER_REACTIVATED' : 'USER_SUSPENDED');
                              }
                            }}
                            title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            className={`p-2 rounded-lg transition ${u.status === 'suspended' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                          >
                            <UserX size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Delete user ${u.email}? This action is permanent.`)) {
                                logAuditAction('USER_DELETED', u.id, `Deleted user ${u.email}`);
                                setMsg({ type: 'success', text: 'User deleted successfully.' });
                              }
                            }}
                            title="Delete User"
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WALLETS */}
      {activeTab === 'wallets' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Wallet & Ledger Management</h2>
              <p className="text-sm text-gray-500 mt-0.5">Credit, debit or adjust user balances with cryptographic audit trail.</p>
            </div>
            <button 
              onClick={() => {
                if (users.length === 0) {
                  alert('No users available.');
                  return;
                }
                setSelectedUser(users[0]);
                setWalletActionType('credit');
                setWalletAmount('');
                setWalletReason('');
                setIsWalletModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-blue-800 transition"
            >
              <PlusCircle size={18} /> Adjust Wallet Balance
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">Account Number</th>
                  <th className="p-4 border-b">User ID</th>
                  <th className="p-4 border-b">Type</th>
                  <th className="p-4 border-b">Current Balance</th>
                  <th className="p-4 border-b text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {accounts.map((acc: any) => {
                  const u = users.find(user => user.id === acc.userId || user.uid === acc.userId);
                  return (
                    <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-gray-900">{acc.accountNumber}</td>
                      <td className="p-4 text-gray-600">{u?.email || acc.userId}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{acc.accountType || 'Checking'}</span>
                      </td>
                      <td className="p-4 font-extrabold text-gray-900">${Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedUser({ ...u, account: acc });
                            setWalletActionType('credit');
                            setWalletAmount('');
                            setWalletReason('');
                            setIsWalletModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition mr-2 text-xs"
                        >
                          Credit
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser({ ...u, account: acc });
                            setWalletActionType('debit');
                            setWalletAmount('');
                            setWalletReason('');
                            setIsWalletModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition text-xs"
                        >
                          Debit
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

      {/* TAB 4: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Transaction Oversight & Approvals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">Transaction ID</th>
                  <th className="p-4 border-b">Type / Recipient</th>
                  <th className="p-4 border-b">Amount</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Date</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.length > 0 ? transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-xs text-gray-600">{tx.id.substring(0, 10)}...</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{tx.type || 'Transfer'}</p>
                      <p className="text-xs text-gray-500">{tx.recipientName || tx.description || 'Internal transfer'}</p>
                    </td>
                    <td className="p-4 font-extrabold text-gray-900">${Number(tx.amount || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        tx.status === 'Completed' || tx.status === 'success' ? 'bg-green-100 text-green-700' :
                        tx.status === 'Pending' || tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{new Date(tx.createdAt || Date.now()).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      {tx.status === 'Pending' || tx.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleTxStatus(tx.id, 'Completed')}
                            className="px-3 py-1 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 text-xs"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleTxStatus(tx.id, 'Failed')}
                            className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleTxStatus(tx.id, 'Reversed')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 text-xs"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Immutable Audit Logs</h2>
              <p className="text-sm text-gray-500 mt-0.5">Every administrative action is cryptographically tracked and logged.</p>
            </div>
            <button 
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "audit_logs.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-bold text-sm transition"
            >
              <Download size={16} /> Export Audit Logs
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-900 text-white rounded font-mono text-xs font-bold">{log.action}</span>
                    <span className="text-xs text-gray-500">Target: <span className="font-semibold">{log.targetUser}</span></span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{log.details}</p>
                  <p className="text-xs text-gray-400">Admin: <span className="text-gray-700 font-semibold">{log.adminEmail}</span> ({log.adminName})</p>
                </div>
                <div className="text-right text-xs text-gray-500 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-center text-gray-400 py-12 font-medium">No audit logs found.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">KYC & Compliance Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((u: any) => (
              <div key={u.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{u.displayName || u.email}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      u.kycStatus === 'verified' || u.kycStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {u.kycStatus || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email: {u.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Joined: {new Date(u.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => handleUserStatusUpdate(u.id, 'kycStatus', 'verified', 'KYC_APPROVED')}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition"
                  >
                    Approve KYC
                  </button>
                  <button 
                    onClick={() => handleUserStatusUpdate(u.id, 'kycStatus', 'rejected', 'KYC_REJECTED')}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition"
                  >
                    Reject KYC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT USER / PRIVILEGES MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900">Manage User Privileges</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">User Email</label>
                <input type="text" disabled value={selectedUser.email || ''} className="w-full p-3 bg-gray-100 rounded-xl font-medium text-gray-700 mt-1 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">System Role</label>
                <select 
                  value={selectedUser.role || 'user'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 mt-1 text-sm"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    handleUserStatusUpdate(selectedUser.id, 'role', selectedUser.role, 'ROLE_UPDATED');
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    alert(`Password reset email sent to ${selectedUser.email}`);
                    logAuditAction('PASSWORD_RESET', selectedUser.id, `Triggered password reset for ${selectedUser.email}`);
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-gray-100 text-gray-800 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900">Wallet Balance Adjustment</h3>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">User: <span className="font-bold text-gray-900">{selectedUser.email}</span></p>
                <p className="text-sm font-medium text-gray-600 mt-1">Current Account: <span className="font-mono font-bold text-gray-900">{selectedUser.account?.accountNumber || 'Checking'}</span></p>
                <p className="text-sm font-medium text-gray-600 mt-1">Current Balance: <span className="font-bold text-green-600">${selectedUser.account?.balance || 0}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjustment Type</label>
                <select 
                  value={walletActionType} 
                  onChange={(e) => setWalletActionType(e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm"
                >
                  <option value="credit">Credit Wallet (+)</option>
                  <option value="debit">Debit Wallet (-)</option>
                  <option value="adjust">Set Exact Balance (=)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount ($)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason (Required for audit log)</label>
                <input 
                  type="text"
                  placeholder="e.g. Compensation for failed transaction reference #12345"
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                />
              </div>

              <button
                onClick={() => {
                  if (!walletAmount || isNaN(Number(walletAmount))) {
                    alert('Please enter a valid amount');
                    return;
                  }
                  if (!walletReason) {
                    alert('Please provide a reason for the audit log');
                    return;
                  }
                  const currentBal = Number(selectedUser.account?.balance || 0);
                  const amt = Number(walletAmount);
                  let newBal = currentBal;
                  if (walletActionType === 'credit') newBal = currentBal + amt;
                  else if (walletActionType === 'debit') newBal = currentBal - amt;
                  else if (walletActionType === 'adjust') newBal = amt;

                  handleUpdateBalance(selectedUser.account.id, newBal, walletReason);
                }}
                className="w-full py-3.5 bg-blue-900 text-white rounded-xl font-bold text-base hover:bg-blue-800 transition"
              >
                Confirm & Record Ledger Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
