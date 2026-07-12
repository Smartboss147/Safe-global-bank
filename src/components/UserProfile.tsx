import { useState } from 'react';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    kycStatus: 'Pending',
  });

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="p-3 bg-gray-50 rounded-lg">{profile.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="p-3 bg-gray-50 rounded-lg">{profile.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">KYC Status</label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className={`w-3 h-3 rounded-full ${profile.kycStatus === 'Verified' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <p>{profile.kycStatus}</p>
          </div>
        </div>
        <button className="w-full p-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition" onClick={() => alert('KYC Verification and Document Upload coming soon!')}>
          Upload ID / Complete KYC
        </button>
      </div>
    </div>
  );
}
