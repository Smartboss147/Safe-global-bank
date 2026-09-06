import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Get User from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    // 2. Verify Admin Privileges
    const { data: adminRecord, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminRecord) {
      throw new Error('Forbidden: Admin access required');
    }

    // 3. Parse and Validate Request
    const { action, targetUserId, amount, reason, updates, metadata } = await req.json();

    const allowedActions = new Set([
      'approve_kyc',
      'reject_kyc',
      'credit_wallet',
      'debit_wallet',
      'set_wallet_balance',
      'update_profile',
      'update_account_status',
      'update_crypto_balance',
      'delete_user',
      'update_transaction'
    ]);

    if (!action || !allowedActions.has(action)) {
      throw new Error(`Invalid or unsupported action: ${action}`);
    }

    if (!targetUserId || !isValidUuid(targetUserId)) {
      throw new Error('targetUserId must be a valid UUID');
    }

    console.log(`[Admin Action] ${action} by ${user.email} on ${targetUserId}`);

    let result = null;
    let beforeValue = null;
    let afterValue = null;

    // Fetch before value for auditing where possible
    if (['approve_kyc', 'reject_kyc', 'update_profile', 'update_account_status'].includes(action)) {
      const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', targetUserId).maybeSingle();
      beforeValue = data;
    }

    switch (action) {
      case 'approve_kyc':
      case 'reject_kyc': {
        const status = action === 'approve_kyc' ? 'verified' : 'rejected';
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            kyc_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId)
          .select()
          .single();
        if (error) throw error;
        
        await supabaseAdmin
          .from('kyc_documents')
          .update({ 
            status: status, 
            verified_at: new Date().toISOString(),
            verified_by: user.id
          })
          .eq('user_id', targetUserId);
          
        result = data;
        afterValue = { kyc_status: status };
        break;
      }

      case 'update_account_status': {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({ account_status: updates.status, updated_at: new Date().toISOString() })
          .eq('id', targetUserId)
          .select()
          .single();
        if (error) throw error;
        
        await supabaseAdmin.from('accounts').update({ status: updates.status }).eq('user_id', targetUserId);
        
        result = data;
        afterValue = { account_status: updates.status };
        break;
      }

      case 'credit_wallet':
      case 'debit_wallet':
      case 'set_wallet_balance': {
        const { walletType, reference } = metadata || {};
        const amountNum = Number(amount);
        if (isNaN(amountNum)) throw new Error('Invalid numeric amount');
        if (!walletType) throw new Error('Missing wallet type');

        const allowedWalletTypes = new Set(['main', 'trading', 'investment', 'bonus', 'profit']);
        if (!allowedWalletTypes.has(walletType)) throw new Error('Invalid wallet type');

        let { data: walletData, error: walletFetchError } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('wallet_type', walletType)
          .maybeSingle();

        if (walletFetchError) throw walletFetchError;

        if (!walletData) {
          if (action === 'debit_wallet') throw new Error(`Wallet of type ${walletType} not found for this user.`);
          
          const { data: newWallet, error: createError } = await supabaseAdmin
            .from('wallets')
            .insert([{ 
              user_id: targetUserId, 
              wallet_type: walletType, 
              balance: 0,
              currency: 'USD'
            }])
            .select()
            .single();
          
          if (createError) throw createError;
          walletData = newWallet;
        }

        const oldBalance = Number(walletData.balance || 0);
        let newBalance = oldBalance;
        if (action === 'credit_wallet') newBalance = oldBalance + amountNum;
        else if (action === 'debit_wallet') newBalance = oldBalance - amountNum;
        else if (action === 'set_wallet_balance') newBalance = amountNum;

        if (newBalance < 0) throw new Error('Insufficient funds in wallet for this debit operation.');

        const { data: updatedWallet, error: walletUpdateError } = await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', walletData.id)
          .select()
          .single();

        if (walletUpdateError) throw walletUpdateError;

        const { error: txError } = await supabaseAdmin
          .from('wallet_transactions')
          .insert([{
            wallet_id: walletData.id,
            user_id: targetUserId,
            type: action === 'credit_wallet' ? 'credit' : action === 'debit_wallet' ? 'debit' : 'adjustment',
            amount: action === 'set_wallet_balance' ? Math.abs(newBalance - oldBalance) : amountNum,
            balance_after: newBalance,
            description: reason || `Admin manual ${action.split('_')[0]}`,
            reference: reference || null
          }]);

        if (txError) {
          await supabaseAdmin.from('wallets').update({ balance: oldBalance }).eq('id', walletData.id);
          throw txError;
        }

        result = updatedWallet;
        beforeValue = { balance: oldBalance, wallet_type: walletType };
        afterValue = { balance: newBalance, wallet_type: walletType };
        break;
      }

      case 'update_crypto_balance': {
        const { balanceType, asset, newBalance } = updates || {};
        if (newBalance === undefined) throw new Error('Missing newBalance');
        
        const { data: existingWallet } = await supabaseAdmin
          .from('crypto_wallets')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        let updatedWallet = null;
        if (balanceType === 'trading') {
          const oldVal = Number(existingWallet?.trading_balance || 0);
          const { data, error } = await supabaseAdmin
            .from('crypto_wallets')
            .upsert({
              user_id: targetUserId,
              trading_balance: newBalance,
              updated_at: new Date().toISOString(),
              address: existingWallet?.address || '0x' + Math.random().toString(16).substring(2, 26)
            }, { onConflict: 'user_id' })
            .select()
            .single();
          if (error) throw error;
          updatedWallet = data;
          await supabaseAdmin.from('profiles').update({ trading_balance: newBalance }).eq('id', targetUserId);
          
          await supabaseAdmin.from('transactions').insert([{
            user_id: targetUserId,
            type: newBalance >= oldVal ? 'admin_credit' : 'admin_debit',
            amount: Math.abs(newBalance - oldVal),
            currency: 'USD',
            status: 'completed',
            description: `Admin trading balance adjustment: ${reason || 'Manual Adjustment'}`,
          }]);
        } else if (balanceType === 'crypto' && asset) {
          const currentBalances = existingWallet?.balances || { BTC: 0, ETH: 0, USDT: 0, SOL: 0 };
          const oldVal = Number(currentBalances[asset] || 0);
          const updatedBalances = { ...currentBalances, [asset]: newBalance };
          
          const { data, error } = await supabaseAdmin
            .from('crypto_wallets')
            .upsert({
              user_id: targetUserId,
              balances: updatedBalances,
              updated_at: new Date().toISOString(),
              address: existingWallet?.address || '0x' + Math.random().toString(16).substring(2, 26)
            }, { onConflict: 'user_id' })
            .select()
            .single();
          if (error) throw error;
          updatedWallet = data;
          
          await supabaseAdmin.from('wallet_transactions').insert([{
            user_id: targetUserId,
            type: newBalance >= oldVal ? 'credit' : 'debit',
            amount: Math.abs(newBalance - oldVal),
            balance_after: newBalance,
            description: `Admin ${asset} balance adjustment: ${reason || 'Manual Adjustment'}`
          }]);
        }
        result = updatedWallet;
        afterValue = updates;
        break;
      }

      case 'delete_user': {
        // Handle user deletion (profiles, accounts, etc. usually handled by Cascade)
        // But for safety we often do it manually or just disable
        const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (error) throw error;
        await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
        result = { success: true };
        break;
      }

      case 'update_transaction': {
        const { data, error } = await supabaseAdmin
          .from('transactions')
          .update(updates)
          .eq('id', metadata?.transactionId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'update_profile': {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId)
          .select()
          .single();
        if (error) throw error;
        result = data;
        afterValue = updates;
        break;
      }
    }

    // 4. Audit Log
    await supabaseAdmin.from('audit_logs').insert([{
      admin_id: user.id,
      action,
      target_user_id: targetUserId,
      before_value: beforeValue,
      after_value: afterValue,
      reason: reason || 'Manual admin action'
    }]);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[Admin Action Error]', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
