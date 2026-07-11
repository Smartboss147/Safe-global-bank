import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function TransactionHistory({ user }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const q = query(
        collection(db, 'transactions'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTransactions();
  }, [user]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>
      {transactions.map(t => (
        <div key={t.id} className="border-b py-2 flex justify-between">
          <span>{t.description} ({t.type})</span>
          <span className={t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
            {t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
