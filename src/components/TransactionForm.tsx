import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function TransactionForm({ user, accountId, type, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    // Create transaction
    await addDoc(collection(db, 'transactions'), {
      userId: user.uid,
      accountId: accountId,
      type,
      amount: val,
      description,
      createdAt: serverTimestamp(),
    });

    // Update account balance
    const accountRef = doc(db, 'accounts', accountId);
    await updateDoc(accountRef, {
      balance: increment(type === 'deposit' ? val : -val)
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <h3 className="font-bold text-lg mb-2 capitalize">{type}</h3>
      <input type="number" placeholder="Amount" className="w-full p-2 mb-2 border rounded" onChange={(e) => setAmount(e.target.value)} />
      <input type="text" placeholder="Description" className="w-full p-2 mb-4 border rounded" onChange={(e) => setDescription(e.target.value)} />
      <button type="submit" className="w-full p-2 bg-green-600 text-white rounded">Submit</button>
    </form>
  );
}
