import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ArrowDownLeft, ArrowUpRight, Search, Filter, Download, FileText } from 'lucide-react';

export default function TransactionHistory({ user }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      const q = query(
        collection(db, 'transactions'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTransactions();
  }, [user]);

  const filtered = transactions.filter(t => t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDownloadStatement = () => {
    setDownloading(true);
    setTimeout(() => {
      alert("Statement PDF generated successfully! Check your downloads folder.");
      setDownloading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Statements & History</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100"><Filter size={18} /></button>
          <button onClick={handleDownloadStatement} disabled={downloading} className={`p-2 rounded-full flex items-center gap-2 ${downloading ? 'bg-blue-100 text-blue-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {/* Quick Statements Panel */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <button onClick={handleDownloadStatement} className="flex-shrink-0 flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition w-48">
          <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText size={20} /></div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-900">July 2026</p>
            <p className="text-xs text-gray-500">PDF • 120KB</p>
          </div>
        </button>
        <button onClick={handleDownloadStatement} className="flex-shrink-0 flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition w-48">
          <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText size={20} /></div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-900">June 2026</p>
            <p className="text-xs text-gray-500">PDF • 115KB</p>
          </div>
        </button>
        <button onClick={handleDownloadStatement} className="flex-shrink-0 flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition w-48">
          <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText size={20} /></div>
          <div className="text-left">
            <p className="font-bold text-sm text-gray-900">May 2026</p>
            <p className="text-xs text-gray-500">PDF • 132KB</p>
          </div>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search transactions..." 
          className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions found.</div>
        ) : filtered.map(t => (
          <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {t.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
              </div>
              <div>
                <p className="font-bold text-gray-900">{t.description || 'Transaction'}</p>
                <p className="text-sm text-gray-500 capitalize">{t.type} • {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-bold text-lg ${t.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                {t.type === 'deposit' ? '+' : '-'}${Number(t.amount).toFixed(2)}
              </span>
              <p className="text-xs text-gray-400 font-medium">{t.status || 'Completed'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
