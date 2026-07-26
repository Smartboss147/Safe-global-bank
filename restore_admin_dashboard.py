import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Split the content at TAB 3
parts = content.split('      {/* TAB 3: WALLETS */}')
if len(parts) != 2:
    print("Could not find TAB 3")
    exit(1)

# We need to find where the `return (` starts.
pre_return, post_return = parts[0].split('  return (\n    <div className="max-w-7xl mx-auto p-4 md:p-8">')

new_render = """
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Management Console</h1>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">
              {adminRole}
            </span>
          </div>
          <p className="text-gray-500 mt-1">Enterprise secure banking oversight, user compliance & ledger management.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={adminRole} 
            onChange={(e) => setAdminRole(e.target.value as any)}
            className="bg-white border border-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
            <option value="ADMIN">Admin (Ops & Users)</option>
            <option value="SUPPORT">Support (Read-Only & Reset)</option>
          </select>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center font-bold" onClick={() => setIsAdminProfileDropdownOpen(!isAdminProfileDropdownOpen)}>
              {user?.email?.[0].toUpperCase() || 'A'}
            </button>
            
            {isAdminProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAdminProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border border-gray-100 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">Administrator</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button 
                      onClick={async () => { setIsAdminProfileDropdownOpen(false); await supabase.auth.signOut(); navigate('/'); }} 
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between shadow-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          <div className="flex items-center gap-3">
            {msg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
            <p className="font-semibold text-sm">{msg.text}</p>
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })} className="text-sm font-bold opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: <Activity size={18} /> },
          { id: 'users', label: 'User Management', icon: <Users size={18} /> },
          { id: 'wallets', label: 'Wallet & Ledger', icon: <DollarSign size={18} /> },
          { id: 'transactions', label: 'Transaction Oversight', icon: <ArrowRightLeft size={18} /> },
          { id: 'audit', label: 'Audit Logs & Activity', icon: <FileText size={18} /> },
          { id: 'compliance', label: 'KYC & Compliance', icon: <ShieldCheck size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMsg({ type: '', text: '' }); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm ${
              activeTab === tab.id ? 'bg-blue-900 text-white shadow-blue-900/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalUsers}</h3>
                <p className="text-xs text-green-600 font-semibold mt-1">+{activeUsers} active accounts</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total System Liquidity</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">${totalWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-blue-600 font-semibold mt-1">Across all checking accounts</p>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Transactions</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalTransactions}</h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">{pendingTransactions} pending review</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <ArrowRightLeft size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">KYC Verified</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{verifiedUsers}</h3>
                <p className="text-xs text-indigo-600 font-semibold mt-1">{totalUsers - verifiedUsers} pending/rejected</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 border-b">User</th>
                  <th className="p-4 border-b">Account</th>
                  <th className="p-4 border-b">Balance</th>
                  <th className="p-4 border-b">KYC</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.length > 0 ? filteredUsers.map((u: any) => {
                  const acc = accounts.find(a => a.user_id === u.id || a.user_id === u.id);
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}` || 'Unnamed User'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-gray-700">{acc ? acc.accountNumber : 'No Account'}</td>
                      <td className="p-4 font-bold text-gray-900">
                        ${acc ? Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.kyc_status === 'verified' || u.kyc_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.kyc_status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {u.status === 'suspended' ? 'Suspended' : 'Active'}
                         </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); }}
                            title="Edit User"
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to ${u.status === 'suspended' ? 'reactivate' : 'suspend'} user ${u.email}?`)) {
                                handleUserStatusUpdate(u.id, 'status', u.status === 'suspended' ? 'active' : 'suspended', u.status === 'suspended' ? 'USER_REACTIVATED' : 'USER_SUSPENDED');
                              }
                            }}
                            title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            className={`p-2 rounded-lg transition ${u.status === 'suspended' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                          >
                            <UserX size={16} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm(`Delete user ${u.email}? This action is permanent.`)) {
                                try {
                                  const session = await supabase.auth.getSession();
                                  const token = session.data.session?.access_token;
                                  if (!token) throw new Error('No auth token');
                                  
                                  const res = await fetch('/api/admin/delete-user', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ userId: u.id })
                                  });
                                  
                                  if (!res.ok) {
                                    const data = await res.json();
                                    throw new Error(data.error || 'Failed to delete user');
                                  }
                                  
                                  logAuditAction('USER_DELETED', u.id, `Deleted user ${u.email}`);
                                  setMsg({ type: 'success', text: 'User deleted successfully.' });
                                  fetchData();
                                } catch (e: any) {
                                  setMsg({ type: 'error', text: e.message || 'Error deleting user' });
                                }
                              }
                            }}
                            title="Delete User"
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WALLETS */}
"""

final_content = pre_return + '  return (\n    <div className="max-w-7xl mx-auto p-4 md:p-8">\n' + new_render + parts[1]

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(final_content)
print("done")
