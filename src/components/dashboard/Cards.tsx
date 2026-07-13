import { CreditCard, Snowflake, Settings2, Eye, ShieldAlert, Plane, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function Cards() {
  const [activeCard, setActiveCard] = useState<'virtual' | 'physical'>('virtual');
  
  const [toggles, setToggles] = useState({
    online: true,
    atm: true,
    international: false,
    frozen: false
  });

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden min-h-[80vh] pb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Cards</h2>
        
        {/* Card Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button 
            onClick={() => setActiveCard('virtual')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeCard === 'virtual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Virtual
          </button>
          <button 
            onClick={() => setActiveCard('physical')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeCard === 'physical' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Physical
          </button>
        </div>

        {/* Card Display */}
        <div className="relative mb-8">
          <div className={`p-6 rounded-[2rem] shadow-2xl text-white aspect-[1.6] flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${activeCard === 'virtual' ? 'bg-gradient-to-br from-blue-600 to-indigo-800 shadow-blue-900/20' : 'bg-gradient-to-br from-gray-900 to-gray-800 shadow-gray-900/20'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="font-extrabold tracking-widest text-white/90">SAFE GLOBAL</div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest">
                {activeCard.toUpperCase()}
              </span>
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl tracking-[0.2em] font-medium opacity-90 drop-shadow-sm">
                  {activeCard === 'virtual' ? '**** **** **** 4021' : '**** **** **** 8829'}
                </p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">Cardholder</p>
                  <p className="font-bold tracking-wide">JOHN DOE</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mb-1">Expires</p>
                  <p className="font-bold tracking-wide">{activeCard === 'virtual' ? '12/28' : '05/29'}</p>
                </div>
                <div className="w-10 h-6">
                  {/* Master card logo mock */}
                  <div className="relative w-full h-full">
                    <div className="absolute right-4 w-6 h-6 bg-red-500/80 rounded-full mix-blend-multiply" />
                    <div className="absolute right-0 w-6 h-6 bg-yellow-500/80 rounded-full mix-blend-multiply" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 text-gray-700">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
              <Eye size={18} />
            </div>
            <span className="text-xs font-bold">Details</span>
          </button>
          <button 
            onClick={() => setToggles({...toggles, frozen: !toggles.frozen})}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 text-gray-700"
          >
            <div className={`w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center ${toggles.frozen ? 'text-blue-500 bg-blue-50' : 'text-cyan-600'}`}>
              <Snowflake size={18} />
            </div>
            <span className="text-xs font-bold">{toggles.frozen ? 'Unfreeze' : 'Freeze'}</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 text-gray-700">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600">
              <Settings2 size={18} />
            </div>
            <span className="text-xs font-bold">Limits</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition active:scale-95 text-gray-700">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500">
              <ShieldAlert size={18} />
            </div>
            <span className="text-xs font-bold">Replace</span>
          </button>
        </div>

        {/* Security Controls */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Security Controls</h3>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Online Payments</p>
                  <p className="text-xs text-gray-500">Internet purchases</p>
                </div>
              </div>
              <div 
                onClick={() => setToggles({...toggles, online: !toggles.online})}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner ${toggles.online ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${toggles.online ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">ATM Withdrawals</p>
                  <p className="text-xs text-gray-500">Cash at ATMs</p>
                </div>
              </div>
              <div 
                onClick={() => setToggles({...toggles, atm: !toggles.atm})}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner ${toggles.atm ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${toggles.atm ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Plane size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">International</p>
                  <p className="text-xs text-gray-500">Foreign countries</p>
                </div>
              </div>
              <div 
                onClick={() => setToggles({...toggles, international: !toggles.international})}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner ${toggles.international ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${toggles.international ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
