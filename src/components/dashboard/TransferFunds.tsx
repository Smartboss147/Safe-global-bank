import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount, getCurrencySymbol, getCurrencyInfo } from '../../utils/currency';
import { 
  Send, 
  Building2, 
  Globe, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  DollarSign,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendCryptoTransferEmail } from '../../services/cryptoEmailService';

interface TransferFundsProps {
  user: any;
  account: any;
  fetchAccount: () => void;
}

export default function TransferFunds({ user, account, fetchAccount }: TransferFundsProps) {
  const [transferType, setTransferType] = useState<'internal' | 'email' | 'domestic' | 'international' | 'scheduled'>('internal');
  
  // Form states
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  
  // UX states
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const availableBalance = Number(account?.balance || 0);
  const userCurr = account?.currency_code || account?.currency || user?.currency_code || user?.currency || user?.country || 'USD';
  const currInfo = getCurrencyInfo(userCurr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');
    setReceiptData(null);

    if (!account) {
      setStatus('error');
      setMessage('Source account not found. Please reload your dashboard.');
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setStatus('error');
      setMessage(`Please enter a valid transfer amount greater than ${formatCurrencyAmount(0, currInfo)}.`);
      return;
    }

    if (val > availableBalance) {
      setStatus('error');
      setMessage(`Insufficient funds. Your available balance is ${formatCurrencyAmount(availableBalance, currInfo)}.`);
      return;
    }

    if (!recipient.trim()) {
      setStatus('error');
      setMessage('Please enter a recipient account number or email address.');
      return;
    }

    if (transferType === 'international' && !swiftCode.trim()) {
      setStatus('error');
      setMessage('SWIFT/BIC Code is required for international wire transfers.');
      return;
    }

    setShowConfirmModal(true);
  };

  const processTransfer = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatus('idle');
    setMessage('');

    const val = parseFloat(amount);
    const txDescription = reference.trim() || `Transfer to ${recipient} (${transferType.toUpperCase()})`;

    try {
      let recipientAccountId: string | null = null;
      let recipientUserId: string | null = null;
      let txStatus = 'completed';

      // 1. Email transfer lookup
      if (transferType === 'email') {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', recipient.toLowerCase().trim())
          .maybeSingle();

        if (userProfile?.id) {
          recipientUserId = userProfile.id;
          const { data: recipientAcc } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', recipientUserId)
            .maybeSingle();
          if (recipientAcc?.id) {
            recipientAccountId = recipientAcc.id;
          }
        }
      } 
      // 2. Internal account lookup
      else if (transferType === 'internal') {
        const { data: recipientAcc } = await supabase
          .from('accounts')
          .select('id, user_id, balance')
          .eq('account_number', recipient.trim())
          .maybeSingle();

        if (recipientAcc) {
          recipientAccountId = recipientAcc.id;
          recipientUserId = recipientAcc.user_id;
        }
      } else if (transferType === 'international' || transferType === 'scheduled') {
        txStatus = 'pending';
      }

      // Record sender's transaction in Supabase 'transactions' table
      const { data: senderTx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          account_id: account.id,
          type: 'transfer_out',
          transfer_type: transferType,
          amount: val,
          recipient: recipient.trim(),
          bank_name: bankName.trim() || 'Safe Global Bank',
          swift_code: swiftCode.trim() || null,
          description: txDescription,
          status: txStatus,
          schedule_date: scheduleDate || null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (txError) {
        console.warn('Error inserting transaction into Supabase, attempting fallback:', txError);
      }

      // Deduct funds from sender account
      const newSenderBalance = availableBalance - val;
      await supabase
        .from('accounts')
        .update({ balance: newSenderBalance })
        .eq('id', account.id);

      // If internal/email transfer recipient account is found, credit recipient
      if (recipientAccountId) {
        try {
          const { data: recAccData } = await supabase
            .from('accounts')
            .select('balance')
            .eq('id', recipientAccountId)
            .single();

          if (recAccData) {
            const newRecBalance = (Number(recAccData.balance) || 0) + val;
            await supabase
              .from('accounts')
              .update({ balance: newRecBalance })
              .eq('id', recipientAccountId);

            // Log deposit transaction for recipient
            await supabase
              .from('transactions')
              .insert([{
                user_id: recipientUserId || user.id,
                account_id: recipientAccountId,
                type: 'transfer_in',
                transfer_type: transferType,
                amount: val,
                recipient: account.account_number || account.accountNumber || user.email,
                description: `Received from ${user.email}`,
                status: 'completed',
                created_at: new Date().toISOString()
              }]);
          }
        } catch (recErr) {
          console.warn('Notice crediting recipient:', recErr);
        }
      }

      const referenceId = senderTx?.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

      const receipt = {
        id: referenceId,
        senderEmail: user.email,
        senderAccount: account.account_number || account.accountNumber || 'Primary Checking',
        recipient: recipient.trim(),
        amount: val,
        type: transferType,
        bankName: bankName || 'Safe Global Bank Network',
        status: txStatus,
        date: new Date().toLocaleString()
      };

      setReceiptData(receipt);
      setStatus('success');
      setMessage(
        txStatus === 'completed'
          ? `Successfully transferred $${val.toFixed(2)} to ${recipient}.`
          : `Transfer request submitted and pending verification.`
      );

      // Dispatch automated transfer email notification
      if (user?.email) {
        sendCryptoTransferEmail({
          type: 'outgoing',
          recipientName: user.displayName || user.email?.split('@')[0] || 'Valued Client',
          recipientEmail: user.email,
          asset: currInfo.code || 'USD',
          assetName: 'Bank Funds',
          amount: val,
          network: bankName || 'Safe Global Banking Network',
          walletAddress: recipient,
          status: txStatus === 'completed' ? 'Completed' : 'Pending Verification',
          referenceId: referenceId,
          updatedBalance: formatCurrencyAmount(newSenderBalance, currInfo, { includeCode: true })
        }).catch(e => console.warn('Bank transfer email notification warning:', e));
      }

      // Reset form
      setAmount('');
      setRecipient('');
      setReference('');
      setSwiftCode('');
      setBankName('');
      setScheduleDate('');

      // Refresh account balances across app
      if (fetchAccount) fetchAccount();

    } catch (err: any) {
      console.error('Transfer funds error:', err);
      setStatus('error');
      setMessage(err.message || 'Transfer failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceiptPDF = () => {
    if (!receiptData) return;
    try {
      const doc = new jsPDF();
      doc.setFillColor(10, 61, 54);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('Safe Global Bank Official Transfer Receipt', 14, 20);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.text(`Transaction Reference: ${receiptData.id}`, 14, 40);
      doc.text(`Date & Time: ${receiptData.date}`, 14, 46);

      autoTable(doc, {
        startY: 54,
        head: [['Field', 'Details']],
        body: [
          ['Sender Email', receiptData.senderEmail],
          ['Sender Account', receiptData.senderAccount],
          ['Recipient', receiptData.recipient],
          ['Bank / Network', receiptData.bankName],
          ['Transfer Type', receiptData.type.toUpperCase()],
          ['Amount Transferred', formatCurrencyAmount(receiptData.amount, currInfo, { includeCode: true })],
          ['Status', receiptData.status.toUpperCase()]
        ],
        headStyles: { fillColor: [10, 61, 54] },
        styles: { fontSize: 10 }
      });

      doc.save(`SafeGlobalBank_Transfer_${receiptData.id}.pdf`);
    } catch (err) {
      console.error('Error printing receipt PDF:', err);
      alert('Unable to generate PDF receipt.');
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100/80 space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="text-[#0A3D36]" size={24} />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Transfer Funds</h2>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">Send money seamlessly with end-to-end encryption & instant ledger confirmation</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="text-emerald-700" size={20} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Available Balance</p>
            <p className="text-base font-black text-emerald-900">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Transfer Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
        {[
          { id: 'internal', label: 'Internal Account', icon: <Send size={15} /> },
          { id: 'email', label: 'Email Pay', icon: <Mail size={15} /> },
          { id: 'domestic', label: 'Domestic Bank', icon: <Building2 size={15} /> },
          { id: 'international', label: 'Wire Transfer', icon: <Globe size={15} /> },
          { id: 'scheduled', label: 'Scheduled', icon: <Clock size={15} /> }
        ].map(type => (
          <button
            key={type.id}
            type="button"
            onClick={() => {
              setTransferType(type.id as any);
              setStatus('idle');
              setMessage('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              transferType === type.id
                ? 'bg-[#0A3D36] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type.icon}
            <span className="truncate">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Alert Status Banner */}
      {status === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle size={20} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
          <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          {receiptData && (
            <div className="pt-2 flex flex-wrap gap-2 items-center justify-between border-t border-emerald-200/60">
              <span className="text-xs font-mono text-emerald-900 font-semibold">Ref: {receiptData.id}</span>
              <button
                onClick={downloadReceiptPDF}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} /> Download Receipt PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Transfer Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recipient Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            {transferType === 'email' ? 'Recipient Email Address' : transferType === 'internal' ? 'Account Number (e.g. ACC-100234)' : 'Recipient Account Number / IBAN'}
          </label>
          <div className="relative">
            <input
              type={transferType === 'email' ? 'email' : 'text'}
              required
              placeholder={
                transferType === 'email' ? 'john.doe@example.com' :
                transferType === 'internal' ? 'e.g. ACC-894210' :
                'Enter Account / IBAN'
              }
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0A3D36] focus:bg-white outline-none"
            />
            <UserCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {/* Amount Input with Quick Preset Chips */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Transfer Amount ({currInfo.code})</span>
            <span className="text-[#0A3D36] font-extrabold">{currInfo.symbol}</span>
          </label>
          <div className="relative mb-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-extrabold text-base">{currInfo.symbol}</span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-9 pr-3.5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black text-gray-900 focus:ring-2 focus:ring-[#0A3D36] focus:bg-white outline-none"
            />
          </div>
          <div className="flex gap-2">
            {[25, 50, 100, 250, 500, 1000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
              >
                +{currInfo.symbol}{val}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Bank Details */}
        {(transferType === 'domestic' || transferType === 'international') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. Chase Bank, Barclays"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0A3D36] outline-none"
              />
            </div>
            {transferType === 'international' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SWIFT / BIC Code</label>
                <input
                  type="text"
                  required
                  placeholder="CHASUS33XXX"
                  value={swiftCode}
                  onChange={e => setSwiftCode(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold uppercase focus:ring-2 focus:ring-[#0A3D36] outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Scheduled Date */}
        {transferType === 'scheduled' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Execution Date</label>
            <input
              type="date"
              required
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0A3D36] outline-none"
            />
          </div>
        )}

        {/* Reference / Memo */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Payment Memo / Reference (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Invoice #9021 or Rent payment"
            value={reference}
            onChange={e => setReference(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#0A3D36] outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0A3D36] hover:bg-[#072a25] active:scale-[0.99] text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Processing Transfer...</span>
              </>
            ) : (
              <>
                <span>Review & Process Transfer</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">Confirm Transfer Details</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Recipient</span>
                  <span className="font-bold text-gray-900 truncate max-w-[180px]">{recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Transfer Method</span>
                  <span className="font-bold text-gray-900 capitalize">{transferType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Transfer Fee</span>
                  <span className="font-bold text-emerald-600">$0.00 (Waived)</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                  <span className="font-bold text-gray-900">Total Deduction</span>
                  <span className="font-black text-[#0A3D36]">{formatCurrencyAmount(amount || 0, currInfo)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                By confirming, you authorize Safe Global Trade to deduct <span className="font-bold text-gray-800">{formatCurrencyAmount(amount || 0, currInfo)}</span> from your account and process the funds to <span className="font-bold text-gray-800">{recipient}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={processTransfer}
                className="py-3 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold rounded-xl text-sm shadow-md transition"
              >
                Authorize & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
