import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { brand, tradingLabels } from '../../lib/branding';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ArrowRight,
  Download, Send, History, Wallet, ShieldCheck, Search, Star, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, Layers, BarChart2, User, ExternalLink, RefreshCw
} from 'lucide-react';

interface TradingDashboardProps {
  user: any;
  account: any;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
}

export default function TradingDashboard({ user, account, setActiveTab, isDarkMode = false }: TradingDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>({
    balance: 0,
    profit: 0,
    deposited: 0,
    invested: 0,
    accounts: [],
    recentTransactions: [],
    positions: [],
    recentTrades: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Advisors state
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const [dashRes, advRes] = await Promise.all([
        fetch('/api/trading/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        fetch('/api/advisors', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);

      if (!dashRes.ok) throw new Error('Failed to load trading dashboard data');
      const dashJson = await dashRes.json();
      setDashboardData(dashJson);

      if (advRes.ok) {
        const advJson = await advRes.json();
        setAdvisors(advJson.advisors || []);
        setFollowedIds(advJson.followedIds || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Unable to load financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Valued Client';
  const totalBalance = dashboardData.balance + (dashboardData.invested || 0);
  const profit = dashboardData.profit || 0;
  const deposited = dashboardData.deposited || 0;
  const savingsBalance = account?.savings_balance || 0;
  const checkingBalance = account?.balance || 0;
  const investmentVal = dashboardData.invested + profit;

  const handleFollowAdvisor = async (advisorId: string) => {
    const isFollowing = followedIds.includes(advisorId);
    const nextFollowed = isFollowing ? followedIds.filter(id => id !== advisorId) : [...followedIds, advisorId];
    setFollowedIds(nextFollowed);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch('/api/advisors/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ advisor_id: advisorId, action: isFollowing ? 'unfollow' : 'follow' })
      });
    } catch (e) {
      console.error('Error updating advisor follow state:', e);
    }
  };

  const followedAdvisorsList = advisors.filter(a => followedIds.includes(a.id));

  return (
    <div className={`space-y-6 pb-16 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. TOP HEADER */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-r ${isDarkMode ? 'from-slate-900 via-slate-900 to-blue-950/40 border-slate-800' : 'from-blue-900 via-indigo-900 to-blue-950 text-white border-blue-950 shadow-xl'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {brand.name} Secure Portal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                Paper Trading Mode
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">Good morning, {firstName}</h1>
            <p className="text-sm text-slate-300 mt-1">Here’s an overview of your portfolio and trading activity</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('terminal')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition"
            >
              <BarChart2 size={16} /> Go to Live Trading
            </button>
            <button
              onClick={fetchDashboardData}
              title="Refresh Data"
              className={`p-2.5 rounded-xl border transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-500 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline text-xs">Try again</button>
        </div>
      )}

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Total Balance */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{tradingLabels.totalBalance}</span>
            <span className="text-emerald-500 flex items-center font-bold">
              <ArrowUpRight size={14} className="mr-0.5" /> +1.42% today
            </span>
          </div>
          {loading ? (
            <div className="h-9 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-3/4"></div>
          ) : (
            <div className="text-3xl font-black font-mono">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-2">Includes available cash &amp; open investments</div>
        </div>

        {/* Card 2: Profit */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{tradingLabels.profit}</span>
            <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {profit >= 0 ? 'Realized & Unrealized' : 'Loss'}
            </span>
          </div>
          {loading ? (
            <div className="h-9 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-2/3"></div>
          ) : (
            <div className={`text-3xl font-black font-mono flex items-center gap-1 ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {profit >= 0 ? '+' : ''}${profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-2">Unrestricted profit from active portfolio positions</div>
        </div>

        {/* Card 3: Deposited */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{tradingLabels.deposited}</span>
            <span className="text-emerald-500 font-bold">Confirmed</span>
          </div>
          {loading ? (
            <div className="h-9 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-3/4"></div>
          ) : (
            <div className="text-3xl font-black font-mono">
              ${deposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-2">Total verified lifetime deposits</div>
        </div>

      </div>

      {/* 3. QUICK ACTION BUTTONS */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'}`}
        >
          <Download size={16} className="text-blue-500" /> Deposit
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'}`}
        >
          <Send size={16} className="text-emerald-500" /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'}`}
        >
          <RefreshCw size={16} className="text-indigo-500" /> Transfer
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'}`}
        >
          <History size={16} className="text-amber-500" /> History
        </button>
      </div>

      {/* 4. MAIN DASHBOARD GRID (Recent Activity & Account Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: Recent Activity / Transactions */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black">{tradingLabels.recentActivity}</h3>
            <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Show all transactions <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : dashboardData.recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p className="font-semibold">No transactions yet</p>
              <p className="text-xs mt-1">Your deposits, withdrawals, and transfers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentTransactions.slice(0, 5).map((tx: any) => {
                const isPositive = ['deposit', 'trading_credit', 'investment_sell', 'refund'].includes(tx.type);
                return (
                  <div key={tx.id || tx.reference} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isPositive ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="font-bold capitalize text-xs">{tx.type.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()} · {tx.reference || 'Ref #TX'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-xs font-mono ${isPositive ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isPositive ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Account Overview / Portfolio & Accounts */}
        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black">{tradingLabels.accountOverview}</h3>
            <button onClick={() => setActiveTab('investments')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View investments <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="font-bold text-xs">Current Checking Account</div>
                  <div className="text-[11px] text-slate-400">Primary liquidity</div>
                </div>
              </div>
              <div className="font-mono font-black text-sm">
                ${checkingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="font-bold text-xs">Savings Vault</div>
                  <div className="text-[11px] text-slate-400">High yield reserve</div>
                </div>
              </div>
              <div className="font-mono font-black text-sm">
                ${savingsBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="font-bold text-xs">Investment Portfolio</div>
                  <div className="text-[11px] text-slate-400">{dashboardData.positions.length} active positions</div>
                </div>
              </div>
              <div className="font-mono font-black text-sm text-purple-500">
                ${investmentVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`p-4 rounded-xl border bg-blue-600/10 border-blue-500/30 flex items-center justify-between`}>
              <span className="font-extrabold text-xs">Total Net Combined Worth</span>
              <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400">
                ${(checkingBalance + savingsBalance + investmentVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. INVESTMENT SUMMARY BANNER */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-r ${isDarkMode ? 'from-slate-900 to-slate-950 border-slate-800' : 'from-slate-900 to-indigo-950 text-white border-slate-900 shadow-lg'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Portfolio Performance</span>
            <h3 className="text-xl font-black">Investment Portfolio Summary</h3>
            <p className="text-xs text-slate-300">Real-time asset valuation with automated risk balancing.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-right">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Value</span>
              <span className="text-lg font-black font-mono">${investmentVal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Invested</span>
              <span className="text-lg font-black font-mono">${dashboardData.invested.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Profit</span>
              <span className={`text-lg font-black font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Return</span>
              <span className={`text-lg font-black font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dashboardData.invested > 0 ? `${((profit / dashboardData.invested) * 100).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INVESTMENT / TRADE HISTORY TABLE */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black">{tradingLabels.investmentHistory}</h3>
          <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Show all trades
          </button>
        </div>

        {dashboardData.positions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <p className="font-bold">No investments or trade positions yet</p>
            <p className="text-xs mt-1">Explore live trading or execute orders to build your portfolio.</p>
            <button
              onClick={() => setActiveTab('terminal')}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow"
            >
              Start Trading Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="pb-3 font-bold">Symbol</th>
                  <th className="pb-3 font-bold">Side</th>
                  <th className="pb-3 font-bold">Date / Time</th>
                  <th className="pb-3 font-bold">Quantity</th>
                  <th className="pb-3 font-bold">Entry Price</th>
                  <th className="pb-3 font-bold">Profit / Loss</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {dashboardData.positions.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3 font-bold text-sm">{p.asset_symbol}</td>
                    <td className="py-3 uppercase font-extrabold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.type === 'buy' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-3 font-mono">{p.amount} QTY</td>
                    <td className="py-3 font-mono">${p.entry_price}</td>
                    <td className={`py-3 font-mono font-bold ${Number(p.profit_loss || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${Number(p.profit_loss || 0).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. ADVISORS SECTION */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-black">{tradingLabels.advisors}</h3>
            <p className="text-xs text-slate-400">Professional traders and investment strategists.</p>
          </div>
          <button
            onClick={() => setShowAdvisorModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5 self-start"
          >
            <User size={14} /> Explore Advisors
          </button>
        </div>

        {followedAdvisorsList.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center">
            <p className="text-sm font-bold">No advisors followed</p>
            <p className="text-xs text-slate-400 mt-1">Explore professional investment profiles and strategies to follow expert allocation insights.</p>
            <button
              onClick={() => setShowAdvisorModal(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
            >
              Browse Advisors
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followedAdvisorsList.map(advisor => (
              <div key={advisor.id} className={`p-4 rounded-xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={advisor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} alt={advisor.name} className="w-12 h-12 rounded-full object-cover border" />
                    <div>
                      <h4 className="font-bold text-sm">{advisor.name}</h4>
                      <span className="text-[11px] text-blue-500 font-semibold">{advisor.specialization}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{advisor.description}</p>
                  <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-emerald-500">Return: {advisor.historical_performance}</span>
                    <span className="text-slate-400">Risk: {advisor.risk_level}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowAdvisor(advisor.id)}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs transition"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADVISOR DISCOVERY MODAL */}
      {showAdvisorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-2xl border p-6 max-h-[85vh] overflow-y-auto shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black">Explore Expert Advisors &amp; Strategies</h3>
              <button onClick={() => setShowAdvisorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search advisor name or specialization..."
                value={advisorSearch}
                onChange={(e) => setAdvisorSearch(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
              />
            </div>

            <div className="space-y-4">
              {advisors.filter(a => a.name.toLowerCase().includes(advisorSearch.toLowerCase()) || a.specialization.toLowerCase().includes(advisorSearch.toLowerCase())).map(advisor => {
                const isFollowing = followedIds.includes(advisor.id);
                return (
                  <div key={advisor.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-4">
                      <img src={advisor.avatar_url} alt={advisor.name} className="w-14 h-14 rounded-full object-cover border" />
                      <div>
                        <h4 className="font-bold text-base">{advisor.name}</h4>
                        <span className="text-xs text-blue-500 font-semibold">{advisor.specialization} · Strategy: {advisor.strategy}</span>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">{advisor.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-xs font-bold flex gap-3">
                        <span className="text-emerald-500">Return: {advisor.historical_performance}</span>
                        <span className="text-slate-400">Followers: {advisor.followers_count}</span>
                      </div>
                      <button
                        onClick={() => handleFollowAdvisor(advisor.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition ${isFollowing ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {isFollowing ? 'Following' : 'Follow Advisor'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
