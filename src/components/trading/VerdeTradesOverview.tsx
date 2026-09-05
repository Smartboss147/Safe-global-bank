import { useState } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, ArrowRightLeft, History, TrendingUp, TrendingDown, 
  Search, Shield, CheckCircle2, ChevronRight, BarChart2, DollarSign, Users, Globe 
} from 'lucide-react';
import { INITIAL_MARKETS, MarketInstrument } from './mockMarketData';

interface VerdeTradesOverviewProps {
  user: any;
  account: any;
  onGoToLiveTrading: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenHistory: () => void;
  isDarkMode?: boolean;
}

export default function VerdeTradesOverview({
  user,
  account,
  onGoToLiveTrading,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenHistory,
  isDarkMode = false
}: VerdeTradesOverviewProps) {
  const [activeMarketTab, setActiveMarketTab] = useState<'All' | 'Crypto' | 'Stocks' | 'Watchlist'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingTraders] = useState([
    { name: 'Marcus Webb', roi: '+41.60%', avatar: 'MW' },
    { name: 'Elena Rostova', roi: '+28.40%', avatar: 'ER' },
    { name: 'David Chen', roi: '+19.95%', avatar: 'DC' }
  ]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader';
  const totalBalance = account?.balance || 782.72;
  const totalProfit = 658.84;
  const totalDeposited = 1200.00;

  const cryptoMarkets = INITIAL_MARKETS.filter(m => m.category === 'Crypto');
  const stockMarkets = INITIAL_MARKETS.filter(m => m.category === 'Stocks');

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* Greeting & Balance Card (VerdeTrades Style) */}
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white capitalize">
          Good morning, {userName}
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s an overview of your portfolio and trading activity
        </p>
      </div>

      {/* Main VerdeTrades Green/Dark Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white p-6 md:p-8 shadow-xl border border-emerald-900/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 text-transparent bg-clip-text">
              VerdeTrades
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        <div className="relative z-10 space-y-1 mb-6">
          <p className="text-xs uppercase tracking-wider text-emerald-300/80 font-bold">Total Balance</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight font-mono">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold pt-1">
            <TrendingUp size={14} /> <span>+$0.00 +0.00% today</span>
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-emerald-900/60 text-xs">
          <div>
            <p className="text-emerald-400/80 font-bold uppercase text-[10px]">PROFIT</p>
            <p className="text-lg font-black font-mono text-emerald-300">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-emerald-400/80 font-bold uppercase text-[10px]">DEPOSITED</p>
            <p className="text-lg font-black font-mono text-white">${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons (Deposit, Withdraw, Transfer, History) */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <ArrowDownLeft size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Deposit</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <ArrowUpRight size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Withdraw</span>
        </button>

        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <ArrowRightLeft size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Transfer</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
            <History size={20} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">History</span>
        </button>
      </div>

      {/* Go To Live Trading Banner Button */}
      <button
        onClick={onGoToLiveTrading}
        className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition group"
      >
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <span className="w-3 h-3 rounded-full bg-red-500 absolute" />
          <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 dark:text-white">
            <BarChart2 size={18} className="text-emerald-500 ml-3" />
            <span>Go to Live Trading Terminal</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
      </button>

      {/* Trading Platform Section & Market Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Trading Platform</h3>
            <p className="text-xs text-slate-500">Trade cryptocurrencies and stocks in real-time</p>
          </div>

          {/* Market Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(['All', 'Crypto', 'Stocks', 'Watchlist'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveMarketTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeMarketTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'All' ? 'All Markets' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Instrument Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={onGoToLiveTrading}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 transition cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">Crypto Trading</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">24/7 Live</span>
            </div>
            <p className="text-xs text-slate-500">Trade major cryptocurrencies with instant execution</p>
            <div className="flex items-center gap-2 pt-1">
              {['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].map(sym => (
                <span key={sym} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                  {sym}
                </span>
              ))}
            </div>
          </div>

          <div 
            onClick={onGoToLiveTrading}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 transition cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">Stock Trading</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded">US Equities</span>
            </div>
            <p className="text-xs text-slate-500">Trade top US stocks &amp; global exchange-traded funds</p>
            <div className="flex items-center gap-2 pt-1">
              {['AAPL', 'MSFT', 'TSLA'].map(sym => (
                <span key={sym} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                  {sym}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Crypto Market Overview Table */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Crypto Market Overview</h4>
            <span className="text-[11px] text-slate-400 font-medium">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 font-bold uppercase">Asset</th>
                  <th className="pb-3 font-bold uppercase text-right">Price</th>
                  <th className="pb-3 font-bold uppercase text-right">24h Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {INITIAL_MARKETS.slice(0, 8).map(m => (
                  <tr key={m.id} onClick={onGoToLiveTrading} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                    <td className="py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                        {m.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">{m.symbol}</p>
                        <p className="text-[10px] text-slate-400">{m.name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: m.price < 1 ? 4 : 2 })}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded text-[11px] ${
                        m.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown & Trade History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Portfolio Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Portfolio Breakdown</h4>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 font-semibold">Profit</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+$658.84</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 font-semibold">Balance</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${totalBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-500 font-semibold">Total Portfolio Value</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${(totalBalance + 658.84).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Copy Trading / Following Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Following Traders</h4>
            <span className="text-xs text-emerald-600 font-bold">Copy Active</span>
          </div>

          <div className="space-y-3">
            {followingTraders.map((trader, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    {trader.avatar}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900 dark:text-white">{trader.name}</p>
                    <p className="text-[10px] text-slate-400">Expert Crypto &amp; Forex Strategist</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">{trader.roi}</span>
                  <p className="text-[10px] text-slate-400">ROI</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
