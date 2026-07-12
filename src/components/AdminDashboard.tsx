import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);

        const txSnapshot = await getDocs(collection(db, 'transactions'));
        const txList = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading Admin Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Control Panel</h1>
      
      <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
        {['users', 'transactions', 'kyc', 'compliance', 'reports'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-blue-900 text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((u: any) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.email || 'N/A'}</td>
                    <td className="py-2">{u.role || 'user'}</td>
                    <td className="py-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                    <td className="py-2">
                      <button className="text-sm text-blue-600 hover:underline mr-2" onClick={() => alert('User details placeholder')}>View</button>
                      <button className="text-sm text-red-600 hover:underline" onClick={() => alert('Suspend user placeholder')}>Suspend</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Transaction Monitoring</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">ID</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((t: any) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 text-xs font-mono">{t.id.slice(0, 8)}...</td>
                    <td className="py-2 capitalize">{t.type}</td>
                    <td className="py-2">${t.amount?.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t.status || 'completed'}
                      </span>
                    </td>
                    <td className="py-2">
                      <button className="text-sm text-blue-600 hover:underline" onClick={() => alert('Transaction details placeholder')}>Review</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">KYC Approvals</h2>
          <p className="text-gray-600 mb-4">Review identity documents and selfie verifications.</p>
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No pending KYC applications.</p>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Compliance & Fraud Detection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <h3 className="font-bold text-red-800">Suspicious Activities</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">0</p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <h3 className="font-bold text-yellow-800">High-Risk Transfers</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Analytics & Reports</h2>
          <p className="text-gray-600 mb-4">Generate financial and operational reports.</p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-50 text-blue-900 rounded-lg font-semibold hover:bg-blue-100" onClick={() => alert('Exporting Revenue Report CSV...')}>Export Revenue</button>
            <button className="px-4 py-2 bg-blue-50 text-blue-900 rounded-lg font-semibold hover:bg-blue-100" onClick={() => alert('Exporting Audit Logs...')}>Audit Logs</button>
          </div>
        </div>
      )}

    </div>
  );
}
