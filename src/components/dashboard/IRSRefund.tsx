import React, { useState } from 'react';
import { 
  Building2, CheckCircle2, Clock, AlertTriangle, FileText, 
  HelpCircle, ChevronDown, ChevronUp, Search, Info, ShieldCheck, 
  DollarSign, Landmark, RefreshCw
} from 'lucide-react';

export default function IRSRefund({ user, account }: { user: any; account: any }) {
  const [ssn, setSsn] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [refundAmount, setRefundAmount] = useState('');
  const [taxYear, setTaxYear] = useState('2024');
  
  const [isSearching, setIsSearching] = useState(false);
  const [refundStatus, setRefundStatus] = useState<any>({
    searched: true,
    stage: 2, // 1: Return Received, 2: Refund Approved, 3: Refund Sent
    receivedDate: 'February 12, 2025',
    approvedDate: 'February 24, 2025',
    estimatedSentDate: 'March 03, 2025',
    amount: account?.balance ? Math.min(2850, Math.round(account.balance * 0.15) || 2850) : 2850,
    depositMethod: 'Safe Global Direct Deposit',
    accountEnding: account?.account_number ? account.account_number.slice(-4) : (account?.accountNumber ? account.accountNumber.slice(-4) : '9424'),
    routingNumber: '021000021',
    statusNotes: 'Your return has been processed and your refund is approved. It is scheduled to be deposited into your Safe Global Bank account by March 3, 2025.'
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleTrackRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setRefundStatus((prev: any) => ({
        ...prev,
        searched: true,
        amount: refundAmount ? parseFloat(refundAmount) : prev.amount
      }));
      setIsSearching(false);
    }, 800);
  };

  const faqs = [
    {
      q: 'When will I receive my IRS refund?',
      a: 'The IRS issues most refunds in less than 21 calendar days for e-filed returns with direct deposit selected. Paper tax returns or returns requiring manual review may take 6 to 8 weeks or longer.'
    },
    {
      q: 'Why is my refund delayed beyond 21 days?',
      a: 'Delays can occur if your return contains errors, is incomplete, requires identity verification, involves claims for the Earned Income Tax Credit (EITC) or Additional Child Tax Credit (ACTC), or is suspected of identity theft.'
    },
    {
      q: 'How do I direct deposit my refund into Safe Global Bank?',
      a: 'On IRS Form 1040 (Lines 35b, 35c, and 35d), enter your 9-digit Safe Global Bank Routing Number (021000021), select "Checking" or "Savings", and enter your Safe Global Account Number.'
    },
    {
      q: 'What should I do if the IRS requests identity verification?',
      a: 'If you receive an IRS 5071C or 6331C letter, visit the official IRS Identity & Tax Return Verification Service at irs.gov/verify or call the toll-free number provided on your letter.'
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Landmark size={14} /> Official Educational Process Guide
          </div>
          <span className="text-white/60 text-xs">U.S. Internal Revenue Service Workflow</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
          IRS Tax Refund Tracker & Direct Deposit Guide
        </h1>
        <p className="text-gray-300 text-sm max-w-2xl">
          Track your federal tax return status, understand official IRS processing stages, and easily configure direct deposit straight into your Safe Global Bank account.
        </p>
      </div>

      {/* Live Refund Tracker Tool */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Search className="text-blue-600" size={20} /> Where's My Refund? Tracker
            </h2>
            <p className="text-xs text-gray-500">Check official status for Tax Year {taxYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={taxYear} 
              onChange={e => setTaxYear(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="2024">Tax Year 2024</option>
              <option value="2023">Tax Year 2023</option>
            </select>
          </div>
        </div>

        {/* Status Stepper */}
        {refundStatus.searched && (
          <div className="mb-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100/80">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Refund Progress Status</span>
              <span className="text-xs font-semibold text-gray-500">Updated Today</span>
            </div>

            <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4 mb-8">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-200 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-10 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500" 
                style={{ width: refundStatus.stage === 1 ? '0%' : refundStatus.stage === 2 ? '50%' : '100%' }}
              />

              {/* Stage 1 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  refundStatus.stage >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  {refundStatus.stage > 1 ? <CheckCircle2 size={20} /> : '1'}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-2">1. Return Received</span>
                <span className="text-[10px] text-gray-500">{refundStatus.receivedDate}</span>
              </div>

              {/* Stage 2 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  refundStatus.stage >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  {refundStatus.stage > 2 ? <CheckCircle2 size={20} /> : '2'}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-2">2. Refund Approved</span>
                <span className="text-[10px] text-gray-500">{refundStatus.approvedDate}</span>
              </div>

              {/* Stage 3 */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  refundStatus.stage >= 3 ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  {refundStatus.stage >= 3 ? <CheckCircle2 size={20} /> : '3'}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-2">3. Refund Sent</span>
                <span className="text-[10px] text-gray-500">Est. {refundStatus.estimatedSentDate}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <p className="text-xs text-gray-500">Approved Refund Amount</p>
                  <p className="text-xl font-extrabold text-green-700">${refundStatus.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Deposit Target Account</p>
                  <p className="text-sm font-bold text-gray-900">Safe Global Checking (•••• {refundStatus.accountEnding})</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <Info size={14} className="inline text-blue-600 mr-1" />
                {refundStatus.statusNotes}
              </p>
            </div>
          </div>
        )}

        {/* Lookup Form */}
        <form onSubmit={handleTrackRefund} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">SSN / ITIN Number</label>
            <input 
              type="text" 
              placeholder="XXX-XX-XXXX" 
              value={ssn}
              onChange={e => setSsn(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Filing Status</label>
            <select 
              value={filingStatus} 
              onChange={e => setFilingStatus(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
              <option value="surviving_spouse">Qualifying Surviving Spouse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Exact Refund Amount ($)</label>
            <div className="relative">
              <input 
                type="number" 
                placeholder="2850" 
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 pl-8 font-semibold"
              />
              <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
            </div>
          </div>

          <div className="md:col-span-3 pt-2">
            <button 
              type="submit" 
              disabled={isSearching}
              className="w-full py-3.5 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-70"
            >
              {isSearching ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Verifying with IRS Records...
                </>
              ) : (
                <>
                  <Search size={18} /> Check Refund Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Safe Global Direct Deposit Setup Instructions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Building2 className="text-green-600" size={20} /> Safe Global Bank Direct Deposit Info
        </h2>
        <p className="text-xs text-gray-500 mb-6">Use these details when completing IRS Form 1040 for fast electronic refund deposit</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-500 block mb-1">Bank Name</span>
            <span className="text-sm font-bold text-gray-900 block">Safe Global Bank N.A.</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-500 block mb-1">Routing Number (ABA)</span>
            <span className="text-sm font-bold font-mono text-gray-900 block">021000021</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-500 block mb-1">Your Account Number</span>
            <span className="text-sm font-bold font-mono text-gray-900 block">
              {account?.account_number || account?.accountNumber || '9424881920'}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-bold">IRS Form 1040 Instructions (Line 35):</p>
            <p>1. Line 35b (Routing Number): Enter <strong className="font-mono">021000021</strong></p>
            <p>2. Line 35c (Type of Account): Check <strong className="font-semibold">Checking</strong></p>
            <p>3. Line 35d (Account Number): Enter <strong className="font-mono">{account?.account_number || account?.accountNumber || '9424881920'}</strong></p>
          </div>
        </div>
      </div>

      {/* Official Educational Workflow Stages */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="text-indigo-600" size={20} /> Official IRS Refund Timeline & Stages
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm mb-3">1</div>
            <h3 className="font-bold text-sm text-gray-900 mb-1">1. Return Received</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              The IRS has received your return and added it to the processing queue. E-filed returns usually update within 24–48 hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm mb-3">2</div>
            <h3 className="font-bold text-sm text-gray-900 mb-1">2. Refund Approved</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              The IRS processed your tax forms, verified deductions/credits, and approved the exact refund payment.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">3</div>
            <h3 className="font-bold text-sm text-gray-900 mb-1">3. Refund Sent</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your refund is transmitted via ACH direct deposit to Safe Global Bank or sent via paper check through US Mail.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="text-orange-600" size={20} /> Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-semibold text-sm text-gray-900 flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expandedFaq === idx && (
                <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
