import { useState } from 'react';
import { INITIAL_MARKETS, MarketInstrument } from './mockMarketData';
import { Search, Star, TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface MarketsViewProps {
  onTradeSymbol: (symbol: string) => void;
  isDarkMode?: boolean;
}

export default function MarketsView({ onTradeSymbol, isDarkMode = false }: MarketsViewProps) {
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'spread'>('symbol');
  const [favorites, setFavorites] = useState<string[]>(['EUR/USD', 'BTC/USD', 'AAPL']);

  const categories = ['All', 'Favorites', 'Forex', 'Crypto', 'Stocks', 'Indices', 'Metals', 'Energy', 'ETFs'];

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  let filtered = INITIAL_MARKETS.filter(m => {
    const matchCat = category === 'All'
      || (category === 'Favorites' && favorites.includes(m.symbol))
      || m.category === category;
    const matchSearch = m.symbol.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'change') return b.change24h - a.change24h;
    if (sortBy === 'spread') return a.spread - b.spread;
    return a.symbol.localeCompare(b.symbol);
  });

  return (
    <div className="w-full space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tradeable Global Markets</h2>
          <p className="text-sm text-slate-500">
            Access 500+ instruments with institutional spreads, 1:500 leverage and instant execution.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className={`p-2 text-xs font-bold rounded-xl border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
          >
            <option value="symbol">Symbol (A-Z)</option>
            <option value="change">Top Movers (24h %)</option>
            <option value="spread">Lowest Spread</option>
            <option value="price">Highest Price</option>
          </select>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  category === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
            />
          </div>
        </div>
      </div>

      {/* Markets Grid/Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`uppercase font-bold text-[10px] tracking-wider ${isDarkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <th className="p-4">Fav</th>
                <th className="p-4">Instrument</th>
                <th className="p-4">Category</th>
                <th className="p-4">Bid Price</th>
                <th className="p-4">Ask Price</th>
                <th className="p-4">Spread</th>
                <th className="p-4">24h Change</th>
                <th className="p-4">Max Leverage</th>
                <th className="p-4">Hours</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(m => {
                const isFav = favorites.includes(m.symbol);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <button onClick={() => toggleFavorite(m.symbol)}>
                        <Star size={16} fill={isFav ? '#f59e0b' : 'none'} className={isFav ? 'text-amber-500' : 'text-slate-300'} />
                      </button>
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">{m.symbol}</p>
                      <p className="text-[11px] text-slate-400">{m.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-rose-500">
                      ${m.bid > 100 ? m.bid.toFixed(2) : m.bid.toFixed(4)}
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-500">
                      ${m.ask > 100 ? m.ask.toFixed(2) : m.ask.toFixed(4)}
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {m.spread} pips
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-extrabold text-[11px] ${
                        m.change24h >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {m.leverage}
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {m.tradingHours}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onTradeSymbol(m.symbol)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition"
                      >
                        Trade {m.symbol}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
