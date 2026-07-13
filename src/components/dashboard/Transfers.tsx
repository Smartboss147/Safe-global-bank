import { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Transfers({ user, account, fetchAccount }: any) {
  const [transferType, setTransferType] = useState('internal');
  
  // Form states
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setReceiptData(null);
    
    if (!account) {
      setStatus('error');
      setMessage('Account not found.');
      setLoading(false);
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatus('error');
      setMessage('Invalid amount.');
      setLoading(false);
      return;
    }

    if (account.balance < val) {
      setStatus('error');
      setMessage('Insufficient funds.');
      setLoading(false);
      return;
    }

    try {
      let recipientAccountId = null;
      let transactionStatus = 'pending';
      let txDescription = reference || `${transferType} transfer to ${recipient}`;

      // Handle internal transfer (simulate finding the recipient)
      if (transferType === 'internal') {
        const q = query(collection(db, 'accounts'), where('accountNumber', '==', recipient));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          recipientAccountId = querySnapshot.docs[0].id;
          transactionStatus = 'completed';
        } else {
          // Instead of failing immediately, internal transfers might be pending admin approval if not found?
          // Let's just fail if it's internal and not found.
          throw new Error('Recipient account not found within the bank.');
        }
      }

      // Add transaction record
      const txData = {
        userId: user.uid,
        accountId: account.id,
        type: 'transfer',
        transferType, // internal, local, international, scheduled
        amount: val,
        recipient,
        swiftCode: transferType === 'international' ? swiftCode : null,
        bankName: bankName,
        description: txDescription,
        status: transactionStatus, // internal can be completed immediately, others pending
        scheduleDate: transferType === 'scheduled' ? scheduleDate : null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'transactions'), txData);

      // Deduct from sender immediately (even if pending for realism in this sim)
      await updateDoc(doc(db, 'accounts', account.id), {
        balance: increment(-val)
      });

      // If internal and completed, add to recipient immediately
      if (recipientAccountId && transactionStatus === 'completed') {
        await updateDoc(doc(db, 'accounts', recipientAccountId), {
          balance: increment(val)
        });
        
        // Also add a deposit transaction for the recipient
        await addDoc(collection(db, 'transactions'), {
          userId: 'system', // we don't have the recipient's uid handy but can just put a system flag
          accountId: recipientAccountId,
          type: 'deposit',
          amount: val,
          description: `Transfer from ${account.accountNumber} - ${reference}`,
          status: 'completed',
          createdAt: serverTimestamp()
        });
      }

      setReceiptData({
        id: docRef.id,
        ...txData,
        date: new Date().toLocaleString()
      });
      
      fetchAccount(); // Update local state
      setStatus('success');
      setMessage('Transfer initiated successfully.');
      
      // Reset form
      setAmount('');
      setRecipient('');
      setReference('');
      setSwiftCode('');
      setBankName('');
      setScheduleDate('');
      
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An error occurred during transfer.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success' && receiptData) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer {receiptData.status === 'completed' ? 'Successful' : 'Initiated'}</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          {receiptData.status === 'completed' 
            ? 'Your transfer has been completed successfully.'
            : 'Your transfer has been submitted and is pending approval or processing.'}
        </p>
        
        <div className="w-full max-w-md bg-gray-50 p-6 rounded-xl space-y-3 text-sm border border-gray-100">
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono font-medium text-gray-900">{receiptData.id}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <span className="text-gray-500">Date & Time</span>
            <span className="font-medium text-gray-900">{receiptData.date}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <span className="text-gray-500">Type</span>
            <span className="font-medium text-gray-900 capitalize">{receiptData.transferType} Transfer</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <span className="text-gray-500">Recipient</span>
            <span className="font-medium text-gray-900">{receiptData.recipient}</span>
          </div>
          {receiptData.bankName && (
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-900">{receiptData.bankName}</span>
            </div>
          )}
          <div className="flex justify-between pt-2">
            <span className="text-gray-500 font-medium text-base">Amount</span>
            <span className="font-bold text-gray-900 text-lg">${Number(receiptData.amount).toFixed(2)}</span>
          </div>
        </div>
        
        <button 
          onClick={() => { setStatus('idle'); setReceiptData(null); }}
          className="mt-8 px-6 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition shadow-sm w-full max-w-md"
        >
          Make Another Transfer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Money Transfer</h2>
      
      <div className="flex gap-4 mb-6 border-b border-gray-100 pb-2 overflow-x-auto hide-scrollbar">
        {['internal', 'local', 'international', 'scheduled'].map(type => (
          <button
            key={type}
            onClick={() => setTransferType(type)}
            className={`pb-2 px-4 capitalize font-semibold transition-colors whitespace-nowrap ${
              transferType === type 
                ? 'text-blue-900 border-b-2 border-blue-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <XCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-red-700 text-sm">{message}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        
        {transferType === 'international' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">SWIFT / BIC Code</label>
              <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Enter SWIFT code" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Bank Name</label>
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Enter Bank Name" required />
            </div>
          </div>
        )}
        
        {(transferType === 'local' || transferType === 'scheduled') && (
           <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bank Name</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. Chase, Bank of America" required />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Recipient Account / IBAN</label>
          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Account Number or IBAN" required />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" step="0.01" className="w-full py-3 pl-8 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="0.00" required />
          </div>
          {account && (
            <p className="text-xs text-gray-500 mt-2 font-medium">Available Balance: <span className="font-bold text-gray-900">${account.balance.toFixed(2)}</span></p>
          )}
        </div>

        {transferType === 'scheduled' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Date</label>
            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Reference / Description</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="What is this for?" required />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-3.5 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 active:scale-95 transition-all mt-4 disabled:opacity-70 flex items-center justify-center shadow-lg shadow-blue-900/20"
        >
          {loading ? 'Processing...' : 'Complete Transfer'}
        </button>
      </form>
    </div>
  );
}
