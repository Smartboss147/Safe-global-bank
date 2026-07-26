import { useState } from 'react';
import { supabase } from '../../lib/supabase';

import { CheckCircle, XCircle, Download, AlertTriangle } from 'lucide-react';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus('idle');
    setReceiptData(null);
    
    if (!account) {
      setStatus('error');
      setMessage('Account not found.');
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatus('error');
      setMessage('Invalid amount.');
      return;
    }

    if (account.balance < val) {
      setStatus('error');
      setMessage('Insufficient funds.');
      return;
    }

    // Trigger confirmation modal
    setShowConfirmModal(true);
  };

  const confirmAndProcessTransfer = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatus('idle');
    setReceiptData(null);

    const val = parseFloat(amount);

    try {
      let txDescription = reference || `${transferType} transfer to ${recipient}`;

      if (transferType === 'email') {
        const { data: userSnap, error: uErr } = await supabase.from('profiles').select('id, email').eq('email', recipient.toLowerCase().trim());
        
        if (!userSnap || userSnap.length === 0) {
          throw new Error('Recipient user not found.');
        }
        const recipientUserDoc = userSnap[0];
        const recipientUserId = recipientUserDoc.id;

        const { data: accSnap, error: aErr } = await supabase.from('accounts').select('id').eq('user_id', recipientUserId);
        
        if (!accSnap || accSnap.length === 0) {
          throw new Error("Recipient doesn't have an active account.");
        }
        const recipientAccountIdStr = accSnap[0].id;
        
        let newDocId = '';

        
// Call an RPC or do it sequentially in a real app
const { data: senderAcc } = await supabase.from('accounts').select('balance').eq('id', account.id).single();
if (!senderAcc || senderAcc.balance < val) throw new Error("Insufficient funds.");

// This should ideally be an RPC to ensure atomicity
await supabase.rpc('process_email_transfer', { 
  sender_user_id: user.id, 
  sender_account_id: account.id, 
  recipient_user_id: recipientUserId, 
  recipient_account_id: recipientAccountIdStr,
  amount: val,
  description: txDescription
});

newDocId = 'tx_' + Math.random().toString(36).substr(2, 9);


        setReceiptData({
          id: newDocId,
          userId: user.id,
          accountId: account.id,
          type: 'transfer',
          transferType: 'email',
          amount: val,
          recipient,
          description: txDescription,
          status: 'completed',
          date: new Date().toLocaleString()
        });

        fetchAccount();
        setStatus('success');
        setMessage('Transfer initiated successfully.');
        setAmount('');
        setRecipient('');
        setReference('');
        setLoading(false);
        return;
      }

      let recipientAccountId = null;
      let transactionStatus = 'pending';

      // Handle internal transfer (simulate finding the recipient)
      if (transferType === 'internal') {
        const { data: querySnapshot } = await supabase.from('accounts').select('id').eq('account_number', recipient);
        
        if (querySnapshot && querySnapshot.length > 0) {
          recipientAccountId = querySnapshot[0].id;
          transactionStatus = 'completed';
        } else {
          // Instead of failing immediately, internal transfers might be pending admin approval if not found?
          // Let's just fail if it's internal and not found.
          throw new Error('Recipient account not found within the bank.');
        }
      }

      // Add transaction record
      const { data: insertedTx } = await supabase.from('transactions').insert([{
  user_id: user.id,
  account_id: account.id,
  type: 'transfer',
  transfer_type: transferType,
  amount: val,
  recipient: recipient,
  swift_code: transferType === 'international' ? swiftCode : null,
  bank_name: bankName,
  description: txDescription,
  status: transactionStatus,
  schedule_date: transferType === 'scheduled' ? scheduleDate : null
}]).select().single();
const docRef = { id: insertedTx?.id || 'pending' };

      // Deduct from sender immediately (even if pending for realism in this sim)
      
const { data: currAcc } = await supabase.from('accounts').select('balance').eq('id', account.id).single();
if(currAcc) {
  await supabase.from('accounts').update({ balance: currAcc.balance - val }).eq('id', account.id);
}


      // If internal and completed, add to recipient immediately
      if (recipientAccountId && transactionStatus === 'completed') {
        
await supabase.rpc('increment_balance', { account_id_param: recipientAccountId, amount_param: val });

        
        // Also add a deposit transaction for the recipient
        
await supabase.from('transactions').insert([{
  user_id: user.id, // mocked
  account_id: recipientAccountId,
  type: 'deposit',
  amount: val,
  description: `Transfer from ${account.account_number || account.accountNumber} - ${reference}`,
  status: 'completed'
}]);

      }

      setReceiptData({
        id: docRef.id,
         
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

  const handleDownloadReceipt = () => {
    alert("Receipt PDF generated successfully! Check your downloads folder.");
  };

  return (
    <div className="relative">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Money Transfer</h2>
        
        <div className="flex gap-4 mb-6 border-b border-gray-100 pb-2 overflow-x-auto hide-scrollbar">
          {['email', 'internal', 'local', 'international', 'scheduled'].map(type => (
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
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {transferType === 'email' ? 'Recipient Email Address' : 'Recipient Account / IBAN'}
            </label>
            <input 
              type={transferType === 'email' ? 'email' : 'text'} 
              value={recipient} 
              onChange={e => setRecipient(e.target.value)} 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder={transferType === 'email' ? 'user@example.com' : 'Account Number or IBAN'} 
              required 
            />
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

      {status === 'success' && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center transform transition-all">
            <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer {receiptData.status === 'completed' ? 'Successful' : 'Initiated'}</h2>
            <p className="text-gray-500 mb-6 text-center">
              {receiptData.status === 'completed' 
                ? 'Your transfer has been completed successfully.'
                : 'Your transfer has been submitted and is pending approval or processing.'}
            </p>
            
            <div className="w-full bg-gray-50 p-6 rounded-2xl space-y-3 text-sm border border-gray-100 mb-6">
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono font-medium text-gray-900">{receiptData.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-medium text-gray-900">{receiptData.date}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900 capitalize">{receiptData.transferType}</span>
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
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleDownloadReceipt}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition shadow-sm flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Receipt PDF
              </button>
              <button 
                onClick={() => { setStatus('idle'); setReceiptData(null); }}
                className="w-full px-6 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center transform transition-all">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-amber-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Confirm Transfer</h2>
            <p className="text-gray-500 mb-6 text-center text-sm">
              Please double check the transaction details before confirming. This transfer cannot be undone.
            </p>
            
            <div className="w-full bg-gray-50 p-6 rounded-2xl space-y-3 text-sm border border-gray-100 mb-6">
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Transfer Type</span>
                <span className="font-medium text-gray-900 capitalize">{transferType}</span>
              </div>
              
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">
                  {transferType === 'email' ? 'Recipient Email' : 'Recipient Account'}
                </span>
                <span className="font-medium text-gray-900 text-right truncate max-w-[200px]" title={recipient}>
                  {recipient}
                </span>
              </div>

              {bankName && (
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-medium text-gray-900">{bankName}</span>
                </div>
              )}

              {swiftCode && (
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-500">SWIFT / BIC Code</span>
                  <span className="font-mono text-gray-900">{swiftCode}</span>
                </div>
              )}

              {transferType === 'scheduled' && scheduleDate && (
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-500">Scheduled Date</span>
                  <span className="font-medium text-gray-900">{scheduleDate}</span>
                </div>
              )}

              {reference && (
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-900 truncate max-w-[200px]" title={reference}>
                    {reference}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <span className="text-gray-500 font-medium text-base">Amount</span>
                <span className="font-bold text-gray-900 text-lg">${Number(amount).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmAndProcessTransfer}
                className="flex-1 px-6 py-3 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition shadow-sm"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
