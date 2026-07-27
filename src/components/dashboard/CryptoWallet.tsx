import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount, getCurrencyInfo } from '../../utils/currency';
import { ArrowDownLeft, ArrowUpRight, Copy, QrCode, ChevronDown, CheckCircle, XCircle, Check, Wallet } from 'lucide-react';

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64200.50, networks: ['Bitcoin (BTC)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, networks: ['Ethereum (ERC20)', 'Arbitrum One', 'Optimism', 'Base'] },
  { symbol: 'USDT', name: 'TetherUS', price: 1.00, networks: ['Tron (TRC20)', 'Ethereum (ERC20)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'BNB', name: 'BNB', price: 580.40, networks: ['BNB Smart Chain (BEP20)'] },
  { symbol: 'SOL', name: 'Solana', price: 145.30, networks: ['Solana'] },
  { symbol: 'XRP', name: 'XRP', price: 0.60, networks: ['Ripple'] },
  { symbol: 'LTC', name: 'Litecoin', price: 82.50, networks: ['Litecoin'] }
];

const createDefaultWallet = (userId: string) => {
  const cleanId = (userId || 'user').replace(/[^a-f0-9]/gi, '').padEnd(40, 'a').slice(0, 40);
  return {
    user_id: userId,
    balances: SUPPORTED_COINS.reduce((acc: any, coin) => ({ ...acc, [coin.symbol]: 0 }), {}),
    trading_balance: 0,
    address: '0x' + cleanId
  };
};

export default function CryptoWallet({ user }: any) {
  // Synchronous immediate initialization - NO BLOCKING LOADING SCREEN!
  const [wallet, setWallet] = useState<any>(() => createDefaultWallet(user?.id));
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'receive' | 'send'>('portfolio');
  
  // Receive state
  const [selectedReceiveAsset, setSelectedReceiveAsset] = useState(SUPPORTED_COINS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_COINS[0].networks[0]);

  // Send state
  const [sendAsset, setSendAsset] = useState(SUPPORTED_COINS[0]);
  const [sendNetwork, setSendNetwork] = useState(SUPPORTED_COINS[0].networks[0]);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const syncWallet = async () => {
      try {
        const { data } = await supabase
          .from('crypto_wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          if (isMounted) {
            // Ensure all supported coins exist in balances object
            const balances = { ...createDefaultWallet(user.id).balances, ...(data.balances || {}) };
            setWallet({ ...data, balances });
          }
        } else {
          // Create empty wallet in database
          const newWallet = createDefaultWallet(user.id);
          const { data: inserted } = await supabase
            .from('crypto_wallets')
            .insert([newWallet])
            .select()
            .single();

          if (inserted && isMounted) {
            setWallet(inserted);
          }
        }
      } catch (err) {
        console.warn('Crypto wallet sync notice:', err);
      }
    };

    syncWallet();

    return () => { isMounted = false; };
  }, [user?.id]);

  const handleCopyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = SUPPORTED_COINS.find(a => a.symbol === e.target.value) || SUPPORTED_COINS[0];
    setSelectedReceiveAsset(asset);
    setSelectedNetwork(asset.networks[0]);
  };

  const handleSendAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = SUPPORTED_COINS.find(a => a.symbol === e.target.value) || SUPPORTED_COINS[0];
    setSendAsset(asset);
    setSendNetwork(asset.networks[0]);
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setSendLoading(true);

    const val = parseFloat(sendAmount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Invalid amount' });
      setSendLoading(false);
      return;
    }

    const currentBalance = (wallet?.balances && wallet.balances[sendAsset.symbol]) || 0;
    if (currentBalance < val) {
      setMsg({ type: 'error', text: `Insufficient ${sendAsset.symbol} balance` });
      setSendLoading(false);
      return;
    }

    try {
      // Create pending transaction for admin approval
      await supabase.from('crypto_transactions').insert([{
        user_id: user.id,
        wallet_id: wallet.id,
        type: 'withdrawal',
        asset: sendAsset.symbol,
        network: sendNetwork,
        amount: val,
        address: sendAddress,
        status: 'pending'
      }]);

      // Deduct from local wallet balance immediately for simulation
      const newBalances = { ...wallet.balances, [sendAsset.symbol]: currentBalance - val };
      if (wallet.id) {
        await supabase.from('crypto_wallets').update({ balances: newBalances }).eq('id', wallet.id);
      }
      
      setWallet({ ...wallet, balances: newBalances });
      setMsg({ type: 'success', text: `Withdrawal of ${val} ${sendAsset.symbol} submitted and is pending network confirmation.` });
      setSendAmount('');
      setSendAddress('');
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to process withdrawal.' });
    } finally {
      setSendLoading(false);
    }
  };

  const handleReceiveSimulation = async () => {
    setMsg({ type: '', text: '' });
    try {
      if (wallet.id) {
        await supabase.from('crypto_transactions').insert([{
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'deposit',
          asset: selectedReceiveAsset.symbol,
          network: selectedNetwork,
          amount: 0,
          address: wallet.address,
          status: 'pending'
        }]);
      }
      setMsg({ type: 'success', text: `System notified of incoming ${selectedReceiveAsset.symbol} deposit. Pending network confirmation.` });
    } catch (err) {
       setMsg({ type: 'error', text: 'Failed to process deposit notification.' });
    }
  };

  // Calculate totals
  const activeAssets = SUPPORTED_COINS.map((coin, index) => {
    const balance = (wallet?.balances && wallet.balances[coin.symbol]) || 0;
    const value = balance * coin.price;
    const changeVals = ['+2.4', '-1.1', '0.00', '+4.5', '+8.2', '-0.5', '+1.8'];
    return {
      ...coin,
      balance,
      value,
      change: changeVals[index % changeVals.length]
    };
  });

  const cryptoValue = activeAssets.reduce((sum, a) => sum + a.value, 0);
  const tradingBalance = wallet?.trading_balance || 0;
  const totalValue = cryptoValue + tradingBalance;
  
  const currInfo = getCurrencyInfo(user?.currency_code || user?.currency || user?.country || 'USD');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider relative z-10">Total Crypto Account Value</p>
        <p className="text-3xl sm:text-4xl mt-2 font-black tracking-tight relative z-10">{formatCurrencyAmount(totalValue, currInfo)}</p>
        
        <div className="flex gap-2 sm:gap-4 mt-6 relative z-10">
          <button 
            onClick={() => { setActiveTab('receive'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'receive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <ArrowDownLeft size={16} /> Receive
          </button>
          <button 
            onClick={() => { setActiveTab('send'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'send' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <ArrowUpRight size={16} /> Send
          </button>
          <button 
            onClick={() => { setActiveTab('portfolio'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'portfolio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <Wallet size={16} /> Portfolio
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 ${msg.type === 'error' ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
          {msg.type === 'error' ? <XCircle className="shrink-0 mt-0.5" size={20} /> : <CheckCircle className="shrink-0 mt-0.5" size={20} />}
          <p className="text-sm font-medium">{msg.text}</p>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trading Account Balance</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrencyAmount(tradingBalance, currInfo)}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Active</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crypto Assets</h3>
            <div className="space-y-3">
              {activeAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/80 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-slate-900/10">
                      {asset.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{asset.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">{asset.balance} {asset.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrencyAmount(asset.value, currInfo)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${parseFloat(asset.change) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {parseFloat(asset.change) >= 0 ? '+' : ''}{asset.change}%
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setSelectedReceiveAsset(asset);
                          setSelectedNetwork(asset.networks[0]);
                          setActiveTab('receive');
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title={`Deposit ${asset.symbol}`}
                      >
                        <ArrowDownLeft size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setSendAsset(asset);
                          setSendNetwork(asset.networks[0]);
                          setActiveTab('send');
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title={`Send ${asset.symbol}`}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receive' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Deposit Crypto</h3>
          <div className="max-w-md mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedReceiveAsset.symbol}
                    onChange={handleAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                  >
                    {selectedReceiveAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-100 rounded-2xl text-center space-y-5 bg-gray-50/50">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QrCode size={160} className="text-slate-900 mx-auto" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Your {selectedReceiveAsset.symbol} Deposit Address</p>
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <p className="font-mono text-xs font-semibold truncate text-slate-800 select-all">{wallet?.address || 'Loading...'}</p>
                  <button 
                    onClick={handleCopyAddress} 
                    className="text-slate-500 hover:text-blue-600 transition p-1.5 hover:bg-gray-100 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs p-3.5 rounded-xl text-left font-medium leading-relaxed">
                <span className="font-bold">Important:</span> Send only {selectedReceiveAsset.name} ({selectedReceiveAsset.symbol}) via <span className="font-bold">{selectedNetwork}</span> network to this deposit address.
              </div>
              <button onClick={handleReceiveSimulation} className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition">
                Notify System of Completed Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Send Crypto</h3>
          <form className="max-w-md mx-auto space-y-6" onSubmit={handleSend}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={sendAsset.symbol}
                    onChange={handleSendAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={sendNetwork}
                    onChange={(e) => setSendNetwork(e.target.value)}
                  >
                    {sendAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Recipient Address</label>
              <input 
                type="text" 
                value={sendAddress}
                onChange={e => setSendAddress(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder={`Enter ${sendAsset.symbol} Address`} 
                required 
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</label>
                <span className="text-xs font-bold text-gray-500">Available: {(wallet?.balances && wallet.balances[sendAsset.symbol]) || 0} {sendAsset.symbol}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  className="w-full py-3 pl-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" 
                  placeholder="0.00" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setSendAmount(((wallet?.balances && wallet.balances[sendAsset.symbol]) || 0).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800 p-1"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="pt-1">
               <div className="flex justify-between text-xs font-medium text-gray-500">
                 <span>Network Fee</span>
                 <span className="font-bold text-gray-900">~ 0.0005 {sendAsset.symbol}</span>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={sendLoading}
              className="w-full p-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70"
            >
              {sendLoading ? 'Processing...' : 'Withdraw Crypto'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
