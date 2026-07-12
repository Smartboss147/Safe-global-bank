import { Smartphone, Zap, Wifi, QrCode, SplitSquareHorizontal, UserPlus } from 'lucide-react';

export default function Payments() {
  const actions = [
    { id: 'mobile', title: 'Airtime', icon: <Smartphone size={24} />, desc: 'Top up mobile number' },
    { id: 'data', title: 'Data Bundle', icon: <Wifi size={24} />, desc: 'Buy internet data' },
    { id: 'utility', title: 'Utility Bills', icon: <Zap size={24} />, desc: 'Pay electricity, water, etc.' },
    { id: 'qr', title: 'Scan to Pay', icon: <QrCode size={24} />, desc: 'Pay merchants via QR' },
    { id: 'request', title: 'Request Money', icon: <UserPlus size={24} />, desc: 'Request from contacts' },
    { id: 'split', title: 'Split Bill', icon: <SplitSquareHorizontal size={24} />, desc: 'Share expenses with friends' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payments & Services</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button key={action.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition text-left flex flex-col gap-4 group">
            <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              {action.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Payees</h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]">
              <div className="w-14 h-14 bg-gray-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-500">
                P{i}
              </div>
              <p className="text-sm font-medium">Person {i}</p>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]">
            <div className="w-14 h-14 bg-blue-50 rounded-full border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-600">
              <UserPlus size={20} />
            </div>
            <p className="text-sm font-medium text-blue-600">Add New</p>
          </div>
        </div>
      </div>
    </div>
  );
}
