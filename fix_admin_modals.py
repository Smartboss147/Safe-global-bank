import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

buttons = """
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    handleUserStatusUpdate(selectedUser.id, 'role', selectedUser.role, 'ROLE_UPDATED');
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email);
                      if (error) throw error;
                      alert(`Password reset email sent to ${selectedUser.email}`);
                      logAuditAction('PASSWORD_RESET', selectedUser.id, `Triggered password reset for ${selectedUser.email}`);
                      setIsEditModalOpen(false);
                    } catch (err: any) {
                      alert('Failed to send reset email: ' + err.message);
                    }
                  }}
                  className="py-3 bg-gray-100 text-gray-800 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                >
                  Reset Password
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from('profiles').update({ transaction_pin: null }).eq('id', selectedUser.id);
                      if (error) throw error;
                      alert(`Transaction PIN reset for ${selectedUser.email}`);
                      logAuditAction('PIN_RESET', selectedUser.id, `Reset transaction PIN for ${selectedUser.email}`);
                      setIsEditModalOpen(false);
                    } catch (err: any) {
                      alert('Failed to reset PIN: ' + err.message);
                    }
                  }}
                  className="py-3 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition sm:col-span-2"
                >
                  Reset Transaction PIN
                </button>
              </div>
"""

# Replace the buttons grid
content = re.sub(
    r'<div className="grid grid-cols-2 gap-4 pt-2">.*?Reset Password\s*</button>\s*</div>',
    buttons,
    content,
    flags=re.DOTALL
)

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)
