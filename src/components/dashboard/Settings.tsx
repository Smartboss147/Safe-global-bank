import { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Globe, User, CreditCard, ChevronRight, Fingerprint, Lock, Smartphone, Camera, Save, X, AlertCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import KYCUpload from './KYCUpload';

export default function Settings({ user, userData, fetchAccount }: any) {
  const [notifications, setNotifications] = useState({ push: true, email: false, sms: true });
  const [isEditing, setIsEditing] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', address: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!userData || !userData.uid) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      await fetchAccount();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = userData?.kycStatus || 'Unverified';

  if (showKyc) {
    return (
      <div className="space-y-4">
        <button onClick={() => setShowKyc(false)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium mb-2">
          <X size={18} /> Back to Settings
        </button>
        <KYCUpload user={user} userData={userData} onComplete={() => {
          fetchAccount();
          setShowKyc(false);
        }} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden min-h-[80vh]">
      <div className="bg-[#0A3D36] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="w-24 h-24 mx-auto rounded-full bg-white/10 p-1 mb-4 relative z-10 group cursor-pointer">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative">
            <img src={userData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.firstName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera className="text-white" size={24} />
            </div>
          </div>
          {kycStatus === 'Verified' ? (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <ShieldCheck size={16} className="text-white" />
            </button>
          ) : (
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
              <AlertCircle size={16} className="text-white" />
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white relative z-10">{userData?.firstName} {userData?.lastName}</h2>
        <p className="text-white/70 text-sm mb-4 relative z-10">{user?.email}</p>
        
        <div 
          onClick={() => kycStatus !== 'Verified' && setShowKyc(true)}
          className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20 relative z-10 ${kycStatus !== 'Verified' ? 'cursor-pointer hover:bg-white/20' : ''}`}
        >
          {kycStatus === 'Verified' ? 'KYC Verified Level 3' : kycStatus === 'Pending' ? 'KYC Pending Review' : 'Complete KYC Verification'}
          {kycStatus !== 'Verified' && <ChevronRight size={14} />}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Personal Information */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personal Information</h3>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">First Name</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Last Name</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Home Address</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="pt-2">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    {loading ? 'Saving...' : <><Save size={18} /> Save Profile</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Full Name</span>
                  <span className="font-semibold text-gray-900">{userData?.firstName} {userData?.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Phone</span>
                  <span className="font-semibold text-gray-900">{userData?.phone || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Address</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%]">{userData?.address || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Date of Birth</span>
                  <span className="font-semibold text-gray-900">May 14, 1988</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Security</h3>
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100" onClick={() => alert("Check Security Center to change password.")}>
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
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100" onClick={() => {
                 const current = userData?.biometricLogin || false;
                 updateDoc(doc(db, 'users', user.uid), { biometricLogin: !current });
                 fetchAccount();
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Fingerprint size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Biometric Login</p>
                  <p className="text-xs text-gray-500">FaceID / TouchID</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${userData?.biometricLogin ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${userData?.biometricLogin ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition" onClick={() => alert("Check Security Center for 2FA setup.")}>
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
