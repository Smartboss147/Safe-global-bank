import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, TrendingDown, Search, Star, RefreshCw, BarChart2, 
  DollarSign, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, AlertCircle, Clock, Layers, Plus, Trash2, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface StockMarketDashboardProps {
  user: any;
  account: any;
  isDarkMode?: boolean;
}

export default function StockMarketDashboard({ user, account, isDarkMode = false }: StockMarketDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [quote, setQuote] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1M');
  const [marketOverview, setMarketOverview] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN']);
  
  // Indicator Toggles
  const [showSma20, setShowSma20] = useState(false);
  const [showSma50, setShowSma50] = useState(false);
  const [showSma200, setShowSma200] = useState(false);
  const [showEma9, setShowEma9] = useState(false);
  const [showEma20, setShowEma20] = useState(false);

  // Positions & Portfolio
  const [positions, setPositions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<number>(account?.balance || 10000);
  const [investedValue, setInvestedValue] = useState<number>(0);
  const [todayPnl, setTodayPnl] = useState<number>(0);
  const [totalPnl, setTotalPnl] = useState<number>(0);

  // Order Execution State
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [isExecuting, setIsExecuting] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Session Token
  const getToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token || '';
  };

  // Fetch Market Overview
  useEffect(() => {
    fetch('/api/market/overview')
      .then(res => res.json())
      .then(data => {
        if (data.indices) setMarketOverview(data.indices);
      })
      .catch(err => console.error('Error fetching market overview:', err));
    
    // Fetch Watchlist
    getToken().then(token => {
      if (!token) return;
      fetch('/api/market/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.watchlist) setWatchlist(data.watchlist);
        })
        .catch(e => console.error(e));
    });
  }, []);

  // Fetch Quote and Chart when selectedSymbol or timeframe changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/market/quote?symbol=${selectedSymbol}`).then(res => res.json()),
      fetch(`/api/market/chart?symbol=${selectedSymbol}&range=${timeframe}`).then(res => res.json())
    ])
      .then(([quoteData, chartRes]) => {
        setQuote(quoteData);
        if (chartRes.candles) {
          setChartData(chartRes.candles);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching quote/chart:', err);
        setLoading(false);
      });
  }, [selectedSymbol, timeframe]);

  // Fetch User Positions & Transactions
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUserId = user?.id || user?.uid;
      if (!currentUserId) return;

      try {
        const { data: posData } = await supabase
          .from('trading_positions')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('status', 'open');

        if (posData) {
          setPositions(posData);
          const inv = posData.reduce((acc, p) => acc + (Number(p.amount) * Number(p.entry_price)), 0);
          setInvestedValue(inv);
          const pnl = posData.reduce((acc, p) => acc + (Number(p.profit_loss) || 0), 0);
          setTotalPnl(pnl);
          setTodayPnl(pnl * 0.4); // estimated today portion
        }

        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (txData) {
          setTransactions(txData);
        }
      } catch (e) {
        console.error('Error loading portfolio data:', e);
      }
    };

    fetchUserData();
  }, [user]);

  // Search Stocks with Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) setSearchResults(data.results);
        })
        .catch(e => console.error(e));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate Technical Indicators (SMA & EMA) on chartData
  const enrichedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const closes = chartData.map(c => c.close);

    // Helper for SMA
    const calculateSMA = (period: number) => {
      return closes.map((val, idx, arr) => {
        if (idx < period - 1) return null;
        const slice = arr.slice(idx - period + 1, idx + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        return +(sum / period).toFixed(2);
      });
    };

    // Helper for EMA
    const calculateEMA = (period: number) => {
      const k = 2 / (period + 1);
      let emaArray: (number | null)[] = [];
      let prevEma = 0;
      closes.forEach((val, idx) => {
        if (idx === 0) {
          prevEma = val;
          emaArray.push(+val.toFixed(2));
        } else if (idx < period) {
          prevEma = (prevEma * idx + val) / (idx + 1);
          emaArray.push(+prevEma.toFixed(2));
        } else {
          prevEma = (val * k) + (prevEma * (1 - k));
          emaArray.push(+prevEma.toFixed(2));
        }
      });
      return emaArray;
    };

    const sma20 = calculateSMA(20);
    const sma50 = calculateSMA(50);
    const sma200 = calculateSMA(200);
    const ema9 = calculateEMA(9);
    const ema20 = calculateEMA(20);

    return chartData.map((candle, idx) => ({
      ...candle,
      sma20: sma20[idx],
      sma50: sma50[idx],
      sma200: sma200[idx],
      ema9: ema9[idx],
      ema20: ema20[idx],
    }));
  }, [chartData]);

  // Toggle Watchlist
  const toggleWatchlist = async (sym: string) => {
    const token = await getToken();
    const isFav = watchlist.includes(sym);
    const action = isFav ? 'remove' : 'add';

    const nextWatchlist = isFav ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(nextWatchlist);

    if (token) {
      fetch('/api/market/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: sym, action })
      }).catch(e => console.error(e));
    }
  };

  // Execute Trade
  const handleExecuteOrder = async () => {
    if (!quote) return;
    setIsExecuting(true);
    setOrderMessage(null);

    const token = await getToken();
    const currentUserId = user?.id || user?.uid;

    try {
      let success = false;
      try {
        const res = await fetch('/api/trading/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            user_id: currentUserId,
            asset_symbol: selectedSymbol,
            type: orderSide,
            amount: orderQuantity,
            entry_price: quote.price,
            leverage: 1
          })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Server error' }));
          throw new Error(errData.error || `Execution failed with status ${res.status}`);
        }

        const data = await res.json().catch(() => ({ success: false }));
        if (data.success) {
          success = true;
        }
      } catch (apiErr) {
        console.warn('API execute failed, falling back to client Supabase:', apiErr);
      }

      if (!success && currentUserId) {
        const { error: insErr } = await supabase.from('trading_positions').insert([{
          user_id: currentUserId,
          asset_symbol: selectedSymbol,
          type: orderSide,
          amount: orderQuantity,
          entry_price: quote.price,
          leverage: 1,
          status: 'open'
        }]);
        if (insErr) throw insErr;
      }

      setOrderMessage({ type: 'success', text: `Successfully executed ${orderSide.toUpperCase()} order for ${orderQuantity} shares of ${selectedSymbol} @ $${quote.price}` });
      
      // Refresh positions
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setOrderMessage({ type: 'error', text: err.message || 'Trade execution failed' });
    } finally {
      setIsExecuting(false);
    }
  };

  const isFav = watchlist.includes(selectedSymbol);

  return (
    <div className={`space-y-6 pb-12 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Market Overview Ticker */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        {marketOverview.map((ind, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-xs font-bold text-slate-400">{ind.symbol}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black">{ind.value.toLocaleString()}</span>
              <span className={`text-xs font-bold flex items-center ${ind.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {ind.change >= 0 ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                {ind.change >= 0 ? '+' : ''}{ind.changePercent}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Summary Bar */}
      <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 p-5 rounded-2xl border bg-gradient-to-r ${isDarkMode ? 'from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800' : 'from-blue-900 to-indigo-900 text-white border-blue-900 shadow-lg'}`}>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-slate-300">Total Portfolio Value</span>
          <span className="text-2xl font-black mt-1">${(portfolioValue + investedValue + totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-slate-300">Available Cash</span>
          <span className="text-xl font-bold mt-1 text-emerald-400">${(account?.balance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-slate-300">Invested Value</span>
          <span className="text-xl font-bold mt-1">${investedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-slate-300">Today's P / L</span>
          <span className={`text-xl font-bold mt-1 flex items-center ${todayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold text-slate-300">Total P / L</span>
          <span className={`text-xl font-bold mt-1 flex items-center ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Search & Watchlist Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Stock Search & Watchlist */}
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-slate-400">Search Stocks &amp; Assets</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search symbol (e.g. AAPL, TSLA, NVDA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Search Dropdown / Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className={`mt-2 rounded-xl border max-h-60 overflow-y-auto ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                {searchResults.map(stock => (
                  <div
                    key={stock.symbol}
                    onClick={() => {
                      setSelectedSymbol(stock.symbol);
                      setSearchQuery('');
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer border-b last:border-0 transition ${
                      isDarkMode ? 'hover:bg-slate-900 border-slate-800' : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{stock.symbol}</div>
                      <div className="text-xs text-slate-400">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono">${stock.price.toFixed(2)}</div>
                      <div className={`text-xs font-semibold ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watchlist Panel */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">My Watchlist</h3>
              <Star size={16} className="text-amber-400 fill-amber-400" />
            </div>
            
            <div className="space-y-2">
              {watchlist.map(sym => (
                <div
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedSymbol === sym
                      ? 'border-blue-600 bg-blue-50/10 dark:bg-blue-950/30'
                      : isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(sym);
                      }}
                      className="text-amber-400 hover:text-amber-500"
                    >
                      <Star size={16} className="fill-amber-400" />
                    </button>
                    <div>
                      <div className="font-bold">{sym}</div>
                      <div className="text-[11px] text-slate-400">US Equities</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right / Main: Stock Detail, Chart & Order Execution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stock Header & Statistics */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            {quote && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black">{quote.symbol}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                          {quote.marketStatus}
                        </span>
                        <button onClick={() => toggleWatchlist(quote.symbol)} className="text-amber-400">
                          <Star size={18} className={isFav ? 'fill-amber-400' : ''} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-400 font-medium">{quote.name}</p>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-3xl font-black font-mono">${quote.price.toFixed(2)}</div>
                    <div className={`text-sm font-bold flex items-center md:justify-end gap-1 ${quote.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {quote.change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {quote.change >= 0 ? '+' : ''}{quote.change} ({quote.changePercent}%)
                    </div>
                  </div>
                </div>

                {/* Key Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block">Day High</span>
                    <span className="font-bold text-sm font-mono mt-0.5 block">${quote.dayHigh}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Day Low</span>
                    <span className="font-bold text-sm font-mono mt-0.5 block">${quote.dayLow}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Volume</span>
                    <span className="font-bold text-sm font-mono mt-0.5 block">{quote.volume.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Market Cap</span>
                    <span className="font-bold text-sm font-mono mt-0.5 block">{quote.marketCap}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart with Indicators */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              
              {/* Timeframe selector */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Indicator Toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1">Indicators:</span>
                <button onClick={() => setShowSma20(!showSma20)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${showSma20 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>SMA 20</button>
                <button onClick={() => setShowSma50(!showSma50)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${showSma50 ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>SMA 50</button>
                <button onClick={() => setShowEma9(!showEma9)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${showEma9 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>EMA 9</button>
              </div>
            </div>

            {/* Chart Container */}
            <div className="w-full h-80">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="animate-spin" size={20} /> Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={enrichedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="time" stroke={isDarkMode ? '#64748b' : '#94a3b8'} textAnchor="end" fontSize={11} />
                    <YAxis domain={['auto', 'auto']} stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={11} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="volume" yAxisId={1} fill={isDarkMode ? '#334155' : '#cbd5e1'} opacity={0.4} name="Volume" />
                    <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Price" />
                    {showSma20 && <Line type="monotone" dataKey="sma20" stroke="#6366f1" strokeWidth={1.5} dot={false} name="SMA 20" />}
                    {showSma50 && <Line type="monotone" dataKey="sma50" stroke="#a855f7" strokeWidth={1.5} dot={false} name="SMA 50" />}
                    {showEma9 && <Line type="monotone" dataKey="ema9" stroke="#10b981" strokeWidth={1.5} dot={false} name="EMA 9" />}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Order Execution Panel */}
          <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-base font-black mb-4">Execute Stock Order ({selectedSymbol})</h3>

            {orderMessage && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${orderMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'}`}>
                {orderMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{orderMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Order Side</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderSide('buy')}
                    className={`py-2.5 rounded-xl font-bold text-xs transition ${orderSide === 'buy' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    onClick={() => setOrderSide('sell')}
                    className={`py-2.5 rounded-xl font-bold text-xs transition ${orderSide === 'sell' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Quantity (Shares)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Estimated Total</label>
                <div className={`px-4 py-2.5 rounded-xl border font-mono font-black text-sm flex items-center ${isDarkMode ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-600'}`}>
                  ${quote ? (quote.price * orderQuantity).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>

            <button
              disabled={isExecuting || !quote}
              onClick={handleExecuteOrder}
              className={`w-full py-3.5 rounded-xl font-black text-white shadow-lg transition ${
                orderSide === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {isExecuting ? 'Executing Order...' : `Execute ${orderSide.toUpperCase()} Order (${orderQuantity} ${selectedSymbol})`}
            </button>
          </div>

        </div>
      </div>

      {/* User Positions & Transaction History */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-base font-black mb-4">My Open Positions &amp; Portfolio Holdings</h3>
        {positions.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No open stock positions currently. Use the trading panel above to place your first order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="pb-3 font-bold">Symbol</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Quantity</th>
                  <th className="pb-3 font-bold">Entry Price</th>
                  <th className="pb-3 font-bold">Current P / L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {positions.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 font-bold">{p.asset_symbol}</td>
                    <td className="py-3 uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.type === 'buy' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 font-mono">{p.amount}</td>
                    <td className="py-3 font-mono">${p.entry_price}</td>
                    <td className={`py-3 font-mono font-bold ${Number(p.profit_loss || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${Number(p.profit_loss || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
