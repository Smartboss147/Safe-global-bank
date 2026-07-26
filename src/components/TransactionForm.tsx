import { useState } from 'react';
import { supabase } from '../lib/supabase';

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function TransactionForm({ user, accountId, type, onSuccess, currentBalance }: any) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const val = parseFloat(amount);
    
    if (type === 'withdrawal' && currentBalance !== undefined && val > currentBalance) {
      setError('Insufficient funds.');
      setLoading(false);
      return;
    }

    // Create transaction
    
    const { data: insertedTx } = await supabase.from('transactions').insert([{
      user_id: user.id,
      account_id: accountId,
      type,
      amount: val,
      description,
      status: 'completed'
    }]);


    // Update account balance
    
    const { data: currAcc } = await supabase.from('accounts').select('balance').eq('id', accountId).single();
    if(currAcc) {
      await supabase.from('accounts').update({ balance: currAcc.balance + (type === 'deposit' ? val : -val) }).eq('id', accountId);
    }


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
      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      
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
