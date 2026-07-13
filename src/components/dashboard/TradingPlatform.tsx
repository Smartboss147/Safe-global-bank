import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

const mockCandleData = [
  { time: '09:00', open: 150, close: 152, high: 155, low: 148 },
  { time: '10:00', open: 152, close: 156, high: 158, low: 150 },
  { time: '11:00', open: 156, close: 154, high: 157, low: 153 },
  { time: '12:00', open: 154, close: 159, high: 160, low: 152 },
  { time: '13:00', open: 159, close: 162, high: 165, low: 158 },
  { time: '14:00', open: 162, close: 157, high: 163, low: 155 },
  { time: '15:00', open: 157, close: 166, high: 168, low: 156 },
].map(d => ({
  ...d,
  openClose: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
  isUp: d.close > d.open
}));

export default function TradingPlatform({ user, account }: any) {
  const [asset, setAsset] = useState('AAPL');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'trades'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'trades'), {
        userId: user.uid,
        accountId: account?.id || null,
        asset,
        type,
        amount: Number(amount),
        price: 166.00, // Mock current price
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setAmount('');
      alert(`Trade submitted! Waiting for admin settlement.`);
    } catch (error) {
      console.error("Error submitting trade: ", error);
      alert("Failed to submit trade.");
    } finally {
      setLoading(false);
    }
  };

  const CustomCandle = (props: any) => {
    const { x, y, width, height, isUp } = props;
    const color = isUp ? '#22c55e' : '#ef4444';
    return (
      <g>
        {/* Wick (mocked since we don't have exact Y scales for high/low easily in this payload) */}
        <line x1={x + width / 2} y1={y - 10} x2={x + width / 2} y2={y + height + 10} stroke={color} strokeWidth={2} />
        {/* Body */}
        <rect x={x} y={y} width={width} height={height || 2} fill={color} />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Trading Platform</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['AAPL', 'TSLA', 'GOOGL', 'BTC'].map(a => (
            <button 
              key={a}
              onClick={() => setAsset(a)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${asset === a ? 'bg-white shadow-sm text-blue-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-gray-500 font-medium mb-1">{asset} / USD</p>
              <h3 className="text-3xl font-bold text-gray-900">$166.00</h3>
            </div>
            <div className="text-right">
              <span className="flex items-center text-green-500 font-bold bg-green-50 px-2 py-1 rounded-md text-sm">
                <TrendingUp size={16} className="mr-1" /> +2.4% Today
              </span>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCandleData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl border border-gray-800">
                          <p className="font-bold mb-2">{data.time}</p>
                          <p>Open: ${data.open}</p>
                          <p>High: ${data.high}</p>
                          <p>Low: ${data.low}</p>
                          <p>Close: ${data.close}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="openClose" shape={<CustomCandle />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Order Entry</h3>
          
          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Asset</label>
              <input type="text" value={asset} disabled className="w-full p-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl font-bold" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Shares / Amount</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="0.00" 
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-blue-700 font-medium">Estimated Total</span>
                <span className="font-bold text-blue-900">${amount ? (Number(amount) * 166).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">Available Buying Power</span>
                <span className="font-bold text-blue-800">${account?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={() => handleTrade('buy')}
              disabled={loading}
              className="py-3.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              Buy {asset}
            </button>
            <button 
              onClick={() => handleTrade('sell')}
              disabled={loading}
              className="py-3.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              Sell {asset}
            </button>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Asset</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Price</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No recent orders.</td>
                </tr>
              ) : trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-600 whitespace-nowrap">
                    {trade.createdAt?.toDate ? new Date(trade.createdAt.toDate()).toLocaleString() : 'Just now'}
                  </td>
                  <td className="p-4 font-bold text-gray-900">{trade.asset}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold uppercase ${trade.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{trade.amount}</td>
                  <td className="p-4 text-gray-600">${trade.price?.toFixed(2)}</td>
                  <td className="p-4">
                    {trade.status === 'pending' ? (
                      <span className="inline-flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-bold">
                        <Clock size={12} className="mr-1" /> Pending Settlement
                      </span>
                    ) : trade.status === 'completed' ? (
                      <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold">
                        <CheckCircle size={12} className="mr-1" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold">
                        <XCircle size={12} className="mr-1" /> Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
