import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight, Copy, QrCode, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64200.50, networks: ['Bitcoin (BTC)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, networks: ['Ethereum (ERC20)', 'Arbitrum One', 'Optimism', 'Base'] },
  { symbol: 'USDT', name: 'TetherUS', price: 1.00, networks: ['Tron (TRC20)', 'Ethereum (ERC20)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'BNB', name: 'BNB', price: 580.40, networks: ['BNB Smart Chain (BEP20)'] },
  { symbol: 'SOL', name: 'Solana', price: 145.30, networks: ['Solana'] },
  { symbol: 'XRP', name: 'XRP', price: 0.60, networks: ['Ripple'] },
  { symbol: 'LTC', name: 'Litecoin', price: 82.50, networks: ['Litecoin'] }
];

export default function CryptoWallet({ user }: any) {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
    fetchWallet();
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'crypto_wallets'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setWallet({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
    } else {
      // Create empty wallet
      const newWallet = {
        userId: user.uid,
        balances: SUPPORTED_COINS.reduce((acc: any, coin) => ({ ...acc, [coin.symbol]: 0 }), {}),
        tradingBalance: 0,
        address: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')
      };
      const docRef = await addDoc(collection(db, 'crypto_wallets'), newWallet);
      setWallet({ id: docRef.id, ...newWallet });
    }
    setLoading(false);
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

    const currentBalance = wallet.balances[sendAsset.symbol] || 0;
    if (currentBalance < val) {
      setMsg({ type: 'error', text: `Insufficient ${sendAsset.symbol} balance` });
      setSendLoading(false);
      return;
    }

    try {
      // Create pending transaction for admin approval
      await addDoc(collection(db, 'crypto_transactions'), {
        userId: user.uid,
        walletId: wallet.id,
        type: 'withdrawal',
        asset: sendAsset.symbol,
        network: sendNetwork,
        amount: val,
        address: sendAddress,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Deduct from local wallet balance immediately for simulation
      const newBalances = { ...wallet.balances, [sendAsset.symbol]: currentBalance - val };
      await updateDoc(doc(db, 'crypto_wallets', wallet.id), { balances: newBalances });
      
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
      // Simulate an incoming deposit (for demonstration)
      await addDoc(collection(db, 'crypto_transactions'), {
        userId: user.uid,
        walletId: wallet.id,
        type: 'deposit',
        asset: selectedReceiveAsset.symbol,
        network: selectedNetwork,
        amount: 0, // Admin must fill this
        address: wallet.address,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setMsg({ type: 'success', text: `System notified of incoming ${selectedReceiveAsset.symbol} deposit. Pending network confirmation.` });
    } catch (err) {
       setMsg({ type: 'error', text: 'Failed to process deposit notification.' });
    }
  };

  if (loading || !wallet) {
    return <div className="p-8 text-center text-gray-500">Loading Crypto Wallet...</div>;
  }

  // Calculate totals
  const activeAssets = SUPPORTED_COINS.map(coin => ({
    ...coin,
    balance: wallet.balances[coin.symbol] || 0,
    value: (wallet.balances[coin.symbol] || 0) * coin.price,
    change: (Math.random() * 10 - 5).toFixed(2) // Simulated 24h change
  }));

  const cryptoValue = activeAssets.reduce((sum, a) => sum + a.value, 0);
  const tradingBalance = wallet.tradingBalance || 0;
  const totalValue = cryptoValue + tradingBalance;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider relative z-10">Total Account Value</p>
        <p className="text-4xl mt-2 font-bold relative z-10">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        
        <div className="flex gap-4 mt-8 relative z-10">
          <button 
            onClick={() => { setActiveTab('receive'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'receive' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <ArrowDownLeft size={18} /> Receive
          </button>
          <button 
            onClick={() => { setActiveTab('send'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'send' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <ArrowUpRight size={18} /> Send
          </button>
          <button 
            onClick={() => { setActiveTab('portfolio'); setMsg({type:'',text:''}); }}
            className={`flex-1 p-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'portfolio' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Portfolio
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${msg.type === 'error' ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-green-50 border border-green-100 text-green-700'}`}>
          {msg.type === 'error' ? <XCircle className="shrink-0 mt-0.5" size={20} /> : <CheckCircle className="shrink-0 mt-0.5" size={20} />}
          <p className="text-sm font-medium">{msg.text}</p>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Trading Balance</h3>
            <span className="text-xl font-bold text-gray-900">${tradingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="w-full h-px bg-gray-100 mb-6" />

          <h3 className="text-lg font-bold text-gray-900 mb-4">Crypto Portfolio</h3>
          <div className="space-y-3">
            {activeAssets.map((asset) => (
              <div key={asset.symbol} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 text-lg">
                    {asset.symbol.substring(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{asset.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{asset.balance} {asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className={`text-xs font-bold mt-1 ${parseFloat(asset.change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(asset.change) >= 0 ? '+' : ''}{asset.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'receive' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Deposit Crypto</h3>
          <div className="max-w-md mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedReceiveAsset.symbol}
                    onChange={handleAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                  >
                    {selectedReceiveAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="p-8 border border-gray-100 rounded-2xl text-center space-y-6 bg-gray-50/50">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QrCode size={180} className="text-slate-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium">Your {selectedReceiveAsset.symbol} Address</p>
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <p className="font-mono text-xs font-semibold truncate text-slate-700 select-all">{wallet.address}</p>
                  <button onClick={() => navigator.clipboard.writeText(wallet.address)} className="text-slate-400 hover:text-blue-600 transition p-1"><Copy size={16} /></button>
                </div>
              </div>
              <div className="bg-yellow-50/50 border border-yellow-100 text-yellow-800 text-xs p-4 rounded-xl text-left font-medium leading-relaxed">
                <span className="font-bold">Warning:</span> Only send {selectedReceiveAsset.name} ({selectedReceiveAsset.symbol}) to this address over the <span className="font-bold">{selectedNetwork}</span> network. Sending other assets or using a different network will result in permanent loss.
              </div>
              <button onClick={handleReceiveSimulation} className="text-xs text-blue-600 font-bold hover:underline">I have made a deposit</button>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    value={sendAsset.symbol}
                    onChange={handleSendAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Recipient Address</label>
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
                <label className="block text-sm font-bold text-gray-700">Amount</label>
                <span className="text-xs font-bold text-gray-500">Available: {wallet.balances[sendAsset.symbol] || 0} {sendAsset.symbol}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  className="w-full py-3 pl-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="0.00" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setSendAmount((wallet.balances[sendAsset.symbol] || 0).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800 p-1"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="pt-2">
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-500 font-medium">Network Fee</span>
                 <span className="font-bold text-gray-900">~ 0.0005 {sendAsset.symbol}</span>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={sendLoading}
              className="w-full p-3.5 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 active:scale-95 transition-all mt-4 disabled:opacity-70 shadow-lg shadow-blue-900/20"
            >
              {sendLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
