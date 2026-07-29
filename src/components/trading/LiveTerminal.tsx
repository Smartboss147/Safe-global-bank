import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  INITIAL_MARKETS, MarketInstrument, generateCandlesForSymbol 
} from './mockMarketData';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Search, Star, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, Sliders, Shield, Zap, X, Download, FileText 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LiveTerminalProps {
  user: any;
  account: any;
  isDarkMode?: boolean;
}

export default function LiveTerminal({ user, account, isDarkMode = false }: LiveTerminalProps) {
  const [markets, setMarkets] = useState<MarketInstrument[]>(INITIAL_MARKETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EUR/USD');
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['EUR/USD', 'BTC/USD', 'AAPL', 'XAU/USD']);
  
  // Order Form State
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [leverage, setLeverage] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [trailingStopPips, setTrailingStopPips] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chart State
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [timeframe, setTimeframe] = useState<string>('1H');
  const [candles, setCandles] = useState<any[]>([]);

  // Trades & Open Positions State
  const [trades, setTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'positions' | 'pending' | 'history'>('positions');
  const [selectedTradeToModify, setSelectedTradeToModify] = useState<any | null>(null);

  const activeMarket = markets.find(m => m.symbol === selectedSymbol) || markets[0];

  // Refresh candle data when symbol or timeframe changes
  useEffect(() => {
    const data = generateCandlesForSymbol(selectedSymbol, 18);
    setCandles(data);
  }, [selectedSymbol, timeframe]);

  // Real-time price simulation tick generator
  useEffect(() => {
    const timer = setInterval(() => {
      setMarkets(prev =>
        prev.map(m => {
          const delta = (Math.random() - 0.49) * (m.price * 0.0015);
          const newPrice = Math.max(0.0001, m.price + delta);
          const newBid = newPrice - (m.spread * 0.0001);
          const newAsk = newPrice + (m.spread * 0.0001);
          return {
            ...m,
            price: Number(newPrice.toFixed(m.price > 100 ? 2 : 4)),
            bid: Number(newBid.toFixed(m.price > 100 ? 2 : 4)),
            ask: Number(newAsk.toFixed(m.price > 100 ? 2 : 4))
          };
        })
      );
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Fetch trades from Supabase strictly
  const fetchTrades = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let merged = data && Array.isArray(data) ? [...data] : [];

      merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setTrades(merged);
    } catch (e) {
      console.warn('Error fetching trades:', e);
    }
  };

  useEffect(() => {
    fetchTrades();
    if (!user) return;

    const channel = supabase.channel('live_terminal_trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, () => {
        fetchTrades();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  // Execute Trade Order
  const handleExecuteTrade = async (type: 'buy' | 'sell') => {
    if (!user) {
      alert("Please log in to execute trades.");
      return;
    }

    if (lotSize <= 0) {
      alert("Please enter a valid volume / lot size.");
      return;
    }

    setIsSubmitting(true);
    const orderPrice = orderType === 'market' ? (type === 'buy' ? activeMarket.ask : activeMarket.bid) : Number(limitPrice || activeMarket.price);

    const newTradeObj = {
      id: 'trd_' + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      trading_account_id: account?.id || null,
      symbol: activeMarket.symbol,
      type,
      amount: lotSize,
      price: orderPrice,
      leverage,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
      status: orderType === 'market' ? 'open' : 'pending',
      created_at: new Date().toISOString()
    };

    try {
      // 1. Try Supabase insert
      await supabase.from('trades').insert([newTradeObj]);
    } catch (err) {
      console.warn('Supabase trade insert notice:', err);
    }

    setIsSubmitting(false);
    fetchTrades();
    alert(`Order Executed! ${type.toUpperCase()} ${lotSize} Lots ${activeMarket.symbol} @ $${orderPrice}`);
  };

  // Close or Modify Trade
  const handleClosePosition = async (tradeId: string) => {
    if (!confirm("Are you sure you want to close this position?")) return;
    try {
      await supabase.from('trades').update({ status: 'completed' }).eq('id', tradeId);
    } catch (e) {}

    fetchTrades();
  };

  // Close All Positions
  const handleCloseAllPositions = async () => {
    if (!confirm("Close ALL open positions at market price?")) return;
    const openTradeIds = openPositions.map(p => p.id);
    
    try {
      await supabase.from('trades').update({ status: 'completed' }).in('id', openTradeIds);
    } catch (e) {}

    fetchTrades();
  };

  // Export PDF Statement
  const exportPDFStatement = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SAFE GLOBAL TRADE - Trading Account Statement", 14, 20);
    doc.setFontSize(10);
    doc.text(`Account Holder: ${user?.email || 'Valued Client'}`, 14, 28);
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 34);

    const tableData = trades.map(t => [
      t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
      t.symbol || t.asset || 'N/A',
      (t.type || '').toUpperCase(),
      t.amount || 0,
      `$${Number(t.price || 0).toFixed(2)}`,
      (t.status || '').toUpperCase()
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Symbol', 'Type', 'Volume/Lots', 'Price', 'Status']],
      body: tableData,
    });

    doc.save(`Safe_Global_Trade_Statement_${Date.now()}.pdf`);
  };

  // Filtered market watch items
  const filteredMarkets = markets.filter(m => {
    const matchesCategory = selectedMarketCategory === 'All'
      || (selectedMarketCategory === 'Favorites' && favorites.includes(m.symbol))
      || m.category === selectedMarketCategory;
    const matchesSearch = m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openPositions = trades.filter(t => t.status === 'open' || t.status === 'pending');
  const closedHistory = trades.filter(t => t.status === 'completed' || t.status === 'rejected');

  // Calculate live margin requirement
  const estimatedMargin = (lotSize * activeMarket.price * 100) / leverage;

  const CustomCandle = (props: any) => {
    const { x, y, width, height, isUp } = props;
    const color = isUp ? '#10b981' : '#f43f5e';
    return (
      <g>
        <line x1={x + width / 2} y1={y - 8} x2={x + width / 2} y2={y + height + 8} stroke={color} strokeWidth={2} />
        <rect x={x} y={y} width={width} height={Math.max(2, height)} fill={color} rx={1} />
      </g>
    );
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Top Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Market Watch (3 cols) */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 flex flex-col justify-between space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-600" /> Market Watch
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                LIVE Ticks
              </span>
            </div>

            {/* Search Box */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol, currency..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>

            {/* Market Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
              {['All', 'Favorites', 'Forex', 'Crypto', 'Stocks', 'Indices', 'Metals', 'Energy', 'ETFs'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedMarketCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                    selectedMarketCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Instrument List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {filteredMarkets.map((m) => {
              const isSelected = m.symbol === selectedSymbol;
              const isFav = favorites.includes(m.symbol);

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedSymbol(m.symbol)}
                  className={`py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(m.symbol); }}
                      className="text-slate-300 hover:text-amber-400 transition"
                    >
                      <Star size={13} fill={isFav ? '#f59e0b' : 'none'} className={isFav ? 'text-amber-500' : ''} />
                    </button>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">{m.symbol}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[90px]">{m.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      ${m.price > 100 ? m.price.toFixed(2) : m.price.toFixed(4)}
                    </p>
                    <p className={`text-[10px] font-bold ${m.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Interactive Trading Chart (6 cols) */}
        <div className={`lg:col-span-6 rounded-2xl border p-4 flex flex-col justify-between space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          {/* Symbol Header & Chart Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 dark:text-white">{activeMarket.symbol}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                  {activeMarket.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                  Spread: {activeMarket.spread} pips
                </span>
              </div>
              <p className="text-xs text-slate-500">{activeMarket.name} • Trading Hours: {activeMarket.tradingHours}</p>
            </div>

            {/* Timeframe & View Toggles */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['1M', '5M', '15M', '1H', '4H', '1D'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition ${
                      timeframe === tf ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setChartType('candle')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition ${chartType === 'candle' ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}
                >
                  🕯️ Candle
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition ${chartType === 'line' ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}
                >
                  📈 Line
                </button>
              </div>
            </div>
          </div>

          {/* Live Chart Container */}
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'candle' ? (
                <BarChart data={candles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-800 font-mono">
                            <p className="font-bold text-amber-400 mb-1">{d.time}</p>
                            <p>Open: ${d.open}</p>
                            <p>High: ${d.high}</p>
                            <p>Low: ${d.low}</p>
                            <p>Close: ${d.close}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="openClose" shape={<CustomCandle />} />
                </BarChart>
              ) : (
                <LineChart data={candles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Market Depth Ribbon */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Bid Price</p>
              <p className="font-mono font-extrabold text-rose-500">${activeMarket.bid}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Ask Price</p>
              <p className="font-mono font-extrabold text-emerald-500">${activeMarket.ask}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold">24h High</p>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-200">${activeMarket.high24h}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase font-bold">24h Low</p>
              <p className="font-mono font-bold text-slate-700 dark:text-slate-200">${activeMarket.low24h}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Entry Panel (3 cols) */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 flex flex-col justify-between space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Order Entry</span>
              <span className="text-xs font-extrabold text-blue-600">{activeMarket.symbol}</span>
            </h3>

            {/* Order Type Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-3">
              {(['market', 'limit', 'stop'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`py-1 text-[10px] font-extrabold uppercase rounded-lg transition ${
                    orderType === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Fields Form */}
            <div className="space-y-3">
              {orderType !== 'market' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Entry Price ($)
                  </label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={e => setLimitPrice(e.target.value)}
                    placeholder={activeMarket.price.toString()}
                    className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Volume (Lots / Units)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={lotSize}
                    onChange={e => setLotSize(Number(e.target.value))}
                    className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 font-mono font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Leverage Ratio
                </label>
                <select
                  value={leverage}
                  onChange={e => setLeverage(Number(e.target.value))}
                  className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-blue-500 font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value={10}>1:10 Conservative</option>
                  <option value={50}>1:50 Standard</option>
                  <option value={100}>1:100 Moderate</option>
                  <option value={200}>1:200 High</option>
                  <option value={500}>1:500 Maximum VIP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Stop Loss ($)</label>
                  <input
                    type="number"
                    placeholder="Optional SL"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-rose-500 font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Take Profit ($)</label>
                  <input
                    type="number"
                    placeholder="Optional TP"
                    value={takeProfit}
                    onChange={e => setTakeProfit(e.target.value)}
                    className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-emerald-500 font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              {/* Risk & Margin Estimate Box */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-xs space-y-1">
                <div className="flex justify-between text-blue-900 dark:text-blue-300 font-medium">
                  <span>Req. Margin ({leverage}x):</span>
                  <span className="font-extrabold font-mono">${estimatedMargin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                  <span>Free Margin:</span>
                  <span className="font-bold">${(account?.balance || 1000).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buy & Sell Execute Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleExecuteTrade('sell')}
              disabled={isSubmitting}
              className="py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition flex flex-col items-center justify-center"
            >
              <span className="uppercase tracking-wider">SELL</span>
              <span className="font-mono font-extrabold">${activeMarket.bid}</span>
            </button>

            <button
              onClick={() => handleExecuteTrade('buy')}
              disabled={isSubmitting}
              className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition flex flex-col items-center justify-center"
            >
              <span className="uppercase tracking-wider">BUY</span>
              <span className="font-mono font-extrabold">${activeMarket.ask}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Open Positions & Order History Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'positions', label: `Open Positions (${openPositions.length})` },
              { id: 'history', label: `Order History (${closedHistory.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'positions' && openPositions.length > 0 && (
              <button
                onClick={handleCloseAllPositions}
                className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 font-extrabold text-xs transition"
              >
                Close All Positions
              </button>
            )}

            <button
              onClick={exportPDFStatement}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
            >
              <FileText size={14} /> PDF Statement
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`uppercase font-bold tracking-wider text-[10px] ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <th className="p-3">Ticket / Date</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Type</th>
                <th className="p-3">Volume</th>
                <th className="p-3">Open Price</th>
                <th className="p-3">Current Price</th>
                <th className="p-3">SL / TP</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(activeTab === 'positions' ? openPositions : closedHistory).length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    No active {activeTab} record found.
                  </td>
                </tr>
              ) : (
                (activeTab === 'positions' ? openPositions : closedHistory).map((t) => {
                  const inst = markets.find(m => m.symbol === (t.symbol || t.asset)) || activeMarket;
                  const curPrice = inst.price;
                  const opPrice = t.price || curPrice;
                  const pnl = t.type === 'buy' ? (curPrice - opPrice) * (t.amount || 1) * 100 : (opPrice - curPrice) * (t.amount || 1) * 100;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-slate-500">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{t.id}</p>
                        <p className="text-[10px]">{t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Just now'}</p>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {t.symbol || t.asset || 'EUR/USD'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[10px] ${
                          t.type === 'buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-800 dark:text-slate-200">
                        {t.amount || 0.1} Lots
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        ${opPrice.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        ${curPrice.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-500">
                        SL: {t.stop_loss ? `$${t.stop_loss}` : 'None'}<br />
                        TP: {t.take_profit ? `$${t.take_profit}` : 'None'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {t.status === 'open' && (
                          <button
                            onClick={() => handleClosePosition(t.id)}
                            className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] active:scale-95 transition"
                          >
                            Close Trade (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
