import { useState } from 'react';
import { login, signup } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Fingerprint, ChevronLeft, ChevronRight, CheckCircle2, User, Building, Landmark, Coins, Briefcase } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup State
  const [signupStep, setSignupStep] = useState(1);
  const [signupData, setSignupData] = useState({
    firstName: '', middleName: '', lastName: '', username: '', dob: '', gender: '',
    email: '', phone: '', address: '', city: '', state: '', country: '', zip: '',
    accountType: 'checking', pin: '', confirmPin: '',
    password: '', confirmPassword: '', terms: false
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmSignupPassword, setShowConfirmSignupPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setSuccessMsg('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (signupData.pin !== signupData.confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (!signupData.terms) {
      setError('Please accept terms and conditions');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await signup(signupData.email, signupData.password);
      // Create initial account just in case so dashboard works
      try {
        await addDoc(collection(db, 'accounts'), {
          userId: userCredential.user.uid,
          accountNumber: '9424' + Math.floor(Math.random() * 1000000),
          balance: 0,
          currency: 'USD',
          type: signupData.accountType,
          status: 'active',
          createdAt: serverTimestamp()
        });
        await addDoc(collection(db, 'users'), {
           uid: userCredential.user.uid,
           firstName: signupData.firstName,
           lastName: signupData.lastName,
           email: signupData.email,
           phone: signupData.phone,
           address: signupData.address,
           createdAt: serverTimestamp()
        });
      } catch (dbErr) {
        console.error('Error creating user profile/account docs:', dbErr);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const updateSignupData = (field: string, value: any) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setError('');
    if (signupStep < 4) setSignupStep(prev => prev + 1);
  };
  const prevStep = () => setSignupStep(prev => prev - 1);

  const renderLogin = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
            <Landmark className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2 font-medium">Securely access your digital banking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50/80 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-900 outline-none"
              placeholder="name@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-900 outline-none pr-12"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              >
                {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               <span className="text-sm font-medium text-gray-600">Remember Me</span>
            </label>
            <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition" onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Or continue with</span></div>
          </div>

          <button
            type="button"
            className="w-full p-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
            onClick={() => alert('Biometric login feature coming soon!')}
          >
            <Fingerprint size={20} className="text-blue-600" />
            Login with Biometrics
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-medium">
            Don't have an account?{' '}
            <button type="button" className="text-blue-600 font-bold hover:underline" onClick={() => setIsLogin(false)}>
              Open an Account
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderSignupStep1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Legal First Name *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.firstName} onChange={e => updateSignupData('firstName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Middle Name</label>
          <input type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.middleName} onChange={e => updateSignupData('middleName', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Legal Last Name *</label>
        <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.lastName} onChange={e => updateSignupData('lastName', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Username *</label>
        <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.username} onChange={e => updateSignupData('username', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date of Birth *</label>
          <input required type="date" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.dob} onChange={e => updateSignupData('dob', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Gender</label>
          <select className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.gender} onChange={e => updateSignupData('gender', e.target.value)}>
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderSignupStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address *</label>
        <input required type="email" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.email} onChange={e => updateSignupData('email', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Phone Number *</label>
        <input required type="tel" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.phone} onChange={e => updateSignupData('phone', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Street Address *</label>
        <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.address} onChange={e => updateSignupData('address', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">City *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.city} onChange={e => updateSignupData('city', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">State / Province *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.state} onChange={e => updateSignupData('state', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">ZIP / Postal Code *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.zip} onChange={e => updateSignupData('zip', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Country *</label>
          <input required type="text" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={signupData.country} onChange={e => updateSignupData('country', e.target.value)} />
        </div>
      </div>
    </motion.div>
  );

  const renderSignupStep3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">Account Type *</label>
        <div className="space-y-3">
          {[
            { id: 'checking', label: 'Checking Account', desc: 'Perfect for daily transactions', icon: <Landmark size={20} /> },
            { id: 'savings', label: 'Savings Account', desc: 'Earn interest on deposits', icon: <Coins size={20} /> },
            { id: 'business', label: 'Business Account', desc: 'For corporate entities', icon: <Building size={20} /> }
          ].map(type => (
            <div
              key={type.id}
              onClick={() => updateSignupData('accountType', type.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                signupData.accountType === type.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${signupData.accountType === type.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${signupData.accountType === type.id ? 'text-blue-900' : 'text-gray-900'}`}>{type.label}</p>
                <p className="text-sm text-gray-500">{type.desc}</p>
              </div>
              {signupData.accountType === type.id && <CheckCircle2 className="text-blue-600" size={24} />}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Transaction PIN (4 digits) *</label>
        <input required type="password" maxLength={4} pattern="\d{4}" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-lg" value={signupData.pin} onChange={e => updateSignupData('pin', e.target.value.replace(/\D/g, ''))} placeholder="••••" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Confirm PIN *</label>
        <input required type="password" maxLength={4} pattern="\d{4}" className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-lg" value={signupData.confirmPin} onChange={e => updateSignupData('confirmPin', e.target.value.replace(/\D/g, ''))} placeholder="••••" />
      </div>
    </motion.div>
  );

  const renderSignupStep4 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Password *</label>
        <div className="relative">
          <input
            type={showSignupPassword ? 'text' : 'password'}
            required minLength={6}
            className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12"
            value={signupData.password}
            onChange={(e) => updateSignupData('password', e.target.value)}
          />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowSignupPassword(!showSignupPassword)}>
            {showSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Confirm Password *</label>
        <div className="relative">
          <input
            type={showConfirmSignupPassword ? 'text' : 'password'}
            required minLength={6}
            className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12"
            value={signupData.confirmPassword}
            onChange={(e) => updateSignupData('confirmPassword', e.target.value)}
          />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirmSignupPassword(!showConfirmSignupPassword)}>
            {showConfirmSignupPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      <div className="pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={signupData.terms} onChange={e => updateSignupData('terms', e.target.checked)} />
          <span className="text-sm text-gray-600">
            I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>, <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>, and consent to electronic disclosures.
          </span>
        </label>
      </div>
    </motion.div>
  );

  const renderSignup = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-xl mx-auto">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
            {signupStep === 1 ? <User className="text-white w-8 h-8" /> : 
             signupStep === 2 ? <Building className="text-white w-8 h-8" /> : 
             signupStep === 3 ? <Landmark className="text-white w-8 h-8" /> : 
             <Fingerprint className="text-white w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Your Account</h2>
          <p className="text-gray-500 mt-2 font-medium">
            {signupStep === 1 ? 'Step 1: Personal Information' :
             signupStep === 2 ? 'Step 2: Contact Details' :
             signupStep === 3 ? 'Step 3: Account Setup' : 'Step 4: Security'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${(signupStep / 4) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400">
            <span className={signupStep >= 1 ? 'text-blue-600' : ''}>Personal Info</span>
            <span className={signupStep >= 2 ? 'text-blue-600' : ''}>Contact Details</span>
            <span className={signupStep >= 3 ? 'text-blue-600' : ''}>Account Setup</span>
            <span className={signupStep >= 4 ? 'text-blue-600' : ''}>Security</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {error}
          </div>
        )}

        <form onSubmit={signupStep === 4 ? handleSignupSubmit : (e) => { e.preventDefault(); nextStep(); }}>
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {signupStep === 1 && <div key="s1">{renderSignupStep1()}</div>}
              {signupStep === 2 && <div key="s2">{renderSignupStep2()}</div>}
              {signupStep === 3 && <div key="s3">{renderSignupStep3()}</div>}
              {signupStep === 4 && <div key="s4">{renderSignupStep4()}</div>}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
            {signupStep > 1 && (
              <button type="button" onClick={prevStep} className="flex-1 p-4 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <ChevronLeft size={20} /> Previous
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] p-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${signupStep === 1 ? 'w-full' : ''}`}
            >
              {loading ? (
                 <span className="flex items-center gap-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Processing...
                 </span>
              ) : signupStep === 4 ? (
                <>Complete Registration <CheckCircle2 size={20} /></>
              ) : (
                <>Next Step <ChevronRight size={20} /></>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-medium">
            Already have an account?{' '}
            <button type="button" className="text-blue-600 font-bold hover:underline" onClick={() => setIsLogin(true)}>
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/5 -skew-y-6 transform origin-top-left -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3" />
      
      <AnimatePresence mode="wait">
        {isLogin ? <div key="login">{renderLogin()}</div> : <div key="signup">{renderSignup()}</div>}
      </AnimatePresence>
    </div>
  );
}
