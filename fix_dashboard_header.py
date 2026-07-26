import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# Add state for dropdown
content = re.sub(
    r"(const \[showNotifications, setShowNotifications\] = useState\(false\);)", 
    r"\1\n  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);", 
    content
)

# Replace the profile button with a dropdown
new_header = """
          <div className="relative">
            <button className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-blue-500 transition-all" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
              <img src={userData?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.firstName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />
            </button>
            
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border border-gray-100 py-2"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{userData?.displayName || userData?.firstName || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); handleAction('settings'); }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <SettingsIcon size={16} /> Profile Settings
                      </button>
                      <button 
                        onClick={() => { setIsProfileDropdownOpen(false); handleAction('logout'); }} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
"""

content = re.sub(
    r'<button className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm" onClick=\{\(\) => handleAction\(\'settings\'\)\}>.*?<\/button>', 
    new_header, 
    content,
    flags=re.DOTALL
)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)
