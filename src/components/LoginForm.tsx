import { useState } from 'react';
import { login, signup } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Login started');
    try {
      if (isLogin) {
        await login(email, password);
        console.log('Authentication successful');
      } else {
        await signup(email, password);
        console.log('Authentication successful');
      }
      console.log('Redirecting to dashboard');
      navigate('/');
    } catch (error: any) {
      console.error('Authentication failed with error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p className="text-gray-500 mb-8">{isLogin ? 'Securely access your account.' : 'Join our global community.'}</p>
      {error && <p className="text-red-500 mb-4 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input type="email" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex justify-end mt-2">
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => alert('Password reset feature coming soon!')}>Forgot Password?</button>
        </div>
        <button type="submit" disabled={loading} className="w-full p-3 bg-blue-900 text-white rounded-lg font-semibold text-lg hover:bg-blue-800 transition disabled:bg-gray-400">
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </button>
        {isLogin && (
          <button type="button" className="w-full p-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition" onClick={() => alert('Biometric login feature coming soon!')}>
            Login with Biometrics (FaceID / Fingerprint)
          </button>
        )}
      </form>
      <div className="mt-6 text-center space-y-2">
        <button type="button" className="text-blue-700 font-medium hover:underline" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Open an Account' : 'Have an account? Sign In'}
        </button>
        <p className="text-xs text-gray-400">2FA and Email Verification are enforced for all accounts.</p>
      </div>
    </div>
  );
}
