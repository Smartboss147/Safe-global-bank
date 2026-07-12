import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import SpendingChart from './dashboard/SpendingChart';

export default function Dashboard({ user }) {
  const [account, setAccount] = useState(null);
  const [accountId, setAccountId] = useState(null);

  const fetchAccount = async () => {
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setAccountId(querySnapshot.docs[0].id);
      setAccount(querySnapshot.docs[0].data());
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-900 text-white rounded-2xl shadow-lg">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Balance</p>
          {account ? (
            <p className="text-4xl mt-2 font-bold">${account.balance.toFixed(2)}</p>
          ) : (
            <p className="text-2xl mt-2">Loading...</p>
          )}
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Available</p>
          <p className="text-3xl mt-2 font-bold text-gray-900">${account ? (account.balance * 0.9).toFixed(2) : '0.00'}</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending</p>
          <p className="text-3xl mt-2 font-bold text-gray-900">${account ? (account.balance * 0.1).toFixed(2) : '0.00'}</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        {accountId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TransactionForm user={user} accountId={accountId} type="deposit" onSuccess={fetchAccount} />
            <TransactionForm user={user} accountId={accountId} type="withdrawal" onSuccess={fetchAccount} />
            <button className="p-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200">Send Money</button>
            <button className="p-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200">Pay Bills</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Overview</h3>
            <p className="text-gray-500">Crypto: $1,250.00</p>
            <p className="text-gray-500">Stocks: $5,400.00</p>
            <button className="mt-4 p-2 w-full bg-blue-50 text-blue-900 rounded-lg font-semibold hover:bg-blue-100">View Investments</button>
        </div>
      </div>
      
      <TransactionHistory user={user} />
    </div>
  );
}
