import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

password_reset = """
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
"""

content = re.sub(
    r"onClick=\{\(\) => \{\s*alert\(`Password reset email sent to \$\{selectedUser.email\}`\);\s*logAuditAction\('PASSWORD_RESET', selectedUser.id, `Triggered password reset for \$\{selectedUser.email\}`\);\s*setIsEditModalOpen\(false\);\s*\}\}", 
    password_reset, 
    content
)

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)
