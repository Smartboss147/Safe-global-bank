import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Settings, Users, ArrowRightLeft, Activity, ShieldAlert, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const accSnapshot = await getDocs(collection(db, 'accounts'));
      setAccounts(accSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const txSnapshot = await getDocs(collection(db, 'transactions'));
      setTransactions(txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const cryptoTxSnapshot = await getDocs(collection(db, 'crypto_transactions'));
      setCryptoTxs(cryptoTxSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateBalance = async (accountId: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'accounts', accountId), { balance: newBalance });
      setMsg({ type: 'success', text: 'Balance updated successfully' });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating balance' });
    }
  };

  const handleTxStatus = async (txId: string, status: string, collectionName = 'transactions') => {
    try {
      await updateDoc(doc(db, collectionName, txId), { status });
      setMsg({ type: 'success', text: `Transaction marked as ${status}` });
      fetchData();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating transaction' });
    }
  };

  if (loading) return <div className="text-center mt-20 text-gray-500 font-medium">Loading Admin Simulator...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500 mt-1">Simulate banking, crypto, and trading operations.</p>
        </div>
      </div>
      
      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {msg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <p className="font-medium">{msg.text}</p>
        </div>
      )}

      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'users', label: 'Users & Accounts', icon: <Users size={18} /> },
          { id: 'transfers', label: 'Transfers', icon: <ArrowRightLeft size={18} /> },
          { id: 'crypto', label: 'Crypto Txs', icon: <Activity size={18} /> },
          { id: 'compliance', label: 'Compliance', icon: <ShieldAlert size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMsg({type:'',text:''}); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">User</th>
                  <th className="p-4 border-b">Account No.</th>
                  <th className="p-4 border-b">Balance</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.length > 0 ? users.map((u: any) => {
                  const acc = accounts.find(a => a.userId === u.id);
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="p-4 font-mono font-medium">{acc ? acc.accountNumber : 'N/A'}</td>
                      <td className="p-4">
                        {acc ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold">${acc.balance?.toFixed(2)}</span>
                            <button 
                              onClick={() => {
                                const newBal = prompt('Enter new balance:', acc.balance);
                                if (newBal && !isNaN(Number(newBal))) handleUpdateBalance(acc.id, Number(newBal));
                              }}
                              className="text-xs text-blue-600 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span></td>
                      <td className="p-4 text-right">
                        <button className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition mr-2">View</button>
                        <button className="text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">Suspend</button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Transfer Operations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">ID / Date</th>
                  <th className="p-4 border-b">Type / Route</th>
                  <th className="p-4 border-b">Amount</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.length > 0 ? transactions.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map((t: any) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-mono font-medium text-gray-900">{t.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'New'}</p>
                    </td>
                    <td className="p-4 capitalize">
                      <p className="font-bold text-gray-900">{t.type}</p>
                      <p className="text-xs text-gray-500">{t.transferType || 'deposit'}</p>
                    </td>
                    <td className="p-4 font-mono font-bold">${Number(t.amount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {t.status === 'pending' && (
                        <>
                          <button onClick={() => handleTxStatus(t.id, 'completed')} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">Approve</button>
                          <button onClick={() => handleTxStatus(t.id, 'failed')} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition">Reject</button>
                        </>
                      )}
                      {t.status !== 'pending' && (
                        <button onClick={() => handleTxStatus(t.id, 'pending')} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">Revert to Pending</button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-medium">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'crypto' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Crypto Operations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">ID</th>
                  <th className="p-4 border-b">Action</th>
                  <th className="p-4 border-b">Asset & Network</th>
                  <th className="p-4 border-b">Amount</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {cryptoTxs.length > 0 ? cryptoTxs.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map((t: any) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-medium">{t.id.slice(0, 8)}</td>
                    <td className="p-4 font-bold capitalize">{t.type}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{t.asset}</p>
                      <p className="text-xs text-gray-500">{t.network}</p>
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {t.type === 'deposit' && t.amount === 0 ? (
                        <button 
                          onClick={async () => {
                            const val = prompt('Enter deposit amount in ' + t.asset);
                            if (val && !isNaN(Number(val))) {
                              await updateDoc(doc(db, 'crypto_transactions', t.id), { amount: Number(val) });
                              fetchData();
                            }
                          }}
                          className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-bold hover:underline"
                        >
                          Set Amount
                        </button>
                      ) : (
                        `${t.amount} ${t.asset}`
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {t.status === 'pending' && (
                        <>
                          <button onClick={() => handleTxStatus(t.id, 'completed', 'crypto_transactions')} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">Complete</button>
                          <button onClick={() => handleTxStatus(t.id, 'failed', 'crypto_transactions')} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition">Reject</button>
                        </>
                      )}
                      {t.status !== 'pending' && (
                        <button onClick={() => handleTxStatus(t.id, 'pending', 'crypto_transactions')} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">Revert</button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No crypto operations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold mb-6 text-gray-900">Compliance & KYC Overview</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-bold text-red-900 text-lg">Fraud Alerts</h3>
                  <p className="text-3xl font-black text-red-600 mt-2">0</p>
                  <p className="text-sm text-red-700 mt-2">No suspicious activities</p>
                </div>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                  <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-bold text-blue-900 text-lg">Pending KYC</h3>
                  <p className="text-3xl font-black text-blue-600 mt-2">{users.filter(u => u.kycStatus === 'pending' || !u.kycStatus).length}</p>
                  <p className="text-sm text-blue-700 mt-2">Require review</p>
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-900">KYC Verification Requests</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                  <tr>
                    <th className="p-4 border-b">User</th>
                    <th className="p-4 border-b">Email</th>
                    <th className="p-4 border-b">Current Status</th>
                    <th className="p-4 border-b text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.length > 0 ? users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900">{u.firstName} {u.lastName}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.kycStatus === 'verified' ? 'bg-green-100 text-green-700' :
                          u.kycStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {u.kycStatus || 'pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                         {u.kycStatus !== 'verified' && (
                            <button onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', u.id), { kycStatus: 'verified' });
                                setMsg({ type: 'success', text: 'User KYC verified.' });
                                fetchData();
                              } catch(e) {
                                setMsg({ type: 'error', text: 'Error updating KYC' });
                              }
                            }} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">Approve</button>
                         )}
                         {u.kycStatus !== 'rejected' && (
                            <button onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', u.id), { kycStatus: 'rejected' });
                                setMsg({ type: 'success', text: 'User KYC rejected.' });
                                fetchData();
                              } catch(e) {
                                setMsg({ type: 'error', text: 'Error updating KYC' });
                              }
                            }} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition">Reject</button>
                         )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-medium">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
