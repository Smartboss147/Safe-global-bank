import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatCurrencyAmount, getCurrencyInfo } from '../../utils/currency';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Copy, QrCode, ChevronDown, CheckCircle, XCircle, Check, Wallet, Landmark, Zap, Mail, FileText, Download, X, History, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { sendCryptoTransferEmail, getLocalEmailAuditLogs } from '../../services/cryptoEmailService';
import { generateCryptoTransferEmailHtml } from '../../services/emailTemplates';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64200.50, networks: ['Bitcoin (BTC)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, networks: ['Ethereum (ERC20)', 'Arbitrum One', 'Optimism', 'Base'] },
  { symbol: 'USDT', name: 'TetherUS', price: 1.00, networks: ['Tron (TRC20)', 'Ethereum (ERC20)', 'BNB Smart Chain (BEP20)'] },
  { symbol: 'BNB', name: 'BNB', price: 580.40, networks: ['BNB Smart Chain (BEP20)'] },
  { symbol: 'SOL', name: 'Solana', price: 145.30, networks: ['Solana'] },
  { symbol: 'XRP', name: 'XRP', price: 0.60, networks: ['Ripple'] },
  { symbol: 'LTC', name: 'Litecoin', price: 82.50, networks: ['Litecoin'] }
];

const createDefaultWallet = (userId: string) => {
  const cleanId = (userId || 'user').replace(/[^a-f0-9]/gi, '').padEnd(40, 'a').slice(0, 40);
  return {
    user_id: userId,
    balances: SUPPORTED_COINS.reduce((acc: any, coin) => ({ ...acc, [coin.symbol]: 0 }), {}),
    trading_balance: 0,
    address: '0x' + cleanId
  };
};

const getInitialWallet = (userId: string) => {
  const defaultW = createDefaultWallet(userId);
  if (typeof window !== 'undefined' && userId) {
    try {
      const stored = localStorage.getItem(`crypto_wallet_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.balances === 'object') {
          return {
            ...defaultW,
            ...parsed,
            balances: { ...defaultW.balances, ...parsed.balances }
          };
        }
      }
    } catch (e) {
      console.warn('Error reading crypto wallet from localStorage:', e);
    }
  }
  return defaultW;
};

export default function CryptoWallet({ user, account, fetchAccount }: any) {
  // Synchronous immediate initialization from localStorage cache if available
  const [wallet, setWallet] = useState<any>(() => getInitialWallet(user?.id));
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'receive' | 'send' | 'main_transfer' | 'history'>('portfolio');
  
  // Confirmation Modal state for transfers
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalDetails, setConfirmModalDetails] = useState<{
    title: string;
    from: string;
    to: string;
    amount: string;
    equivalent?: string;
    fee: string;
    type: 'main_transfer' | 'send_crypto';
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Receive state
  const [selectedReceiveAsset, setSelectedReceiveAsset] = useState(SUPPORTED_COINS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_COINS[0].networks[0]);

  // Send state
  const [sendAsset, setSendAsset] = useState(SUPPORTED_COINS[0]);
  const [sendNetwork, setSendNetwork] = useState(SUPPORTED_COINS[0].networks[0]);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  // Main Balance Transfer state
  const [mainTransferAsset, setMainTransferAsset] = useState(SUPPORTED_COINS[2]); // Default USDT
  const [mainTransferAmount, setMainTransferAmount] = useState('');
  const [mainTransferLoading, setMainTransferLoading] = useState(false);

  // Transaction Ledger & Email Receipts State
  const [recentCryptoTxs, setRecentCryptoTxs] = useState<any[]>([]);
  const [selectedEmailReceipt, setSelectedEmailReceipt] = useState<any | null>(null);
  const [latestReceiptParams, setLatestReceiptParams] = useState<any | null>(null);

  const [msg, setMsg] = useState({ type: '', text: '' });

  const currInfo = getCurrencyInfo(user?.currency_code || user?.currency || user?.country || 'USD');

  // Fetch recent transactions & audit logs
  const fetchRecentTxs = async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch from crypto_transactions table in Supabase
      const { data: dbCryptoTxs } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Fetch email audit logs from local storage & Supabase
      const localLogs = getLocalEmailAuditLogs();
      let dbEmailLogs: any[] = [];
      try {
        const { data } = await supabase
          .from('email_audit_logs')
          .select('*')
          .eq('recipient_email', user.email)
          .order('sent_at', { ascending: false });
        dbEmailLogs = data || [];
      } catch (e) {
        console.warn('DB email audit log query notice:', e);
      }

      const allEmailLogs = [...dbEmailLogs, ...localLogs];

      // Merge crypto_transactions with matching email logs
      const combinedTxs = (dbCryptoTxs || []).map((tx: any) => {
        const matchingLog = allEmailLogs.find((l: any) => 
          l.transaction_ref === tx.id || 
          l.transaction_ref === tx.reference_id ||
          (l.amount === tx.amount && l.asset === tx.asset)
        );
        return {
          ...tx,
          emailLog: matchingLog
        };
      });

      // Add any standalone email logs
      allEmailLogs.forEach((log: any) => {
        if (!combinedTxs.some((t: any) => t.emailLog?.transaction_ref === log.transaction_ref || t.id === log.transaction_ref)) {
          combinedTxs.push({
            id: log.transaction_ref || log.id,
            user_id: user.id,
            type: log.type === 'outgoing' ? 'withdrawal' : 'deposit',
            asset: log.asset || 'BTC',
            network: log.metadata?.network || 'Blockchain',
            amount: log.amount || 0,
            address: log.metadata?.walletAddress || log.recipient_email,
            status: 'completed',
            created_at: log.sent_at || new Date().toISOString(),
            emailLog: log
          });
        }
      });

      combinedTxs.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setRecentCryptoTxs(combinedTxs);
    } catch (err) {
      console.warn('[CryptoWallet] Error loading crypto activity:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const syncWallet = async () => {
      try {
        const localW = getInitialWallet(user.id);

        // 1. Fetch wallet record from Supabase
        const { data: dbWallet } = await supabase
          .from('crypto_wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Fetch completed crypto transactions from Supabase to derive ledger-backed balances
        const { data: dbTxs } = await supabase
          .from('crypto_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const txCalculatedBalances: Record<string, number> = {};
        if (dbTxs && dbTxs.length > 0) {
          dbTxs.forEach((tx: any) => {
            const symbol = tx.asset || tx.symbol;
            if (!symbol) return;
            const amt = Number(tx.amount || 0);
            if (tx.type === 'deposit' || tx.type === 'incoming') {
              txCalculatedBalances[symbol] = Number(((txCalculatedBalances[symbol] || 0) + amt).toFixed(6));
            } else if (tx.type === 'withdrawal' || tx.type === 'outgoing') {
              txCalculatedBalances[symbol] = Number(((txCalculatedBalances[symbol] || 0) - amt).toFixed(6));
            }
          });
        }

        const defaultW = createDefaultWallet(user.id);
        const dbBalances = dbWallet?.balances || {};
        const localBalances = localW?.balances || {};
        const mergedBalances = { ...defaultW.balances };

        // Consolidate balance for each asset using maximum of recorded values
        Object.keys(defaultW.balances).forEach((sym) => {
          const dbVal = Number(dbBalances[sym] || 0);
          const localVal = Number(localBalances[sym] || 0);
          const txVal = Number(txCalculatedBalances[sym] || 0);

          mergedBalances[sym] = Math.max(dbVal, localVal, txVal);
        });

        const activeId = dbWallet?.id || localW?.id;

        const updatedWallet = {
          ...(activeId ? { id: activeId } : {}),
          user_id: user.id,
          balances: mergedBalances,
          trading_balance: dbWallet?.trading_balance ?? localW?.trading_balance ?? 0,
          address: dbWallet?.address || localW?.address || defaultW.address
        };

        if (isMounted) {
          setWallet(updatedWallet);
          try {
            localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(updatedWallet));
          } catch (e) {}

          // Upsert back to Supabase and capture saved DB record to retain UUID id
          const { data: savedDbWallet } = await supabase
            .from('crypto_wallets')
            .upsert({
              ...(updatedWallet.id ? { id: updatedWallet.id } : {}),
              user_id: user.id,
              balances: mergedBalances,
              address: updatedWallet.address
            }, { onConflict: 'user_id' })
            .select()
            .maybeSingle();

          if (savedDbWallet?.id && isMounted) {
            const refreshedWallet = { ...updatedWallet, id: savedDbWallet.id };
            setWallet(refreshedWallet);
            try {
              localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(refreshedWallet));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Crypto wallet sync notice:', err);
      }
    };

    syncWallet();
    fetchRecentTxs();

    const cryptoChannel = supabase.channel(`crypto_wallet_realtime_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_wallets', filter: `user_id=eq.${user.id}` }, () => {
        syncWallet();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_transactions', filter: `user_id=eq.${user.id}` }, () => {
        fetchRecentTxs();
      })
      .subscribe();

    return () => { 
      isMounted = false; 
      supabase.removeChannel(cryptoChannel);
    };
  }, [user?.id]);

  const handleCopyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = SUPPORTED_COINS.find(a => a.symbol === e.target.value) || SUPPORTED_COINS[0];
    setSelectedReceiveAsset(asset);
    setSelectedNetwork(asset.networks[0]);
  };

  const handleSendAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asset = SUPPORTED_COINS.find(a => a.symbol === e.target.value) || SUPPORTED_COINS[0];
    setSendAsset(asset);
    setSendNetwork(asset.networks[0]);
  };

  // Form submit handler for Send Crypto - Triggers Confirmation Modal
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    const val = parseFloat(sendAmount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid transfer amount.' });
      return;
    }

    if (!sendAddress.trim()) {
      setMsg({ type: 'error', text: 'Please enter a valid destination address.' });
      return;
    }

    const currentBalance = Number((wallet?.balances && wallet.balances[sendAsset.symbol]) || 0);
    if (currentBalance < val) {
      setMsg({ type: 'error', text: `Insufficient ${sendAsset.symbol} balance. Available: ${currentBalance} ${sendAsset.symbol}` });
      return;
    }

    setConfirmModalDetails({
      title: 'Confirm Crypto Send / Withdrawal',
      from: `Crypto Wallet (${sendAsset.symbol})`,
      to: sendAddress,
      amount: `${val} ${sendAsset.symbol}`,
      equivalent: formatCurrencyAmount(val * sendAsset.price, currInfo),
      fee: `0.0005 ${sendAsset.symbol} (Network Gas)`,
      type: 'send_crypto',
      onConfirm: () => executeSend(val)
    });
    setShowConfirmModal(true);
  };

  // Execution function for Send Crypto after user confirms in Modal
  const executeSend = async (val: number) => {
    setConfirmLoading(true);
    setSendLoading(true);

    try {
      const refId = `CTX-${Math.floor(100000 + Math.random() * 900000)}`;
      const currentBalance = Number((wallet?.balances && wallet.balances[sendAsset.symbol]) || 0);
      const newCoinBal = Number((currentBalance - val).toFixed(6));
      const newBalances = { ...(wallet?.balances || {}), [sendAsset.symbol]: newCoinBal };

      const updatedWallet = {
        ...wallet,
        user_id: user.id,
        balances: newBalances
      };

      setWallet(updatedWallet);
      try {
        localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(updatedWallet));
      } catch (e) {}

      // Upsert into Supabase DB and capture saved wallet ID
      let activeWalletId = wallet?.id;
      try {
        const { data: upserted } = await supabase
          .from('crypto_wallets')
          .upsert({
            ...(wallet?.id ? { id: wallet.id } : {}),
            user_id: user.id,
            balances: newBalances,
            address: wallet?.address || createDefaultWallet(user.id).address
          }, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (upserted?.id) {
          activeWalletId = upserted.id;
          const freshWallet = { ...updatedWallet, id: activeWalletId };
          setWallet(freshWallet);
          try {
            localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(freshWallet));
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn('Crypto wallet database sync notice:', dbErr);
      }

      // 1. Create completed transaction in crypto_transactions
      await supabase.from('crypto_transactions').insert([{
        id: refId,
        user_id: user.id,
        wallet_id: activeWalletId || null,
        type: 'withdrawal',
        asset: sendAsset.symbol,
        network: sendNetwork,
        amount: val,
        address: sendAddress,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

      // 2. Also record in primary bank account transactions table for main statement history
      if (account?.id) {
        await supabase.from('transactions').insert([{
          user_id: user.id,
          account_id: account.id,
          type: 'transfer_out',
          transfer_type: 'crypto_withdrawal',
          amount: val * sendAsset.price,
          recipient: `${sendAddress} (${sendAsset.symbol})`,
          bank_name: `${sendAsset.name} Network (${sendNetwork})`,
          description: `Crypto Transfer Out: ${val} ${sendAsset.symbol} to ${sendAddress}`,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);
      }

      const emailParams = {
        type: 'outgoing' as const,
        recipientName: user.displayName || user.email?.split('@')[0] || 'Valued Client',
        recipientEmail: user.email,
        asset: sendAsset.symbol,
        assetName: sendAsset.name,
        amount: val,
        network: sendNetwork,
        walletAddress: sendAddress,
        status: 'Completed',
        referenceId: refId,
        updatedBalance: `${newBalances[sendAsset.symbol]} ${sendAsset.symbol}`
      };

      if (user?.email) {
        await sendCryptoTransferEmail(emailParams);
      }

      setLatestReceiptParams(emailParams);
      setMsg({ 
        type: 'success', 
        text: `Successfully sent ${val} ${sendAsset.symbol} to ${sendAddress}. Confirmation email sent to ${user.email}.` 
      });
      setSendAmount('');
      setSendAddress('');
      setShowConfirmModal(false);
      await fetchRecentTxs();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to process withdrawal.' });
    } finally {
      setSendLoading(false);
      setConfirmLoading(false);
    }
  };

  const handleReceiveSimulation = async () => {
    setMsg({ type: '', text: '' });
    try {
      const depositVal = 0.05;
      const refId = `CTX-${Math.floor(100000 + Math.random() * 900000)}`;

      const currentBal = Number((wallet?.balances && wallet.balances[selectedReceiveAsset.symbol]) || 0);
      const newBalances = { ...(wallet?.balances || {}), [selectedReceiveAsset.symbol]: currentBal + depositVal };

      const updatedWallet = { ...wallet, user_id: user.id, balances: newBalances };
      setWallet(updatedWallet);
      try {
        localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(updatedWallet));
      } catch (e) {}

      let activeWalletId = wallet?.id;
      try {
        const { data: upserted } = await supabase
          .from('crypto_wallets')
          .upsert({
            ...(wallet?.id ? { id: wallet.id } : {}),
            user_id: user.id,
            balances: newBalances,
            address: wallet?.address || createDefaultWallet(user.id).address
          }, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (upserted?.id) {
          activeWalletId = upserted.id;
          const freshWallet = { ...updatedWallet, id: activeWalletId };
          setWallet(freshWallet);
          try {
            localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(freshWallet));
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn('Crypto wallet receive sync notice:', dbErr);
      }

      await supabase.from('crypto_transactions').insert([{
        id: refId,
        user_id: user.id,
        wallet_id: activeWalletId || null,
        type: 'deposit',
        asset: selectedReceiveAsset.symbol,
        network: selectedNetwork,
        amount: depositVal,
        address: wallet?.address || createDefaultWallet(user.id).address,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

      const emailParams = {
        type: 'incoming' as const,
        recipientName: user.displayName || user.email?.split('@')[0] || 'Valued Client',
        recipientEmail: user.email,
        asset: selectedReceiveAsset.symbol,
        assetName: selectedReceiveAsset.name,
        amount: depositVal,
        network: selectedNetwork,
        walletAddress: wallet.address,
        status: 'Completed',
        referenceId: refId,
        updatedBalance: `${newBalances[selectedReceiveAsset.symbol]} ${selectedReceiveAsset.symbol}`
      };

      if (user?.email) {
        await sendCryptoTransferEmail(emailParams);
      }

      setLatestReceiptParams(emailParams);
      setMsg({ type: 'success', text: `Deposit of ${depositVal} ${selectedReceiveAsset.symbol} confirmed! Confirmation email dispatched to ${user.email}.` });
      await fetchRecentTxs();
    } catch (err) {
       setMsg({ type: 'error', text: 'Failed to process deposit notification.' });
    }
  };

  // Form submit handler for Main Balance to Crypto Transfer - Triggers Confirmation Modal
  const handleMainBalanceTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    const val = parseFloat(mainTransferAmount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid transfer amount.' });
      return;
    }

    const currentMainBal = Number(account?.balance || 0);
    if (currentMainBal < val) {
      setMsg({ type: 'error', text: `Insufficient main balance. Available: ${formatCurrencyAmount(currentMainBal, currInfo)}` });
      return;
    }

    const cryptoAmount = Number((val / mainTransferAsset.price).toFixed(mainTransferAsset.symbol === 'USDT' ? 2 : 6));

    setConfirmModalDetails({
      title: 'Confirm Transfer to Crypto Wallet',
      from: `Primary Bank Account (${formatCurrencyAmount(currentMainBal, currInfo)})`,
      to: `Crypto Wallet (${mainTransferAsset.symbol})`,
      amount: formatCurrencyAmount(val, currInfo),
      equivalent: `~ ${cryptoAmount} ${mainTransferAsset.symbol}`,
      fee: '$0.00 (Waived - Instant Topup)',
      type: 'main_transfer',
      onConfirm: () => executeMainBalanceTransfer(val, cryptoAmount)
    });
    setShowConfirmModal(true);
  };

  // Execution function for Main Balance Transfer after user confirms in Modal
  const executeMainBalanceTransfer = async (val: number, cryptoAmount: number) => {
    setConfirmLoading(true);
    setMainTransferLoading(true);

    const currentMainBal = Number(account?.balance || 0);

    try {
      const refId = `CTX-MAIN-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Deduct from main bank account balance in Supabase
      const newMainBal = currentMainBal - val;
      if (account?.id) {
        await supabase.from('accounts').update({ balance: newMainBal }).eq('id', account.id);
      }

      // 2. Add to user's crypto wallet balance
      const currentCoinBal = Number((wallet?.balances && wallet.balances[mainTransferAsset.symbol]) || 0);
      const newCoinBal = Number((currentCoinBal + cryptoAmount).toFixed(mainTransferAsset.symbol === 'USDT' ? 2 : 6));
      const newBalances = { ...(wallet?.balances || {}), [mainTransferAsset.symbol]: newCoinBal };

      const updatedWallet = {
        ...wallet,
        user_id: user.id,
        balances: newBalances
      };

      setWallet(updatedWallet);
      try {
        localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(updatedWallet));
      } catch (e) {}

      // Upsert into Supabase crypto_wallets and capture saved wallet ID
      let activeWalletId = wallet?.id;
      try {
        const { data: upserted } = await supabase
          .from('crypto_wallets')
          .upsert({
            ...(wallet?.id ? { id: wallet.id } : {}),
            user_id: user.id,
            balances: newBalances,
            address: wallet?.address || createDefaultWallet(user.id).address
          }, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (upserted?.id) {
          activeWalletId = upserted.id;
          const freshWallet = { ...updatedWallet, id: activeWalletId };
          setWallet(freshWallet);
          try {
            localStorage.setItem(`crypto_wallet_${user.id}`, JSON.stringify(freshWallet));
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn('[CryptoWallet] DB upsert notice:', dbErr);
      }

      // 3. Insert transaction log into crypto_transactions table unconditionally
      await supabase.from('crypto_transactions').insert([{
        id: refId,
        user_id: user.id,
        wallet_id: activeWalletId || null,
        type: 'deposit',
        asset: mainTransferAsset.symbol,
        network: 'Main Balance Instant Transfer',
        amount: cryptoAmount,
        address: wallet?.address || 'Internal Account',
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

      // 4. Insert transaction log into bank transactions table for statement history
      if (account?.id) {
        await supabase.from('transactions').insert([{
          user_id: user.id,
          account_id: account.id,
          type: 'transfer_out',
          transfer_type: 'crypto_topup',
          amount: val,
          recipient: `Crypto Wallet (${mainTransferAsset.symbol})`,
          bank_name: 'Safe Global Bank Crypto Services',
          description: `Transfer to Crypto Wallet: ${cryptoAmount} ${mainTransferAsset.symbol}`,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);
      }

      if (typeof fetchAccount === 'function') {
        fetchAccount();
      }

      const emailParams = {
        type: 'incoming' as const,
        recipientName: user.displayName || user.email?.split('@')[0] || 'Valued Client',
        recipientEmail: user.email,
        asset: mainTransferAsset.symbol,
        assetName: mainTransferAsset.name,
        amount: cryptoAmount,
        network: 'Main Bank Account Transfer',
        walletAddress: wallet?.address || 'Internal Crypto Wallet',
        status: 'Completed',
        referenceId: refId,
        updatedBalance: `${newBalances[mainTransferAsset.symbol]} ${mainTransferAsset.symbol}`
      };

      if (user?.email) {
        await sendCryptoTransferEmail(emailParams);
      }

      setLatestReceiptParams(emailParams);
      setMsg({
        type: 'success',
        text: `Successfully transferred ${formatCurrencyAmount(val, currInfo)} from Main Balance into ${cryptoAmount} ${mainTransferAsset.symbol}! Confirmation email sent to ${user.email}.`
      });
      setMainTransferAmount('');
      setShowConfirmModal(false);
      await fetchRecentTxs();
    } catch (err: any) {
      console.error('[CryptoWallet] Main balance transfer error:', err);
      setMsg({ type: 'error', text: 'Failed to process transfer from main balance.' });
    } finally {
      setMainTransferLoading(false);
      setConfirmLoading(false);
    }
  };

  // PDF Receipt Download Helper
  const downloadPdfReceipt = (item: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SAFE GLOBAL BANK', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL ELECTRONIC TRANSACTION RECEIPT', 140, 18);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text(`Recipient: ${user?.email || 'N/A'}`, 14, 38);
      doc.text(`Reference ID: ${item.id || item.emailLog?.transaction_ref || 'CTX-RECORD'}`, 14, 44);
      doc.text(`Date & Time: ${new Date(item.created_at || item.sent_at || Date.now()).toLocaleString()}`, 14, 50);

      const amountVal = `${item.amount} ${item.asset || 'BTC'}`;
      const typeLabel = item.type === 'withdrawal' || item.type === 'outgoing' ? 'Crypto Withdrawal (Outgoing)' : 'Crypto Deposit / Transfer (Incoming)';

      autoTable(doc, {
        startY: 58,
        head: [['Receipt Attribute', 'Details']],
        body: [
          ['Transaction Reference', item.id || item.emailLog?.transaction_ref || 'CTX-RECORD'],
          ['Account Email', user?.email],
          ['Transaction Type', typeLabel],
          ['Crypto Asset', item.asset || 'BTC'],
          ['Amount Transferred', amountVal],
          ['Blockchain Network', item.network || 'Main Network'],
          ['Destination Address', item.address || wallet?.address || 'Internal Account'],
          ['Delivery Status', 'DELIVERED (Email Receipt Dispatched)'],
          ['Verification Timestamp', new Date(item.created_at || Date.now()).toISOString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
      });

      doc.save(`SafeGlobal_Receipt_${item.id || 'TX'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  // Calculate totals
  const activeAssets = SUPPORTED_COINS.map((coin, index) => {
    const balance = (wallet?.balances && wallet.balances[coin.symbol]) || 0;
    const value = balance * coin.price;
    const changeVals = ['+2.4', '-1.1', '0.00', '+4.5', '+8.2', '-0.5', '+1.8'];
    return {
      ...coin,
      balance,
      value,
      change: changeVals[index % changeVals.length]
    };
  });

  const cryptoValue = activeAssets.reduce((sum, a) => sum + a.value, 0);
  const tradingBalance = wallet?.trading_balance || 0;
  const totalValue = cryptoValue + tradingBalance;
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider relative z-10">Total Crypto Account Value</p>
        <p className="text-3xl sm:text-4xl mt-2 font-black tracking-tight relative z-10">{formatCurrencyAmount(totalValue, currInfo)}</p>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 mt-6 relative z-10">
          <button 
            onClick={() => { setActiveTab('receive'); setMsg({type:'',text:''}); }}
            className={`flex-1 min-w-[120px] p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'receive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <ArrowDownLeft size={16} /> Deposit Crypto
          </button>
          <button 
            onClick={() => { setActiveTab('send'); setMsg({type:'',text:''}); }}
            className={`flex-1 min-w-[120px] p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'send' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <ArrowUpRight size={16} /> Send Crypto
          </button>
          <button 
            onClick={() => { setActiveTab('main_transfer'); setMsg({type:'',text:''}); }}
            className={`flex-1 min-w-[140px] p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'main_transfer' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <ArrowRightLeft size={16} /> From Main Balance
          </button>
          <button 
            onClick={() => { setActiveTab('portfolio'); setMsg({type:'',text:''}); }}
            className={`flex-1 min-w-[100px] p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'portfolio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <Wallet size={16} /> Portfolio
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setMsg({type:'',text:''}); }}
            className={`flex-1 min-w-[100px] p-3 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <History size={16} /> Activity & Receipts
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${msg.type === 'error' ? 'bg-red-50 border border-red-100 text-red-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
          <div className="flex items-start gap-3">
            {msg.type === 'error' ? <XCircle className="shrink-0 mt-0.5" size={20} /> : <CheckCircle className="shrink-0 mt-0.5 text-emerald-600" size={20} />}
            <p className="text-sm font-medium">{msg.text}</p>
          </div>
          {msg.type === 'success' && latestReceiptParams && (
            <button
              onClick={() => {
                const { subject, html } = generateCryptoTransferEmailHtml(latestReceiptParams);
                setSelectedEmailReceipt({
                  subject,
                  html,
                  params: latestReceiptParams,
                  sent_at: new Date().toISOString()
                });
              }}
              className="shrink-0 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Mail size={14} /> View Sent Email Receipt
            </button>
          )}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex justify-between items-center bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trading Account Balance</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrencyAmount(tradingBalance, currInfo)}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Active</span>
            </div>

            <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 via-teal-50/80 to-blue-50/60 p-4 rounded-2xl border border-emerald-100">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Landmark size={13} /> Main Bank Balance
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrencyAmount(Number(account?.balance || 0), currInfo)}</p>
              </div>
              <button
                onClick={() => { setActiveTab('main_transfer'); setMsg({ type: '', text: '' }); }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
              >
                <ArrowRightLeft size={13} /> Transfer
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Crypto Assets</h3>
            <div className="space-y-3">
              {activeAssets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/80 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-slate-900/10">
                      {asset.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{asset.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">{asset.balance} {asset.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatCurrencyAmount(asset.value, currInfo)}</p>
                      <p className={`text-xs font-bold mt-0.5 ${parseFloat(asset.change) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {parseFloat(asset.change) >= 0 ? '+' : ''}{asset.change}%
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setSelectedReceiveAsset(asset);
                          setSelectedNetwork(asset.networks[0]);
                          setActiveTab('receive');
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title={`Deposit ${asset.symbol}`}
                      >
                        <ArrowDownLeft size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setSendAsset(asset);
                          setSendNetwork(asset.networks[0]);
                          setActiveTab('send');
                        }}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title={`Send ${asset.symbol}`}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receive' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Deposit Crypto</h3>
          <div className="max-w-md mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedReceiveAsset.symbol}
                    onChange={handleAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                  >
                    {selectedReceiveAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-100 rounded-2xl text-center space-y-5 bg-gray-50/50">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QrCode size={160} className="text-slate-900 mx-auto" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Your {selectedReceiveAsset.symbol} Deposit Address</p>
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <p className="font-mono text-xs font-semibold truncate text-slate-800 select-all">{wallet?.address || 'Loading...'}</p>
                  <button 
                    onClick={handleCopyAddress} 
                    className="text-slate-500 hover:text-blue-600 transition p-1.5 hover:bg-gray-100 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs p-3.5 rounded-xl text-left font-medium leading-relaxed">
                <span className="font-bold">Important:</span> Send only {selectedReceiveAsset.name} ({selectedReceiveAsset.symbol}) via <span className="font-bold">{selectedNetwork}</span> network to this deposit address.
              </div>
              <button onClick={handleReceiveSimulation} className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition">
                Notify System of Completed Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Send Crypto</h3>
          <form className="max-w-md mx-auto space-y-6" onSubmit={handleSend}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Asset</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={sendAsset.symbol}
                    onChange={handleSendAssetChange}
                  >
                    {SUPPORTED_COINS.map(a => <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Network</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={sendNetwork}
                    onChange={(e) => setSendNetwork(e.target.value)}
                  >
                    {sendAsset.networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Recipient Address</label>
              <input 
                type="text" 
                value={sendAddress}
                onChange={e => setSendAddress(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder={`Enter ${sendAsset.symbol} Address`} 
                required 
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</label>
                <span className="text-xs font-bold text-gray-500">Available: {(wallet?.balances && wallet.balances[sendAsset.symbol]) || 0} {sendAsset.symbol}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  className="w-full py-3 pl-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" 
                  placeholder="0.00" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setSendAmount(((wallet?.balances && wallet.balances[sendAsset.symbol]) || 0).toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-800 p-1"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="pt-1">
               <div className="flex justify-between text-xs font-medium text-gray-500">
                 <span>Network Fee</span>
                 <span className="font-bold text-gray-900">~ 0.0005 {sendAsset.symbol}</span>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={sendLoading}
              className="w-full p-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70"
            >
              {sendLoading ? 'Processing...' : 'Withdraw Crypto'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'main_transfer' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap size={20} className="text-amber-500 fill-amber-500" />
                Transfer from Main Balance
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Instantly top-up your crypto wallet from your primary bank account balance</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
              <Zap size={12} /> Instant 0% Fee
            </span>
          </div>

          <form className="max-w-md mx-auto space-y-6" onSubmit={handleMainBalanceTransfer}>
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Landmark size={13} /> Source Account
                </p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">Primary Bank Account</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Available Balance</p>
                <p className="text-lg font-black text-emerald-400 mt-0.5">
                  {formatCurrencyAmount(Number(account?.balance || 0), currInfo)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Crypto Asset</label>
              <div className="relative">
                <select 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={mainTransferAsset.symbol}
                  onChange={(e) => {
                    const coin = SUPPORTED_COINS.find(c => c.symbol === e.target.value) || SUPPORTED_COINS[2];
                    setMainTransferAsset(coin);
                  }}
                >
                  {SUPPORTED_COINS.map(c => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.name} ({c.symbol}) — Price: ${c.price.toLocaleString()}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-4 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Amount ({currInfo.code || 'USD'})</label>
                <span className="text-xs font-bold text-gray-500">
                  Max: {formatCurrencyAmount(Number(account?.balance || 0), currInfo)}
                </span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  min="0.01"
                  step="any"
                  value={mainTransferAmount}
                  onChange={e => setMainTransferAmount(e.target.value)}
                  className="w-full py-3.5 pl-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none transition text-base" 
                  placeholder="0.00" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setMainTransferAmount((Number(account?.balance || 0)).toString())}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-700 hover:text-emerald-900 bg-emerald-100 px-2 py-1 rounded-lg transition"
                >
                  MAX
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMainTransferAmount(amt.toString())}
                    className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            {parseFloat(mainTransferAmount) > 0 && !isNaN(parseFloat(mainTransferAmount)) && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-emerald-900">
                  <span>Exchange Rate:</span>
                  <span className="font-bold font-mono">1 {mainTransferAsset.symbol} = ${mainTransferAsset.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-emerald-950 pt-1 border-t border-emerald-200/60">
                  <span>You Receive:</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ~ {(parseFloat(mainTransferAmount) / mainTransferAsset.price).toFixed(mainTransferAsset.symbol === 'USDT' ? 2 : 6)} {mainTransferAsset.symbol}
                  </span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={mainTransferLoading}
              className="w-full p-4 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 active:scale-95 transition-all shadow-lg shadow-emerald-700/20 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
            >
              {mainTransferLoading ? (
                <span>Processing Transfer...</span>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Confirm Transfer to Crypto Wallet</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* RECENT CRYPTO ACTIVITY & EMAIL RECEIPTS TABLE */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={20} className="text-slate-800" />
            <h3 className="text-lg font-bold text-gray-900">Recent Activity & Dispatched Email Receipts</h3>
          </div>
          <button 
            onClick={fetchRecentTxs}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            Refresh Ledger
          </button>
        </div>

        {recentCryptoTxs.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
            <Mail className="mx-auto text-gray-400" size={32} />
            <p className="text-sm font-bold text-gray-700">No crypto transactions recorded yet</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">When you deposit, withdraw, or transfer funds, complete records and instant email receipts will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-x-auto">
            {recentCryptoTxs.map((tx, idx) => {
              const isOutgoing = tx.type === 'withdrawal' || tx.type === 'outgoing';
              const refId = tx.id || tx.emailLog?.transaction_ref || `CTX-${idx}`;
              const dateStr = new Date(tx.created_at || tx.sent_at || Date.now()).toLocaleString();

              return (
                <div key={refId + idx} className="py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${isOutgoing ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {isOutgoing ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">
                          {isOutgoing ? 'Crypto Transfer Out' : 'Crypto Deposit / Topup'}
                        </p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Completed
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">Ref: {refId} • {dateStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${isOutgoing ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isOutgoing ? '-' : '+'}{tx.amount} {tx.asset || 'BTC'}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium truncate max-w-[140px]">
                        {tx.network || 'Main Network'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const emailLog = tx.emailLog;
                        const subject = emailLog?.metadata?.subject || `Crypto Transfer Confirmation - Ref: ${refId}`;
                        const html = emailLog?.metadata?.html || generateCryptoTransferEmailHtml({
                          type: isOutgoing ? 'outgoing' : 'incoming',
                          recipientName: user?.displayName || user?.email?.split('@')[0] || 'Valued Client',
                          recipientEmail: user?.email,
                          asset: tx.asset || 'BTC',
                          amount: tx.amount,
                          network: tx.network || 'Blockchain',
                          walletAddress: tx.address || 'Internal Wallet',
                          status: 'Completed',
                          referenceId: refId
                        }).html;

                        setSelectedEmailReceipt({
                          subject,
                          html,
                          tx,
                          sent_at: dateStr
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Mail size={13} /> View Email Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OFFICIAL EMAIL RECEIPT POPUP MODAL */}
      {selectedEmailReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-400">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Official Electronic Email Receipt
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">Recipient Inbox: {user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmailReceipt(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subheader & Actions */}
            <div className="bg-slate-50 px-6 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  <CheckCircle size={13} />
                  {selectedEmailReceipt.smtpSent ? 'Delivered via Live SMTP' : 'Saved in App Account Inbox & Audit Log'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(selectedEmailReceipt.html);
                      win.document.close();
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Open Full Email
                </button>

                <button
                  onClick={() => downloadPdfReceipt(selectedEmailReceipt.tx || selectedEmailReceipt.params || { user_id: user?.id })}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </div>

            {/* Delivery notice banner if live SMTP is not active */}
            {!selectedEmailReceipt.smtpSent && (
              <div className="bg-amber-50 px-6 py-3 border-b border-amber-100 flex items-start gap-3.5 text-xs text-amber-900">
                <ShieldCheck className="shrink-0 text-amber-600 mt-0.5" size={18} />
                <div>
                  <p className="font-bold">Inbox Delivery Notice:</p>
                  <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                    This official email receipt is securely stored in your account history below. To deliver live messages directly to your external inbox (e.g. Gmail), configure <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">SMTP_USER</code> &amp; <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">GMAIL_APP_PASSWORD</code> (or <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">SMTP_PASS</code>) in your environment settings.
                  </p>
                </div>
              </div>
            )}

            {/* Render HTML Email Content Frame */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70">
              <div 
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 font-sans text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedEmailReceipt.html }} 
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="font-mono text-gray-400">Safe Global Trade Verification Engine</span>
              <button
                onClick={() => setSelectedEmailReceipt(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition"
              >
                Close Receipt View
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TRANSFER CONFIRMATION MODAL */}
      {showConfirmModal && confirmModalDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={22} />
                {confirmModalDetails.title}
              </h3>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                disabled={confirmLoading}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2.5 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-xs">From Source</span>
                  <span className="font-bold text-gray-900 text-xs truncate max-w-[210px]">{confirmModalDetails.from}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-xs">Destination</span>
                  <span className="font-bold text-gray-900 text-xs truncate max-w-[210px]">{confirmModalDetails.to}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500 font-medium text-xs">Transfer Amount</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">{confirmModalDetails.amount}</span>
                </div>
                {confirmModalDetails.equivalent && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium text-xs">Value / Crypto Credit</span>
                    <span className="font-bold text-indigo-700 text-xs font-mono">{confirmModalDetails.equivalent}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium text-xs">Network / Service Fee</span>
                  <span className="font-bold text-gray-700 text-xs">{confirmModalDetails.fee}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Security Notice:</span> Please verify transaction details. Once authorized, balance transfers execute immediately and email confirmation receipts will be issued.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmLoading}
                className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmModalDetails.onConfirm()}
                disabled={confirmLoading}
                className="py-3 bg-[#0A3D36] hover:bg-[#072a25] text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {confirmLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Authorize Transfer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
