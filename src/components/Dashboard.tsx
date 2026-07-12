import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
import { ArrowRightLeft, CreditCard, LayoutDashboard, Settings as SettingsIcon, ShieldCheck, Wallet, PieChart, Coins, Send, Receipt, Banknote, PiggyBank, Briefcase, HandCoins, HelpCircle, User } from 'lucide-react';

export default function Dashboard({ user }: { user: any }) {
  const [account, setAccount] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAccount = async () => {
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setAccountId(querySnapshot.docs[0].id);
      setAccount(querySnapshot.docs[0].data());
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [user]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'accounts', label: 'Bank Accounts', icon: <Banknote size={20} /> },
    { id: 'transfers', label: 'Transfers', icon: <ArrowRightLeft size={20} /> },
    { id: 'crypto', label: 'Crypto Wallet', icon: <Coins size={20} /> },
    { id: 'payments', label: 'Payments', icon: <Receipt size={20} /> },
    { id: 'cards', label: 'Cards', icon: <CreditCard size={20} /> },
    { id: 'savings', label: 'Savings', icon: <PiggyBank size={20} /> },
    { id: 'investments', label: 'Investments', icon: <Briefcase size={20} /> },
    { id: 'loans', label: 'Loans', icon: <HandCoins size={20} /> },
    { id: 'security', label: 'Security Center', icon: <ShieldCheck size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
    { id: 'support', label: 'Customer Support', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex-shrink-0">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-900 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-900 text-white rounded-2xl shadow-lg">
                <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Balance</p>
                {account ? (
                  <p className="text-4xl mt-2 font-bold">${account.balance.toFixed(2)}</p>
                ) : (
                  <p className="text-2xl mt-2">Loading...</p>
                )}
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Available</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">${account ? (account.balance * 0.9).toFixed(2) : '0.00'}</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending</p>
                <p className="text-3xl mt-2 font-bold text-gray-900">${account ? (account.balance * 0.1).toFixed(2) : '0.00'}</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              {accountId && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TransactionForm user={user} accountId={accountId} type="deposit" onSuccess={fetchAccount} />
                  <TransactionForm user={user} accountId={accountId} type="withdrawal" onSuccess={fetchAccount} />
                  <button className="p-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"><Send size={16}/> Send Money</button>
                  <button className="p-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"><Receipt size={16}/> Pay Bills</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingChart />
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Coins className="text-orange-500" />
                        <span className="font-semibold">Crypto</span>
                      </div>
                      <span className="font-bold">$1,250.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <PieChart className="text-blue-500" />
                        <span className="font-semibold">Stocks & ETFs</span>
                      </div>
                      <span className="font-bold">$5,400.00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <PiggyBank className="text-pink-500" />
                        <span className="font-semibold">Vaults</span>
                      </div>
                      <span className="font-bold">$10,000.00</span>
                    </div>
                  </div>
                  <button className="mt-4 p-3 w-full bg-blue-50 text-blue-900 rounded-lg font-semibold hover:bg-blue-100">View All Assets</button>
              </div>
            </div>
            
            <TransactionHistory user={user} />
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold mb-4">Bank Accounts</h2>
            <p className="text-gray-600 mb-6">Manage your checking, savings, and multi-currency accounts.</p>
            <div className="space-y-4">
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-blue-900">Primary Checking (USD)</h3>
                  <p className="text-sm text-blue-700 font-mono mt-1">**** **** **** 1234</p>
                </div>
                <p className="text-xl font-bold">${account ? account.balance.toFixed(2) : '0.00'}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">Savings Vault (USD)</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">**** **** **** 5678</p>
                </div>
                <p className="text-xl font-bold">$10,000.00</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">Euro Wallet (EUR)</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">**** **** **** 9012</p>
                </div>
                <p className="text-xl font-bold">€4,500.00</p>
              </div>
            </div>
            <button className="mt-6 p-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 w-full">+ Open New Account</button>
          </div>
        )}

        {activeTab === 'transfers' && <Transfers />}
        {activeTab === 'crypto' && <CryptoWallet />}
        {activeTab === 'payments' && <Payments />}
        {activeTab === 'cards' && <Cards />}
        {activeTab === 'savings' && <Savings />}
        {activeTab === 'investments' && <Investments />}
        {activeTab === 'loans' && <Loans />}

        {activeTab === 'security' && <SecurityCenter />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'support' && <CustomerSupport />}
      </main>
    </div>
  );
}
