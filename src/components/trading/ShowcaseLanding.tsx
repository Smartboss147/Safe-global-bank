import { motion } from 'motion/react';
import { 
  TrendingUp, Shield, Zap, Award, Globe, Smartphone, BarChart3, 
  ArrowRight, CheckCircle2, Lock, Cpu, Layers, DollarSign, Users, Clock, HelpCircle, ChevronRight, UserCheck 
} from 'lucide-react';
import { INITIAL_MARKETS } from './mockMarketData';

interface ShowcaseLandingProps {
  onStartTrading: () => void;
  onExploreMarkets: () => void;
  onOpenAccount: () => void;
  onViewPlatforms: () => void;
}

export default function ShowcaseLanding({
  onStartTrading,
  onExploreMarkets,
  onOpenAccount,
  onViewPlatforms
}: ShowcaseLandingProps) {
  const stats = [
    { label: 'Daily Trading Volume', value: '$12.8 Billion+' },
    { label: 'Active Registered Traders', value: '2.4 Million+' },
    { label: 'Global Jurisdictions Served', value: '140+ Countries' },
    { label: 'Average Execution Speed', value: '< 9.4 Milliseconds' },
    { label: 'Customer Satisfaction Score', value: '99.4%' },
  ];

  const features = [
    {
      title: 'Ultra-Low Spreads',
      desc: 'Trade raw spreads starting from 0.0 pips on major FX pairs with institutional liquidity depth.',
      icon: Layers,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'High Leverage Up to 1:500',
      desc: 'Maximize market opportunities with flexible leverage tiers tailored to your trading style and risk profile.',
      icon: Zap,
      color: 'from-amber-500 to-orange-600'
    },
    {
      title: 'Multi-Asset Trading Engine',
      desc: 'Access 500+ tradeable CFD instruments including Forex, Crypto, Global Stocks, Indices, Metals & Energy.',
      icon: BarChart3,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'Enterprise-Grade Security',
      desc: 'Segregated tier-1 bank accounts, SSL encryption, negative balance protection, and strict regulatory compliance.',
      icon: Lock,
      color: 'from-purple-600 to-indigo-600'
    }
  ];

  return (
    <div className="w-full space-y-12 pb-12">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-14 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Award size={14} /> Official Safe Global Trade Broker Platform
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Trade Forex, Crypto, Stocks &amp; Commodities with <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 text-transparent bg-clip-text">Institutional Precision</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Experience lightning-fast execution, zero-pip spreads, and raw multi-asset liquidity backed by Safe Global Trade’s state-of-the-art brokerage ecosystem.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartTrading}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl active:scale-95 transition flex items-center gap-2"
            >
              <span>Launch Web Trader</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onOpenAccount}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 active:scale-95 transition flex items-center gap-2"
            >
              <UserCheck size={18} />
              <span>Open Trading Account</span>
            </button>

            <button
              onClick={onExploreMarkets}
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 transition flex items-center gap-2"
            >
              <Globe size={18} />
              <span>Explore Markets</span>
            </button>

            <button
              onClick={onViewPlatforms}
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 transition flex items-center gap-2"
            >
              <Smartphone size={18} />
              <span>Download Mobile App</span>
            </button>
          </div>

          {/* Quick Features List */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Spreads from 0.0 pips</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Leverage up to 1:500</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Instant Withdrawal Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>24/7 Dedicated Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Featured Market Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Live Global Markets</h2>
            <p className="text-sm text-slate-500">Real-time institutional prices across Forex, Crypto, Stocks &amp; Commodities</p>
          </div>
          <button
            onClick={onExploreMarkets}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>View All 500+ Markets</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {INITIAL_MARKETS.slice(0, 8).map((market) => (
            <div
              key={market.id}
              onClick={onStartTrading}
              className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:shadow-md transition cursor-pointer bg-slate-50/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-200 text-slate-700 uppercase">
                  {market.category}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${market.change24h >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                </span>
              </div>

              <div>
                <p className="font-extrabold text-base text-slate-900">{market.symbol}</p>
                <p className="text-xs text-slate-500 truncate">{market.name}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Price</p>
                  <p className="font-extrabold text-sm text-slate-900">
                    ${market.price > 100 ? market.price.toFixed(2) : market.price.toFixed(4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Spread</p>
                  <p className="font-bold text-xs text-blue-600">{market.spread} pips</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Four Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-md`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Security & Regulatory Trust Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Shield size={16} /> Regulatory Compliance &amp; Client Fund Security
          </div>
          <h2 className="text-2xl md:text-3xl font-black">
            Your Capital is Safeguarded by Safe Global Trade
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Client funds are stored in segregated accounts at Tier-1 international banks, completely separate from company operational assets, protected with negative balance guarantee and enterprise SSL encryption.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <button
            onClick={onOpenAccount}
            className="px-6 py-3.5 rounded-xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 transition active:scale-95 shadow-lg"
          >
            Create Live Account
          </button>
          <button
            onClick={onStartTrading}
            className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-500 transition active:scale-95"
          >
            Try Free $100,000 Demo
          </button>
        </div>
      </div>
    </div>
  );
}
