import React, { useState, useEffect } from 'react';
import { PlusCircle, Target, Folder, DollarSign, Calendar, Trash2, Plus, Minus, Sparkles, CheckCircle2 } from 'lucide-react';

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate: string;
  color: string;
  category: string;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: '1', name: 'Emergency Fund', target: 5000, current: 3200, targetDate: '2026-12-31', color: 'bg-emerald-500', category: 'Safety' },
  { id: '2', name: 'Dream Vacation', target: 2000, current: 450, targetDate: '2026-08-15', color: 'bg-blue-500', category: 'Lifestyle' },
  { id: '3', name: 'New Vehicle', target: 15000, current: 8500, targetDate: '2027-06-30', color: 'bg-purple-500', category: 'Asset' }
];

const COLOR_OPTIONS = [
  { name: 'Emerald', class: 'bg-emerald-500' },
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Amber', class: 'bg-amber-500' },
  { name: 'Rose', class: 'bg-rose-500' },
  { name: 'Indigo', class: 'bg-indigo-500' }
];

export default function Savings({ user, account, fetchAccount }: { user: any; account: any; fetchAccount: () => void }) {
  const storageKey = `safe_bank_savings_${user?.id || 'guest'}`;
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading savings goals:', e);
    }
    return DEFAULT_GOALS;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGoalForFunds, setActiveGoalForFunds] = useState<SavingsGoal | null>(null);
  const [fundActionType, setFundActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [fundAmount, setFundAmount] = useState('');

  // New goal form state
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newColor, setNewColor] = useState('bg-blue-500');
  const [newCategory, setNewCategory] = useState('General');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(goals));
    } catch (e) {
      console.error('Error saving savings goals:', e);
    }
  }, [goals, storageKey]);

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current || 0), 12150); // Base vault + custom goals
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target || 0), 22000);
  const overallPercentage = Math.min(100, Math.round((totalSaved / (totalTarget || 1)) * 100));

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTarget) return;

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newName,
      target: parseFloat(newTarget) || 1000,
      current: parseFloat(newCurrent) || 0,
      targetDate: newDate || new Date(Date.now() + 180 * 24 * 60 * 10000).toISOString().split('T')[0],
      color: newColor,
      category: newCategory
    };

    setGoals([...goals, goal]);
    setNewName('');
    setNewTarget('');
    setNewCurrent('');
    setNewDate('');
    setShowCreateModal(false);
    fetchAccount();
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Are you sure you want to delete this savings goal?')) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  const handleFundTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForFunds || !fundAmount) return;

    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) return;

    setGoals(goals.map(g => {
      if (g.id === activeGoalForFunds.id) {
        const updatedCurrent = fundActionType === 'deposit' 
          ? g.current + amt 
          : Math.max(0, g.current - amt);
        return { ...g, current: updatedCurrent };
      }
      return g;
    }));

    setActiveGoalForFunds(null);
    setFundAmount('');
    fetchAccount();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Vaults & Goals</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Create custom folders, set targets, and track your progress</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-800 transition shadow-sm active:scale-95"
        >
          <PlusCircle size={18} /> New Goal Vault
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-2xl shadow-xl text-white md:col-span-3 lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Total Vault Savings</p>
            <p className="text-4xl mt-2 font-bold tracking-tight">${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-200 bg-white/10 py-1.5 px-3 rounded-lg w-fit">
              <Sparkles size={14} className="text-yellow-300" />
              <span>Earning 4.5% APY Daily Interest</span>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-200">Overall Progress</span>
                <span className="font-bold">{overallPercentage}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
              </div>
              <div className="flex justify-between text-xs text-blue-200">
                <span>Current: ${totalSaved.toLocaleString()}</span>
                <span>Target: ${totalTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="md:col-span-3 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Folder size={20} className="text-blue-600 dark:text-blue-400" /> Your Custom Savings Folders ({goals.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.current / (goal.target || 1)) * 100));
              const isCompleted = goal.current >= goal.target;

              return (
                <div key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60 flex flex-col gap-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl text-white shadow-sm ${goal.color}`}>
                        <Target size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base">{goal.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium">
                            {goal.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar size={12} /> Target Date: {goal.targetDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setActiveGoalForFunds(goal); setFundActionType('deposit'); }}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1"
                      >
                        <Plus size={14} /> Add
                      </button>
                      <button 
                        onClick={() => { setActiveGoalForFunds(goal); setFundActionType('withdraw'); }}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-600 transition flex items-center gap-1"
                      >
                        <Minus size={14} /> Withdraw
                      </button>
                      <button 
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition rounded-lg"
                        title="Delete Goal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${goal.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">saved</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isCompleted && (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Goal Achieved!
                          </span>
                        )}
                        <span className="font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`${goal.color} h-2.5 rounded-full transition-all duration-500`} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>Remaining: ${(Math.max(0, goal.target - goal.current)).toLocaleString()}</span>
                      <span>Target: ${goal.target.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create New Savings Vault</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Set up a custom folder and target for your financial goals.</p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Goal Name / Folder</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. House Down Payment" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Target Amount ($)</label>
                  <input 
                    type="number" 
                    value={newTarget} 
                    onChange={e => setNewTarget(e.target.value)} 
                    placeholder="10000" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Initial Saved ($)</label>
                  <input 
                    type="number" 
                    value={newCurrent} 
                    onChange={e => setNewCurrent(e.target.value)} 
                    placeholder="0" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Target Date</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Category</label>
                  <select 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Safety">Safety</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Asset">Asset</option>
                    <option value="Investment">Investment</option>
                    <option value="Education">Education</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Color Theme</label>
                <div className="flex gap-3">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewColor(c.class)}
                      className={`w-8 h-8 rounded-full ${c.class} transition-transform ${newColor === c.class ? 'ring-4 ring-blue-500/30 scale-110' : 'opacity-80 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-blue-900 text-white hover:bg-blue-800 text-sm font-semibold transition shadow-sm"
                >
                  Create Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Modal */}
      {activeGoalForFunds && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {fundActionType === 'deposit' ? 'Add Funds to' : 'Withdraw from'} {activeGoalForFunds.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Current balance: ${activeGoalForFunds.current.toLocaleString()}</p>

            <form onSubmit={handleFundTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400"><DollarSign size={16} /></span>
                  <input 
                    type="number" 
                    value={fundAmount} 
                    onChange={e => setFundAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => { setActiveGoalForFunds(null); setFundAmount(''); }}
                  className="px-4 py-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition shadow-sm ${
                    fundActionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {fundActionType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
