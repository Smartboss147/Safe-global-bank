import re

with open('server.ts', 'r') as f:
    content = f.read()

api_routes = """
import { createClient } from '@supabase/supabase-js';

app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    
    // Check if user is in admins table
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
      
    if (!adminData) return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    
    req.admin = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/api/admin/delete-user', verifyAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  
  try {
    // Delete from auth.users (this cascades to profiles and other tables if configured)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/update-balance', verifyAdmin, async (req, res) => {
  const { accountId, newBalance, reason, targetUserId } = req.body;
  if (!accountId || newBalance === undefined) return res.status(400).json({ error: 'Missing parameters' });
  
  try {
    const { data: account } = await supabaseAdmin.from('accounts').select('balance, currency').eq('id', accountId).single();
    const oldBalance = account ? account.balance : 0;
    
    const { error: updateError } = await supabaseAdmin.from('accounts').update({ balance: newBalance }).eq('id', accountId);
    if (updateError) throw updateError;
    
    // Log transaction
    await supabaseAdmin.from('transactions').insert([{
      user_id: targetUserId || 'unknown',
      account_id: accountId,
      type: newBalance > oldBalance ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(newBalance - oldBalance),
      currency: account?.currency || 'USD',
      status: 'completed',
      description: `Admin balance adjustment: ${reason}`,
    }]);
    
    // Log audit
    await supabaseAdmin.from('audit_logs').insert([{
      admin_id: req.admin.id,
      admin_email: req.admin.email,
      action: 'WALLET_ADJUSTMENT',
      target_user: targetUserId || accountId,
      details: `Changed balance from $${oldBalance} to $${newBalance}. Reason: ${reason}`,
      ip_address: req.ip || '127.0.0.1'
    }]);
    
    res.json({ success: true, newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  // API routes
"""

content = content.replace("  // API routes\n", api_routes)

with open('server.ts', 'w') as f:
    f.write(content)
