import { useState } from 'react';
import { HelpCircle, BookOpen, ChevronDown, CheckCircle2, Shield } from 'lucide-react';

interface EducationFAQViewProps {
  isDarkMode?: boolean;
}

export default function EducationFAQView({ isDarkMode = false }: EducationFAQViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is Safe Global Trade and what instruments can I trade?',
      a: 'Safe Global Trade is an institutional broker platform offering access to over 500+ tradeable CFD instruments including Forex pairs, Cryptocurrencies, Global Stocks, Stock Indices, Precious Metals (Gold/Silver), Energy (Oil/Gas), and ETFs.'
    },
    {
      q: 'What leverage ratios are available?',
      a: 'We offer flexible leverage ratios from 1:10 up to 1:500 depending on account type and asset class. Maximum leverage of 1:500 is available on major Forex pairs.'
    },
    {
      q: 'How does instant execution work?',
      a: 'Orders placed on Safe Global Trade Web Trader or MetaTrader 5 are routed directly to Tier-1 liquidity providers via automated STP/ECN engine with average execution speed under 10 milliseconds.'
    },
    {
      q: 'Are my funds safe with Safe Global Trade?',
      a: 'Yes. All client deposits are held in segregated bank accounts at Tier-1 international financial institutions, isolated from operational company funds with negative balance protection guarantee.'
    },
    {
      q: 'What are the minimum deposit and withdrawal amounts?',
      a: 'Minimum deposit for Starter Account is $100. Withdrawals are processed instantly through your client portal wallet to your linked bank or crypto wallet.'
    },
    {
      q: 'Is there an Islamic Swap-Free account option?',
      a: 'Yes. All Safe Global Trade account types support an optional Swap-Free mode compliant with Islamic Sharia principles with zero overnight interest fees.'
    }
  ];

  const guides = [
    { title: 'Beginner Guide to Forex & CFD Trading', level: 'Beginner', readTime: '5 min' },
    { title: 'Understanding Leverage, Margin & Risk Management', level: 'Intermediate', readTime: '7 min' },
    { title: 'Mastering Candlestick Patterns & Technical Analysis', level: 'Advanced', readTime: '10 min' },
    { title: 'Algorithmic Trading with MetaTrader 5 EAs', level: 'Pro Expert', readTime: '12 min' }
  ];

  return (
    <div className="w-full space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
          Trader Academy &amp; FAQ Center
        </h2>
        <p className="text-sm text-slate-500">
          Learn trading concepts, master risk management, and find answers to common brokerage questions.
        </p>
      </div>

      {/* Educational Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {guides.map((g, i) => (
          <div key={i} className={`p-5 rounded-3xl border shadow-sm space-y-3 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                {g.level} • {g.readTime}
              </span>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{g.title}</h4>
            </div>

            <button
              onClick={() => alert(`Opening guide: ${g.title}`)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <BookOpen size={14} /> Read Article
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition overflow-hidden ${
                  isOpen
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
