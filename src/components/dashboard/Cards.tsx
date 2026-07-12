import { CreditCard, Snowflake, Settings2, Eye } from 'lucide-react';

export default function Cards() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Cards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Virtual Card */}
        <div className="bg-gradient-to-tr from-blue-900 to-blue-600 p-6 rounded-2xl shadow-lg text-white aspect-[1.6] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-20">
             <CreditCard size={100} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <p className="font-bold tracking-widest">SAFE GLOBAL</p>
            <span className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">VIRTUAL</span>
          </div>
          <div className="relative z-10 space-y-4">
            <p className="font-mono text-xl tracking-widest">**** **** **** 4021</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-blue-200">Cardholder Name</p>
                <p className="font-semibold uppercase tracking-wider">John Doe</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Expiry</p>
                <p className="font-semibold">12/28</p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Card */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-700 p-6 rounded-2xl shadow-lg text-white aspect-[1.6] flex flex-col justify-between relative overflow-hidden">
           <div className="flex justify-between items-start relative z-10">
            <p className="font-bold tracking-widest">SAFE GLOBAL</p>
            <span className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">PHYSICAL</span>
          </div>
          <div className="relative z-10 space-y-4">
            <p className="font-mono text-xl tracking-widest">**** **** **** 8829</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-300">Cardholder Name</p>
                <p className="font-semibold uppercase tracking-wider">John Doe</p>
              </div>
              <div>
                <p className="text-xs text-slate-300">Expiry</p>
                <p className="font-semibold">05/29</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Card Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition gap-2 text-gray-700">
            <Eye size={24} />
            <span className="text-sm font-semibold">Show Details</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition gap-2 text-gray-700">
            <Snowflake size={24} />
            <span className="text-sm font-semibold">Freeze Card</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition gap-2 text-gray-700">
            <Settings2 size={24} />
            <span className="text-sm font-semibold">Limits</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition gap-2 text-gray-700">
            <CreditCard size={24} />
            <span className="text-sm font-semibold">Replace</span>
          </button>
        </div>
      </div>

       <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Security Controls</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div>
              <p className="font-semibold">Online Payments</p>
              <p className="text-sm text-gray-500">Allow card to be used for internet purchases</p>
            </div>
            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div>
              <p className="font-semibold">ATM Withdrawals</p>
              <p className="text-sm text-gray-500">Allow cash withdrawals at ATMs</p>
            </div>
            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
            </div>
          </div>
          <div className="flex justify-between items-center p-4">
            <div>
              <p className="font-semibold">International Payments</p>
              <p className="text-sm text-gray-500">Allow transactions in foreign countries</p>
            </div>
            <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
