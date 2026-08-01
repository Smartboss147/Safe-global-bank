import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount, getCurrencyInfo } from '../../utils/currency';
import { TrendingUp, TrendingDown, Clock, Activity, BarChart2 } from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

function generateAssetChartData(basePrice: number, count = 20) {
  const points = [];
  const now = new Date();
  let current = basePrice * 0.985;
  for (let i = count; i >= 0; i--) {
    const timeStr = new Date(now.getTime() - i * 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const delta = (Math.random() - 0.48) * (basePrice * 0.003);
    current = Math.max(0.0001, current + delta);
    points.push({
      time: timeStr,
      price: Number(current.toFixed(basePrice > 100 ? 2 : 4))
    });
  }
  if (points.length > 0) {
    points[points.length - 1].price = basePrice;
  }
  return points;
}

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

  // Recharts Chart State
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('4H');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  useEffect(() => {
    setChartData(generateAssetChartData(selectedAsset.price, 20));
  }, [selectedAsset.symbol, timeframe]);

  // Real-time price movement chart simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setChartData(prev => {
        if (!prev || prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const delta = (Math.random() - 0.49) * (selectedAsset.price * 0.002);
        const newPrice = Number(Math.max(0.0001, last.price + delta).toFixed(selectedAsset.price > 100 ? 2 : 4));
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev.slice(1), { time: newTime, price: newPrice }];
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedAsset.price]);

  useEffect(() => {
    if (!user) return;
    
    
    // Fetch or create trading account
    const fetchAccount = async () => {
      const { data: querySnapshot } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id);
      
      if (querySnapshot && querySnapshot.length > 0) {
        const acc = querySnapshot[0];
        setTradingAccount({
          ...acc,
          freeMargin: acc.free_margin ?? acc.freeMargin ?? 10000.00,
          equity: acc.equity ?? 10000.00,
          margin: acc.margin ?? 0
        });
      } else {
        const newAcc = {
          user_id: user.id,
          balance: 10000.00,
          equity: 10000.00,
          margin: 0.00,
          free_margin: 10000.00,
          leverage: '1:100',
          status: 'Active'
        };
        const { data: docRef } = await supabase.from('trading_accounts').insert([newAcc]).select().single();
        if (docRef) {
          setTradingAccount({ 
            ...docRef, 
            equity: docRef.equity ?? 10000.00, 
            margin: docRef.margin ?? 0, 
            freeMargin: docRef.free_margin ?? 10000.00 
          });
        }
      }
    };

    fetchAccount();

    
    // Listen to trades
    const channel = supabase.channel('trades_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, payload => {
        // Just refetch for simplicity
        fetchTrades();
      })
      .subscribe();
      
    const fetchTrades = async () => {
      const uId = user?.id || 'user_demo_100';
      let merged: any[] = [];
      try {
        const { data } = await supabase.from('trades').select('*').eq('user_id', uId);
        if (data && Array.isArray(data)) merged = [...data];
      } catch (e) {}

      // local fallback merge
      try {
        const saved = localStorage.getItem(`sgt_trades_${uId}`);
        if (saved) {
          const local = JSON.parse(saved);
          local.forEach((lt: any) => {
            const exists = merged.some(m => String(m.id) === String(lt.id));
            if (!exists) merged.push(lt);
            else if (lt.status === 'completed' || lt.status === 'closed') {
              const idx = merged.findIndex(m => String(m.id) === String(lt.id));
              if (idx !== -1) merged[idx].status = lt.status;
            }
          });
        }
      } catch (e) {}

      setOpenTrades(merged.filter((t: any) => (t.status || 'open').toLowerCase() === 'open' || (t.status || '').toLowerCase() === 'pending'));
      setTradeHistory(merged.filter((t: any) => (t.status || '').toLowerCase() === 'closed' || (t.status || '').toLowerCase() === 'completed'));
      setLoading(false);
    };
    fetchTrades();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleTrade = async (direction: 'buy' | 'sell') => {
    if (!tradingAccount) return;
    setPlacingTrade(true);
    const uId = user?.id || 'user_demo_100';
    
    try {
      const size = parseFloat(tradeSize);
      if (isNaN(size) || size <= 0) throw new Error('Invalid trade size');
      
      const marginRequired = size * 100; // Margin requirement
      
      if (tradingAccount.freeMargin < marginRequired) {
        alert('Not enough free margin to open this trade.');
        setPlacingTrade(false);
        return;
      }
      
      const genId = 'trd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newTrade = {
        id: genId,
        user_id: uId,
        trading_account_id: tradingAccount.id,
        symbol: selectedAsset.symbol,
        type: direction,
        amount: size,
        price: selectedAsset.price,
        status: 'open',
        created_at: new Date().toISOString()
      };
      
      // Open trade in Supabase
      try {
        await supabase.from('trades').insert([{
          user_id: uId,
          trading_account_id: tradingAccount.id,
          symbol: selectedAsset.symbol,
          type: direction,
          amount: size,
          price: selectedAsset.price,
          status: 'open'
        }]);
      } catch (e) {}

      // Save locally
      try {
        const saved = localStorage.getItem(`sgt_trades_${uId}`);
        const currentLocal = saved ? JSON.parse(saved) : [];
        localStorage.setItem(`sgt_trades_${uId}`, JSON.stringify([newTrade, ...currentLocal]));
      } catch (e) {}
      
      // Update state optimistically
      setOpenTrades((prev: any[]) => [newTrade, ...prev]);
      alert(`Trade Opened: ${direction.toUpperCase()} ${size} ${selectedAsset.symbol} @ $${selectedAsset.price}`);
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
      
      
      await supabase.from('trades').update({
        status: 'completed',
      }).eq('id', tradeId);

      
      // Update account balance
      const newBalance = tradingAccount.balance + (tradeToClose.profit || 0);
      const marginReleased = tradeToClose.size * 100;
      
      /* update margin */
      
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
  const userCurr = user?.currency_code || user?.currency || user?.country || 'USD';
  const currInfo = getCurrencyInfo(userCurr);
  const currentEquity = tradingAccount.balance + totalProfit;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Account Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Balance</p>
          <p className="text-xl mt-1 font-bold">{formatCurrencyAmount(tradingAccount.balance, currInfo)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Equity</p>
          <p className={`text-xl mt-1 font-bold ${currentEquity >= tradingAccount.balance ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrencyAmount(currentEquity, currInfo)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Margin</p>
          <p className="text-xl mt-1 font-bold">{formatCurrencyAmount(tradingAccount.margin, currInfo)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Free Margin</p>
          <p className="text-xl mt-1 font-bold">{formatCurrencyAmount(tradingAccount.freeMargin, currInfo)}</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[340px]">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50">
               <div className="flex items-center gap-2">
                 <Activity size={18} className="text-blue-600" />
                 <div>
                   <h3 className="font-bold text-gray-900">{selectedAsset.symbol} ({selectedAsset.name})</h3>
                   <p className="text-xs text-gray-500 font-mono">${selectedAsset.price} ({selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change}%)</p>
                 </div>
               </div>
               <div className="flex gap-1 items-center">
                 <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 text-xs font-bold">
                   {['1H', '4H', '1D', '1W'].map(tf => (
                     <button
                       key={tf}
                       onClick={() => setTimeframe(tf)}
                       className={`px-2 py-0.5 rounded transition ${timeframe === tf ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                     >
                       {tf}
                     </button>
                   ))}
                 </div>
                 <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 text-xs font-bold">
                   <button
                     onClick={() => setChartType('area')}
                     className={`px-2 py-0.5 rounded transition ${chartType === 'area' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                   >
                     Area
                   </button>
                   <button
                     onClick={() => setChartType('line')}
                     className={`px-2 py-0.5 rounded transition ${chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                   >
                     Line
                   </button>
                 </div>
               </div>
            </div>
            <div className="flex-1 bg-slate-900 p-4 min-h-[260px] relative">
              <ResponsiveContainer width="100%" height={260}>
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-700 font-mono">
                              <p className="text-amber-400 font-bold mb-0.5">{d.time}</p>
                              <p className="text-sm font-bold text-emerald-400">${d.price}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={selectedAsset.price} stroke="#3b82f6" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#assetGradient)" />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip />
                    <ReferenceLine y={selectedAsset.price} stroke="#10b981" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
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
                            {formatCurrencyAmount(trade.profit, currInfo)}
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
                            {formatCurrencyAmount(trade.profit || 0, currInfo)}
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
