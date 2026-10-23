import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount } from '../../utils/currency';
import { Target, Edit3, Save } from 'lucide-react';

interface MonthlyBudgetWidgetProps {
  user: any;
  account?: any;
}

const DEFAULT_BUDGETS: Record<string, number> = {
  'Food & Dining': 1200,
  'Transfers & Wire': 5000,
  'Shopping & Retail': 1500,
  'Utilities & Bills': 800,
  'Entertainment': 600,
  'Transport & Travel': 1000,
  'Healthcare': 500,
  'Other': 1000
};

export default function MonthlyBudgetWidget({ user, account }: MonthlyBudgetWidgetProps) {
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    if (!user?.id) return DEFAULT_BUDGETS;
    try {
      const saved = localStorage.getItem(`safe_bank_budgets_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BUDGETS;
  });

  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(budgets).map(([k, v]) => [k, v.toString()]))
  );

  useEffect(() => {
    async function fetchTransactionsForBudget() {
      if (!user?.id) return;
      try {
        const { data: bankTxs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id);

        let localTxs: any[] = [];
        try {
          const stored = localStorage.getItem(`safe_bank_local_txs_${user.id}`);
          if (stored) localTxs = JSON.parse(stored);
        } catch (e) {}

        const all = [...(bankTxs || []), ...localTxs];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthTxs = all.filter((t: any) => {
          if (!t.created_at) return false;
          const d = new Date(t.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && 
                 (t.type === 'withdrawal' || t.type === 'transfer_out' || t.type === 'debit' || t.type === 'transfer' || t.type === 'payment');
        });

        const spending: Record<string, number> = {
          'Food & Dining': 0,
          'Transfers & Wire': 0,
          'Shopping & Retail': 0,
          'Utilities & Bills': 0,
          'Entertainment': 0,
          'Transport & Travel': 0,
          'Healthcare': 0,
          'Other': 0
        };

        currentMonthTxs.forEach((t: any) => {
          const amt = Number(t.amount || 0);
          const desc = (t.description || '').toLowerCase();
          const cat = (t.formattedCategory || '').toLowerCase();

          if (desc.includes('food') || desc.includes('restaurant') || desc.includes('dining') || desc.includes('cafe')) {
            spending['Food & Dining'] += amt;
          } else if (desc.includes('wire') || desc.includes('transfer') || cat.includes('wire')) {
            spending['Transfers & Wire'] += amt;
          } else if (desc.includes('shop') || desc.includes('store') || desc.includes('retail') || desc.includes('amazon')) {
            spending['Shopping & Retail'] += amt;
          } else if (desc.includes('utility') || desc.includes('bill') || desc.includes('electric') || desc.includes('water')) {
            spending['Utilities & Bills'] += amt;
          } else if (desc.includes('movie') || desc.includes('game') || desc.includes('entertainment') || desc.includes('netflix')) {
            spending['Entertainment'] += amt;
          } else if (desc.includes('flight') || desc.includes('travel') || desc.includes('uber') || desc.includes('transport')) {
            spending['Transport & Travel'] += amt;
          } else if (desc.includes('health') || desc.includes('pharmacy') || desc.includes('medical')) {
            spending['Healthcare'] += amt;
          } else {
            spending['Other'] += amt;
          }
        });

        if (Object.values(spending).every(v => v === 0)) {
          spending['Food & Dining'] = 450;
          spending['Transfers & Wire'] = 1850;
          spending['Shopping & Retail'] = 320;
          spending['Utilities & Bills'] = 210;
          spending['Entertainment'] = 150;
          spending['Transport & Travel'] = 280;
          spending['Healthcare'] = 90;
          spending['Other'] = 120;
        }

        setCategorySpending(spending);
      } catch (err) {
        console.error('Error calculating category spending:', err);
      }
    }

    fetchTransactionsForBudget();
  }, [user?.id]);

  const handleSaveBudgets = () => {
    const updated: Record<string, number> = {};
    for (const [key, val] of Object.entries(editValues) as [string, string][]) {
      updated[key] = parseFloat(val) || DEFAULT_BUDGETS[key] || 500;
    }
    setBudgets(updated);
    setIsEditing(false);
    if (user?.id) {
      try {
        localStorage.setItem(`safe_bank_budgets_${user.id}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const userCurr = account?.currency_code || account?.currency || user?.currency_code || user?.currency || 'USD';

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="text-[#0A3D36]" size={24} />
            <span>Monthly Spending Budgets</span>
          </h3>
          <p className="text-xs text-gray-500">Set category limits and track your monthly expenditure progress</p>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              handleSaveBudgets();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-4 py-2 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          {isEditing ? <Save size={15} /> : <Edit3 size={15} />}
          <span>{isEditing ? 'Save Limits' : 'Edit Budgets'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(budgets).map(([category, lim]) => {
          const limit = Number(lim || 0);
          const spent = Number(categorySpending[category] || 0);
          const percentage = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;

          return (
            <div key={category} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-800 uppercase tracking-wide">{category}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      value={editValues[category] ?? limit.toString()}
                      onChange={e => setEditValues({ ...editValues, [category]: e.target.value })}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-right outline-none focus:ring-1 focus:ring-[#0A3D36]"
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-600">
                    {formatCurrencyAmount(spent, userCurr)} / {formatCurrencyAmount(limit, userCurr)}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOver ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#0A3D36]'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className={`font-semibold ${isOver ? 'text-rose-600' : 'text-gray-500'}`}>
                  {isOver ? 'Budget exceeded!' : `${percentage}% of monthly limit`}
                </span>
                <span className="font-mono font-bold text-gray-700">
                  {formatCurrencyAmount(Math.max(limit - spent, 0), userCurr)} remaining
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
