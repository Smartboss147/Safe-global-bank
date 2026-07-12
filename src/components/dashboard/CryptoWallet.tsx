import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Copy, QrCode, ChevronDown } from 'lucide-react';

export default function CryptoWallet() {
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.045, price: 64200.50, change: 2.4, networks: ['Bitcoin (BTC)', 'BNB Smart Chain (BEP20)'] },
    { symbol: 'ETH', name: 'Ethereum', balance: 0.5, price: 3450.20, change: -1.2, networks: ['Ethereum (ERC20)', 'Arbitrum One', 'Optimism', 'Base'] },
    { symbol: 'USDC', name: 'USD Coin', balance: 1200.00, price: 1.00, change: 0.0, networks: ['Ethereum (ERC20)', 'Solana', 'Polygon', 'Arbitrum One'] },
    { symbol: 'SOL', name: 'Solana', balance: 14.2, price: 145.30, change: 5.6, networks: ['Solana'] }
  ];

  const totalValue = assets.reduce((sum, asset) => sum + (asset.balance * asset.price), 0);

  const [selectedReceiveAsset, setSelectedReceiveAsset] = useState(assets[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(assets[0].networks[0]);

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = assets.find(a => a.symbol === e.target.value) || assets[0];
    setSelectedReceiveAsset(asset);
    setSelectedNetwork(asset.networks[0]);
  };

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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Deposit Crypto</h3>
        <div className="max-w-md mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
              <div className="relative">
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedReceiveAsset.symbol}
                  onChange={handleAssetChange}
                >
                  {assets.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
              <div className="relative">
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                >
                  {selectedReceiveAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>

          <div className="p-6 border border-gray-200 rounded-xl text-center space-y-4 bg-gray-50">
            <QrCode size={160} className="mx-auto text-gray-800" />
            <div>
              <p className="text-sm text-gray-500 mb-2">Your {selectedReceiveAsset.symbol} Address</p>
              <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                <p className="font-mono text-sm font-semibold truncate max-w-[200px]">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                <button className="text-gray-400 hover:text-blue-600"><Copy size={16} /></button>
              </div>
            </div>
            <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg text-left">
              <span className="font-bold">Warning:</span> Only send {selectedReceiveAsset.name} ({selectedReceiveAsset.symbol}) to this address over the <span className="font-bold">{selectedNetwork}</span> network. Sending other assets or using a different network will result in permanent loss.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
