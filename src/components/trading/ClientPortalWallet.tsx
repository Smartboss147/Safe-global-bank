import { useState, useEffect } from 'react';
import { Wallet, ArrowRightLeft, PlusCircle, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount, getCurrencyInfo, getCurrencySymbol } from '../../utils/currency';

interface ClientPortalWalletProps {
  user: any;
  account: any;
  fetchAccount?: () => void;
  isDarkMode?: boolean;
}

export default function ClientPortalWallet({ user, account, fetchAccount, isDarkMode = false }: ClientPortalWalletProps) {
  const userCurr = account?.currency_code || account?.currency || user?.currency_code || user?.currency || user?.country || 'USD';
  const currInfo = getCurrencyInfo(userCurr);

  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState<'to_trading' | 'to_bank'>('to_trading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tradingAccounts, setTradingAccounts] = useState<any[]>([]);
  const [selectedAccId, setSelectedAccId] = useState('');
  
  useEffect(() => {
    if (!user?.id) return;

    const fetchTradingAccounts = async () => {
      const { data } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id);
      if (data && data.length > 0) {
        console.log('[ClientPortalWallet] Fresh trading accounts from Supabase:', data);
        const mapped = data.map(d => ({
          id: d.id,
          number: d.account_number,
          type: 'Standard Live',
          currency: currInfo.code,
          leverage: d.leverage || '1:100',
          balance: d.balance || 0,
          equity: d.equity || 0,
          isLive: true
        }));
        setTradingAccounts(mapped);
        setSelectedAccId(mapped[0].id);
      }
    };

    fetchTradingAccounts();

    const tradingChannel = supabase.channel(`trading_acc_realtime_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_accounts', filter: `user_id=eq.${user.id}` }, payload => {
        console.log('[ClientPortalWallet Realtime] Database change event:', payload);
        fetchTradingAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tradingChannel);
    };
  }, [user?.id, currInfo.code]);

  const [showNewAccModal, setShowNewAccModal] = useState(false);
  const [newAccType, setNewAccType] = useState('Standard Live');
  const [newAccLeverage, setNewAccLeverage] = useState('1:100');

  const activeTradingAccount = tradingAccounts.find(a => a.id === selectedAccId) || tradingAccounts[0] || {};

  // Perform Internal Transfer
  const handleInternalTransfer = async () => {
    const val = Number(transferAmount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid transfer amount.");
      return;
    }

    setIsProcessing(true);
    try {
      if (transferDirection === 'to_trading') {
        // Transfer from Bank Account to Trading Account
        if (account && account.balance < val) {
          alert("Insufficient bank account balance.");
          setIsProcessing(false);
          return;
        }

        const updatedBankBal = (account?.balance || 0) - val;
        if (account?.id) {
          await supabase.from('accounts').update({ balance: updatedBankBal }).eq('id', account.id);
        }

        const newTrdBal = (activeTradingAccount.balance || 0) + val;
        if (activeTradingAccount.id && !activeTradingAccount.id.startsWith('acc_')) {
          await supabase.from('trading_accounts').update({ balance: newTrdBal, equity: newTrdBal }).eq('id', activeTradingAccount.id);
        }

        setTradingAccounts(prev =>
          prev.map(a => a.id === selectedAccId ? { ...a, balance: a.balance + val, equity: a.equity + val } : a)
        );

        alert(`Successfully transferred ${formatCurrencyAmount(val, currInfo)} to Trading Account ${activeTradingAccount.number}`);
      } else {
        // Transfer from Trading Account to Bank Account
        if (activeTradingAccount.balance < val) {
          alert("Insufficient trading account balance.");
          setIsProcessing(false);
          return;
        }

        const updatedBankBal = (account?.balance || 0) + val;
        if (account?.id) {
          await supabase.from('accounts').update({ balance: updatedBankBal }).eq('id', account.id);
        }

        const newTrdBal = (activeTradingAccount.balance || 0) - val;
        if (activeTradingAccount.id && !activeTradingAccount.id.startsWith('acc_')) {
          await supabase.from('trading_accounts').update({ balance: newTrdBal, equity: newTrdBal }).eq('id', activeTradingAccount.id);
        }

        setTradingAccounts(prev =>
          prev.map(a => a.id === selectedAccId ? { ...a, balance: a.balance - val, equity: a.equity - val } : a)
        );

        alert(`Successfully transferred ${formatCurrencyAmount(val, currInfo)} from Trading Account to Main Wallet`);
      }

      setTransferAmount('');
      if (fetchAccount) fetchAccount();
    } catch (e) {
      console.error(e);
      alert("Failed to complete transfer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewAccount = async () => {
    const accNum = `SGT-${Math.floor(100000 + Math.random() * 900000)}-${newAccType.includes('Demo') ? 'DEMO' : 'LIVE'}`;
    const initBal = newAccType.includes('Demo') ? 100000 : 0;

    try {
      const { data: inserted } = await supabase.from('trading_accounts').insert([{
        user_id: user.id,
        account_number: accNum,
        balance: initBal,
        equity: initBal,
        margin: 0,
        free_margin: initBal,
        leverage: newAccLeverage,
        status: 'active'
      }]).select().single();

      if (inserted) {
        const mapped = {
          id: inserted.id,
          number: inserted.account_number,
          type: newAccType,
          currency: currInfo.code,
          leverage: inserted.leverage,
          balance: inserted.balance,
          equity: inserted.equity,
          isLive: !newAccType.includes('Demo')
        };
        setTradingAccounts(prev => [...prev, mapped]);
        setSelectedAccId(inserted.id);
      }
    } catch (err) {
      console.error('[ClientPortalWallet] Error inserting trading account:', err);
    }

    setShowNewAccModal(false);
    alert(`New Trading Account ${accNum} created successfully!`);
  };

  const downloadPDFStatement = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SAFE GLOBAL TRADE - Trading Wallet Summary", 14, 20);
    doc.setFontSize(10);
    doc.text(`Account ID: ${activeTradingAccount.number}`, 14, 28);
    doc.text(`Leverage: ${activeTradingAccount.leverage}`, 14, 34);
    doc.text(`Balance: $${activeTradingAccount.balance.toFixed(2)}`, 14, 40);
    doc.text(`Equity: $${activeTradingAccount.equity.toFixed(2)}`, 14, 46);

    doc.save(`SGT_Wallet_Summary_${Date.now()}.pdf`);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Broker Client Portal &amp; Wallet</h2>
          <p className="text-sm text-slate-500">
            Manage your live and demo trading accounts, perform instant wallet-to-trading transfers, and view equity statements.
          </p>
        </div>

        <button
          onClick={() => setShowNewAccModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition flex items-center gap-2"
        >
          <PlusCircle size={16} /> Open New Trading Account
        </button>
      </div>

      {/* Account Cards Carousel/List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tradingAccounts.map(acc => {
          const isSelected = acc.id === selectedAccId;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccId(acc.id)}
              className={`p-5 rounded-3xl border-2 transition cursor-pointer shadow-sm flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    acc.isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {acc.type}
                  </span>
                  <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-1">{acc.number}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Leverage</p>
                  <p className="font-bold text-xs text-amber-600">{acc.leverage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Balance</p>
                  <p className="font-extrabold text-base text-slate-900 dark:text-white">${acc.balance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Equity</p>
                  <p className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">${acc.equity.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Internal Transfer Module */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Instant Wallet &amp; Trading Transfer</h3>
            <p className="text-xs text-slate-500">Transfer funds between your main Safe Global bank wallet and selected trading account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Transfer Direction</label>
              <select
                value={transferDirection}
                onChange={e => setTransferDirection(e.target.value as any)}
                className={`w-full p-3 text-xs rounded-xl border font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="to_trading">Bank Wallet ➔ Trading Account ({activeTradingAccount.number})</option>
                <option value="to_bank">Trading Account ({activeTradingAccount.number}) ➔ Bank Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Transfer Amount ($)</label>
              <input
                type="number"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                placeholder="100.00"
                className={`w-full p-3 text-xs rounded-xl border font-bold outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            <button
              onClick={handleInternalTransfer}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition"
            >
              {isProcessing ? 'Processing Transfer...' : 'Complete Instant Transfer'}
            </button>
          </div>

          {/* Wallet Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 text-xs">
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Transfer Summary</h4>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Main Bank Wallet:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">${(account?.balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500">Selected Trading Account:</span>
                <span className="font-extrabold text-blue-600">${activeTradingAccount.balance.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={downloadPDFStatement}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
            >
              <FileText size={15} /> Download Wallet Statement PDF
            </button>
          </div>
        </div>
      </div>

      {/* New Account Creation Modal */}
      {showNewAccModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Open New Trading Account</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Account Tier</label>
                <select
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Starter Live">Starter Live (1:500 Leverage)</option>
                  <option value="Standard Live">Standard Live (1:500 Leverage)</option>
                  <option value="Pro ECN Live">Pro ECN Live (Raw 0.0 Spreads)</option>
                  <option value="VIP Institutional">VIP Institutional ($10k Deposit)</option>
                  <option value="Demo Practice">Demo Practice ($100,000 Virtual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Default Leverage</label>
                <select
                  value={newAccLeverage}
                  onChange={e => setNewAccLeverage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="1:50">1:50 Conservative</option>
                  <option value="1:100">1:100 Standard</option>
                  <option value="1:200">1:200 High</option>
                  <option value="1:500">1:500 Maximum</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowNewAccModal(false)}
                className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewAccount}
                className="py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 shadow-md"
              >
                Confirm &amp; Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
