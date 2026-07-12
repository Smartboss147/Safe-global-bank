import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Globe, Moon, Sun, User, CreditCard } from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false
  });
  
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon size={32} className="text-blue-900" />
        <h2 className="text-2xl font-bold">Account Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-gray-500" /> Profile Information
            </h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Profile updated'); }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" defaultValue="John" className="w-full p-2.5 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full p-2.5 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" defaultValue="john.doe@example.com" disabled className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Contact support to change your email address.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={20} className="text-gray-500" /> Preferences
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Currency</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-gray-900">Theme</p>
                  <p className="text-sm text-gray-500">Toggle dark mode</p>
                </div>
                <div 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${darkMode ? 'bg-slate-800' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all flex items-center justify-center ${darkMode ? 'left-6' : 'left-0.5'}`}>
                    {darkMode ? <Moon size={12} className="text-slate-800" /> : <Sun size={12} className="text-yellow-500" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={20} className="text-gray-500" /> Notifications
            </h3>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{key} Notifications</p>
                    <p className="text-xs text-gray-500">Receive updates via {key}.</p>
                  </div>
                  <div 
                    onClick={() => setNotifications({...notifications, [key]: !value})}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${value ? 'left-5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-gray-500" /> Connected Accounts
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div>
                  <p className="font-semibold text-sm">Stripe Account</p>
                  <p className="text-xs text-gray-500">Connected</p>
                </div>
                <button className="text-sm text-red-600 font-medium">Disconnect</button>
              </div>
              <button className="w-full p-3 border border-dashed border-gray-300 text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition">
                + Connect External Bank
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
