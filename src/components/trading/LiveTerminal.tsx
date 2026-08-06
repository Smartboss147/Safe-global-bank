import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { INITIAL_MARKETS, MarketInstrument } from './mockMarketData';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Settings, List, BarChart2, Briefcase, Clock, 
  Search, Plus, Minus, X, Info, TrendingUp, TrendingDown, Star
} from 'lucide-react';

interface LiveTerminalProps {
  user: any;
  account: any;
  isDarkMode?: boolean;
}

export default function LiveTerminal({ user, account, isDarkMode = true }: LiveTerminalProps) {
  const [mobileTab, setMobileTab] = useState<'quotes' | 'chart' | 'trade' | 'history' | 'settings'>('quotes');
  const [markets, setMarkets] = useState<MarketInstrument[]>(INITIAL_MARKETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(['EUR/USD', 'XAU/USD', 'BTC/USD']);
  const [showSearch, setShowSearch] = useState(false);
  
  const [trades, setTrades] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'positions' | 'orders' | 'deals'>('positions');
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  
  const [isOrderWindowOpen, setIsOrderWindowOpen] = useState(false);
  const [orderType, setOrderType] = useState<'Market Execution' | 'Buy Limit' | 'Sell Limit'>('Market Execution');
  const [lotSize, setLotSize] = useState<number>(1.00);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [timeframe, setTimeframe] = useState<string>('M5');
  const [candles, setCandles] = useState<any[]>([]);
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, 'up' | 'down'>>({});
  
  const tradesRef = useRef(trades);
  tradesRef.current = trades;

  // Real-time market tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => {
        const next = [...prev];
        const flashes: Record<string, 'up' | 'down'> = {};
        
        for (let i = 0; i < next.length; i++) {
          if (Math.random() > 0.7) {
            const m = { ...next[i] };
            const volatility = m.price * 0.0001;
            const change = (Math.random() - 0.5) * volatility;
            const newPrice = m.price + change;
            
            flashes[m.symbol] = change > 0 ? 'up' : 'down';
            m.price = newPrice;
            
            // Adjust bid/ask keeping spread
            const spreadAmt = m.price * (m.spread / 10000);
            m.bid = m.price - spreadAmt / 2;
            m.ask = m.price + spreadAmt / 2;
            
            next[i] = m;
          }
        }
        setFlashingSymbols(flashes);
        
        // SL/TP Check
        checkSlTp(next);
        
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSlTp = useCallback((currentMarkets: MarketInstrument[]) => {
    const currentTrades = tradesRef.current;
    if (!currentTrades || currentTrades.length === 0) return;
    
    currentTrades.forEach(t => {
      if (t.status !== 'OPEN') return;
      
      const m = currentMarkets.find(x => x.symbol === t.symbol);
      if (!m) return;
      
      const currentPrice = t.type === 'buy' ? m.bid : m.ask;
      
      let shouldClose = false;
      let closeReason = '';
      
      if (t.stop_loss) {
        if ((t.type === 'buy' && currentPrice <= t.stop_loss) || (t.type === 'sell' && currentPrice >= t.stop_loss)) {
          shouldClose = true;
          closeReason = 'SL';
        }
      }
      if (!shouldClose && t.take_profit) {
        if ((t.type === 'buy' && currentPrice >= t.take_profit) || (t.type === 'sell' && currentPrice <= t.take_profit)) {
          shouldClose = true;
          closeReason = 'TP';
        }
      }
      
      if (shouldClose) {
        handleClosePosition(t.id, currentPrice, closeReason);
      }
    });
  }, []);

  // Clear flashes
  useEffect(() => {
    const to = setTimeout(() => setFlashingSymbols({}), 300);
    return () => clearTimeout(to);
  }, [flashingSymbols]);

  const fetchTrades = useCallback(async () => {
    const currentUserId = user?.id || user?.uid;
    if (!currentUserId) return;
    try {
      const { data: positions, error } = await supabase
        .from('trading_positions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('opened_at', { ascending: false });
        
      if (!error && positions) {
        const { data: historyMetadata } = await supabase
          .from('trading_history')
          .select('*')
          .in('position_id', positions.map(p => p.id));
          
        const mappedTrades = positions.map(p => {
          const meta = historyMetadata?.find(m => m.position_id === p.id && m.details?.type === 'sl_tp_meta');
          return {
             id: p.id,
             symbol: p.asset_symbol,
             type: p.type,
             amount: p.amount,
             open_price: p.entry_price,
             close_price: p.close_price,
             profit: p.profit_loss,
             status: p.status === 'open' ? 'OPEN' : 'completed',
             created_at: p.opened_at,
             stop_loss: meta?.details?.stop_loss || null,
             take_profit: meta?.details?.take_profit || null
          }
        });
        setTrades(mappedTrades);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Generate dynamic candles
  useEffect(() => {
    const activeMarket = markets.find(m => m.symbol === selectedSymbol) || markets[0];
    const basePrice = activeMarket.price;
    const newCandles = [];
    let current = basePrice * 0.94;
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const deltaPercent = (Math.random() - 0.47) * 0.005;
      const open = current;
      const close = open * (1 + deltaPercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.002);
      const low = Math.min(open, close) * (1 - Math.random() * 0.002);
      current = close;
      newCandles.push({
        time: timeStr,
        open: Number(open.toFixed(basePrice > 100 ? 2 : 4)),
        close: Number(close.toFixed(basePrice > 100 ? 2 : 4)),
        high: Number(high.toFixed(basePrice > 100 ? 2 : 4)),
        low: Number(low.toFixed(basePrice > 100 ? 2 : 4)),
        isUp: close >= open,
        openClose: [Math.min(open, close), Math.max(open, close)]
      });
    }
    // Append current live tick
    newCandles[newCandles.length - 1].close = activeMarket.price;
    if (activeMarket.price > newCandles[newCandles.length - 1].high) newCandles[newCandles.length - 1].high = activeMarket.price;
    if (activeMarket.price < newCandles[newCandles.length - 1].low) newCandles[newCandles.length - 1].low = activeMarket.price;
    newCandles[newCandles.length - 1].isUp = activeMarket.price >= newCandles[newCandles.length - 1].open;
    newCandles[newCandles.length - 1].openClose = [Math.min(newCandles[newCandles.length - 1].open, activeMarket.price), Math.max(newCandles[newCandles.length - 1].open, activeMarket.price)];
    
    setCandles(newCandles);
  }, [selectedSymbol, markets[0]?.price]); // Re-render chart roughly on some ticks, or just on symbol change for performance. To prevent heavy re-renders, we only depend on selectedSymbol

  const activeMarket = markets.find(m => m.symbol === selectedSymbol) || markets[0];
  
  const handleExecuteTrade = async (type: 'buy' | 'sell') => {
    const currentUserId = user?.id || user?.uid;
    if (!currentUserId || lotSize <= 0) return;

    setIsSubmitting(true);
    const orderPrice = type === 'buy' ? activeMarket.ask : activeMarket.bid;

    try {
      const res = await fetch('/api/trading/execute-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          asset_symbol: activeMarket.symbol,
          type,
          amount: lotSize,
          entry_price: orderPrice,
          stop_loss: stopLoss ? Number(stopLoss) : null,
          take_profit: takeProfit ? Number(takeProfit) : null,
          leverage: 100
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await fetchTrades();
        setIsOrderWindowOpen(false);
        setStopLoss('');
        setTakeProfit('');
      } else {
        // Fallback to client Supabase insert
        const { data: posData, error: posError } = await supabase.from('trading_positions').insert([{
          user_id: currentUserId,
          asset_symbol: activeMarket.symbol,
          type: type,
          amount: lotSize,
          entry_price: orderPrice,
          leverage: 100,
          status: 'open'
        }]).select().single();

        if (posData && !posError) {
          if (stopLoss || takeProfit) {
             await supabase.from('trading_history').insert([{
               user_id: currentUserId,
               position_id: posData.id,
               details: {
                 type: 'sl_tp_meta',
                 stop_loss: stopLoss ? Number(stopLoss) : null,
                 take_profit: takeProfit ? Number(takeProfit) : null
               }
             }]);
          }
          await fetchTrades();
          setIsOrderWindowOpen(false);
          setStopLoss('');
          setTakeProfit('');
        } else {
          alert(data.error || "Trade execution failed.");
        }
      }
    } catch (err: any) {
      console.error(err);
      alert("Trade execution error: " + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePosition = async (tradeId: string, customPrice?: number, reason?: string) => {
    const currentUserId = user?.id || user?.uid;
    const tradeToClose = tradesRef.current.find(t => t.id === tradeId);
    if (!tradeToClose || tradeToClose.status !== 'OPEN') return;
    
    const currentMarket = markets.find(m => m.symbol === tradeToClose.symbol);
    const clPrice = customPrice || (currentMarket ? (tradeToClose.type === 'buy' ? currentMarket.bid : currentMarket.ask) : tradeToClose.open_price);
    const pnl = tradeToClose.type === 'buy' ? (clPrice - tradeToClose.open_price) * tradeToClose.amount * 100 : (tradeToClose.open_price - clPrice) * tradeToClose.amount * 100;

    // Optimistic update
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'completed', close_price: clPrice, profit: pnl } : t));

    try { 
      const res = await fetch('/api/trading/close-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: tradeId,
          user_id: currentUserId,
          close_price: clPrice,
          profit_loss: pnl,
          reason: reason || 'manual'
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Fallback to client Supabase update
        await supabase.from('trading_positions').update({ 
          status: 'closed',
          close_price: clPrice,
          profit_loss: pnl,
          closed_at: new Date().toISOString()
        }).eq('id', tradeId); 
        
        await supabase.from('trading_history').insert([{
           user_id: currentUserId,
           position_id: tradeId,
           details: {
             type: 'close_event',
             reason: reason || 'manual',
             close_price: clPrice,
             pnl: pnl
           }
        }]);

        const { data: accData } = await supabase.from('accounts').select('balance, id').eq('user_id', currentUserId).maybeSingle();
        if (accData) {
          await supabase.from('accounts').update({ balance: (Number(accData.balance) || 0) + pnl }).eq('id', accData.id);
        }
      }
      
      await fetchTrades();
    } catch (e) {
      console.error(e);
    }
    setSelectedTrade(null);
  };

  const openPositions = trades.filter(t => t.status === 'OPEN');
  const closedHistory = trades.filter(t => t.status !== 'OPEN');
  
  const floatingPnl = openPositions.reduce((acc, t) => {
    const m = markets.find(x => x.symbol === t.symbol);
    if (!m) return acc;
    const currentPrice = t.type === 'buy' ? m.bid : m.ask;
    const pnl = t.type === 'buy' ? (currentPrice - t.open_price) * t.amount * 100 : (t.open_price - currentPrice) * t.amount * 100;
    return acc + pnl;
  }, 0);

  const balance = account?.balance || 0;
  const equity = balance + floatingPnl;
  const margin = openPositions.reduce((acc, t) => acc + (t.amount * 100), 0); // Simplified margin calc
  const freeMargin = equity - margin;

  const CustomCandle = (props: any) => {
    const { x, y, width, height, isUp } = props;
    const color = isUp ? '#00b8d4' : '#ff3b30';
    return (
      <g>
        <line x1={x + width / 2} y1={y - 8} x2={x + width / 2} y2={y + height + 8} stroke={color} strokeWidth={1} />
        <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={isUp ? 'transparent' : color} stroke={color} rx={0} />
      </g>
    );
  };

  const formatPrice = (p: number) => p.toFixed(p > 10 ? 2 : 5);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden select-none">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-semibold tracking-wide">
          {mobileTab === 'quotes' ? 'Quotes' : 
           mobileTab === 'chart' ? activeMarket.symbol.replace('/', '') : 
           mobileTab === 'trade' ? 'Trade' : 
           mobileTab === 'history' ? 'History' : 'Settings'}
        </h1>
        {mobileTab === 'quotes' && (
          <div className="flex gap-4 text-blue-500">
            <button onClick={() => setShowSearch(!showSearch)}><Plus size={22} /></button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {mobileTab === 'quotes' && (
          <div className="h-full flex flex-col bg-black">
            {showSearch && (
              <div className="p-2 bg-[#111] border-b border-gray-800">
                <input 
                  type="text" 
                  placeholder="Enter symbol to search..." 
                  className="w-full bg-[#222] text-white px-3 py-2 rounded outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {markets.filter(m => m.symbol.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                <div 
                  key={m.id} 
                  className="px-4 py-3 border-b border-gray-900 flex justify-between items-center bg-black active:bg-gray-900 cursor-pointer"
                  onClick={() => { setSelectedSymbol(m.symbol); setMobileTab('chart'); }}
                >
                  <div>
                    <div className="font-bold text-base flex items-center gap-2">
                      {m.symbol.replace('/', '')}
                      {flashingSymbols[m.symbol] === 'up' && <span className="text-blue-500 text-xs">▲</span>}
                      {flashingSymbols[m.symbol] === 'down' && <span className="text-red-500 text-xs">▼</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.tradingHours === '24/7' ? '24/7' : '10:00 - 23:50'}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`flex flex-col items-end transition-colors duration-300 ${flashingSymbols[m.symbol] === 'up' ? 'text-blue-500' : flashingSymbols[m.symbol] === 'down' ? 'text-red-500' : 'text-gray-200'}`}>
                      <span className="font-mono text-sm">{formatPrice(m.bid)}</span>
                      <span className="text-[10px] text-gray-500">L: {formatPrice(m.low24h)}</span>
                    </div>
                    <div className={`flex flex-col items-end transition-colors duration-300 ${flashingSymbols[m.symbol] === 'up' ? 'text-blue-500' : flashingSymbols[m.symbol] === 'down' ? 'text-red-500' : 'text-gray-200'}`}>
                      <span className="font-mono text-sm">{formatPrice(m.ask)}</span>
                      <span className="text-[10px] text-gray-500">H: {formatPrice(m.high24h)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mobileTab === 'chart' && (
          <div className="flex flex-col h-full bg-black relative">
            <div className="flex gap-4 px-4 py-2 border-b border-gray-800 bg-[#0a0a0a] text-sm overflow-x-auto shrink-0 no-scrollbar">
              {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].map(tf => (
                <button 
                  key={tf} 
                  onClick={() => setTimeframe(tf)}
                  className={`font-semibold shrink-0 ${timeframe === tf ? 'text-blue-500' : 'text-gray-500'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <div className="flex-1 w-full p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={candles} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#444" tick={{fill: '#666', fontSize: 10}} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#444" tick={{fill: '#666', fontSize: 10}} orientation="right" />
                  <Bar dataKey="openClose" shape={<CustomCandle />} isAnimationActive={false} />
                  <ReferenceLine y={activeMarket.price} stroke="#00b8d4" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#00b8d4] text-black text-xs font-mono px-1 py-0.5 rounded-l shadow">
                {formatPrice(activeMarket.price)}
              </div>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between gap-4">
               <button 
                 onClick={() => { setOrderType('Market Execution'); setIsOrderWindowOpen(true); }}
                 className="flex-1 bg-[#111] bg-opacity-80 backdrop-blur border border-gray-700 text-white font-bold py-3 rounded shadow-lg text-sm"
               >
                 Trade
               </button>
            </div>
          </div>
        )}

        {mobileTab === 'trade' && (
          <div className="w-full h-full flex flex-col bg-black">
            <div className="bg-[#111] p-4 flex flex-col items-center justify-center border-b border-gray-800 shrink-0">
              <div className="flex gap-8 text-center text-sm mb-4">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Balance</span>
                  <span className="font-mono font-bold text-gray-200">{balance.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Equity</span>
                  <span className="font-mono font-bold text-gray-200">{equity.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Margin</span>
                  <span className="font-mono font-bold text-gray-200">{margin.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-8 text-center text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Free margin</span>
                  <span className="font-mono font-bold text-gray-200">{freeMargin.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Margin level</span>
                  <span className="font-mono font-bold text-gray-200">{margin > 0 ? ((equity/margin)*100).toFixed(2) : '0.00'}%</span>
                </div>
              </div>
            </div>

            <div className="flex px-4 py-2 bg-[#0a0a0a] border-b border-gray-800">
              <span className="font-bold text-gray-300">Positions</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
              {openPositions.length === 0 ? (
                <div className="p-8 text-center text-gray-600 text-sm">No open positions</div>
              ) : (
                openPositions.map(t => {
                  const m = markets.find(x => x.symbol === t.symbol);
                  const currentPrice = m ? (t.type === 'buy' ? m.bid : m.ask) : t.open_price;
                  const pnl = t.type === 'buy' ? (currentPrice - t.open_price) * t.amount * 100 : (t.open_price - currentPrice) * t.amount * 100;
                  const isSelected = selectedTrade === t.id;
                  
                  return (
                    <div key={t.id} className="flex flex-col bg-black">
                      <div 
                        className="p-4 flex justify-between cursor-pointer"
                        onClick={() => setSelectedTrade(isSelected ? null : t.id)}
                      >
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-base tracking-tight">{t.symbol?.replace('/','')}</span>
                            <span className={`text-xs ${t.type === 'buy' ? 'text-blue-500' : 'text-red-500'}`}>{t.type}</span>
                            <span className="text-xs text-gray-400">{t.amount}</span>
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {formatPrice(t.open_price)} → {formatPrice(currentPrice)}
                          </div>
                        </div>
                        <div className={`font-mono text-lg ${pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                          {pnl.toFixed(2)}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="bg-[#111] p-3 flex gap-2 justify-between border-t border-gray-800">
                          <button 
                            onClick={() => handleClosePosition(t.id)}
                            className="flex-1 py-2 rounded bg-red-600 text-white font-semibold text-sm"
                          >
                            Close position
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {mobileTab === 'history' && (
          <div className="w-full h-full flex flex-col bg-black">
            <div className="flex bg-[#111] border-b border-gray-800 text-sm">
              <button 
                className={`flex-1 py-3 text-center ${activeHistoryTab === 'positions' ? 'text-blue-500 border-b-2 border-blue-500 font-semibold' : 'text-gray-400'}`}
                onClick={() => setActiveHistoryTab('positions')}
              >Positions</button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
              {closedHistory.map(t => (
                  <div key={t.id} className="p-4 flex justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-sm">{t.symbol?.replace('/','')}</span>
                        <span className={`text-xs ${t.type === 'buy' ? 'text-blue-500' : 'text-red-500'}`}>{t.type}</span>
                        <span className="text-xs text-gray-400">{t.amount}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm ${t.profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {t.profit?.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {formatPrice(t.open_price)} → {formatPrice(t.close_price)}
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-2 py-1 bg-[#111] border-t border-gray-900 pb-safe shrink-0 text-[10px]">
        {[
          { id: 'quotes', icon: List, label: 'Quotes' },
          { id: 'chart', icon: BarChart2, label: 'Chart' },
          { id: 'trade', icon: Briefcase, label: 'Trade' },
          { id: 'history', icon: Clock, label: 'History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors ${
              mobileTab === tab.id ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={22} className="mb-1" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {isOrderWindowOpen && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col animation-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0a0a0a]">
            <button onClick={() => setIsOrderWindowOpen(false)} className="text-blue-500">Cancel</button>
            <div className="flex flex-col items-center">
              <span className="font-bold">{activeMarket.symbol.replace('/','')}</span>
              <span className="text-xs text-gray-500">{orderType}</span>
            </div>
            <button className="text-gray-500 opacity-0">Cancel</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="text-center font-bold text-gray-300 border-b border-gray-800 pb-2 mx-4">{orderType}</div>
            
            <div className="flex justify-center items-center gap-6 text-xl">
              <button onClick={() => setLotSize(p => Math.max(0.01, p - 0.1))} className="text-blue-500">-0.1</button>
              <button onClick={() => setLotSize(p => Math.max(0.01, p - 0.01))} className="text-blue-500">-0.01</button>
              <span className="font-mono text-2xl w-20 text-center">{lotSize.toFixed(2)}</span>
              <button onClick={() => setLotSize(p => p + 0.01)} className="text-blue-500">+0.01</button>
              <button onClick={() => setLotSize(p => p + 0.1)} className="text-blue-500">+0.1</button>
            </div>
            
            <div className="flex justify-around items-center pt-4 border-t border-gray-800 px-8">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500">Stop Loss</span>
                <input 
                   type="number" 
                   value={stopLoss} 
                   onChange={(e) => setStopLoss(e.target.value)} 
                   placeholder="Not set"
                   className="text-2xl font-mono text-gray-300 bg-transparent text-center border-b border-gray-800 pb-1 w-24 outline-none placeholder:text-gray-700" 
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500">Take Profit</span>
                <input 
                   type="number" 
                   value={takeProfit} 
                   onChange={(e) => setTakeProfit(e.target.value)} 
                   placeholder="Not set"
                   className="text-2xl font-mono text-gray-300 bg-transparent text-center border-b border-gray-800 pb-1 w-24 outline-none placeholder:text-gray-700" 
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-2 mt-auto">
            <button 
              onClick={() => handleExecuteTrade('sell')}
              disabled={isSubmitting}
              className="py-4 bg-[#ff3b30] text-white rounded font-bold text-sm flex flex-col items-center"
            >
              <span>Sell by Market</span>
              <span className="font-mono">{formatPrice(activeMarket.bid)}</span>
            </button>
            <button 
              onClick={() => handleExecuteTrade('buy')}
              disabled={isSubmitting}
              className="py-4 bg-[#00b8d4] text-white rounded font-bold text-sm flex flex-col items-center"
            >
              <span>Buy by Market</span>
              <span className="font-mono">{formatPrice(activeMarket.ask)}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .animation-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
