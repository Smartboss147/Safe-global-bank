import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import SpendingChart from './dashboard/SpendingChart';
import Transfers from './dashboard/Transfers';
import CryptoWallet from './dashboard/CryptoWallet';
import Cards from './dashboard/Cards';
import Payments from './dashboard/Payments';
import Savings from './dashboard/Savings';
import Investments from './dashboard/Investments';
import Loans from './dashboard/Loans';
import Settings from './dashboard/Settings';
import SecurityCenter from './dashboard/SecurityCenter';
import CustomerSupport from './dashboard/CustomerSupport';
import { 
  Menu, Bell, Eye, EyeOff, Activity, CreditCard, LayoutGrid, 
  Send, Globe, Download, HandCoins, Receipt, HelpCircle, LogOut, 
  ChevronLeft, Settings as SettingsIcon, Home, BarChart2, User, Wallet, History, X
} from 'lucide-react';

export default function Dashboard({ user }: { user: any }) {
  const [account, setAccount] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAccount = async () => {
    // Fetch account
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setAccountId(querySnapshot.docs[0].id);
      setAccount(querySnapshot.docs[0].data());
    }
    
    // Fetch user profile info if available
    const uq = query(collection(db, 'users'), where('uid', '==', user.uid));
    const uSnap = await getDocs(uq);
    if (!uSnap.empty) {
      setUserData(uSnap.docs[0].data());
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [user]);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAction = (tab: string) => {
    if (tab === 'logout') {
      signOut(auth);
    } else {
      setActiveTab(tab);
      setIsMenuOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HomeView account={account} accountId={accountId} showBalance={showBalance} setShowBalance={setShowBalance} userData={userData} currentTime={currentTime} greeting={greeting()} user={user} fetchAccount={fetchAccount} />;
      case 'transfers': return <div className="p-4"><Transfers user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'crypto': return <div className="p-4"><CryptoWallet user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'payments': return <div className="p-4"><Payments user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'cards': return <div className="p-4"><Cards user={user} account={account} /></div>;
      case 'savings': return <div className="p-4"><Savings user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'investments': return <div className="p-4"><Investments user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'loans': return <div className="p-4"><Loans user={user} account={account} fetchAccount={fetchAccount} /></div>;
      case 'security': return <div className="p-4"><SecurityCenter user={user} userData={userData} /></div>;
      case 'settings': return <div className="p-4"><Settings user={user} userData={userData} fetchAccount={fetchAccount} /></div>;
      case 'support': return <div className="p-4"><CustomerSupport user={user} /></div>;
      case 'stats': return <div className="p-4 space-y-6"><h2 className="text-2xl font-bold">Analytics</h2><SpendingChart /></div>;
      case 'history': return <div className="p-4"><TransactionHistory user={user} /></div>;
      default: return <HomeView account={account} accountId={accountId} showBalance={showBalance} setShowBalance={setShowBalance} userData={userData} currentTime={currentTime} greeting={greeting()} user={user} fetchAccount={fetchAccount} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50/50 pb-24 relative overflow-hidden shadow-2xl">
      {/* Top Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-transparent relative z-10">
        <div className="flex items-center gap-3">
          <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition" onClick={() => activeTab !== 'overview' && setActiveTab('overview')}>
            {activeTab !== 'overview' ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
          <div className="font-extrabold text-lg flex items-center gap-2">
            <span className="bg-gradient-to-br from-blue-700 to-indigo-800 text-transparent bg-clip-text">SAFE</span>
            <span className="text-gray-900">GLOBAL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition text-gray-700" onClick={() => setShowNotifications(true)}>
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-50"></span>
          </button>
          <button className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm" onClick={() => handleAction('settings')}>
            <img src={userData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.firstName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setShowNotifications(false)} />
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl z-[70] border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
               </div>
               <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                     <p className="text-sm font-bold text-gray-900 mb-1">New Login Detected</p>
                     <p className="text-xs text-gray-500">We noticed a new login from a Mac device in London.</p>
                     <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-wide">2 hours ago</p>
                  </div>
                  <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                     <p className="text-sm font-bold text-gray-900 mb-1">KYC Verification Completed</p>
                     <p className="text-xs text-gray-500">Your identity documents have been approved. You are now Level 3 verified.</p>
                     <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-wide">Yesterday</p>
                  </div>
                  <div className="p-4 hover:bg-gray-50 transition cursor-pointer">
                     <p className="text-sm font-bold text-gray-900 mb-1">Welcome to Safe Global</p>
                     <p className="text-xs text-gray-500">Thanks for joining! Explore our digital banking features.</p>
                     <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase tracking-wide">2 days ago</p>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Menu Modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)} />
            <motion.div initial={{ opacity: 0, y: '100%', scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: '100%', scale: 0.9 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-[2.5rem] z-50 p-6 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                    <img src={userData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.firstName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{userData ? `${userData.firstName} ${userData.lastName}` : 'User'}</h3>
                    <p className="text-sm text-gray-500">Account: {account ? account.accountNumber : 'Loading...'}</p>
                  </div>
                </div>
                <button className="text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                   Verify Account
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Banking Menu</h2>
                <p className="text-sm text-gray-500">Select an option to continue</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'overview', icon: <Home />, label: 'Home', color: 'bg-green-100 text-green-700' },
                  { id: 'history', icon: <Activity />, label: 'Activity', color: 'bg-yellow-100 text-yellow-700' },
                  { id: 'cards', icon: <CreditCard />, label: 'Cards', color: 'bg-green-100 text-green-700' },
                  { id: 'transfers', icon: <Send />, label: 'Transfer', color: 'bg-orange-100 text-orange-700' },
                  { id: 'transfers', icon: <Globe />, label: 'Int\'l Wire', color: 'bg-yellow-100 text-yellow-700' },
                  { id: 'payments', icon: <Download />, label: 'Deposit', color: 'bg-green-100 text-green-700' },
                  { id: 'loans', icon: <Wallet />, label: 'Loan', color: 'bg-orange-100 text-orange-700' },
                  { id: 'payments', icon: <Receipt />, label: 'IRS Refund', color: 'bg-green-100 text-green-700' },
                  { id: 'settings', icon: <SettingsIcon />, label: 'Settings', color: 'bg-green-100 text-green-700' },
                  { id: 'support', icon: <HelpCircle />, label: 'Support', color: 'bg-yellow-100 text-yellow-700' },
                  { id: 'logout', icon: <LogOut />, label: 'Logout', color: 'bg-red-50 text-red-600' }
                ].map((item, idx) => (
                  <button key={idx} onClick={() => handleAction(item.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl ${item.color.split(' ')[0]} transition-transform active:scale-95`}>
                    <div className={`mb-2 ${item.color.split(' ')[1]}`}>{item.icon}</div>
                    <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-200" />
        <div className="relative px-6 py-4 flex justify-between items-center">
          <button className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-blue-900' : 'text-gray-400'}`} onClick={() => setActiveTab('overview')}>
            <Home size={24} className={activeTab === 'overview' ? 'fill-blue-900/20' : ''} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-blue-900' : 'text-gray-400'}`} onClick={() => setActiveTab('stats')}>
            <BarChart2 size={24} />
            <span className="text-[10px] font-bold">Stats</span>
          </button>
          
          <div className="relative -top-6 flex flex-col items-center">
            <button onClick={() => setIsMenuOpen(true)} className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-gray-900/30 hover:scale-105 transition-transform active:scale-95">
              <LayoutGrid size={24} />
            </button>
          </div>

          <button className={`flex flex-col items-center gap-1 ${activeTab === 'cards' ? 'text-blue-900' : 'text-gray-400'}`} onClick={() => setActiveTab('cards')}>
            <CreditCard size={24} />
            <span className="text-[10px] font-bold">Cards</span>
          </button>
          <button className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-blue-900' : 'text-gray-400'}`} onClick={() => setActiveTab('settings')}>
            <User size={24} />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView({ account, accountId, showBalance, setShowBalance, userData, currentTime, greeting, user, fetchAccount }: any) {
  return (
    <div className="px-4 pb-6 space-y-6">
      {/* Balance Card */}
      <div className="bg-[#0A3D36] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#145C52]/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">{greeting}</p>
              <h2 className="text-lg font-bold">{userData ? `${userData.firstName} ${userData.lastName}` : 'Welcome Back'}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/90 font-medium font-mono tracking-wider">{currentTime.toLocaleTimeString([], { hour12: false })}</p>
            <p className="text-white/60 text-xs mt-0.5">{currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="relative z-10 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white/80 font-medium">Available Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white transition p-1">
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <h1 className="text-[2.5rem] font-bold tracking-tight">
            {account ? (showBalance ? `$${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD` : '••••••••') : 'Loading...'}
          </h1>
        </div>

        <div className="relative z-10 flex justify-between items-end">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md py-2 px-4 rounded-xl border border-white/10">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold">SH</span>
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Your Account Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm tracking-wider">{account ? account.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '****'}</p>
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold rounded flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-red-400" /> Inactive
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="px-4 py-1.5 bg-white text-[#0A3D36] text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform flex items-center gap-1 justify-center">
              <Activity size={12} /> Transactions
            </button>
            <button className="px-4 py-1.5 bg-[#1A6D60] text-white text-xs font-bold rounded-lg shadow-sm border border-white/20 active:scale-95 transition-transform flex items-center gap-1 justify-center">
              <CreditCard size={12} /> Top up
            </button>
          </div>
        </div>
      </div>

      {/* What would you like to do today? */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-1">What would you like to do today?</h3>
        <p className="text-gray-500 text-sm mb-6">Choose from our popular actions below</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mb-3">
              <Wallet size={24} />
            </div>
            <span className="font-bold text-gray-800">Account Info</span>
          </div>
          
          <div className="bg-[#E6F0A3] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-[#D1DF7B] text-[#55601C] rounded-full flex items-center justify-center mb-3">
              <Send size={24} />
            </div>
            <span className="font-bold text-gray-800">Send Money</span>
          </div>

          <div className="bg-[#E6F9EC] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform">
            <div className="text-green-600 mb-2">
              <span className="text-4xl font-light">+</span>
            </div>
            <span className="font-bold text-gray-800">More</span>
          </div>

          <div className="bg-[#F5F0FF] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-[#E6DDF5] text-[#6B44A8] rounded-full flex items-center justify-center mb-3">
              <History size={24} />
            </div>
            <span className="font-bold text-gray-800">History</span>
          </div>
        </div>
      </div>

      {/* Quick Transfer Forms */}
      {accountId && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Transfer & Deposit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <TransactionForm user={user} accountId={accountId} type="deposit" onSuccess={fetchAccount} />
             <TransactionForm user={user} accountId={accountId} type="withdrawal" onSuccess={fetchAccount} />
          </div>
        </div>
      )}
    </div>
  );
}
