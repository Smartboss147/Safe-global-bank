import { PlusCircle, Target } from 'lucide-react';

export default function Savings() {
  const goals = [
    { name: 'Emergency Fund', target: 5000, current: 3200, color: 'bg-green-500' },
    { name: 'Vacation', target: 2000, current: 450, color: 'bg-blue-500' },
    { name: 'New Car', target: 15000, current: 8500, color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">Savings Vaults</h2>
          <p className="text-gray-500 mt-1">Earn up to 4.5% APY on your savings</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition">
          <PlusCircle size={18} /> New Vault
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-2xl shadow-lg text-white md:col-span-3 lg:col-span-1">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Saved</p>
          <p className="text-4xl mt-2 font-bold">$12,150.00</p>
          <div className="mt-6 pt-6 border-t border-blue-700/50 flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-200">Interest Earned</p>
              <p className="font-bold text-green-400">+$145.20</p>
            </div>
            <button className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition">View History</button>
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Your Goals</h3>
          {goals.map((goal, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${goal.color}`}>
                    <Target size={20} />
                  </div>
                  <span className="font-bold text-gray-900">{goal.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-500">{Math.round((goal.current / goal.target) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`${goal.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(goal.current / goal.target) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-900">${goal.current.toLocaleString()}</span>
                <span className="text-gray-500">Goal: ${goal.target.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
