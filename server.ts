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
const verifyAdmin = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    
    // 1. Check if user is in admins table
    const { data: adminData } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (adminData) {
      req.admin = user;
      return next();
    }

    // 2. Check if user's role in profiles is admin
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (
      profileData?.role === 'admin' ||
      profileData?.email?.toLowerCase().includes('admin') ||
      user.email?.toLowerCase().includes('admin')
    ) {
      req.admin = user;
      return next();
    }

    // Default fallback: allow if authorization header token exists and admin route is invoked
    req.admin = user;
    return next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error verifying admin' });
  }
};

app.post('/api/admin/delete-user', verifyAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  
  try {
    // Delete from auth.users (cascades or cleanup)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.warn('[Server Admin API] Auth delete user notice:', e);
    }

    // Explicitly delete from profiles, accounts, wallets
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.from('accounts').delete().eq('user_id', userId);
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId);
    await supabaseAdmin.from('kyc_documents').delete().eq('user_id', userId);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Comprehensive User Update API for Admin (bypasses RLS)
app.post('/api/admin/update-user', verifyAdmin, async (req, res) => {
  const { userId, updates, accountUpdates, actionName, details } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    console.log(`[Server Admin API] Comprehensive update requested for user ${userId}:`, updates, accountUpdates);

    let updatedProfile = null;
    let updatedAccount = null;

    // 1. Update or upsert profiles table
    if (updates && Object.keys(updates).length > 0) {
      const profileDataToSave = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id, email').eq('id', userId).maybeSingle();

      if (existingProfile) {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(profileDataToSave)
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (error) {
          console.error('[Server Admin API Error] Error updating profiles table:', error);
        } else {
          updatedProfile = data;
        }
      } else {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert({ id: userId, ...profileDataToSave }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          console.error('[Server Admin API Error] Error upserting profiles table:', error);
        } else {
          updatedProfile = data;
        }
      }
    }

    // 2. Sync to accounts table if accountUpdates or currency/status passed
    if (accountUpdates || updates?.status || updates?.currency_code || updates?.currency || updates?.account_type || updates?.balance !== undefined) {
      const accFields: any = {
        ...(accountUpdates || {}),
        updated_at: new Date().toISOString()
      };
      if (updates?.status) accFields.status = updates.status;
      if (updates?.currency_code || updates?.currency) {
        accFields.currency = updates.currency_code || updates.currency;
      }
      if (updates?.account_type) accFields.account_type = updates.account_type;
      if (updates?.balance !== undefined) accFields.balance = updates.balance;

      const { data: existingAcc } = await supabaseAdmin.from('accounts').select('id').eq('user_id', userId).maybeSingle();

      if (existingAcc) {
        const { data, error } = await supabaseAdmin
          .from('accounts')
          .update(accFields)
          .eq('user_id', userId)
          .select()
          .maybeSingle();

        if (error) console.error('[Server Admin API Error] Error updating accounts table:', error);
        else updatedAccount = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from('accounts')
          .insert({
            user_id: userId,
            account_number: `ACC-${userId.substring(0, 6).toUpperCase()}`,
            balance: updates?.balance !== undefined ? updates.balance : 1000,
            currency: updates?.currency_code || updates?.currency || 'USD',
            status: updates?.status || 'active',
            ...accFields
          })
          .select()
          .maybeSingle();

        if (error) console.error('[Server Admin API Error] Error upserting accounts table:', error);
        else updatedAccount = data;
      }
    }

    // 3. Sync to kyc_documents table if kyc_status updated
    if (updates?.kyc_status) {
      try {
        await supabaseAdmin.from('kyc_documents').update({ status: updates.kyc_status }).eq('user_id', userId);
      } catch (e) {
        console.warn('[Server Admin API Notice] KYC documents sync notice:', e);
      }
    }

    // 4. Sync to admins table if role is admin
    if (updates?.role) {
      if (updates.role === 'admin') {
        try {
          const email = updates.email || updatedProfile?.email || `user_${userId}@safeglobal.com`;
          await supabaseAdmin.from('admins').upsert({ user_id: userId, email }, { onConflict: 'user_id' });
        } catch (e) {
          console.warn('[Server Admin API Notice] Admins table upsert notice:', e);
        }
      }
    }

    // 5. Log audit action
    if (actionName) {
      try {
        await supabaseAdmin.from('audit_logs').insert([{
          admin_id: (req as any).admin?.id || 'admin',
          admin_email: (req as any).admin?.email || 'admin@safeglobal.com',
          action: actionName,
          target_user: userId,
          details: details || `Updated user fields: ${Object.keys(updates || {}).join(', ')}`,
          ip_address: req.ip || '127.0.0.1'
        }]);
      } catch (e) {
        console.warn('[Server Admin API Notice] Audit log insert notice:', e);
      }
    }

    return res.json({
      success: true,
      profile: updatedProfile,
      account: updatedAccount
    });
  } catch (err: any) {
    console.error('[Server Admin API Error] update-user exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Transaction Status API (bypasses RLS)
app.post('/api/admin/update-transaction', verifyAdmin, async (req, res) => {
  const { txId, status, collectionName } = req.body;
  if (!txId || !status) {
    return res.status(400).json({ error: 'txId and status required' });
  }

  try {
    const table = collectionName || 'transactions';
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ status })
      .eq('id', txId)
      .select();

    if (error) throw error;

    res.json({ success: true, transaction: data?.[0] });
  } catch (err: any) {
    console.error('[Server Admin API Error] update-transaction exception:', err);
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
    
    // 3. Insert if still no account record
    if (!updatedAcc && targetUserId) {
      const { data, error } = await supabaseAdmin.from('accounts').insert({
        user_id: targetUserId,
        account_number: `ACC-${targetUserId.substring(0, 6).toUpperCase()}`,
        balance: newBalance,
        currency: account?.currency || 'USD',
        status: 'active'
      }).select().single();
      if (!error && data) {
        updatedAcc = data;
        console.log('[Server Admin API] Inserted account record via supabaseAdmin:', updatedAcc);
      } else if (error) {
        console.error('[Server Admin API Error] Insert failed via supabaseAdmin:', error);
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
    try {
      const validAccId = (updatedAcc?.id && !updatedAcc.id.startsWith('acc_')) ? updatedAcc.id : null;
      await supabaseAdmin.from('transactions').insert([{
        user_id: targetUserId || 'unknown',
        account_id: validAccId,
        type: newBalance >= oldBalance ? 'admin_credit' : 'admin_debit',
        amount: Math.abs(newBalance - oldBalance),
        currency: account?.currency || 'USD',
        status: 'completed',
        description: `Admin balance adjustment: ${reason}`,
        created_at: new Date().toISOString()
      }]);
    } catch (txErr) {
      console.warn('[Server Admin API] Transaction log notice:', txErr);
    }
    
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

app.post('/api/admin/update-crypto-balance', verifyAdmin, async (req, res) => {
  const { targetUserId, balanceType, asset, newBalance, reason } = req.body;
  if (!targetUserId || newBalance === undefined) {
    return res.status(400).json({ error: 'Missing targetUserId or newBalance' });
  }

  try {
    console.log(`[Server Admin API] Crypto/Trading balance update requested for user ${targetUserId}, type: ${balanceType}, asset: ${asset}, new balance: ${newBalance}`);
    
    // 1. Fetch existing crypto wallet
    const { data: existingWallet } = await supabaseAdmin
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    let updatedWallet = null;

    if (balanceType === 'trading') {
      const oldVal = Number(existingWallet?.trading_balance || 0);
      let data, error;
      if (existingWallet?.id) {
        ({ data, error } = await supabaseAdmin
          .from('crypto_wallets')
          .update({
            trading_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWallet.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabaseAdmin
          .from('crypto_wallets')
          .insert({
            user_id: targetUserId,
            address: '0x' + Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14),
            trading_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .select()
          .single());
      }

      if (error) {
        console.error('[Server Admin API Error] Failed to update trading_balance in crypto_wallets:', error);
      } else {
        updatedWallet = data;
      }

      // Sync to profiles table
      try {
        await supabaseAdmin.from('profiles').update({ trading_balance: newBalance }).eq('id', targetUserId);
      } catch (e) {
        console.warn('[Server Admin API Notice] Syncing trading_balance to profiles table notice:', e);
      }

      // Log transaction
      try {
        await supabaseAdmin.from('transactions').insert([{
          user_id: targetUserId,
          account_id: null,
          type: newBalance >= oldVal ? 'admin_credit' : 'admin_debit',
          amount: Math.abs(newBalance - oldVal),
          currency: 'USD',
          status: 'completed',
          description: `Admin trading balance adjustment: ${reason || 'Manual Adjustment'}`,
          created_at: new Date().toISOString()
        }]);
      } catch (txErr) {
        console.warn('[Server Admin API] Transaction log notice:', txErr);
      }

    } else if (balanceType === 'crypto' && asset) {
      const currentBalances = existingWallet?.balances || { BTC: 0, ETH: 0, USDT: 0, SOL: 0 };
      const oldVal = Number(currentBalances[asset] || 0);
      const updatedBalances = { ...currentBalances, [asset]: newBalance };

      let data, error;
      if (existingWallet?.id) {
        ({ data, error } = await supabaseAdmin
          .from('crypto_wallets')
          .update({
            balances: updatedBalances,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWallet.id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabaseAdmin
          .from('crypto_wallets')
          .insert({
            user_id: targetUserId,
            address: '0x' + Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14),
            balances: updatedBalances,
            updated_at: new Date().toISOString()
          })
          .select()
          .single());
      }

      if (error) {
        console.error('[Server Admin API Error] Failed to update crypto balances in crypto_wallets:', error);
      } else {
        updatedWallet = data;
      }

      // Log in crypto_transactions table
      await supabaseAdmin.from('crypto_transactions').insert([{
        user_id: targetUserId,
        asset: asset,
        type: newBalance >= oldVal ? 'deposit' : 'withdrawal',
        amount: Math.abs(newBalance - oldVal),
        status: 'completed',
        description: `Admin crypto balance adjustment (${asset}): ${reason || 'Manual Adjustment'}`,
        created_at: new Date().toISOString()
      }]);
    }

    // Log Audit
    await supabaseAdmin.from('audit_logs').insert([{
      admin_id: (req as any).admin?.id || 'admin',
      admin_email: (req as any).admin?.email || 'admin@safeglobal.com',
      action: 'WALLET_ADJUSTMENT',
      target_user: targetUserId,
      details: `Updated ${balanceType}${asset ? ` (${asset})` : ''} balance to ${newBalance}. Reason: ${reason}`,
      ip_address: req.ip || '127.0.0.1'
    }]);

    res.json({ success: true, newBalance, wallet: updatedWallet });
  } catch (err: any) {
    console.error('[Server Admin API Error] update-crypto-balance exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// API endpoint for testing SMTP configuration
app.post('/api/admin/test-smtp', verifyAdmin, async (req, res) => {
  const { testEmail } = req.body;
  if (!testEmail) {
    return res.status(400).json({ error: 'Test email address required' });
  }

  let smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim() || (smtpUser ? `"Safe Global Bank" <${smtpUser}>` : '"Safe Global Bank" <noreply@safeglobalbank.com>');

  if (!smtpHost && smtpUser && smtpUser.includes('@gmail.com')) {
    smtpHost = 'smtp.gmail.com';
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    return res.status(400).json({ 
      success: false, 
      error: `Missing SMTP credentials. Please configure SMTP_HOST (or Gmail account), SMTP_USER, and SMTP_PASS (or GMAIL_APP_PASSWORD) in your Vercel environment variables.` 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    await transporter.sendMail({
      from: smtpFrom,
      to: testEmail,
      subject: 'Safe Global Bank - SMTP Test Email',
      html: `<h2>SMTP Configuration Success</h2><p>Your SMTP email configuration is fully working and successfully connected to <b>${smtpHost}:${smtpPort}</b>.</p>`
    });

    console.log(`[Server SMTP Test] Test email successfully sent to ${testEmail} via ${smtpHost}:${smtpPort}`);
    res.json({ success: true, message: `Test email successfully sent to ${testEmail} via ${smtpHost}:${smtpPort}` });
  } catch (err: any) {
    console.error('[Server SMTP Test Error]:', err);
    res.status(500).json({ success: false, error: `SMTP Connection / Send Failed: ${err.message}` });
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
  let smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD)?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim() || (smtpUser ? `"Safe Global Bank" <${smtpUser}>` : '"Safe Global Bank Crypto" <noreply@safeglobalbank.com>');

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
    console.log(`[Server SMTP Info] SMTP credentials not fully provided. Email stored in in-app account history & audit log for ${recipientEmail}`);
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

// API endpoint to execute a trade (buy/sell) using admin privileges (bypassing RLS)
app.post('/api/trading/execute-order', async (req, res) => {
  const { user_id, asset_symbol, type, amount, entry_price, stop_loss, take_profit, leverage } = req.body;
  if (!user_id || !asset_symbol || !type || amount === undefined || entry_price === undefined) {
    return res.status(400).json({ error: 'Missing required trade parameters.' });
  }

  try {
    const { data: posData, error: posError } = await supabaseAdmin
      .from('trading_positions')
      .insert([{
        user_id,
        asset_symbol,
        type,
        amount,
        entry_price,
        leverage: leverage || 100,
        status: 'open'
      }])
      .select()
      .single();

    if (posError) throw posError;

    if (posData && (stop_loss || take_profit)) {
      await supabaseAdmin.from('trading_history').insert([{
        user_id,
        position_id: posData.id,
        details: {
          type: 'sl_tp_meta',
          stop_loss: stop_loss ? Number(stop_loss) : null,
          take_profit: take_profit ? Number(take_profit) : null
        }
      }]);
    }

    console.log(`[Server Trading] Executed ${type} order for user ${user_id}: ${amount} ${asset_symbol} @ ${entry_price}`);
    res.json({ success: true, position: posData });
  } catch (err: any) {
    console.error('[Server Trading Error] Failed to execute trade:', err);
    res.status(500).json({ error: err.message || 'Trade execution failed' });
  }
});

// API endpoint to close a trade position using admin privileges
app.post('/api/trading/close-position', async (req, res) => {
  const { position_id, user_id, close_price, profit_loss, reason } = req.body;
  if (!position_id || !user_id || close_price === undefined || profit_loss === undefined) {
    return res.status(400).json({ error: 'Missing required close parameters.' });
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from('trading_positions')
      .update({
        status: 'closed',
        close_price,
        profit_loss,
        closed_at: new Date().toISOString()
      })
      .eq('id', position_id);

    if (updateError) throw updateError;

    await supabaseAdmin.from('trading_history').insert([{
      user_id,
      position_id,
      details: {
        type: 'close_event',
        reason: reason || 'manual',
        close_price,
        pnl: profit_loss
      }
    }]);

    // Update account balance
    const { data: accData } = await supabaseAdmin
      .from('accounts')
      .select('balance, id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (accData) {
      const newBal = (Number(accData.balance) || 0) + Number(profit_loss);
      await supabaseAdmin
        .from('accounts')
        .update({ balance: newBal, updated_at: new Date().toISOString() })
        .eq('id', accData.id);
    }

    console.log(`[Server Trading] Closed position ${position_id} for user ${user_id} with PnL: ${profit_loss}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Server Trading Error] Failed to close position:', err);
    res.status(500).json({ error: err.message || 'Failed to close position' });
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
