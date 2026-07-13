import { useState } from 'react';
import { ShieldCheck, Bell, Globe, User, CreditCard, ChevronRight, Fingerprint, Lock, Smartphone } from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    sms: true,
  });

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden min-h-[80vh]">
      {/* Profile Header */}
      <div className="bg-[#0A3D36] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="w-24 h-24 mx-auto rounded-full bg-white/10 p-1 mb-4 relative z-10">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={16} className="text-white" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-white relative z-10">John Doe</h2>
        <p className="text-white/70 text-sm mb-4 relative z-10">john.doe@example.com</p>
        
        <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20 relative z-10">
          KYC Verified Level 3
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Account Details */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Account Details</h3>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Personal Information</p>
                  <p className="text-xs text-gray-500">Name, DOB, Address</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Linked Accounts</p>
                  <p className="text-xs text-gray-500">Banks, Cards, Limits</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">KYC & Verification</p>
                  <p className="text-xs text-gray-500">Identity Documents</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Security</h3>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Fingerprint size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Biometric Login</p>
                  <p className="text-xs text-gray-500">FaceID / TouchID</p>
                </div>
              </div>
              <div className="w-12 h-6 rounded-full bg-green-500 relative transition-colors shadow-inner">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">2-Factor Auth (2FA)</p>
                  <p className="text-xs text-gray-500">Authenticator App</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Preferences</h3>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
             {Object.entries(notifications).map(([key, value], idx) => (
                <div key={key} className={`flex items-center justify-between p-4 ${idx !== 2 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                      <Bell size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 capitalize">{key} Notifications</p>
                      <p className="text-xs text-gray-500">Alerts & marketing</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setNotifications({...notifications, [key]: !value})}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner ${value ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${value ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
