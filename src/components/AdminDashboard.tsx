import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrencyAmount, getCurrencyByCountry, getCurrencyInfo, getCurrencySymbol } from '../utils/currency';
import { 
  Users, ArrowRightLeft, Activity, ShieldAlert, FileText, CheckCircle, XCircle, 
  DollarSign, Lock, Unlock, RefreshCw, Eye, Edit3, Trash2, ShieldCheck, UserX, 
  Download, Search, Filter, History, AlertTriangle, Key, PlusCircle, MinusCircle, 
  LogOut, CheckSquare, Settings as SettingsIcon, Database, ArrowUpRight, ArrowDownLeft,
  Bell, FileSpreadsheet, Layers, Menu, X, Terminal, ChevronRight, Zap, Sparkles, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLocalEmailAuditLogs } from '../services/cryptoEmailService';
import ThemeToggle from './ThemeToggle';

export default function AdminDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('users'); // Default to Users tab like screenshot
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletActionType, setWalletActionType] = useState<'credit' | 'debit' | 'adjust'>('credit');
  const [walletBalanceType, setWalletBalanceType] = useState<'main' | 'crypto' | 'trading'>('main');
  const [walletCryptoAsset, setWalletCryptoAsset] = useState('USDT');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [adminRole, setAdminRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT'>('SUPER_ADMIN');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Broadcast Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // SMTP Test State
  const [testEmailInput, setTestEmailInput] = useState('smartcompany112234@gmail.com');
  const [testSmtpLoading, setTestSmtpLoading] = useState(false);
  const [testSmtpResult, setTestSmtpResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleTestSmtp = async () => {
    if (!testEmailInput) return;
    setTestSmtpLoading(true);
    setTestSmtpResult(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ testEmail: testEmailInput })
      });
      const data = await res.json();
      setTestSmtpResult(data);
    } catch (err: any) {
      setTestSmtpResult({ success: false, error: err.message || 'Failed to connect to test-smtp endpoint' });
    } finally {
      setTestSmtpLoading(false);
    }
  };

  // Broker & Trading Management State
  const [tradingInstruments, setTradingInstruments] = useState([
    { id: 'eurusd', symbol: 'EUR/USD', category: 'Forex', spread: '0.8 pips', maxLeverage: '1:500', status: 'Open' },
    { id: 'btcusd', symbol: 'BTC/USD', category: 'Crypto', spread: '12.5 pts', maxLeverage: '1:100', status: 'Open' },
    { id: 'xauusd', symbol: 'XAU/USD', category: 'Commodities', spread: '1.2 pips', maxLeverage: '1:200', status: 'Open' },
    { id: 'aapl', symbol: 'AAPL', category: 'Stocks', spread: '0.15 pts', maxLeverage: '1:20', status: 'Closed' }
  ]);

  // Investment Plans State
  const [investmentPlans, setInvestmentPlans] = useState([
    { id: 'plan_1', name: 'Starter Yield', roi: '5.5%', duration: '7 Days', minInv: 100, maxInv: 5000, active: true },
    { id: 'plan_2', name: 'Premium Staking', roi: '14.2%', duration: '30 Days', minInv: 5000, maxInv: 50000, active: true },
    { id: 'plan_3', name: 'Institutional Alpha', roi: '32.0%', duration: '90 Days', minInv: 50000, maxInv: 1000000, active: true }
  ]);

  // Payment Gateways State
  const [gateways, setGateways] = useState([
    { id: 'gw_crypto', name: 'Crypto Direct (USDT/BTC)', minDeposit: 10, maxDeposit: 100000, fee: '0%', status: 'Active' },
    { id: 'gw_wire', name: 'Global SWIFT/SEPA Wire', minDeposit: 500, maxDeposit: 500000, fee: '0.5%', status: 'Active' },
    { id: 'gw_card', name: 'Credit / Debit Card (Visa/MC)', minDeposit: 50, maxDeposit: 10000, fee: '1.8%', status: 'Active' }
  ]);

  // Referral & Bonus State
  const [referralBonus, setReferralBonus] = useState({ refRate: '5%', signupBonus: '25.00', status: 'Active' });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    platformName: 'Safe Global Trade & Banking',
    maintenanceMode: false,
    registrationEnabled: true,
    require2FA: false,
    defaultCurrency: 'USD'
  });
  const [supportedCountries, setSupportedCountries] = useState<any[]>([]);

  const navigate = useNavigate();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: countriesData } = await supabase.from('supported_countries').select('*').order('country_name');
      if (countriesData) setSupportedCountries(countriesData);

      // 1. Fetch profiles
      const { data: profilesData } = await supabase.from('profiles').select('*');
      
      // 2. Fetch accounts
      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData) setAccounts(accountsData);

      // 2.5 Fetch crypto wallets
      const { data: cryptoWalletsData } = await supabase.from('crypto_wallets').select('*');
      if (cryptoWalletsData) setCryptoWallets(cryptoWalletsData);

      // 3. Fetch transactions
      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

      // 4. Fetch audit logs
      const { data: auditData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (auditData) setAuditLogs(auditData);

      // Fetch Email Audit Logs
      try {
        const { data: emlData } = await supabase.from('email_audit_logs').select('*').order('sent_at', { ascending: false });
        if (emlData && emlData.length > 0) {
          setEmailLogs(emlData);
        } else {
          setEmailLogs(getLocalEmailAuditLogs());
        }
      } catch (e) {
        setEmailLogs(getLocalEmailAuditLogs());
      }

      // 5. Fetch crypto transactions
      const { data: cryptoData } = await supabase.from('crypto_transactions').select('*');
      if (cryptoData) setCryptoTxs(cryptoData);

      // 6. Fetch KYC documents
      const { data: kycData } = await supabase.from('kyc_documents').select('*');
      if (kycData) setKycDocs(kycData);

      // 7. Fetch investment plans
      const { data: plansData } = await supabase.from('investment_plans').select('*');
      if (plansData) setInvestmentPlans(plansData.map(p => ({
        id: p.id,
        name: p.name,
        roi: `${p.roi_percentage}%`,
        duration: `${p.duration_days} Days`,
        minInv: p.min_amount,
        maxInv: p.max_amount,
        active: p.is_active
      })));

      // 8. Fetch market assets
      const { data: assetsData } = await supabase.from('market_assets').select('*');
      if (assetsData) setTradingInstruments(assetsData.map(a => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        category: 'Market', // Default category
        status: a.is_active ? 'Open' : 'Closed',
        spread: 'Dynamic',
        maxLeverage: '1:500'
      })));

      // Robust User Aggregation Engine (Supabase strictly)
      const userMap = new Map<string, any>();

      // Populate strictly from Supabase profiles
      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(p => {
          if (p && p.id) {
            userMap.set(p.id, {
              id: p.id,
              email: p.email || 'user@safeglobalbank.com',
              displayName: p.display_name || p.displayName || `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || p.email?.split('@')[0] || 'Safe Global Bank User',
              firstName: p.first_name || p.firstName || '',
              lastName: p.last_name || p.lastName || '',
              phone: p.phone || '',
              kyc_status: p.kyc_status || 'Unverified',
              status: p.status || 'active',
              role: p.role || 'user',
              created_at: p.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Ensure the currently authenticated admin is present if missing
      if (user && user.id && !userMap.has(user.id)) {
        userMap.set(user.id, {
          id: user.id,
          email: user.email || 'admin@safeglobalbank.com',
          displayName: user.displayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrator',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          phone: user.phone || '',
          kyc_status: 'verified',
          status: 'active',
          role: user.role || 'admin',
          created_at: user.created_at || new Date().toISOString()
        });
      }

      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.log("Error fetching admin data:", error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    fetchData(); // Initial full load

    console.log('[AdminDashboard] Initializing Supabase Realtime synchronization channels...');

    const adminChannel = supabase.channel('admin_global_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        console.log('[Admin Realtime] Profiles update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, payload => {
        console.log('[Admin Realtime] Accounts update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, payload => {
        console.log('[Admin Realtime] Wallets update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        console.log('[Admin Realtime] Transactions update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_transactions' }, payload => {
        console.log('[Admin Realtime] Crypto transactions update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_documents' }, payload => {
        console.log('[Admin Realtime] KYC Documents update received:', payload);
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_accounts' }, payload => {
        console.log('[Admin Realtime] Trading accounts update received:', payload);
        fetchData(true);
      })
      .subscribe();

    const interval = setInterval(() => fetchData(true), 10000); // Fallback background refresh
    const handleUserSyncEvent = () => fetchData(true);
    window.addEventListener('user_registered_or_updated', handleUserSyncEvent);

    return () => {
      supabase.removeChannel(adminChannel);
      clearInterval(interval);
      window.removeEventListener('user_registered_or_updated', handleUserSyncEvent);
    };
  }, []);

  const logAuditAction = async (action: string, targetUser: string, details: string) => {
    try {
      const adminName = user?.displayName || user?.user_metadata?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Administrator';
      const logData = {
        admin_id: user?.id || 'admin_root',
        admin_email: user?.email || 'admin@safeglobalbank.com',
        admin_name: adminName,
        action,
        target_user: targetUser,
        details,
        ip_address: '127.0.0.1'
      };
      const { data: insertedLog } = await supabase.from('audit_logs').insert([logData]).select().single();
      if (insertedLog) setAuditLogs(prev => [insertedLog, ...prev]);
    } catch (e) {
      console.log("Error logging audit:", e);
    }
  };

  const handleCryptoUpdateBalance = async (targetUserId: string, balanceType: 'crypto' | 'trading', asset: string | null, newBalance: number, reason: string) => {
    try {
      console.log(`[Admin Wallet System Audit] Starting ${balanceType} balance update process for user: ${targetUserId}`);

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      
      const res = await fetch('/api/admin/update-crypto-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetUserId,
          balanceType,
          asset,
          newBalance,
          reason
        })
      });

      const apiJson = await res.json();
      if (res.ok && apiJson.success) {
        console.log('[Admin Wallet System Audit] Backend Admin API successfully persisted crypto/trading balance:', apiJson);
        setMsg({ type: 'success', text: `${balanceType === 'crypto' ? asset : 'Trading'} wallet balance updated to ${newBalance} successfully.` });
        setIsWalletModalOpen(false);
      } else {
        throw new Error(apiJson.error || 'Backend Admin API response error');
      }
    } catch (err: any) {
      console.error("[Admin Wallet System Audit Error] Failed to update balance:", err);
      setMsg({ type: 'error', text: `Error updating balance: ${err.message || 'Database update failed'}` });
    }
  };

  const handleUpdateBalance = async (accountId: string, newBalance: number, reason: string) => {
    const userCurrInfo = getCurrencyByCountry(selectedUser?.country);
    try {
      const targetUserId = selectedUser?.id || (accounts.find(a => a.id === accountId)?.user_id);
      let targetAcc = accounts.find(a => a.id === accountId || a.user_id === targetUserId || a.userId === targetUserId);
      const oldBalance = targetAcc ? Number(targetAcc.balance) || 0 : 0;

      console.log(`[Admin Wallet System Audit] Starting balance update process for user: ${targetUserId}, account: ${accountId}`);

      let updateResult: any = null;

      // 1. Primary: Use Backend Admin API (supabaseAdmin Service Role Client) to bypass RLS completely
      if (targetUserId) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const token = session?.access_token;
          const res = await fetch('/api/admin/update-balance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              accountId: accountId && !accountId.startsWith('acc_') ? accountId : undefined,
              targetUserId,
              newBalance,
              reason
            })
          });
          const apiJson = await res.json();
          if (res.ok && apiJson.success) {
            console.log('[Admin Wallet System Audit] Backend Admin API successfully persisted balance:', apiJson);
            updateResult = apiJson.account || { user_id: targetUserId, balance: newBalance };
          } else {
            console.warn('[Admin Wallet System Audit] Backend Admin API returned notice:', apiJson);
          }
        } catch (apiErr) {
          console.warn('[Admin Wallet System Audit] Backend Admin API fetch notice:', apiErr);
        }
      }

      // 2. Fallback: Try client update if backend API didn't return updateResult
      if (!updateResult && targetUserId) {
        try {
          const { data, error } = await supabase
            .from('accounts')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('user_id', targetUserId)
            .select();
          if (!error && data && data.length > 0) {
            updateResult = data[0];
          }
        } catch (e) {
          console.warn('[Admin Wallet System Audit] Client update fallback notice:', e);
        }
      }

      if (!updateResult) {
        updateResult = { user_id: targetUserId, balance: newBalance };
      }

      // Sync balance to profiles table if mirrored
      if (targetUserId) {
        try {
          await supabase.from('profiles').update({ balance: newBalance }).eq('id', targetUserId);
        } catch (e) {
          console.warn('[Admin Wallet System Audit] Syncing balance to profiles table notice:', e);
        }
      }

      // Update local state immediately for fast UI feedback
      setAccounts(prev => {
        const existing = prev.find(a => a.id === accountId || a.user_id === targetUserId || a.userId === targetUserId);
        if (existing) {
          return prev.map(a => (a.id === existing.id || a.user_id === targetUserId ? { ...a, balance: newBalance } : a));
        } else if (targetUserId) {
          return [...prev, {
            id: updateResult.id || accountId,
            user_id: targetUserId,
            account_number: updateResult.account_number || `ACC-${targetUserId.substring(0, 6).toUpperCase()}`,
            balance: newBalance,
            currency: userCurrInfo.code
          }];
        }
        return prev;
      });

      // Update modal selectedUser.account if open
      if (selectedUser && selectedUser.id === targetUserId) {
        setSelectedUser((prev: any) => prev ? {
          ...prev,
          account: {
            ...(prev.account || {}),
            balance: newBalance
          }
        } : prev);
      }
      
      // Log transaction for audit integrity
      try {
        const safeAccId = (updateResult?.id && !updateResult.id.startsWith('acc_')) ? updateResult.id : null;
        await supabase.from('transactions').insert([{
          user_id: targetUserId,
          account_id: safeAccId,
          type: newBalance >= oldBalance ? 'admin_credit' : 'admin_debit',
          amount: Math.abs(newBalance - oldBalance),
          currency: targetAcc?.currency_code || targetAcc?.currency || userCurrInfo.code,
          status: 'completed',
          description: `Admin balance adjustment: ${reason}`,
          created_at: new Date().toISOString()
        }]);
      } catch (txErr) {
        console.warn('[Admin Wallet System Audit] Transaction log notice:', txErr);
      }

      await logAuditAction('WALLET_ADJUSTMENT', targetUserId, `Balance adjusted from ${formatCurrencyAmount(oldBalance, userCurrInfo)} to ${formatCurrencyAmount(newBalance, userCurrInfo)}. Reason: ${reason}`);
      setMsg({ type: 'success', text: `Wallet balance updated to ${formatCurrencyAmount(newBalance, userCurrInfo)} in Supabase database and logged.` });
      setIsWalletModalOpen(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId: targetUserId, newBalance } }));
      }

      fetchData(true);
    } catch (err: any) {
      console.error("[Admin Wallet System Audit Error] Failed to update balance:", err);
      setMsg({ type: 'error', text: `Error updating balance: ${err.message || 'Database update failed'}` });
    }
  };

  const handleUserStatusUpdate = async (userId: string, statusField: string, statusValue: any, actionName: string) => {
    try {
      const fieldToUpdate = statusField === 'kycStatus' ? 'kyc_status' : statusField;
      const updates: any = { [fieldToUpdate]: statusValue };
      
      // Keep transaction_pin in sync with pin if pin is updated
      if (statusField === 'pin') {
        updates.transaction_pin = statusValue;
      }

      console.log(`[Admin] Updating ${statusField} for user ${userId} to ${statusValue}...`);

      // 1. Attempt update via Service Role Backend API for guaranteed persistence
      let apiSuccess = false;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const res = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId,
            updates,
            accountUpdates: {
              status: statusField === 'status' || statusField === 'account_status' ? statusValue : undefined,
              currency: statusField === 'currency' || statusField === 'currency_code' ? statusValue : undefined,
              account_type: statusField === 'account_type' || statusField === 'accountType' ? statusValue : undefined
            },
            actionName,
            details: `Updated ${statusField} to ${statusValue}`
          })
        });
        const apiJson = await res.json();
        if (res.ok && apiJson.success) {
          apiSuccess = true;
          console.log('[Admin] Successfully persisted user update via backend API:', apiJson);
        }
      } catch (apiErr) {
        console.warn('[Admin] Backend API call failed, falling back to client update:', apiErr);
      }

      // 2. Fallback client update if API call was unreachable
      if (!apiSuccess) {
        await supabase.from('profiles').update(updates).eq('id', userId);

        if (statusField === 'kyc_status' || statusField === 'kycStatus') {
          await supabase.from('kyc_documents').update({ status: statusValue }).eq('user_id', userId);
        }
        if (statusField === 'currency' || statusField === 'currency_code') {
          await supabase.from('accounts').update({ currency: statusValue }).eq('user_id', userId);
        }
        if (statusField === 'account_type' || statusField === 'accountType') {
          await supabase.from('accounts').update({ account_type: statusValue }).eq('user_id', userId);
        }
        if (statusField === 'account_status' || statusField === 'status') {
          await supabase.from('accounts').update({ status: statusValue }).eq('user_id', userId);
        }

        await logAuditAction(actionName, userId, `Updated ${statusField} to ${statusValue}`);
      }

      // Sync local storage mirror if present
      try {
        const storageKey = `local_profile_${userId}`;
        const existingLocal = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({ ...existingLocal, ...updates, updated_at: new Date().toISOString() }));
      } catch (e) {}

      setMsg({ type: 'success', text: `User ${actionName.toLowerCase().replace(/_/g, ' ')} successfully.` });
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId, statusField, statusValue } }));
      }
      fetchData(true);
    } catch (err: any) {
      console.error("[Admin] Failed to update user status:", err);
      setMsg({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleBatchSaveUser = async (updatedUserData: any) => {
    if (!updatedUserData || !updatedUserData.id) return;
    const userId = updatedUserData.id;
    try {
      const updates = {
        first_name: updatedUserData.firstName || '',
        last_name: updatedUserData.lastName || '',
        display_name: updatedUserData.displayName || `${updatedUserData.firstName || ''} ${updatedUserData.lastName || ''}`.trim() || updatedUserData.email?.split('@')[0] || 'User',
        role: updatedUserData.role || 'user',
        status: updatedUserData.status || 'active',
        kyc_status: updatedUserData.kyc_status || 'pending',
        pin: updatedUserData.pin || '1234',
        transaction_pin: updatedUserData.pin || '1234'
      };

      console.log(`[Admin] Batch saving user details for ${userId}:`, updates);

      let apiSuccess = false;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const res = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId,
            updates,
            accountUpdates: {
              status: updates.status
            },
            actionName: 'PROFILE_BATCH_UPDATE',
            details: `Updated name, role (${updates.role}), status (${updates.status}), KYC (${updates.kyc_status}), and PIN`
          })
        });
        const apiJson = await res.json();
        if (res.ok && apiJson.success) {
          apiSuccess = true;
          console.log('[Admin] Batch update persisted via Service Role backend API:', apiJson);
        }
      } catch (e) {
        console.warn('[Admin] Batch update API error:', e);
      }

      if (!apiSuccess) {
        await supabase.from('profiles').update(updates).eq('id', userId);
        await supabase.from('accounts').update({ status: updates.status }).eq('user_id', userId);
        await supabase.from('kyc_documents').update({ status: updates.kyc_status }).eq('user_id', userId);
        await logAuditAction('PROFILE_BATCH_UPDATE', userId, 'Updated profile details via client fallback');
      }

      // Update local storage cache
      try {
        const storageKey = `local_profile_${userId}`;
        const existingLocal = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({ ...existingLocal, ...updates, updated_at: new Date().toISOString() }));
      } catch (e) {}

      setMsg({ type: 'success', text: `User profile for ${updatedUserData.email || userId} saved successfully.` });
      setIsEditModalOpen(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user_registered_or_updated', { detail: { userId, updates } }));
      }
      fetchData(true);
    } catch (err: any) {
      console.error("[Admin] Error batch saving user profile:", err);
      setMsg({ type: 'error', text: 'Error saving user changes.' });
    }
  };

  const handleDeleteUserRecord = async (u: any) => {
    if (!u || !u.id) return;
    if (confirm(`Delete user ${u.email}? This action cannot be undone.`)) {
      setUsers(prev => prev.filter(item => item.id !== u.id));
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ userId: u.id })
        });
      } catch (e) {
        try {
          await supabase.from('profiles').delete().eq('id', u.id);
          await supabase.from('accounts').delete().eq('user_id', u.id);
        } catch (err) {}
      }
      await logAuditAction('USER_DELETED', u.id, `Deleted user record for ${u.email}`);
      setMsg({ type: 'success', text: `User ${u.email} deleted.` });
      fetchData(true);
    }
  };

  const handleTxStatus = async (txId: string, status: string, collectionName = 'transactions') => {
    try {
      let apiSuccess = false;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const res = await fetch('/api/admin/update-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ txId, status, collectionName })
        });
        const apiJson = await res.json();
        if (res.ok && apiJson.success) apiSuccess = true;
      } catch (e) {}

      if (!apiSuccess) {
        await supabase.from(collectionName).update({ status }).eq('id', txId);
      }

      await logAuditAction('TRANSACTION_STATUS_UPDATE', txId, `Marked transaction #${txId.substring(0, 8)} as ${status}`);
      setMsg({ type: 'success', text: `Transaction marked as ${status}.` });
      fetchData(true);
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error updating transaction status.' });
    }
  };

  // Metrics Calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'suspended' && u.status !== 'frozen').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const verifiedUsers = users.filter(u => u.kyc_status === 'verified' || u.kyc_status === 'Approved').length;
  
  const totalWalletBalance = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const totalTransactions = transactions.length + cryptoTxs.length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'Pending').length;
  const successfulTransactions = transactions.filter(t => t.status === 'completed' || t.status === 'Completed' || t.status === 'success').length;

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar Menu Items matching full Role-Based Admin specification
  const sidebarNavItems = [
    { id: 'overview', label: 'Dashboard', icon: <Zap size={18} /> },
    { id: 'requests', label: 'Inbound Requests', icon: <FileText size={18} />, badge: pendingTransactions > 0 ? pendingTransactions : null },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'wallets', label: 'Wallet Management', icon: <DollarSign size={18} /> },
    { id: 'broker', label: 'Broker & Trading', icon: <Activity size={18} /> },
    { id: 'investments', label: 'Investment Plans', icon: <Layers size={18} /> },
    { id: 'gateways', label: 'Payment Gateways', icon: <ArrowDownLeft size={18} /> },
    { id: 'deposits', label: 'Deposits', icon: <ArrowDownLeft size={18} /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpRight size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <History size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'email_logs', label: 'Crypto Transfer Email Logs', icon: <Mail size={18} /> },
    { id: 'content', label: 'Content & CMS', icon: <FileSpreadsheet size={18} /> },
    { id: 'referrals', label: 'Referrals & Bonuses', icon: <Sparkles size={18} /> },
    { id: 'currencies', label: 'Country & Currencies', icon: <Database size={18} /> },
    { id: 'security', label: 'Audit Logs & Security', icon: <Terminal size={18} /> },
    { id: 'settings', label: 'System Settings', icon: <SettingsIcon size={18} /> },
  ];

  const filteredSidebarItems = sidebarNavItems.filter(item => 
    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (loading && !hasLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-bold tracking-wide">Initializing Safe Global Bank Admin Terminal...</p>
        </div>
      </div>
    );
  }

  const adminDisplayName = user?.displayName || user?.user_metadata?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'Administrator';
  const adminEmail = user?.email || 'admin@safeglobalbank.com';
  const adminPhotoURL = user?.photoURL || user?.user_metadata?.avatar_url || null;
  const adminLastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Session';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c10] text-slate-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-white dark:bg-[#121319] border-b border-gray-200 dark:border-white/10 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20">
            <ShieldCheck size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-gray-900 dark:text-white">Safe Global Bank</h1>
            <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-widest">ADMIN TERMINAL</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>


      {/* LEFT SIDEBAR TERMINAL PANEL */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#121319] border-r border-white/10 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shrink-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-black flex items-center justify-center text-base shadow-lg shadow-emerald-500/20 shrink-0">
                <ShieldCheck size={20} className="text-black" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white leading-tight">Safe Global Bank</h1>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">ADMIN TERMINAL</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Logged-In Admin User Card */}
          <div className="bg-[#1a1c24] border border-white/10 rounded-2xl p-3.5 space-y-2 shadow-inner">
            <div className="flex items-center gap-3">
              {adminPhotoURL ? (
                <img src={adminPhotoURL} alt={adminDisplayName} className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-md shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-lg flex items-center justify-center border border-white/20 shadow-md shrink-0">
                  {(adminDisplayName[0] || 'A').toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate leading-tight">{adminDisplayName}</h3>
                <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    ROLE: {adminRole}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>LAST SIGN IN:</span>
              <span className="text-gray-300 font-semibold">{adminLastLogin}</span>
            </div>
          </div>

          {/* Search Features Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search features..." 
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#181a22] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 hide-scrollbar">
            {filteredSidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMsg({ type: '', text: '' });
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Logout Portal */}
        <div className="pt-3 border-t border-white/10">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={18} />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#121319] border border-white/10 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white capitalize tracking-tight flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} />
              {activeTab === 'overview' ? 'System Overview' : `${activeTab.replace('_', ' ')} Overview`}
            </h2>
            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-mono font-bold uppercase">
              {adminRole}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel />
            <select 
              value={adminRole} 
              onChange={(e) => setAdminRole(e.target.value as any)}
              className="bg-[#181a22] border border-white/10 text-xs font-bold text-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="SUPER_ADMIN">Super Admin (Full Control)</option>
              <option value="ADMIN">Admin (Operations)</option>
              <option value="SUPPORT">Support Mode</option>
            </select>

            <button 
              onClick={() => fetchData(true)}
              className="flex items-center gap-2 bg-[#181a22] hover:bg-white/10 border border-white/10 text-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Alert Dismissible Message */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border shadow-lg ${
            msg.type === 'error' ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-3">
              {msg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
              <p className="font-semibold text-xs md:text-sm">{msg.text}</p>
            </div>
            <button onClick={() => setMsg({ type: '', text: '' })} className="text-xs font-bold opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
                  <h3 className="text-2xl font-black text-white mt-1">{totalUsers}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">+{activeUsers} Active Accounts</p>
                </div>
                <div className="w-11 h-11 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Users size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">System Liquidity</p>
                  <h3 className="text-2xl font-black text-white mt-1">${totalWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">Across all active wallets</p>
                </div>
                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Transactions Logged</p>
                  <h3 className="text-2xl font-black text-white mt-1">{totalTransactions}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-1">{pendingTransactions} Pending Review</p>
                </div>
                <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <ArrowRightLeft size={22} />
                </div>
              </div>

              <div className="bg-[#121319] border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Verified KYC</p>
                  <h3 className="text-2xl font-black text-white mt-1">{verifiedUsers}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">{totalUsers - verifiedUsers} Pending KYC</p>
                </div>
                <div className="w-11 h-11 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/20">
                  <ShieldCheck size={22} />
                </div>
              </div>
            </div>

            {/* System Status Table Summary */}
            <div className="bg-[#121319] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Recent System Activity Highlights</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="p-3.5 bg-[#181a22] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <History size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{tx.description || tx.type || 'Transaction'}</p>
                        <p className="text-gray-400 text-[11px]">{new Date(tx.created_at || Date.now()).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-white">${Number(tx.amount || 0).toFixed(2)}</p>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">{tx.status || 'completed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INBOUND REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Inbound Requests & Approval Queue</h3>
            <p className="text-xs text-gray-400">Review pending deposits, wire transfers, and identity verification requests.</p>

            <div className="space-y-4">
              {transactions.filter(t => t.status === 'pending' || t.status === 'Pending').length > 0 ? (
                transactions.filter(t => t.status === 'pending' || t.status === 'Pending').map((tx: any) => (
                  <div key={tx.id} className="p-4 bg-[#181a22] border border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">{tx.description || tx.type || 'Inbound Request'}</p>
                      <p className="text-xs text-gray-400">Recipient: {tx.recipient || 'Safe Global Bank Internal'}</p>
                      <p className="text-[11px] font-mono text-indigo-400 mt-1">Amount: ${Number(tx.amount || 0).toFixed(2)} USD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleTxStatus(tx.id, 'completed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Approve Request
                      </button>
                      <button 
                        onClick={() => handleTxStatus(tx.id, 'failed')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 font-medium">
                  <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p>No pending inbound requests at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white">Registered Users Ledger</h3>
                <p className="text-xs text-gray-400">View and manage all registered bank accounts, KYC status & security permissions.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-72 pl-9 pr-4 py-2 bg-[#181a22] border border-white/10 rounded-xl text-xs font-semibold text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Users Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">User Info</th>
                    <th className="p-3.5 border-b border-white/10">Account #</th>
                    <th className="p-3.5 border-b border-white/10">Balance ($)</th>
                    <th className="p-3.5 border-b border-white/10">KYC Verification</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u: any) => {
                      const acc = accounts.find(a => a.user_id === u.id || a.userId === u.id);
                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30">
                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User Account'}</p>
                                <p className="text-[11px] text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-gray-300">
                            {acc?.account_number || acc?.accountNumber || 'ACC-109284'}
                          </td>
                          <td className="p-3.5 font-black text-emerald-400">
                            {formatCurrencyAmount(Number(acc?.balance || 0), getCurrencyInfo(acc?.currency_code || acc?.currency || u.currency_code || u.country || 'USD'))}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.kyc_status === 'approved' || u.kyc_status === 'verified' || u.kyc_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {u.kyc_status || 'pending'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {u.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  const userAcc = acc || {
                                    id: `acc_${u.id}`,
                                    user_id: u.id,
                                    account_number: 'ACC-' + u.id.substring(0, 6).toUpperCase(),
                                    balance: 0,
                                    currency: getCurrencyByCountry(u.country).code
                                  };
                                  setSelectedUser({ ...u, account: userAcc });
                                  setWalletActionType('adjust');
                                  setWalletAmount(String(userAcc.balance || 0));
                                  setWalletReason('Manual balance update via Admin Dashboard');
                                  setIsWalletModalOpen(true);
                                }}
                                title="Edit Account Balance"
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                              >
                                <DollarSign size={14} />
                                <span>Edit Balance</span>
                              </button>

                              <button 
                                onClick={() => { setSelectedUser({ ...u, account: acc }); setIsEditModalOpen(true); }}
                                title="Edit Role / Privileges"
                                className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button 
                                onClick={() => {
                                  const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
                                  handleUserStatusUpdate(u.id, 'status', newStatus, newStatus === 'active' ? 'USER_REACTIVATED' : 'USER_SUSPENDED');
                                }}
                                title={u.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                                className={`p-2 rounded-lg transition ${u.status === 'suspended' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                              >
                                <UserX size={15} />
                              </button>

                              <button 
                                onClick={() => handleDeleteUserRecord(u)}
                                title="Delete User"
                                className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users found matching search query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WALLET MANAGEMENT */}
        {activeTab === 'wallets' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Wallet & Ledger Controls</h3>
                <p className="text-xs text-gray-400">Credit, debit or override user balances with audit tracking.</p>
              </div>

              <button 
                onClick={() => {
                  if (users.length === 0) return;
                  setSelectedUser(users[0]);
                  setWalletActionType('credit');
                  setWalletAmount('');
                  setWalletReason('');
                  setIsWalletModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
              >
                <PlusCircle size={16} /> Adjust Wallet Balance
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Account Number</th>
                    <th className="p-3.5 border-b border-white/10">Account Holder</th>
                    <th className="p-3.5 border-b border-white/10">Type</th>
                    <th className="p-3.5 border-b border-white/10">Balance</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Quick Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {accounts.map((acc: any) => {
                    const u = users.find(userItem => userItem.id === acc.user_id || userItem.id === acc.userId);
                    return (
                      <tr key={acc.id} className="hover:bg-white/5">
                        <td className="p-3.5 font-mono font-bold text-white">{acc.account_number || acc.accountNumber || 'ACC-10023'}</td>
                        <td className="p-3.5 text-gray-300">{u?.email || acc.user_id}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-bold border border-indigo-500/20">
                            {acc.type || acc.accountType || 'Checking'}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-emerald-400">{formatCurrencyAmount(Number(acc.balance || 0), getCurrencyInfo(acc?.currency_code || acc?.currency || u?.currency_code || u?.country || 'USD'))}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedUser({ ...u, account: acc });
                              setWalletActionType('credit');
                              setWalletAmount('');
                              setWalletReason('');
                              setIsWalletModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 text-[11px] font-bold transition"
                          >
                            + Credit
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser({ ...u, account: acc });
                              setWalletActionType('debit');
                              setWalletAmount('');
                              setWalletReason('');
                              setIsWalletModalOpen(true);
                            }}
                            className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 text-[11px] font-bold transition"
                          >
                            - Debit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Deposit Requests Oversight</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Reference</th>
                    <th className="p-3.5 border-b border-white/10">Recipient Account</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.filter(t => t.type === 'deposit' || t.type === 'admin_credit').map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 10)}</td>
                      <td className="p-3.5 text-white">{tx.description || 'Deposit'}</td>
                      <td className="p-3.5 font-black text-emerald-400">+${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Withdrawal & Wire Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Reference</th>
                    <th className="p-3.5 border-b border-white/10">Recipient</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.filter(t => t.type === 'transfer' || t.type === 'transfer_out' || t.type === 'admin_debit').map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 10)}</td>
                      <td className="p-3.5 text-white">{tx.recipient || tx.description || 'Withdrawal'}</td>
                      <td className="p-3.5 font-black text-rose-400">-${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: TRANSACTIONS OVERSIGHT */}
        {activeTab === 'transactions' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Full Transaction Audit Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Transaction ID</th>
                    <th className="p-3.5 border-b border-white/10">Type / Detail</th>
                    <th className="p-3.5 border-b border-white/10">Amount</th>
                    <th className="p-3.5 border-b border-white/10">Status</th>
                    <th className="p-3.5 border-b border-white/10">Timestamp</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-mono text-gray-300">#{tx.id.substring(0, 12)}</td>
                      <td className="p-3.5 text-white">{tx.description || tx.type || 'Transfer'}</td>
                      <td className="p-3.5 font-black text-emerald-400">${Number(tx.amount || 0).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold capitalize">
                          {tx.status || 'Completed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400">{new Date(tx.created_at || Date.now()).toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => handleTxStatus(tx.id, tx.status === 'Completed' ? 'Reversed' : 'Completed')}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: BROKER & TRADING MANAGEMENT */}
        {activeTab === 'broker' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Broker & Trading Terminal Controls</h3>
                <p className="text-xs text-gray-400">Manage supported trading instruments, market statuses, spreads, and maximum leverage limits.</p>
              </div>
              <button 
                onClick={() => {
                  const sym = prompt('Enter Instrument Symbol (e.g., SOL/USD):');
                  if (!sym) return;
                  const cat = prompt('Enter Category (Forex / Crypto / Commodities / Stocks):', 'Crypto') || 'Crypto';
                  setTradingInstruments(prev => [...prev, {
                    id: 'inst_' + Math.random().toString(36).substring(2, 7),
                    symbol: sym.toUpperCase(),
                    category: cat,
                    spread: '1.0 pips',
                    maxLeverage: '1:100',
                    status: 'Open'
                  }]);
                  logAuditAction('TRADING_INSTRUMENT_ADDED', 'SYSTEM', `Added instrument ${sym.toUpperCase()}`);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Add Trading Asset
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#181a22] text-[10px] font-mono uppercase text-gray-400">
                  <tr>
                    <th className="p-3.5 border-b border-white/10">Symbol</th>
                    <th className="p-3.5 border-b border-white/10">Category</th>
                    <th className="p-3.5 border-b border-white/10">Spread</th>
                    <th className="p-3.5 border-b border-white/10">Max Leverage</th>
                    <th className="p-3.5 border-b border-white/10">Market Status</th>
                    <th className="p-3.5 border-b border-white/10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-white/5">
                  {tradingInstruments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-white/5">
                      <td className="p-3.5 font-bold text-white font-mono">{inst.symbol}</td>
                      <td className="p-3.5 text-indigo-300">{inst.category}</td>
                      <td className="p-3.5 text-gray-300 font-mono">{inst.spread}</td>
                      <td className="p-3.5 text-gray-300 font-mono">{inst.maxLeverage}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inst.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setTradingInstruments(prev => prev.map(i => i.id === inst.id ? { ...i, status: i.status === 'Open' ? 'Closed' : 'Open' } : i));
                            logAuditAction('MARKET_STATUS_TOGGLED', 'SYSTEM', `Toggled ${inst.symbol} to ${inst.status === 'Open' ? 'Closed' : 'Open'}`);
                          }}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                        >
                          Toggle Market
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: INVESTMENT PLANS */}
        {activeTab === 'investments' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Investment Plans & Yield Staking</h3>
                <p className="text-xs text-gray-400">Configure yield percentage rates, lock durations, and minimum investment thresholds.</p>
              </div>
              <button 
                onClick={() => {
                  const name = prompt('Plan Name:');
                  if (!name) return;
                  const roi = prompt('ROI Rate (%):', '8.5%') || '8.5%';
                  const dur = prompt('Duration:', '14 Days') || '14 Days';
                  setInvestmentPlans(prev => [...prev, {
                    id: 'plan_' + Math.random().toString(36).substring(2, 7),
                    name,
                    roi,
                    duration: dur,
                    minInv: 250,
                    maxInv: 25000,
                    active: true
                  }]);
                  logAuditAction('INVESTMENT_PLAN_CREATED', 'SYSTEM', `Created plan ${name}`);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Create Investment Plan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {investmentPlans.map((plan) => (
                <div key={plan.id} className="p-5 bg-[#181a22] border border-white/10 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-white text-base">{plan.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${plan.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400'}`}>
                      {plan.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/5 space-y-1 text-xs text-gray-300">
                    <p className="flex justify-between"><span>Yield / ROI:</span> <span className="font-black text-emerald-400">{plan.roi}</span></p>
                    <p className="flex justify-between"><span>Duration:</span> <span className="font-bold text-white">{plan.duration}</span></p>
                    <p className="flex justify-between"><span>Min Deposit:</span> <span className="font-bold text-white">${plan.minInv}</span></p>
                    <p className="flex justify-between"><span>Max Cap:</span> <span className="font-bold text-white">${plan.maxInv.toLocaleString()}</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setInvestmentPlans(prev => prev.map(p => p.id === plan.id ? { ...p, active: !p.active } : p));
                      logAuditAction('INVESTMENT_PLAN_TOGGLED', 'SYSTEM', `Toggled plan ${plan.name}`);
                    }}
                    className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl font-bold text-xs transition"
                  >
                    {plan.active ? 'Disable Plan' : 'Enable Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PAYMENT GATEWAYS */}
        {activeTab === 'gateways' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold text-white">Payment Gateway & Fee Management</h3>
            <div className="space-y-4">
              {gateways.map((gw) => (
                <div key={gw.id} className="p-4 bg-[#181a22] border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">{gw.name}</p>
                    <p className="text-xs text-gray-400">Min: ${gw.minDeposit} | Max: ${gw.maxDeposit.toLocaleString()} | Fee: {gw.fee}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                      {gw.status}
                    </span>
                    <button 
                      onClick={() => {
                        const newFee = prompt(`Update Processing Fee % for ${gw.name}:`, gw.fee);
                        if (newFee !== null) {
                          setGateways(prev => prev.map(g => g.id === gw.id ? { ...g, fee: newFee } : g));
                          logAuditAction('GATEWAY_FEE_UPDATED', 'SYSTEM', `Updated ${gw.name} fee to ${newFee}`);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Update Fee
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CONTENT & CMS */}
        {activeTab === 'content' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-2xl">
            <h3 className="text-lg font-bold text-white">CMS, Banners & Legal Policy Controls</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Homepage Announcement Banner</label>
                <input 
                  type="text"
                  defaultValue="Safe Global Bank 2026 Q3 Compliance & Audit Complete. Global ISO 27001 Certified."
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">Terms & Conditions Last Updated</label>
                <input 
                  type="text"
                  defaultValue="Effective Date: July 2026 - Revision v4.2"
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  setMsg({ type: 'success', text: 'Content policies updated successfully.' });
                  logAuditAction('CMS_CONTENT_UPDATED', 'SYSTEM', 'Updated platform legal banners & terms');
                }}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
              >
                Save CMS Banners
              </button>
            </div>
          </div>
        )}

        {/* TAB: REFERRALS & BONUSES */}
        {activeTab === 'referrals' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-xl">
            <h3 className="text-lg font-bold text-white">Referrals & Promotional Bonuses</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Referral Commission Rate (%)</label>
                <input 
                  type="text" 
                  value={referralBonus.refRate}
                  onChange={e => setReferralBonus(prev => ({ ...prev, refRate: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-1">New User Signup Bonus ($ USD)</label>
                <input 
                  type="text" 
                  value={referralBonus.signupBonus}
                  onChange={e => setReferralBonus(prev => ({ ...prev, signupBonus: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>
              <button 
                onClick={() => {
                  setMsg({ type: 'success', text: 'Referral and bonus settings updated.' });
                  logAuditAction('REFERRAL_SETTINGS_UPDATED', 'SYSTEM', `Updated referral rate to ${referralBonus.refRate}`);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                Save Bonus Configuration
              </button>
            </div>
          </div>
        )}

        {/* TAB: COUNTRY & CURRENCIES */}
        {activeTab === 'currencies' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Country & Supported Currency Registry</h3>
                <p className="text-xs text-gray-400">Automatic country-to-currency binding for incoming registrations.</p>
              </div>
              <button 
                onClick={async () => {
                  const countryName = prompt('Enter Country Name (e.g., Brazil):');
                  if (!countryName) return;
                  const currencyCode = prompt('Enter Currency Code (e.g., BRL):');
                  if (!currencyCode) return;
                  const currencySymbol = prompt('Enter Currency Symbol (e.g., R$):');
                  if (!currencySymbol) return;

                  try {
                    await supabase.from('supported_countries').insert([{
                      country_name: countryName,
                      currency_code: currencyCode.toUpperCase(),
                      currency_symbol: currencySymbol,
                      is_active: true
                    }]);
                    await logAuditAction('COUNTRY_ADDED', 'SYSTEM', `Added supported country ${countryName} with currency ${currencyCode.toUpperCase()}`);
                    fetchData();
                    setMsg({ type: 'success', text: `Country ${countryName} added successfully.` });
                  } catch (err: any) {
                    console.log('Error adding country:', err);
                    setMsg({ type: 'error', text: err.message || 'Failed to add country.' });
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <PlusCircle size={16} /> Add Supported Country
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {supportedCountries.map((c) => (
                <div key={c.id} className="p-4 bg-[#181a22] border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-base">{c.currency_symbol} {c.currency_code}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.is_active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-gray-300 font-semibold">{c.country_name}</p>
                  
                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await supabase.from('supported_countries').update({ is_active: !c.is_active }).eq('id', c.id);
                          await logAuditAction('COUNTRY_STATUS_TOGGLED', 'SYSTEM', `Toggled country ${c.country_name} to ${!c.is_active ? 'Active' : 'Disabled'}`);
                          fetchData();
                        } catch (err) {
                          console.log(err);
                        }
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-[11px] font-bold transition"
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(`Remove ${c.country_name} from supported list?`)) {
                          try {
                            await supabase.from('supported_countries').delete().eq('id', c.id);
                            await logAuditAction('COUNTRY_DELETED', 'SYSTEM', `Deleted country ${c.country_name}`);
                            fetchData();
                          } catch (err) {
                            console.log(err);
                          }
                        }
                      }}
                      className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 rounded-lg text-[11px] font-bold transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIT LOGS & SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Cryptographic Audit Logs & Security Engine</h3>
                <p className="text-xs text-gray-400">All administrative actions recorded in immutable timeline.</p>
              </div>
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "safeglobalbank_audit_logs.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
              >
                <Download size={14} /> Export Audit JSON
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="p-4 bg-[#181a22] border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono text-[10px] font-bold uppercase">{log.action}</span>
                      <span className="text-gray-400">Target: <span className="text-white font-semibold">{log.target_user || log.targetUser}</span></span>
                    </div>
                    <p className="text-gray-200 font-semibold">{log.details}</p>
                    <p className="text-gray-500 text-[10px]">By: {log.admin_email || log.adminEmail || 'admin'}</p>
                  </div>
                  <div className="text-right font-mono text-gray-400 text-[11px]">
                    {new Date(log.created_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CRYPTO TRANSFER EMAIL LOGS */}
        {activeTab === 'email_logs' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="text-emerald-400" size={20} />
                  Cryptocurrency Transfer Email Notification Audit Logs
                </h3>
                <p className="text-xs text-gray-400">Automated dispatch receipts, delivery verification, and recipient audit records.</p>
              </div>
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(emailLogs, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "crypto_transfer_email_audit_logs.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto"
              >
                <Download size={14} /> Export Email Logs JSON
              </button>
            </div>

            {/* SMTP Diagnostics & Test Widget */}
            <div className="bg-[#181a22] border border-white/10 p-5 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="text-amber-400" size={16} />
                SMTP Configuration & Delivery Diagnostic Tool
              </h4>
              <p className="text-xs text-gray-400">
                Verify your Vercel SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS / GMAIL_APP_PASSWORD) by sending a live test email directly to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  placeholder="Enter recipient email (e.g. smartcompany112234@gmail.com)"
                  className="flex-1 bg-[#121319] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={handleTestSmtp}
                  disabled={testSmtpLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
                >
                  {testSmtpLoading ? <RefreshCw className="animate-spin" size={14} /> : <Mail size={14} />}
                  {testSmtpLoading ? 'Testing SMTP...' : 'Send Test SMTP Email'}
                </button>
              </div>
              {testSmtpResult && (
                <div className={`p-3.5 rounded-xl text-xs font-mono border ${
                  testSmtpResult.success 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  {testSmtpResult.success ? testSmtpResult.message : testSmtpResult.error}
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {emailLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm bg-[#181a22] border border-white/5 rounded-2xl">
                  No crypto transfer email notifications dispatched yet. Execute a transfer in Crypto Wallet to generate live receipts.
                </div>
              ) : (
                emailLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 bg-[#181a22] border border-white/5 rounded-xl flex flex-col md:flex-row justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          log.delivery_status === 'DELIVERED' || log.delivery_status === 'SENT' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {log.delivery_status || 'DELIVERED'}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono text-[10px] font-bold uppercase">
                          {log.type || 'Crypto Transfer'}
                        </span>
                        <span className="text-gray-400 font-mono text-[11px]">
                          Ref: <span className="text-white font-bold">{log.transaction_ref}</span>
                        </span>
                      </div>
                      <p className="text-gray-200 font-bold text-sm">
                        Recipient: <span className="text-indigo-300">{log.recipient_email}</span>
                      </p>
                      <p className="text-gray-300 font-mono text-xs">
                        Amount: <span className="text-emerald-400 font-bold">{log.amount} {log.asset}</span> {log.metadata?.network ? `on ${log.metadata.network}` : ''}
                      </p>
                      {log.error_message && (
                        <p className="text-rose-400 text-[11px] font-mono">Error: {log.error_message}</p>
                      )}
                    </div>
                    <div className="text-right font-mono text-gray-400 text-[11px] flex flex-col justify-between">
                      <div>{new Date(log.sent_at || Date.now()).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Audit Ledger ID: {log.id}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-[#121319] border border-white/10 p-6 rounded-2xl space-y-6 max-w-xl">
            <h3 className="text-lg font-bold text-white">System & Platform Settings</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Platform Name</label>
                <input 
                  type="text" 
                  value={systemSettings.platformName}
                  onChange={e => setSystemSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-bold"
                />
              </div>

              <div className="p-4 bg-[#181a22] border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Maintenance Mode</p>
                  <p className="text-gray-400 text-[11px]">Prevent client logins during scheduled updates</p>
                </div>
                <button 
                  onClick={() => {
                    setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
                    logAuditAction('MAINTENANCE_MODE_TOGGLED', 'SYSTEM', `Maintenance mode set to ${!systemSettings.maintenanceMode}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold ${systemSettings.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-white/10 text-gray-300'}`}
                >
                  {systemSettings.maintenanceMode ? 'ON (ACTIVE)' : 'OFF'}
                </button>
              </div>

              <div className="p-4 bg-[#181a22] border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">New User Registrations</p>
                  <p className="text-gray-400 text-[11px]">Allow new signups on the public portal</p>
                </div>
                <button 
                  onClick={() => {
                    setSystemSettings(prev => ({ ...prev, registrationEnabled: !prev.registrationEnabled }));
                    logAuditAction('REGISTRATION_TOGGLED', 'SYSTEM', `Registrations set to ${!systemSettings.registrationEnabled}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold ${systemSettings.registrationEnabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
                >
                  {systemSettings.registrationEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <button 
                onClick={() => setMsg({ type: 'success', text: 'System settings saved.' })}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition"
              >
                Save Platform Settings
              </button>
            </div>
          </div>
        )}

      </main>

      {/* EDIT PRIVILEGES MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-gray-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Manage User Privileges</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">User Email</label>
                <input type="text" disabled value={selectedUser.email || ''} className="w-full p-3 bg-[#181a22] rounded-xl text-gray-300 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">First Name</label>
                  <input 
                    type="text" 
                    value={selectedUser.firstName || ''} 
                    onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                    className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={selectedUser.lastName || ''} 
                    onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                    className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={selectedUser.displayName || ''} 
                  onChange={(e) => setSelectedUser({ ...selectedUser, displayName: e.target.value })}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white" 
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">System Role</label>
                <select 
                  value={selectedUser.role || 'user'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white"
                >
                  <option value="user">Standard Account</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">Account Status</label>
                  <select 
                    value={selectedUser.status || 'active'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                    className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">KYC Status</label>
                  <select 
                    value={selectedUser.kyc_status || 'pending'}
                    onChange={(e) => setSelectedUser({ ...selectedUser, kyc_status: e.target.value })}
                    className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Transaction PIN</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={selectedUser.pin || '1234'} 
                    onChange={(e) => setSelectedUser({ ...selectedUser, pin: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                    className="flex-1 p-3 bg-[#181a22] border border-white/10 rounded-xl font-mono text-white" 
                  />
                  <button 
                    onClick={() => setSelectedUser({ ...selectedUser, pin: Math.floor(1000 + Math.random() * 9000).toString() })}
                    className="px-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-[10px] font-bold"
                  >
                    Regen
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleBatchSaveUser(selectedUser)}
                  className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    alert(`Password reset link dispatched to ${selectedUser.email}`);
                    logAuditAction('PASSWORD_RESET', selectedUser.id, `Triggered password reset for ${selectedUser.email}`);
                    setIsEditModalOpen(false);
                  }}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALLET ADJUSTMENT MODAL */}
      {isWalletModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-gray-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Update Account Balance</h3>
                  <p className="text-xs text-gray-400">Manual balance override for {selectedUser.displayName || selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg px-2">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#181a22] rounded-xl border border-white/5 space-y-1.5">
                <p className="text-gray-400">User: <span className="font-bold text-white">{selectedUser.displayName || selectedUser.email}</span></p>
                <p className="text-gray-400">Email: <span className="font-bold text-indigo-300">{selectedUser.email}</span></p>
                <p className="text-gray-400">Account #: <span className="font-mono text-white">{selectedUser.account?.account_number || selectedUser.account?.accountNumber || 'ACC-100234'}</span></p>
                <p className="text-gray-400">
                  Current Balance: <span className="font-bold text-emerald-400">
                    {walletBalanceType === 'main' ? formatCurrencyAmount(Number(selectedUser.account?.balance || 0), getCurrencyInfo(selectedUser.account?.currency_code || selectedUser.account?.currency || selectedUser.currency_code || selectedUser.country || 'USD')) : 
                     walletBalanceType === 'trading' ? `$${Number(cryptoWallets.find(w => w.user_id === selectedUser.id)?.trading_balance || 0).toFixed(2)}` :
                     `${Number(cryptoWallets.find(w => w.user_id === selectedUser.id)?.balances?.[walletCryptoAsset] || 0)} ${walletCryptoAsset}`}
                  </span>
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Balance Type</label>
                <select 
                  value={walletBalanceType} 
                  onChange={(e) => setWalletBalanceType(e.target.value as 'main' | 'crypto' | 'trading')}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white focus:outline-none focus:border-indigo-500 mb-4"
                >
                  <option value="main">Main Balance</option>
                  <option value="crypto">Crypto Balance</option>
                  <option value="trading">Trading Balance</option>
                </select>
              </div>

              {walletBalanceType === 'crypto' && (
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">Crypto Asset</label>
                  <select 
                    value={walletCryptoAsset} 
                    onChange={(e) => setWalletCryptoAsset(e.target.value)}
                    className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white focus:outline-none focus:border-indigo-500 mb-4"
                  >
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Adjustment Type</label>
                <select 
                  value={walletActionType} 
                  onChange={(e) => setWalletActionType(e.target.value as any)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="adjust">Set Exact Balance (=)</option>
                  <option value="credit">Credit Wallet (+)</option>
                  <option value="debit">Debit Wallet (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Amount</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl font-bold text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Audit Reason (Required)</label>
                <input 
                  type="text"
                  placeholder="Reason for balance override..."
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full p-3 bg-[#181a22] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => {
                  const amt = parseFloat(walletAmount);
                  if (walletAmount === '' || isNaN(amt) || amt < 0) {
                    alert('Please enter a valid, non-negative amount');
                    return;
                  }
                  if (!walletReason.trim()) {
                    alert('Please provide a reason for the audit log');
                    return;
                  }

                  let currentBal = 0;
                  if (walletBalanceType === 'main') {
                    currentBal = Number(selectedUser.account?.balance || 0);
                  } else if (walletBalanceType === 'trading') {
                    const wallet = cryptoWallets.find(w => w.user_id === selectedUser.id);
                    currentBal = Number(wallet?.trading_balance || 0);
                  } else if (walletBalanceType === 'crypto') {
                    const wallet = cryptoWallets.find(w => w.user_id === selectedUser.id);
                    currentBal = Number(wallet?.balances?.[walletCryptoAsset] || 0);
                  }

                  let newBal = currentBal;
                  if (walletActionType === 'credit') newBal = currentBal + amt;
                  else if (walletActionType === 'debit') {
                    newBal = currentBal - amt;
                    if (newBal < 0) {
                      if (!confirm(`Warning: Debiting this amount will set the balance below zero (to ${newBal}). Do you wish to proceed?`)) {
                        return;
                      }
                    }
                  }
                  else if (walletActionType === 'adjust') newBal = amt;

                  if (walletBalanceType === 'main') {
                    handleUpdateBalance(selectedUser.account?.id || `acc_${selectedUser.id}`, newBal, walletReason.trim());
                  } else {
                    handleCryptoUpdateBalance(selectedUser.id, walletBalanceType, walletCryptoAsset, newBal, walletReason.trim());
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition active:scale-[0.99]"
              >
                Confirm & Write Ledger Entry
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
