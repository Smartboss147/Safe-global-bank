import re

# TransactionForm.tsx
with open('src/components/TransactionForm.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db } from '../lib/firebase';", "import { supabase } from '../lib/supabase';")
content = re.sub(r"import { collection.*} from 'firebase/firestore';", "", content)

content = content.replace("user.uid", "user.id")

insert_tx = """
    const { data: insertedTx } = await supabase.from('transactions').insert([{
      user_id: user.id,
      account_id: accountId,
      type,
      amount: val,
      description,
      status: 'completed'
    }]);
"""
content = re.sub(r"await addDoc\(collection\(db, 'transactions'\), \{.*?\}\);", insert_tx, content, flags=re.DOTALL)

update_acc = """
    const { data: currAcc } = await supabase.from('accounts').select('balance').eq('id', accountId).single();
    if(currAcc) {
      await supabase.from('accounts').update({ balance: currAcc.balance + (type === 'deposit' ? val : -val) }).eq('id', accountId);
    }
"""
content = re.sub(r"const accountRef = doc\(db, 'accounts', accountId\);\s*await updateDoc\(accountRef, \{.*?\}\);", update_acc, content, flags=re.DOTALL)

with open('src/components/TransactionForm.tsx', 'w') as f:
    f.write(content)


# AdminDashboard.tsx
with open('src/components/AdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { collection, query, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';", "")
content = content.replace("import { db, auth } from '../lib/firebase';", "import { supabase } from '../lib/supabase';")
content = content.replace("user?.uid", "user?.id")

fetch_admin = """
      const { data: usersData } = await supabase.from('profiles').select('*');
      if (usersData) setUsers(usersData);

      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData) setAccounts(accountsData);

      const { data: txData } = await supabase.from('transactions').select('*');
      if (txData) setTransactions(txData);

      const { data: auditData } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (auditData) setAuditLogs(auditData);

      const { data: cryptoData } = await supabase.from('crypto_transactions').select('*');
      if (cryptoData) setCryptoTxs(cryptoData);

      const { data: kycData } = await supabase.from('kyc_documents').select('*');
      if (kycData) setKycDocs(kycData);
"""
content = re.sub(r"const usersSnapshot = await getDocs\(collection\(db, 'users'\)\);.*?setKycDocs\(kycDocsSnapshot\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\)\);", fetch_admin, content, flags=re.DOTALL)

audit_log = """
      const logData = {
        admin_id: user?.id || 'admin',
        admin_email: user?.email || 'admin@safeglobal.com',
        admin_name: user?.displayName || 'System Administrator',
        action,
        target_user: targetUser,
        details,
        ip_address: '127.0.0.1'
      };
      const { data: insertedLog } = await supabase.from('audit_logs').insert([logData]).select().single();
      if(insertedLog) setAuditLogs(prev => [insertedLog, ...prev]);
"""
content = re.sub(r"const logData = \{.*?await addDoc\(collection\(db, 'audit_logs'\), logData\);\s*setAuditLogs\(prev => \[logData, \.\.\.prev\]\);", audit_log, content, flags=re.DOTALL)

update_bal = """
      const targetAcc = accounts.find(a => a.id === accountId);
      const oldBalance = targetAcc ? targetAcc.balance : 0;
      
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId);
      
      // Create transaction record for audit integrity
      await supabase.from('transactions').insert([{
        user_id: targetAcc?.user_id || 'unknown',
        account_id: accountId,
        type: newBalance > oldBalance ? 'admin_credit' : 'admin_debit',
        amount: Math.abs(newBalance - oldBalance),
        currency: targetAcc?.currency || 'USD',
        status: 'completed',
        description: `Admin balance adjustment: ${reason}`,
      }]);
"""
content = re.sub(r"const targetAcc = accounts\.find.*?createdAt: new Date\(\)\.toISOString\(\)\s*\}\);", update_bal, content, flags=re.DOTALL)

user_status = """
      await supabase.from('profiles').update({ [statusField === 'kycStatus' ? 'kyc_status' : statusField]: statusValue }).eq('id', userId);
"""
content = re.sub(r"await updateDoc\(doc\(db, 'users', userId\), \{ \[statusField\]: statusValue \}\);", user_status, content, flags=re.DOTALL)

tx_status = """
      await supabase.from(collectionName).update({ status }).eq('id', txId);
"""
content = re.sub(r"await updateDoc\(doc\(db, collectionName, txId\), \{ status \}\);", tx_status, content, flags=re.DOTALL)


content = content.replace("u.status !== 'suspended' && u.status !== 'frozen'", "u.status !== 'suspended' && u.status !== 'frozen'")
content = content.replace("u.kycStatus === 'verified' || u.kycStatus === 'Approved'", "u.kyc_status === 'verified' || u.kyc_status === 'Approved'")
content = content.replace("t.status === 'Pending'", "t.status === 'pending'")
content = content.replace("t.status === 'Completed'", "t.status === 'completed'")
content = content.replace("t.status === 'Failed'", "t.status === 'failed'")

content = content.replace("tx.createdAt", "tx.created_at")
content = content.replace("u.createdAt", "u.created_at")
content = content.replace("log.timestamp", "log.created_at")
content = content.replace("u.kycStatus", "u.kyc_status")
content = content.replace("u.uid", "u.id")
content = content.replace("a.userId", "a.user_id")

with open('src/components/AdminDashboard.tsx', 'w') as f:
    f.write(content)

