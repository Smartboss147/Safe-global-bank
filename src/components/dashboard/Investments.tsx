import { TrendingUp, LineChart, PieChart } from 'lucide-react';

export default function Investments() {
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, shares: 10, change: 1.2 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, shares: 5, change: -0.5 },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', price: 475.20, shares: 3.5, change: 0.8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Investments</h2>
          <p className="text-gray-500 mt-1">Build wealth for the long term</p>
        </div>
        <button className="bg-blue-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
          Trade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg lg:col-span-1">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Portfolio Value</p>
          <p className="text-4xl mt-2 font-bold">$5,624.75</p>
          <p className="text-green-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp size={16} /> +$342.50 (6.4%) All Time
          </p>
          <div className="mt-8 space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
               <span className="flex-1 text-sm text-slate-300">Technology</span>
               <span className="font-medium">65%</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
               <span className="flex-1 text-sm text-slate-300">ETFs</span>
               <span className="font-medium">25%</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
               <span className="flex-1 text-sm text-slate-300">Cash</span>
               <span className="font-medium">10%</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center justify-center min-h-[200px] text-center">
             <LineChart size={48} className="text-gray-300 mb-4" />
             <p className="text-gray-500">Advanced Charting temporarily unavailable.</p>
             <button className="mt-4 text-blue-600 font-medium hover:underline">Refresh Data</button>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Your Positions</h3>
             <div className="space-y-4">
               {stocks.map((stock) => (
                 <div key={stock.symbol} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-lg flex items-center justify-center font-bold text-sm">
                       {stock.symbol}
                     </div>
                     <div>
                       <h4 className="font-bold">{stock.name}</h4>
                       <p className="text-sm text-gray-500">{stock.shares} shares</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold">${(stock.price * stock.shares).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                     <p className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {stock.change >= 0 ? '+' : ''}{stock.change}%
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
