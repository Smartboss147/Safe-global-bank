import { useState } from 'react';
import { ShieldCheck, Smartphone, Key, History, AlertTriangle, Monitor, Lock } from 'lucide-react';

export default function SecurityCenter() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const activeSessions = [
    { id: 1, device: 'MacBook Pro 16"', location: 'London, UK', ip: '192.168.1.1', time: 'Active now', icon: <Monitor size={20} /> },
    { id: 2, device: 'iPhone 13 Pro', location: 'London, UK', ip: '192.168.1.5', time: 'Last active 2 hours ago', icon: <Smartphone size={20} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={32} className="text-blue-900" />
        <h2 className="text-2xl font-bold">Security Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Key size={20} className="text-gray-500" /> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-gray-600 mb-6">Add an extra layer of security to your account by enabling 2FA. You will need to enter a code from an authenticator app when signing in.</p>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">Authenticator App</p>
                <p className="text-sm text-gray-500">Google Authenticator, Authy, etc.</p>
              </div>
              <div 
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${twoFactorEnabled ? 'left-6' : 'left-0.5'}`}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} className="text-gray-500" /> Change Password
            </h3>
            <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); alert('Password updated successfully!'); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <button type="submit" className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition">
                Update Password
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History size={20} className="text-gray-500" /> Active Sessions
            </h3>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {session.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{session.device}</p>
                    <p className="text-xs text-gray-500">{session.location} • {session.ip}</p>
                    <p className="text-xs text-green-600 font-medium mt-1">{session.time}</p>
                  </div>
                  <button className="text-xs text-red-600 font-medium hover:underline">Log Out</button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 p-2 text-sm text-center text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition">
              Log out of all other devices
            </button>
          </div>

          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} /> Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-4">If you suspect suspicious activity, you can temporarily lock your account.</p>
            <button className="w-full p-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition" onClick={() => alert('Account locking initiated.')}>
              Lock Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
