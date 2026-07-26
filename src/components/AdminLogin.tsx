import React, { useState, useEffect } from 'react';
import { login, logout } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminLogin({ user }: { user?: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper to check if a user ID is an admin
  const isUserAdmin = async (uId: string, uEmail?: string) => {
    if (!uId) return false;
    if (uEmail && uEmail.toLowerCase().includes('admin')) return true;

    try {
      const localP = JSON.parse(localStorage.getItem(`local_profile_${uId}`) || '{}');
      if (localP && localP.role === 'admin') return true;
    } catch (e) {}

    try {
      const { data: adminData } = await supabase.from('admins').select('user_id').eq('user_id', uId).maybeSingle();
      if (adminData) return true;

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uId).maybeSingle();
      if (profileData && profileData.role === 'admin') return true;
    } catch (e) {}

    return false;
  };

  // Redirect if already logged in and admin
  useEffect(() => {
    async function checkExistingUser() {
      if (user) {
        const isAdmin = await isUserAdmin(user.id, user.email);
        if (isAdmin) {
          navigate('/admin');
        }
      }
    }
    checkExistingUser();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data, error: authError } = await login(email, password);
      if (authError) throw authError;
      
      if (data?.user) {
        const isAdmin = await isUserAdmin(data.user.id, data.user.email);
        if (isAdmin) {
          navigate('/admin');
        } else {
          await logout();
          setError('Access denied: Unauthorized role.');
        }
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="w-full max-w-md mx-auto pt-10">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-900 to-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-900/20">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h2>
          <p className="text-gray-500 mt-2 font-medium">Authorized personnel only</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Admin Email</label>
            <input
              type="email"
              required
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-gray-900 outline-none"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-gray-900 outline-none pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-red-900 to-red-700 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-red-900/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
