import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function TransactionForm({ user, accountId, type, onSuccess }: any) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
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

    setAmount('');
    setDescription('');
    setLoading(false);
    onSuccess();
  };

  const isDeposit = type === 'deposit';

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-full ${isDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {isDeposit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <h3 className="font-bold text-gray-900 capitalize text-lg">{type}</h3>
      </div>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
        <input 
          type="number" 
          placeholder="0.00" 
          required
          min="1"
          step="0.01"
          className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)} 
        />
      </div>
      
      <input 
        type="text" 
        placeholder="What is this for?" 
        required
        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition" 
        value={description}
        onChange={(e) => setDescription(e.target.value)} 
      />
      
      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-3 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
          isDeposit 
            ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' 
            : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20'
        }`}
      >
        {loading ? 'Processing...' : (isDeposit ? 'Add Funds' : 'Send Funds')}
      </button>
    </form>
  );
}
