import { useState } from 'react';
import { Check, Shield, Zap, Award, Star, ArrowRight, UserCheck } from 'lucide-react';

interface AccountTypesViewProps {
  onSelectAccountType: (type: string) => void;
  isDarkMode?: boolean;
}

export default function AccountTypesView({ onSelectAccountType, isDarkMode = false }: AccountTypesViewProps) {
  const accountTiers = [
    {
      id: 'starter',
      name: 'Starter Account',
      popular: false,
      minDeposit: '$100',
      spread: 'From 1.2 pips',
      commission: 'Zero Commission',
      leverage: '1:500',
      execution: 'STP Market Execution',
      marginCall: '50%',
      stopOut: '20%',
      desc: 'Ideal for novice traders looking for zero commission trading and reliable fixed spreads.',
      features: [
        'Over 100+ Tradeable FX Pairs & CFDs',
        'Web Trader & Mobile App Access',
        'Standard Order Execution Engine',
        'Swap-Free Option Available',
        '24/5 Customer Support'
      ],
      color: 'border-slate-200'
    },
    {
      id: 'standard',
      name: 'Standard Account',
      popular: true,
      minDeposit: '$500',
      spread: 'From 0.6 pips',
      commission: 'Zero Commission',
      leverage: '1:500',
      execution: 'Ultra-Fast ECN/STP',
      marginCall: '80%',
      stopOut: '30%',
      desc: 'Our most popular account type with tight spreads, flexible leverage, and full feature suite.',
      features: [
        '500+ All Tradeable Asset Classes',
        'WebTrader, MT4 & MT5 Support',
        'Direct Market Access (DMA)',
        'Free VPS Hosting Included',
        'Daily Market Analysis & Signals'
      ],
      color: 'border-blue-500 bg-blue-50/20'
    },
    {
      id: 'pro',
      name: 'Professional ECN',
      popular: false,
      minDeposit: '$2,500',
      spread: 'Raw 0.0 pips',
      commission: '$3.50 per lot',
      leverage: '1:500',
      execution: 'Raw ECN Direct Liquidity',
      marginCall: '100%',
      stopOut: '50%',
      desc: 'Engineered for high-volume traders, EA algorithmic scalpers, and institutional precision.',
      features: [
        'Deep Tier-1 Bank Institutional Liquidity',
        'Zero Markup Raw Spreads',
        'Sub-10ms Order Execution Speed',
        'Personal Account Manager',
        'Advanced Risk & Depth Analytics'
      ],
      color: 'border-indigo-500'
    },
    {
      id: 'vip',
      name: 'VIP Institutional',
      popular: false,
      minDeposit: '$10,000',
      spread: 'Raw 0.0 pips',
      commission: '$2.00 per lot (Discounted)',
      leverage: '1:500',
      execution: 'Prime Brokerage Liquidity',
      marginCall: '100%',
      stopOut: '50%',
      desc: 'Tailored for high net-worth individuals requiring custom leverage, dedicated dealing desk, and VIP perks.',
      features: [
        'Bespoke Customized Trading Terms',
        'Dedicated Senior Dealing Specialist',
        'Priority Instant Withdrawal Routing',
        'Exclusive Institutional Market Briefs',
        'Negative Balance Guarantee'
      ],
      color: 'border-amber-500'
    },
  ];

  return (
    <div className="w-full space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
          Trading Account Types
        </h2>
        <p className="text-sm text-slate-500">
          Choose the account tier tailored to your trading volume, strategy, and risk preference. All accounts enjoy Safe Global Trade’s zero-slippage execution engine.
        </p>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountTiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-3xl border-2 p-6 flex flex-col justify-between shadow-md transition-all hover:shadow-xl ${tier.color} ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-md">
                MOST POPULAR
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{tier.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tier.desc}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Min Deposit:</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{tier.minDeposit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Spread:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{tier.spread}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Commission:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{tier.commission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Max Leverage:</span>
                  <span className="font-extrabold text-amber-600">{tier.leverage}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[11px] uppercase font-extrabold text-slate-400">Included Features</p>
                {tier.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSelectAccountType(tier.name)}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>Select {tier.name}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Account Comparison Matrix */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">Account Specs &amp; Terms Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`uppercase text-[10px] font-bold ${isDarkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <th className="p-3">Specification</th>
                <th className="p-3">Starter</th>
                <th className="p-3">Standard</th>
                <th className="p-3">Pro ECN</th>
                <th className="p-3">VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Execution Type</td>
                <td className="p-3">STP Market</td>
                <td className="p-3">ECN / STP</td>
                <td className="p-3">Raw ECN</td>
                <td className="p-3">Prime DMA</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Margin Call / Stop Out</td>
                <td className="p-3">50% / 20%</td>
                <td className="p-3">80% / 30%</td>
                <td className="p-3">100% / 50%</td>
                <td className="p-3">100% / 50%</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Islamic Swap-Free Option</td>
                <td className="p-3 text-emerald-600 font-bold">Yes</td>
                <td className="p-3 text-emerald-600 font-bold">Yes</td>
                <td className="p-3 text-emerald-600 font-bold">Yes</td>
                <td className="p-3 text-emerald-600 font-bold">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
