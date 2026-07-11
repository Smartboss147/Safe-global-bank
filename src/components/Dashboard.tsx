import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';

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
    <div className="space-y-4">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold">Your Account</h2>
        {account ? (
          <p className="text-2xl mt-2 font-mono">${account.balance.toFixed(2)}</p>
        ) : (
          <p>No account found</p>
        )}
      </div>
      
      {accountId && (
        <div className="grid grid-cols-2 gap-4">
          <TransactionForm user={user} accountId={accountId} type="deposit" onSuccess={fetchAccount} />
          <TransactionForm user={user} accountId={accountId} type="withdrawal" onSuccess={fetchAccount} />
        </div>
      )}
      
      <TransactionHistory user={user} />
    </div>
  );
}
