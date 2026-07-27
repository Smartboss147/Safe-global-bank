import { TrendingUp, TrendingDown, ShieldCheck, Wallet, ChevronDown, BarChart2, Globe, Cpu, Award, Zap, Layers, Calculator, HelpCircle, UserCheck } from 'lucide-react';
import { INITIAL_MARKETS } from './mockMarketData';

interface TradingHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAccount: any;
  setSelectedAccount?: (acc: any) => void;
  userAccounts?: any[];
  liveEquity?: number;
  liveMargin?: number;
  freeMargin?: number;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
  onOpenCreateAccount?: () => void;
}

export default function TradingHeader({
  activeTab,
  setActiveTab,
  selectedAccount,
  setSelectedAccount,
  userAccounts = [],
  liveEquity = 1000,
  liveMargin = 0,
  freeMargin = 1000,
  isDarkMode = false,
  setIsDarkMode,
  onOpenCreateAccount
}: TradingHeaderProps) {
  const tickerItems = INITIAL_MARKETS.slice(0, 8);

  const tabs = [
    { id: 'showcase', label: 'Overview', icon: Globe },
    { id: 'terminal', label: 'Web Trader', icon: BarChart2, badge: 'PRO' },
    { id: 'markets', label: 'Markets', icon: Layers },
    { id: 'accounts', label: 'Account Types', icon: UserCheck },
    { id: 'platforms', label: 'Platforms', icon: Cpu },
    { id: 'wallet', label: 'Portal & Wallet', icon: Wallet },
    { id: 'tools', label: 'Tools & News', icon: Calculator },
    { id: 'education', label: 'Education & FAQ', icon: HelpCircle },
  ];

  return (
    <div className={`w-full transition-colors duration-200 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Top Ticker Tape Bar */}
      <div className={`w-full overflow-hidden text-xs py-2 px-4 border-b flex items-center gap-6 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900 text-slate-200 border-slate-800'}`}>
        <div className="flex items-center gap-2 shrink-0 font-bold text-amber-400">
          <Zap size={14} className="animate-pulse" />
          <span>SAFE GLOBAL TRADE LIVE</span>
        </div>
        
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
          {tickerItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setActiveTab('terminal')}>
              <span className="font-bold text-slate-100">{item.symbol}</span>
              <span className="font-mono">{item.price > 100 ? item.price.toFixed(2) : item.price.toFixed(4)}</span>
              <span className={`flex items-center text-[10px] font-semibold px-1 rounded ${item.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {item.change24h >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                {item.change24h >= 0 ? '+' : ''}{item.change24h}%
              </span>
            </div>
          ))}
        </div>

        <div className="shrink-0 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck size={13} /> Execution &lt;10ms
          </span>
          {setIsDarkMode && (
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          )}
        </div>
      </div>

      {/* Main Header / Broker Info & Account Selector Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Name & Subtitle */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('showcase')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-900 flex items-center justify-center text-white font-black text-xl shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-900 text-transparent bg-clip-text">
                SAFE GLOBAL TRADE
              </h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full tracking-wider uppercase border border-blue-200">
                Brokerage
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Institutional-Grade Execution • MetaTrader &amp; WebTrader Platform</p>
          </div>
        </div>

        {/* Live Broker Balance & Equity HUD */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`p-2.5 rounded-xl border flex items-center gap-4 text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Equity</p>
              <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">${liveEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Free Margin</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Used Margin</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">${liveMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Account Selector Dropdown or Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md active:scale-95 transition"
            >
              <Wallet size={15} />
              <span>Wallet &amp; Deposit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
