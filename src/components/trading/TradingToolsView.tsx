import { useState } from 'react';
import { Calendar, Newspaper, Calculator, Flame, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface TradingToolsViewProps {
  isDarkMode?: boolean;
}

export default function TradingToolsView({ isDarkMode = false }: TradingToolsViewProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'news' | 'calculators' | 'heatmap'>('calendar');

  // Calculator State
  const [calcType, setCalcType] = useState<'margin' | 'pip' | 'profit'>('margin');
  const [calcPrice, setCalcPrice] = useState('1.0850');
  const [calcLots, setCalcLots] = useState('1.0');
  const [calcLeverage, setCalcLeverage] = useState('100');

  // Economic Events
  const economicEvents = [
    { time: '13:30 GMT', currency: 'USD', event: 'US Non-Farm Payrolls (NFP)', impact: 'HIGH', forecast: '185K', previous: '175K' },
    { time: '14:00 GMT', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'HIGH', forecast: '3.75%', previous: '4.00%' },
    { time: '15:30 GMT', currency: 'GBP', event: 'UK CPI Inflation YoY', impact: 'HIGH', forecast: '2.1%', previous: '2.3%' },
    { time: '16:15 GMT', currency: 'USD', event: 'Fed Chair Powell Speech', impact: 'HIGH', forecast: '-', previous: '-' },
    { time: '18:00 GMT', currency: 'JPY', event: 'BOJ Core CPI YoY', impact: 'MEDIUM', forecast: '2.5%', previous: '2.4%' },
  ];

  // Market News
  const newsItems = [
    { title: 'Federal Reserve Signals Potential Interest Rate Cut Ahead', source: 'SGT News Desk', time: '10m ago', category: 'Forex' },
    { title: 'Bitcoin Rebounds Above $67,000 as Institutional ETF Inflows Surge', source: 'Crypto Wire', time: '25m ago', category: 'Crypto' },
    { title: 'Gold Touches 3-Week High on Safe-Haven Demand', source: 'Commodity Pulse', time: '1h ago', category: 'Metals' },
    { title: 'Tech Stocks Rally Led by NVIDIA and Apple Earnings Beat', source: 'Global Markets', time: '2h ago', category: 'Stocks' },
  ];

  // Calculators Result
  const numPrice = Number(calcPrice) || 1;
  const numLots = Number(calcLots) || 1;
  const numLev = Number(calcLeverage) || 100;

  const marginResult = (numLots * 100000 * numPrice) / numLev;
  const pipResult = numLots * 10; // $10 per lot for standard FX

  return (
    <div className="w-full space-y-6">
      
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'calendar', label: 'Economic Calendar', icon: Calendar },
          { id: 'news', label: 'Market News Feed', icon: Newspaper },
          { id: 'calculators', label: 'Financial Calculators', icon: Calculator },
          { id: 'heatmap', label: 'Heat Map & Top Movers', icon: Flame },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      {activeTab === 'calendar' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Global Economic Calendar</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Updated Live</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`uppercase text-[10px] font-bold ${isDarkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <th className="p-3">Time</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Impact</th>
                  <th className="p-3">Forecast</th>
                  <th className="p-3">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {economicEvents.map((ev, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-slate-500">{ev.time}</td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{ev.currency}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{ev.event}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                        ev.impact === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ev.impact}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{ev.forecast}</td>
                    <td className="p-3 font-mono text-slate-400">{ev.previous}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsItems.map((item, i) => (
            <div key={i} className={`p-5 rounded-3xl border shadow-sm space-y-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold">
                  {item.category}
                </span>
                <span className="text-slate-400 font-medium">{item.time}</span>
              </div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{item.title}</h4>
              <p className="text-xs text-slate-400 font-medium">Source: {item.source}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'calculators' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Margin &amp; Pip Calculator</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Price ($)</label>
              <input
                type="number"
                value={calcPrice}
                onChange={e => setCalcPrice(e.target.value)}
                className={`w-full p-3 text-xs rounded-xl border font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Volume (Lots)</label>
              <input
                type="number"
                value={calcLots}
                onChange={e => setCalcLots(e.target.value)}
                className={`w-full p-3 text-xs rounded-xl border font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Leverage Ratio</label>
              <select
                value={calcLeverage}
                onChange={e => setCalcLeverage(e.target.value)}
                className={`w-full p-3 text-xs rounded-xl border font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="50">1:50</option>
                <option value="100">1:100</option>
                <option value="200">1:200</option>
                <option value="500">1:500</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase">Estimated Required Margin</p>
              <p className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">${marginResult.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase">Pip Value (Per 1 Pip Movement)</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${pipResult.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Top Market Movers &amp; Heatmap</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500 text-white space-y-1">
              <p className="font-extrabold text-sm">NVDA (+6.10%)</p>
              <p className="text-xs text-emerald-100">$122.80</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500 text-white space-y-1">
              <p className="font-extrabold text-sm">SOL/USD (+5.12%)</p>
              <p className="text-xs text-emerald-100">$184.30</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500 text-white space-y-1">
              <p className="font-extrabold text-sm">TSLA (+4.75%)</p>
              <p className="text-xs text-emerald-100">$248.50</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500 text-white space-y-1">
              <p className="font-extrabold text-sm">USOIL (-1.10%)</p>
              <p className="text-xs text-rose-100">$81.20</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
