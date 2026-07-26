import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Add state for dropdown
content = re.sub(
    r"(const \[adminRole, setAdminRole\] = useState\<'SUPER_ADMIN' \| 'ADMIN' \| 'SUPPORT'\>\('SUPER_ADMIN'\);)", 
    r"\1\n  const [isAdminProfileDropdownOpen, setIsAdminProfileDropdownOpen] = useState(false);", 
    content
)

# Replace the header buttons
new_buttons = """
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
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border border-gray-100 py-2"
                >
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
"""

content = re.sub(
    r'<button \s*onClick=\{fetchData\}\s*className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition"\s*>\s*<RefreshCw size=\{16\} \/> Refresh\s*<\/button>', 
    new_buttons, 
    content,
    flags=re.DOTALL
)

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)
