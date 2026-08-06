import { createClient } from '@supabase/supabase-js';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;




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
  if ((!accountId && !targetUserId) || newBalance === undefined) {
    return res.status(400).json({ error: 'Missing parameters: accountId or targetUserId and newBalance required' });
  }
  
  try {
    console.log(`[Server Admin API] Balance update request received for user ${targetUserId} / account ${accountId}. Client: supabaseAdmin (Service Role Client)`);
    
    let account = null;
    if (targetUserId) {
      const { data } = await supabaseAdmin.from('accounts').select('balance, currency').eq('user_id', targetUserId).maybeSingle();
      account = data;
    }
    if (!account && accountId && !accountId.startsWith('acc_')) {
      const { data } = await supabaseAdmin.from('accounts').select('balance, currency').eq('id', accountId).maybeSingle();
      account = data;
    }
    const oldBalance = account ? Number(account.balance) || 0 : 0;
    
    let updatedAcc = null;
    // 1. Try update by user_id
    if (targetUserId) {
      const { data, error } = await supabaseAdmin.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('user_id', targetUserId).select();
      if (!error && data && data.length > 0) {
        updatedAcc = data[0];
        console.log('[Server Admin API] Updated accounts table by user_id via supabaseAdmin:', updatedAcc);
      }
    }
    
    // 2. Try update by id if not updated
    if (!updatedAcc && accountId && !accountId.startsWith('acc_')) {
      const { data, error } = await supabaseAdmin.from('accounts').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', accountId).select();
      if (!error && data && data.length > 0) {
        updatedAcc = data[0];
        console.log('[Server Admin API] Updated accounts table by id via supabaseAdmin:', updatedAcc);
      }
    }
    
    // 3. Upsert if still no account record
    if (!updatedAcc && targetUserId) {
      const { data, error } = await supabaseAdmin.from('accounts').upsert({
        user_id: targetUserId,
        account_number: `ACC-${targetUserId.substring(0, 6).toUpperCase()}`,
        balance: newBalance,
        currency: account?.currency || 'USD',
        status: 'active'
      }, { onConflict: 'user_id' }).select().single();
      if (!error && data) {
        updatedAcc = data;
        console.log('[Server Admin API] Upserted account record via supabaseAdmin:', updatedAcc);
      } else if (error) {
        console.error('[Server Admin API Error] Upsert failed via supabaseAdmin:', error);
      }
    }

    // Also sync balance to profiles table if column exists
    if (targetUserId) {
      try {
        await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', targetUserId);
      } catch (e) {
        console.warn('[Server Admin API Notice] Profiles table balance sync notice:', e);
      }
    }
    
    // Log transaction for ledger
    await supabaseAdmin.from('transactions').insert([{
      user_id: targetUserId || 'unknown',
      account_id: updatedAcc?.id || accountId || 'main',
      type: newBalance >= oldBalance ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(newBalance - oldBalance),
      currency: account?.currency || 'USD',
      status: 'completed',
      description: `Admin balance adjustment: ${reason}`,
      created_at: new Date().toISOString()
    }]);
    
    // Log audit
    await supabaseAdmin.from('audit_logs').insert([{
      admin_id: (req as any).admin?.id || 'admin',
      admin_email: (req as any).admin?.email || 'admin@safeglobal.com',
      action: 'WALLET_ADJUSTMENT',
      target_user: targetUserId || accountId,
      details: `Changed balance from $${oldBalance} to $${newBalance}. Reason: ${reason}`,
      ip_address: req.ip || '127.0.0.1'
    }]);
    
    res.json({ success: true, newBalance, account: updatedAcc });
  } catch (err: any) {
    console.error('[Server Admin API Error] update-balance exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint for dispatching cryptocurrency transfer email notifications
app.post('/api/crypto/send-transfer-email', async (req, res) => {
  const { recipientEmail, referenceId, subject, html, params } = req.body;
  
  if (!recipientEmail || !referenceId) {
    return res.status(400).json({ error: 'Recipient email and transaction reference ID are required.' });
  }

  let emailSentReal = false;
  let sendError: string | null = null;

  // Try real SMTP email dispatch if SMTP credentials are present
  let smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || (smtpUser ? `"Safe Global Bank" <${smtpUser}>` : '"Safe Global Bank Crypto" <noreply@safeglobalbank.com>');

  // Auto-detect Gmail if host not specified but user is gmail
  if (!smtpHost && smtpUser && smtpUser.includes('@gmail.com')) {
    smtpHost = 'smtp.gmail.com';
  }

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587 or other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: recipientEmail,
        subject: subject || `Transaction Receipt: Ref ${referenceId}`,
        html: html
      });

      emailSentReal = true;
      console.log(`[Server SMTP] Live email successfully dispatched via SMTP to ${recipientEmail} for Ref ${referenceId}`);
    } catch (err: any) {
      console.warn('[Server SMTP Error] Failed to send via SMTP:', err.message);
      sendError = err.message;
    }
  } else {
    console.log(`[Server SMTP Info] No SMTP_USER/SMTP_PASS configured. Email stored in in-app account history & audit log for ${recipientEmail}`);
  }

  try {
    // Log to Supabase email_audit_logs
    const logEntry = {
      recipient_email: recipientEmail,
      transaction_ref: referenceId,
      type: params?.type || 'crypto_transfer',
      asset: params?.asset || 'BTC',
      amount: params?.amount || 0,
      delivery_status: emailSentReal ? 'DELIVERED' : 'SENT',
      sent_at: new Date().toISOString(),
      metadata: { subject, params, smtpSent: emailSentReal, sendError }
    };

    await supabaseAdmin.from('email_audit_logs').insert([logEntry]);

    console.log(`[Server] Crypto transfer email logged for ${recipientEmail} (Ref: ${referenceId})`);
    return res.json({ 
      success: true, 
      message: `Email receipt processed for ${recipientEmail}`,
      smtpSent: emailSentReal,
      deliveryStatus: emailSentReal ? 'DELIVERED' : 'SENT',
      html
    });
  } catch (err: any) {
    console.warn('[Server] Email logging notice:', err.message);
    return res.json({ 
      success: true, 
      message: 'Email process completed with local fallback', 
      smtpSent: emailSentReal,
      html 
    });
  }
});

// API endpoint for administrators to fetch email audit logs
app.get('/api/admin/email-audit-logs', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_audit_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err: any) {
    res.json({ logs: [] });
  }
});

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
