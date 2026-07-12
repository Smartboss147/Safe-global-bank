import { Calculator, FileText, CheckCircle2 } from 'lucide-react';

export default function Loans() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Personal Loans</h2>
          <p className="text-gray-500 mt-1">Get funds quickly with competitive rates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Calculator size={32} />
          </div>
          <h3 className="font-bold text-lg mb-2">Loan Calculator</h3>
          <p className="text-gray-500 mb-6 flex-1">Estimate your monthly payments and see how much you can borrow.</p>
          <button className="w-full p-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
            Calculate Now
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-lg mb-2">Apply for a Loan</h3>
          <p className="text-gray-500 mb-6 flex-1">Rates as low as 5.99% APR. Get approved in minutes.</p>
          <button className="w-full p-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
            Start Application
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h3 className="font-bold text-gray-900 mb-4">Your Active Loans</h3>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-lg">Auto Loan</h4>
              <p className="text-sm text-gray-500">Account #8892-3321</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-md">
              <CheckCircle2 size={16} /> Current
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Remaining</p>
               <p className="font-bold text-lg">$14,520.00</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Next Payment</p>
               <p className="font-bold text-lg">$345.50</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Due Date</p>
               <p className="font-bold text-lg">Jul 28</p>
             </div>
             <div>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Interest Rate</p>
               <p className="font-bold text-lg">6.5%</p>
             </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>45% Paid Off</span>
            <span>Original: $25,000</span>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end gap-3">
             <button className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">View Details</button>
             <button className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition">Make Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
}
