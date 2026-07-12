import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Copy, QrCode } from 'lucide-react';

export default function CryptoWallet() {
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.045, price: 64200.50, change: 2.4 },
    { symbol: 'ETH', name: 'Ethereum', balance: 0.5, price: 3450.20, change: -1.2 },
    { symbol: 'USDC', name: 'USD Coin', balance: 1200.00, price: 1.00, change: 0.0 },
    { symbol: 'SOL', name: 'Solana', balance: 14.2, price: 145.30, change: 5.6 }
  ];

  const totalValue = assets.reduce((sum, asset) => sum + (asset.balance * asset.price), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Crypto Portfolio</p>
        <p className="text-4xl mt-2 font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        
        <div className="flex gap-4 mt-6">
          <button className="flex-1 p-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition flex items-center justify-center gap-2">
            <ArrowDownLeft size={18} /> Receive
          </button>
          <button className="flex-1 p-3 bg-slate-800 rounded-lg font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2">
            <ArrowUpRight size={18} /> Send
          </button>
          <button className="flex-1 p-3 bg-slate-800 rounded-lg font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2">
            Swap
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Assets</h3>
        <div className="space-y-4">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                  {asset.symbol.substring(0, 1)}
                </div>
                <div>
                  <h4 className="font-bold">{asset.name}</h4>
                  <p className="text-sm text-gray-500">{asset.balance} {asset.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">${(asset.balance * asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-sm ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.change >= 0 ? '+' : ''}{asset.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Deposit Crypto</h3>
        <div className="p-4 border border-gray-200 rounded-xl text-center space-y-4 max-w-sm mx-auto">
          <QrCode size={120} className="mx-auto text-gray-800" />
          <div>
            <p className="text-sm text-gray-500">Your BTC Address</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="font-mono text-sm font-semibold truncate max-w-[200px]">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
              <button className="text-gray-400 hover:text-blue-600"><Copy size={16} /></button>
            </div>
          </div>
          <p className="text-xs text-red-500 font-medium">Only send Bitcoin (BTC) to this address over the Bitcoin network.</p>
        </div>
      </div>
    </div>
  );
}
