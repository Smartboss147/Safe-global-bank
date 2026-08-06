import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { INITIAL_MARKETS, MarketInstrument, generateCandlesForSymbol } from './mockMarketData';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Settings, List, BarChart2, Briefcase, Clock,
  Search, Plus, Minus, X, Info, TrendingUp, TrendingDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LiveTerminalProps {
  user: any;
  account: any;
  isDarkMode?: boolean;
}

export default function LiveTerminal({ user, account, isDarkMode = true }: LiveTerminalProps) {
  // Mobile Tabs
  const [mobileTab, setMobileTab] = useState<'quotes' | 'chart' | 'trade' | 'history' | 'settings'>('quotes');

  // Markets & Live Pricing
  const [markets, setMarkets] = useState<MarketInstrument[]>(INITIAL_MARKETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(['EUR/USD', 'XAU/USD', 'BTC/USD']);
  const [showSearch, setShowSearch] = useState(false);
  
  // Trades & Open Positions State
  const [trades, setTrades] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'positions' | 'orders' | 'deals'>('positions');
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  // Order Window State
  const [isOrderWindowOpen, setIsOrderWindowOpen] = useState(false);
  const [orderType, setOrderType] = useState<'Market Execution' | 'Buy Limit' | 'Sell Limit' | 'Buy Stop' | 'Sell Stop'>('Market Execution');
  const [lotSize, setLotSize] = useState<number>(1.00);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chart State
  const [timeframe, setTimeframe] = useState<string>('M5');
  const [candles, setCandles] = useState<any[]>([]);

  // Flash state for Quotes
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, 'up' | 'down'>>({});

  const activeMarket = useMemo(() => markets.find(m => m.symbol === selectedSymbol) || markets[0], [markets, selectedSymbol]);

  // Initial Data Fetch
  useEffect(() => {
    fetchTrades();
  }, [user]);

  // Helper to load local trades
  const getLocalTrades = (uId: string) => {
    try {
      const saved = localStorage.getItem(`sgt_trades_${uId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalTrades = (uId: string, tradesList: any[]) => {
    try {
      localStorage.setItem(`sgt_trades_${uId}`, JSON.stringify(tradesList));
    } catch (e) {}
  };

  const fetchTrades = useCallback(async () => {
    const currentUserId = user?.id || user?.uid || 'user_demo_100';
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      let merged: any[] = [];
      if (!error && data && Array.isArray(data)) {
        merged = [...data];
      }

      const local = getLocalTrades(currentUserId);
      local.forEach((lt: any) => {
        const idx = merged.findIndex(m => String(m.id) === String(lt.id));
        if (idx === -1) {
          merged.push(lt);
        } else if (lt.status === 'completed' || lt.status === 'closed') {
          merged[idx].status = lt.status;
        }
      });

      merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      saveLocalTrades(currentUserId, merged);
      setTrades(merged);
    } catch (e) {
      setTrades(getLocalTrades(currentUserId));
    }
  }, [user]);

  // Real-time tick generator
  useEffect(() => {
    const timer = setInterval(() => {
      let updatedActivePrice: number | null = null;
      const newFlashes: Record<string, 'up' | 'down'> = {};

      setMarkets(prev =>
        prev.map(m => {
          const delta = (Math.random() - 0.49) * (m.price * 0.0015);
          const newPrice = Math.max(0.0001, m.price + delta);
          const formattedPrice = Number(newPrice.toFixed(m.price > 100 ? 2 : 5));
          
          if (formattedPrice > m.price) newFlashes[m.symbol] = 'up';
          else if (formattedPrice < m.price) newFlashes[m.symbol] = 'down';

          if (m.symbol === selectedSymbol) {
            updatedActivePrice = formattedPrice;
          }
          const newBid = newPrice - (m.spread * 0.0001);
          const newAsk = newPrice + (m.spread * 0.0001);
          return {
            ...m,
            price: formattedPrice,
            bid: Number(newBid.toFixed(m.price > 100 ? 2 : 5)),
            ask: Number(newAsk.toFixed(m.price > 100 ? 2 : 5)),
            changePercent: m.changePercent + (delta / m.price * 100)
          };
        })
      );

      setFlashingSymbols(newFlashes);
      setTimeout(() => setFlashingSymbols({}), 500); // clear flash

      if (updatedActivePrice !== null) {
        const tickPrice = updatedActivePrice;
        setCandles(cPrev => {
          if (!cPrev || cPrev.length === 0) return cPrev;
          const lastCandle = { ...cPrev[cPrev.length - 1] };
          lastCandle.close = tickPrice;
          lastCandle.high = Math.max(lastCandle.high, tickPrice);
          lastCandle.low = Math.min(lastCandle.low, tickPrice);
          lastCandle.isUp = lastCandle.close >= lastCandle.open;
          lastCandle.openClose = [Math.min(lastCandle.open, lastCandle.close), Math.max(lastCandle.open, lastCandle.close)];
          return [...cPrev.slice(0, cPrev.length - 1), lastCandle];
        });
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [selectedSymbol]);

  useEffect(() => {
    setCandles(generateCandlesForSymbol(selectedSymbol, 50));
  }, [selectedSymbol, timeframe]);


  // Trading Engine
  const openPositions = useMemo(() => trades.filter(t => (t.status || 'open').toLowerCase() === 'open'), [trades]);
  const closedHistory = useMemo(() => trades.filter(t => ['completed', 'closed', 'rejected'].includes((t.status || '').toLowerCase())), [trades]);
  
  const balance = Number(account?.balance || 100000);
  
  // Live PnL calculation
  const floatingPnL = useMemo(() => {
    return openPositions.reduce((acc, t) => {
      const inst = markets.find(m => m.symbol === (t.symbol || t.asset));
      if (!inst) return acc;
      const curPrice = t.type === 'buy' ? inst.bid : inst.ask;
      const opPrice = t.price || curPrice;
      const pnl = t.type === 'buy' ? (curPrice - opPrice) * (t.amount || 1) * 100 : (opPrice - curPrice) * (t.amount || 1) * 100;
      return acc + pnl;
    }, 0);
  }, [openPositions, markets]);

  const equity = balance + floatingPnL;
  
  const usedMargin = useMemo(() => {
    return openPositions.reduce((acc, t) => {
      const inst = markets.find(m => m.symbol === (t.symbol || t.asset));
      if (!inst) return acc;
      // Mock margin calculation
      const marginReq = ((t.amount || 1) * inst.price * 100) / (t.leverage || 100);
      return acc + marginReq;
    }, 0);
  }, [openPositions, markets]);

  const freeMargin = equity - usedMargin;
  const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

  const handleExecuteTrade = async (type: 'buy' | 'sell') => {
    const currentUserId = user?.id || user?.uid || 'user_demo_100';
    if (lotSize <= 0) return;

    setIsSubmitting(true);
    const orderPrice = type === 'buy' ? activeMarket.ask : activeMarket.bid;
    const generatedId = 'trd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const dbPayload = {
      user_id: currentUserId,
      trading_account_id: account?.id || null,
      symbol: activeMarket.symbol,
      type,
      amount: lotSize,
      price: orderPrice,
      leverage: 100, // Fixed for simplicity
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
      status: 'open',
      created_at: new Date().toISOString()
    };

    let insertedTrade: any = null;
    try {
      const { data, error } = await supabase.from('trades').insert([dbPayload]).select().single();
      if (!error && data) insertedTrade = data;
    } catch (err) {}

    if (!insertedTrade) insertedTrade = { id: generatedId, ...dbPayload };

    const updatedLocal = [insertedTrade, ...getLocalTrades(currentUserId)];
    saveLocalTrades(currentUserId, updatedLocal);
    setTrades(prev => [insertedTrade, ...prev]);

    setIsSubmitting(false);
    setIsOrderWindowOpen(false);
    setMobileTab('trade');
  };

  const handleClosePosition = async (tradeId: string) => {
    const currentUserId = user?.id || user?.uid || 'user_demo_100';
    try { await supabase.from('trades').update({ status: 'completed' }).eq('id', tradeId); } catch (e) {}

    const updatedLocal = getLocalTrades(currentUserId).map((t: any) => String(t.id) === String(tradeId) ? { ...t, status: 'completed' } : t);
    saveLocalTrades(currentUserId, updatedLocal);
    setTrades(prev => prev.map(t => String(t.id) === String(tradeId) ? { ...t, status: 'completed' } : t));
    setSelectedTrade(null);
  };


  // Custom Candlestick Shape
  const CustomCandle = (props: any) => {
    const { x, y, width, height, isUp } = props;
    const color = isUp ? '#00b8d4' : '#ff3b30'; // MT5 blue/red or green/red
    return (
      <g>
        <line x1={x + width / 2} y1={y - 8} x2={x + width / 2} y2={y + height + 8} stroke={color} strokeWidth={1} />
        <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={isUp ? 'transparent' : color} stroke={color} rx={0} />
      </g>
    );
  };

  const formatPrice = (p: number) => p.toFixed(p > 10 ? 2 : 5);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-semibold tracking-wide">
          {mobileTab === 'quotes' && 'Quotes'}
          {mobileTab === 'chart' && selectedSymbol}
          {mobileTab === 'trade' && 'Trade'}
          {mobileTab === 'history' && 'History'}
          {mobileTab === 'settings' && 'Settings'}
        </h1>
        <div className="flex items-center gap-4">
          {mobileTab === 'quotes' && (
            <>
              <button onClick={() => setShowSearch(!showSearch)}><Search size={20} className="text-blue-500" /></button>
            </>
          )}
          {mobileTab === 'chart' && (
            <div className="flex gap-4">
              <span className="text-sm font-bold text-blue-500">{timeframe}</span>
              <button onClick={() => setIsOrderWindowOpen(true)}><Plus size={22} className="text-blue-500" /></button>
            </div>
          )}
          {mobileTab === 'trade' && (
            <button onClick={() => setIsOrderWindowOpen(true)}><Plus size={22} className="text-blue-500" /></button>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-black pb-20 relative">
        
        {/* QUOTES SCREEN */}
        {mobileTab === 'quotes' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-[#050505] border-b border-gray-900 shrink-0">
              {['All', 'Favorites', 'Forex', 'Crypto', 'Indices', 'Metals', 'Stocks'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {showSearch && (
              <div className="p-2 bg-[#050505] border-b border-gray-900 shrink-0">
                <input 
                  type="text" 
                  placeholder="Search symbol..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm outline-none"
                />
              </div>
            )}
            <div className="divide-y divide-gray-900 flex-1 overflow-y-auto">
            {markets.filter(m => {
              const matchesCat = selectedCategory === 'All' ? true : 
                                 selectedCategory === 'Favorites' ? favorites.includes(m.symbol) :
                                 m.category === selectedCategory;
              const matchesSearch = m.symbol.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesCat && matchesSearch;
            }).map(m => {
              const isUp = flashingSymbols[m.symbol] === 'up';
              const isDown = flashingSymbols[m.symbol] === 'down';
              const bgClass = isUp ? 'bg-blue-900/20' : isDown ? 'bg-red-900/20' : 'bg-transparent';
              const textClass = isUp ? 'text-blue-500' : isDown ? 'text-red-500' : 'text-gray-200';
              
              // Split price for MT5 big numbers
              const bidStr = m.bid.toFixed(m.price > 10 ? 2 : 5);
              const askStr = m.ask.toFixed(m.price > 10 ? 2 : 5);
              
              return (
                <div 
                  key={m.symbol} 
                  className={`p-3 flex justify-between transition-colors duration-200 ${bgClass}`}
                  onClick={() => { setSelectedSymbol(m.symbol); setMobileTab('chart'); }}
                >
                  <div className="flex flex-col w-1/3">
                    <span className="font-bold text-sm tracking-wide">{m.symbol.replace('/','')}</span>
                    <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                      <span>{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span>spread {m.spread}</span>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col items-end w-1/3 ${textClass}`}>
                    <span className="font-mono text-xl tracking-tighter">
                      {bidStr.slice(0, -2)}<span className="text-2xl font-bold">{bidStr.slice(-2,-1)}</span><span className="text-sm align-top">{bidStr.slice(-1)}</span>
                    </span>
                    <span className="text-[10px] text-gray-500">L: {formatPrice(m.price * 0.998)}</span>
                  </div>

                  <div className={`flex flex-col items-end w-1/3 ${textClass}`}>
                    <span className="font-mono text-xl tracking-tighter">
                      {askStr.slice(0, -2)}<span className="text-2xl font-bold">{askStr.slice(-2,-1)}</span><span className="text-sm align-top">{askStr.slice(-1)}</span>
                    </span>
                    <span className="text-[10px] text-gray-500">H: {formatPrice(m.price * 1.002)}</span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* CHART SCREEN */}
        {mobileTab === 'chart' && (
          <div className="w-full h-full flex flex-col">
            <div className="p-2 text-xs flex gap-4 text-gray-400 bg-[#050505]">
              <span>{activeMarket.symbol.replace('/','')} <span className="text-white">▼</span></span>
              <span>{timeframe}</span>
              <span className="text-white flex-1">{activeMarket.name}</span>
            </div>
            
            <div className="flex-1 w-full bg-black relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={candles} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={true} />
                  <XAxis dataKey="time" stroke="#555" tick={{fill: '#555', fontSize: 10}} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#555" tick={{fill: '#555', fontSize: 10}} orientation="right" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#888' }}
                  />
                  <Bar dataKey="openClose" shape={<CustomCandle />} isAnimationActive={false} />
                  <ReferenceLine y={activeMarket.price} stroke="#00b8d4" strokeDasharray="3 3" />
                  <ReferenceLine y={activeMarket.ask} stroke="#ff3b30" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Fake Indicator Panel */}
              <div className="h-1/3 border-t border-gray-800 bg-[#050505]">
                <span className="text-[10px] text-gray-500 p-2 absolute">RSI(14) 38.34</span>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={candles.map(c => ({ time: c.time, rsi: Math.random() * 40 + 30 }))} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <YAxis domain={[0, 100]} stroke="#555" tick={{fill: '#555', fontSize: 10}} orientation="right" ticks={[0, 30, 70, 100]} />
                    <Line type="monotone" dataKey="rsi" stroke="#00b8d4" strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TRADE SCREEN */}
        {mobileTab === 'trade' && (
          <div className="w-full h-full flex flex-col bg-black">
            <div className="p-4 flex flex-col items-center border-b border-gray-900 pb-6">
              <span className={`text-3xl font-mono tracking-tight font-semibold ${floatingPnL >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {floatingPnL >= 0 ? '' : '-'}${Math.abs(floatingPnL).toFixed(2)} USD
              </span>
            </div>
            
            <div className="px-4 py-2 space-y-1 text-sm bg-[#050505] border-b border-gray-900">
              <div className="flex justify-between text-gray-300"><span>Balance:</span><span className="font-mono">{balance.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-300"><span>Equity:</span><span className="font-mono">{equity.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-300"><span>Margin:</span><span className="font-mono">{usedMargin.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-300"><span>Free Margin:</span><span className="font-mono">{freeMargin.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-300"><span>Margin Level (%):</span><span className="font-mono">{marginLevel.toFixed(2)}</span></div>
            </div>

            <div className="p-4 pb-1">
              <div className="flex justify-between items-center text-sm font-semibold text-gray-400">
                <span>Positions</span>
                <span>•••</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
              {openPositions.length === 0 ? (
                <div className="text-center p-10 text-gray-600 text-sm">No open positions</div>
              ) : (
                openPositions.map(t => {
                  const inst = markets.find(m => m.symbol === (t.symbol || t.asset)) || activeMarket;
                  const curPrice = t.type === 'buy' ? inst.bid : inst.ask;
                  const opPrice = t.price || curPrice;
                  const pnl = t.type === 'buy' ? (curPrice - opPrice) * (t.amount || 1) * 100 : (opPrice - curPrice) * (t.amount || 1) * 100;
                  const isSelected = selectedTrade?.id === t.id;

                  return (
                    <div key={t.id} className="flex flex-col transition-colors">
                      <div 
                        className="p-4 flex justify-between items-center active:bg-gray-900"
                        onClick={() => setSelectedTrade(isSelected ? null : t)}
                      >
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="font-bold text-sm tracking-wide">{t.symbol?.replace('/','') || 'XAUUSD'}</span>
                            <span className={`text-xs ${t.type === 'buy' ? 'text-blue-500' : 'text-red-500'}`}>{t.type}</span>
                            <span className="text-xs text-blue-500">{t.amount}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">
                            {formatPrice(opPrice)} → {formatPrice(curPrice)}
                          </div>
                        </div>
                        <div className={`font-mono text-lg ${pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                          {pnl.toFixed(2)}
                        </div>
                      </div>

                      {/* Expanded Trade Actions */}
                      {isSelected && (
                        <div className="bg-[#111] p-3 flex gap-2 justify-between border-t border-gray-800">
                          <button 
                            onClick={() => handleClosePosition(t.id)}
                            className="flex-1 py-2 rounded bg-red-600 text-white font-semibold text-sm"
                          >
                            Close position
                          </button>
                          <button className="flex-1 py-2 rounded bg-gray-700 text-white font-semibold text-sm">Modify</button>
                          <button className="flex-1 py-2 rounded bg-gray-700 text-white font-semibold text-sm">Trade</button>
                          <button className="flex-1 py-2 rounded bg-gray-700 text-white font-semibold text-sm">Chart</button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* HISTORY SCREEN */}
        {mobileTab === 'history' && (
          <div className="w-full h-full flex flex-col bg-black">
            <div className="flex bg-[#111] border-b border-gray-800 text-sm">
              <button 
                className={`flex-1 py-3 text-center ${activeHistoryTab === 'positions' ? 'text-blue-500 border-b-2 border-blue-500 font-semibold' : 'text-gray-400'}`}
                onClick={() => setActiveHistoryTab('positions')}
              >Positions</button>
              <button 
                className={`flex-1 py-3 text-center ${activeHistoryTab === 'orders' ? 'text-blue-500 border-b-2 border-blue-500 font-semibold' : 'text-gray-400'}`}
                onClick={() => setActiveHistoryTab('orders')}
              >Orders</button>
              <button 
                className={`flex-1 py-3 text-center ${activeHistoryTab === 'deals' ? 'text-blue-500 border-b-2 border-blue-500 font-semibold' : 'text-gray-400'}`}
                onClick={() => setActiveHistoryTab('deals')}
              >Deals</button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
              {closedHistory.map(t => {
                 const opPrice = t.price || activeMarket.price;
                 const clPrice = t.close_price || opPrice; // simplified
                 const pnl = t.type === 'buy' ? (clPrice - opPrice) * (t.amount || 1) * 100 : (opPrice - clPrice) * (t.amount || 1) * 100;
                 return (
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
                      <div className={`font-mono text-sm ${pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {pnl.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {formatPrice(opPrice)} → {formatPrice(clPrice)}
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV BAR */}
      <div className="flex justify-between items-center px-2 py-1 bg-[#111] border-t border-gray-900 pb-safe shrink-0 text-[10px]">
        {[
          { id: 'quotes', icon: List, label: 'Quotes' },
          { id: 'chart', icon: BarChart2, label: 'Chart' },
          { id: 'trade', icon: Briefcase, label: 'Trade' },
          { id: 'history', icon: Clock, label: 'History' },
          { id: 'settings', icon: Settings, label: 'Settings' }
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

      {/* NEW ORDER WINDOW MODAL */}
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
              <span className="text-blue-500">-0.1</span>
              <span className="text-blue-500">-0.01</span>
              <span className="font-mono text-2xl w-20 text-center">{lotSize.toFixed(2)}</span>
              <span className="text-blue-500">+0.01</span>
              <span className="text-blue-500">+0.1</span>
            </div>
            
            <div className="flex justify-around items-center pt-4 border-t border-gray-800 px-8">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500">Stop Loss</span>
                <span className="text-2xl font-mono text-gray-600 border-b border-gray-800 pb-1">Not set</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500">Take Profit</span>
                <span className="text-2xl font-mono text-gray-600 border-b border-gray-800 pb-1">Not set</span>
              </div>
            </div>

            <div className="flex justify-between px-10 text-xs text-gray-500 pt-8">
              <span>Deviation</span>
              <span className="font-mono">0</span>
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
      `}</style>
    </div>
  );
}
