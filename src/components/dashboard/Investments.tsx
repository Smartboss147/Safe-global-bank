import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Clock, Activity, BarChart2 } from 'lucide-react';

const MARKETS = [
  { symbol: 'EURUSD', name: 'EUR/USD', type: 'Forex', price: 1.0934, change: 0.12 },
  { symbol: 'GBPUSD', name: 'GBP/USD', type: 'Forex', price: 1.2645, change: -0.05 },
  { symbol: 'USDJPY', name: 'USD/JPY', type: 'Forex', price: 155.32, change: 0.25 },
  { symbol: 'XAUUSD', name: 'Gold', type: 'Commodity', price: 2345.50, change: 1.2 },
  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'Crypto', price: 64200.00, change: -2.4 },
  { symbol: 'ETHUSD', name: 'Ethereum', type: 'Crypto', price: 3450.00, change: 0.8 },
  { symbol: 'US30', name: 'Wall Street 30', type: 'Indices', price: 39500.00, change: 0.4 },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', price: 185.92, change: 1.2 }
];

export default function Investments({ user }: any) {
  const [tradingAccount, setTradingAccount] = useState<any>(null);
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState(MARKETS[0]);
  const [tradeSize, setTradeSize] = useState('1.00');
  const [loading, setLoading] = useState(true);
  const [placingTrade, setPlacingTrade] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');

  useEffect(() => {
    if (!user) return;
    
    // Fetch or create trading account
    const fetchAccount = async () => {
      const q = query(collection(db, 'trading_accounts'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setTradingAccount({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        const newAcc = {
          userId: user.uid,
          balance: 10000.00,
          equity: 10000.00,
          margin: 0,
          freeMargin: 10000.00
        };
        const docRef = await addDoc(collection(db, 'trading_accounts'), newAcc);
        setTradingAccount({ id: docRef.id, ...newAcc });
      }
    };
    
    fetchAccount();

    // Listen to trades
    const tradesQuery = query(collection(db, 'trades'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(tradesQuery, (snapshot) => {
      const allTrades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOpenTrades(allTrades.filter((t: any) => t.status === 'open'));
      setTradeHistory(allTrades.filter((t: any) => t.status === 'closed'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleTrade = async (direction: 'buy' | 'sell') => {
    if (!tradingAccount) return;
    setPlacingTrade(true);
    
    try {
      const size = parseFloat(tradeSize);
      if (isNaN(size) || size <= 0) throw new Error('Invalid trade size');
      
      const marginRequired = size * 100; // Mock margin requirement
      
      if (tradingAccount.freeMargin < marginRequired) {
        alert('Not enough free margin to open this trade.');
        setPlacingTrade(false);
        return;
      }
      
      // Open trade
      await addDoc(collection(db, 'trades'), {
        userId: user.uid,
        tradingAccountId: tradingAccount.id,
        symbol: selectedAsset.symbol,
        type: direction,
        size: size,
        openPrice: selectedAsset.price,
        currentPrice: selectedAsset.price,
        profit: 0,
        status: 'open',
        openTime: serverTimestamp()
      });
      
      // Update account margin
      await updateDoc(doc(db, 'trading_accounts', tradingAccount.id), {
        margin: tradingAccount.margin + marginRequired,
        freeMargin: tradingAccount.freeMargin - marginRequired
      });
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPlacingTrade(false);
    }
  };

  const requestCloseTrade = async (tradeId: string) => {
    // In this simulation, users request to close, or it closes immediately.
    // We will just close it immediately for the user experience, but record the current profit.
    try {
      const tradeToClose = openTrades.find(t => t.id === tradeId);
      if (!tradeToClose) return;
      
      await updateDoc(doc(db, 'trades', tradeId), {
        status: 'closed',
        closePrice: tradeToClose.currentPrice,
        closeTime: serverTimestamp()
      });
      
      // Update account balance
      const newBalance = tradingAccount.balance + (tradeToClose.profit || 0);
      const marginReleased = tradeToClose.size * 100;
      
      await updateDoc(doc(db, 'trading_accounts', tradingAccount.id), {
        balance: newBalance,
        equity: newBalance,
        margin: Math.max(0, tradingAccount.margin - marginReleased),
        freeMargin: newBalance - Math.max(0, tradingAccount.margin - marginReleased)
      });
      
      // Account state will catch up on next fetch/refresh, but we can update local state
      setTradingAccount((prev: any) => ({
        ...prev,
        balance: newBalance,
        equity: newBalance,
        margin: Math.max(0, prev.margin - marginReleased),
        freeMargin: newBalance - Math.max(0, prev.margin - marginReleased)
      }));
      
    } catch(err: any) {
      alert('Failed to close trade: ' + err.message);
    }
  };

  if (loading || !tradingAccount) {
    return <div className="p-8 text-center text-gray-500">Loading Trading Platform...</div>;
  }

  // Calculate live equity from open trades
  const totalProfit = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const currentEquity = tradingAccount.balance + totalProfit;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Account Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Balance</p>
          <p className="text-xl mt-1 font-bold">${tradingAccount.balance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Equity</p>
          <p className={`text-xl mt-1 font-bold ${currentEquity >= tradingAccount.balance ? 'text-green-600' : 'text-red-600'}`}>
            ${currentEquity.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Margin</p>
          <p className="text-xl mt-1 font-bold">${tradingAccount.margin.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Free Margin</p>
          <p className="text-xl mt-1 font-bold">${tradingAccount.freeMargin.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Market Selection & Trade Ticket */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Markets</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
              {MARKETS.map(market => (
                <div 
                  key={market.symbol}
                  onClick={() => setSelectedAsset(market)}
                  className={`p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition ${selectedAsset.symbol === market.symbol ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''}`}
                >
                  <div>
                    <p className="font-bold text-sm text-gray-900">{market.symbol}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{market.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{market.price.toFixed(4)}</p>
                    <p className={`text-[10px] font-bold ${market.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {market.change >= 0 ? '+' : ''}{market.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">{selectedAsset.symbol}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedAsset.name}</p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Volume (Lots)</label>
              <input 
                type="number" 
                min="0.01" 
                step="0.01" 
                value={tradeSize}
                onChange={e => setTradeSize(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleTrade('sell')}
                disabled={placingTrade}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
              >
                <span className="text-xs opacity-80 uppercase tracking-widest mb-1">Sell</span>
                <span className="font-mono text-lg">{(selectedAsset.price - 0.0002).toFixed(4)}</span>
              </button>
              <button 
                onClick={() => handleTrade('buy')}
                disabled={placingTrade}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center"
              >
                <span className="text-xs opacity-80 uppercase tracking-widest mb-1">Buy</span>
                <span className="font-mono text-lg">{(selectedAsset.price + 0.0002).toFixed(4)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Chart & Open Trades */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div className="flex items-center gap-2">
                 <Activity size={18} className="text-blue-600" />
                 <h3 className="font-bold text-gray-900">{selectedAsset.symbol} Chart</h3>
               </div>
               <div className="flex gap-2">
                 <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600">1H</span>
                 <span className="px-2 py-1 bg-blue-100 border border-blue-200 rounded text-xs font-bold text-blue-700">4H</span>
                 <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600">1D</span>
               </div>
            </div>
            <div className="flex-1 bg-slate-900 flex items-center justify-center relative p-6">
               {/* Simulating a chart with CSS */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               <BarChart2 size={64} className="text-slate-700 relative z-10" />
               <p className="text-slate-500 absolute mt-20 relative z-10 font-bold tracking-widest uppercase text-sm">Live Chart Data Loading...</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('trade')}
                className={`flex-1 p-3 font-bold text-sm ${activeTab === 'trade' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Open Trades ({openTrades.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 p-3 font-bold text-sm ${activeTab === 'history' ? 'bg-gray-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                History
              </button>
            </div>
            
            <div className="p-0 max-h-[300px] overflow-y-auto">
              {activeTab === 'trade' && (
                openTrades.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-medium">No open positions.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 sticky top-0">
                      <tr>
                        <th className="p-3 border-b">Symbol</th>
                        <th className="p-3 border-b">Type</th>
                        <th className="p-3 border-b">Volume</th>
                        <th className="p-3 border-b">Open Price</th>
                        <th className="p-3 border-b text-right">Profit</th>
                        <th className="p-3 border-b text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {openTrades.map(trade => (
                        <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-3 font-bold">{trade.symbol}</td>
                          <td className={`p-3 font-bold uppercase ${trade.type === 'buy' ? 'text-blue-600' : 'text-red-500'}`}>{trade.type}</td>
                          <td className="p-3">{trade.size}</td>
                          <td className="p-3 font-mono">{trade.openPrice}</td>
                          <td className={`p-3 font-mono font-bold text-right ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${trade.profit.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => requestCloseTrade(trade.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">Close</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
              
              {activeTab === 'history' && (
                tradeHistory.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-medium">No trade history.</div>
                ) : (
                   <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 sticky top-0">
                      <tr>
                        <th className="p-3 border-b">Symbol</th>
                        <th className="p-3 border-b">Type</th>
                        <th className="p-3 border-b">Open</th>
                        <th className="p-3 border-b">Close</th>
                        <th className="p-3 border-b text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {tradeHistory.map(trade => (
                        <tr key={trade.id} className="border-b border-gray-50">
                          <td className="p-3 font-bold">{trade.symbol}</td>
                          <td className={`p-3 font-bold uppercase ${trade.type === 'buy' ? 'text-blue-600' : 'text-red-500'}`}>{trade.type}</td>
                          <td className="p-3 font-mono">{trade.openPrice}</td>
                          <td className="p-3 font-mono">{trade.closePrice}</td>
                          <td className={`p-3 font-mono font-bold text-right ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${trade.profit?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
