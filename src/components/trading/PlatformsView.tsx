import { useState } from 'react';
import { Smartphone, Monitor, Globe, Cpu, Download, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PlatformsViewProps {
  onLaunchWebTrader: () => void;
  isDarkMode?: boolean;
}

export default function PlatformsView({ onLaunchWebTrader, isDarkMode = false }: PlatformsViewProps) {
  const platforms = [
    {
      id: 'webtrader',
      name: 'Safe Global Trade Web Trader',
      category: 'Browser Based',
      icon: Globe,
      color: 'from-blue-600 to-indigo-600',
      desc: 'No download required. Access institutional charts, one-click trading, and depth of market directly in your web browser with 100% cloud sync.',
      highlights: [
        'Instant execution with zero installation',
        'Built-in Recharts & TradingView charting',
        'Integrated Risk & Margin Calculator',
        'Real-time P&L position monitoring'
      ],
      actionText: 'Launch Web Trader',
      actionFn: onLaunchWebTrader
    },
    {
      id: 'mobile',
      name: 'Safe Global Trade Mobile App',
      category: 'iOS & Android',
      icon: Smartphone,
      color: 'from-purple-600 to-indigo-600',
      desc: 'Trade anywhere, anytime with full account management, live push notification alerts, biometric security, and responsive charts.',
      highlights: [
        'Real-time price alert push notifications',
        'Biometric Touch ID & Face ID security',
        'Full order entry & modification suite',
        'Instant wallet transfers on the go'
      ],
      actionText: 'Download iOS / Android App',
      actionFn: () => alert('Downloading Safe Global Trade Mobile App APK / iOS installer...')
    },
    {
      id: 'mt5',
      name: 'MetaTrader 5 (MT5)',
      category: 'Desktop & Mobile',
      icon: Cpu,
      color: 'from-emerald-600 to-teal-600',
      desc: 'The global standard for algorithmic trading, multi-currency backtesting, Expert Advisors (EAs), and institutional depth of market.',
      highlights: [
        '21 timeframes & 80+ technical indicators',
        'MQL5 algorithmic EA automated trading',
        'Depth of Market (DOM) level 2 prices',
        'Multi-asset stocks, futures & FX support'
      ],
      actionText: 'Download MT5 Platform',
      actionFn: () => alert('Downloading Safe Global Trade MetaTrader 5 Setup...')
    },
    {
      id: 'mt4',
      name: 'MetaTrader 4 (MT4)',
      category: 'Desktop & Mobile',
      icon: Monitor,
      color: 'from-amber-500 to-orange-600',
      desc: 'The world’s favorite forex trading platform with user-friendly interface, automated custom indicators, and automated EA strategy support.',
      highlights: [
        '9 timeframes & 30 custom indicators',
        'MQL4 automated trading robot support',
        '128-bit SSL encrypted data protection',
        'Flexible custom charting templates'
      ],
      actionText: 'Download MT4 Platform',
      actionFn: () => alert('Downloading Safe Global Trade MetaTrader 4 Setup...')
    }
  ];

  return (
    <div className="w-full space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
          Institutional Trading Platforms
        </h2>
        <p className="text-sm text-slate-500">
          Trade on your terms across desktop, browser, and mobile devices. Sync your positions seamlessly across WebTrader, MetaTrader, and Mobile apps.
        </p>
      </div>

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map(p => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon size={24} />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                    {p.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {p.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={p.actionFn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{p.actionText}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
