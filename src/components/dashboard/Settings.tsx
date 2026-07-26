import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Bell, ChevronRight, Fingerprint, Lock, Smartphone, Camera, Save, X, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import KYCUpload from './KYCUpload';
import { getUserDisplayName, getUserPhotoURL, compressImage, saveUserProfile } from '../../utils/profile';

export default function Settings({ user, userData, fetchAccount }: any) {
  const [notifications, setNotifications] = useState({ push: true, email: false, sms: true });
  const [isEditing, setIsEditing] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', address: '', displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.first_name || userData.firstName || '',
        lastName: userData.last_name || userData.lastName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        displayName: userData.display_name || userData.displayName || ''
      });
    }
  }, [userData]);

  const getFormattedDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return 'N/A';
    }
  };

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    setUploadingPhoto(true);
    setMsg({ type: '', text: '' });

    try {
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      
      await saveUserProfile(user.id, user.email, {
        photo_url: compressedDataUrl,
        photoURL: compressedDataUrl,
        avatar_url: compressedDataUrl
      });

      if (fetchAccount) {
        await fetchAccount();
      }

      setMsg({ type: 'success', text: 'Profile picture updated successfully!' });
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setMsg({ type: 'error', text: 'Failed to update profile picture.' });
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const computedDisplayName = formData.displayName.trim() || `${formData.firstName} ${formData.lastName}`.trim();
      
      await saveUserProfile(user.id, user.email, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        display_name: computedDisplayName,
        displayName: computedDisplayName
      });

      if (fetchAccount) {
        await fetchAccount();
      }

      setIsEditing(false);
      setMsg({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (error: any) {
      console.error("Error updating profile", error);
      setMsg({ type: 'error', text: 'Failed to update profile details.' });
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = userData?.kyc_status || 'Unverified';
  const displayName = getUserDisplayName(userData, user);
  const photoUrl = getUserPhotoURL(userData, user);

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
      {/* Hidden File Input for Profile Picture Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      <div className="bg-[#0A3D36] p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Profile Avatar Container */}
        <div 
          onClick={handlePhotoSelect}
          className="w-28 h-28 mx-auto rounded-full bg-white/10 p-1 mb-3 relative z-10 group cursor-pointer shadow-lg"
          title="Click to change profile picture"
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white relative bg-slate-800">
            <img 
              src={photoUrl} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera className="text-white" size={26} />
               <span className="text-[10px] text-white font-bold mt-1 uppercase tracking-wider">Change Photo</span>
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

        {/* Upload Button under avatar */}
        <div className="mb-4 relative z-10">
          <button 
            type="button"
            onClick={handlePhotoSelect}
            disabled={uploadingPhoto}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 transition"
          >
            {uploadingPhoto ? (
              <span>Uploading photo...</span>
            ) : (
              <>
                <Upload size={13} />
                <span>Upload Picture</span>
              </>
            )}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-white relative z-10">{displayName}</h2>
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
        {/* Status Message */}
        {msg.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${msg.type === 'error' ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
            {msg.type === 'error' ? <AlertCircle className="shrink-0" size={20} /> : <CheckCircle2 className="shrink-0" size={20} />}
            <p className="text-sm font-semibold">{msg.text}</p>
          </div>
        )}

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
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Display Name</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0A3D36]" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="e.g. John Doe" />
                </div>
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
                  <span className="text-gray-500 text-sm">Display Name</span>
                  <span className="font-semibold text-gray-900">{userData?.display_name || userData?.displayName || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Full Name</span>
                  <span className="font-semibold text-gray-900">{displayName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Phone</span>
                  <span className="font-semibold text-gray-900">{userData?.phone || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Address</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%]">{userData?.address || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Account Created</span>
                  <span className="font-semibold text-gray-900">{getFormattedDate(userData?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">KYC Status</span>
                  <span className={`font-semibold capitalize px-2.5 py-0.5 rounded-full text-xs ${
                    kycStatus.toLowerCase() === 'verified' ? 'bg-green-100 text-green-800' :
                    kycStatus.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{kycStatus}</span>
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
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100" onClick={async () => {
                 const current = userData?.biometric_login || false;
                 await saveUserProfile(user.id, user.email, { biometric_login: !current, biometricLogin: !current });
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
              <div className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${userData?.biometricLogin || userData?.biometric_login ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${userData?.biometricLogin || userData?.biometric_login ? 'right-0.5' : 'left-0.5'}`}></div>
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
