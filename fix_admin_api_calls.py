import re

with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Replace handleUpdateBalance with an API call
update_balance = """
  const handleUpdateBalance = async (accountId: string, newBalance: number, reason: string) => {
    try {
      const targetAcc = accounts.find(a => a.id === accountId);
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error('No auth token');
      
      const res = await fetch('/api/admin/update-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId,
          newBalance,
          reason,
          targetUserId: targetAcc?.user_id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update balance');
      
      setMsg({ type: 'success', text: `Successfully adjusted balance for account ending in ${targetAcc?.accountNumber?.slice(-4) || accountId}` });
      setIsWalletModalOpen(false);
      fetchData();
    } catch (e: any) {
      console.error("Error updating balance:", e);
      setMsg({ type: 'error', text: e.message || 'Failed to update balance' });
    }
  };
"""

content = re.sub(
    r"  const handleUpdateBalance = async \(accountId: string, newBalance: number, reason: string\) => \{.*?setMsg\(\{ type: 'success', text: `Successfully adjusted balance.*?fetchData\(\);\s*\} catch \(e\) \{.*?\}\s*\};", 
    update_balance, 
    content,
    flags=re.DOTALL
)

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)
