import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

delete_user = """
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
"""

content = re.sub(
    r'<button\s*onClick=\{.*?logAuditAction\(\'USER_DELETED\'.*?setMsg\(\{ type: \'success\'.*?\}\s*\}\s*title="Delete User"\s*className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"\s*>',
    delete_user,
    content,
    flags=re.DOTALL
)

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)
