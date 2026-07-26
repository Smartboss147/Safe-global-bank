import re

with open('src/components/dashboard/Transfers.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db } from '../../lib/firebase';", "import { supabase } from '../../lib/supabase';")
content = re.sub(r"import { collection.*} from 'firebase/firestore';", "", content)

# email transfer part
content = re.sub(r"const qUser = query.*?;", "const { data: userSnap, error: uErr } = await supabase.from('profiles').select('id, email').eq('email', recipient.toLowerCase().trim());", content)
content = re.sub(r"const userSnap = await getDocs\(qUser\);", "", content)
content = content.replace("if (userSnap.empty)", "if (!userSnap || len(userSnap) === 0)".replace("len", "userSnap.length"))
content = content.replace("const recipientUserDoc = userSnap.docs[0];", "const recipientUserDoc = userSnap[0];")
content = content.replace("const recipientUserId = recipientUserDoc.id;", "const recipientUserId = recipientUserDoc.id;")

content = re.sub(r"const qAcc = query.*?;", "const { data: accSnap, error: aErr } = await supabase.from('accounts').select('id').eq('user_id', recipientUserId);", content)
content = re.sub(r"const accSnap = await getDocs\(qAcc\);", "", content)
content = content.replace("if (accSnap.empty)", "if (!accSnap || accSnap.length === 0)")
content = content.replace("const recipientAccountIdStr = accSnap.docs[0].id;", "const recipientAccountIdStr = accSnap[0].id;")

rpc_replace = """
// Call an RPC or do it sequentially in a real app
const { data: senderAcc } = await supabase.from('accounts').select('balance').eq('id', account.id).single();
if (!senderAcc || senderAcc.balance < val) throw new Error("Insufficient funds.");

// This should ideally be an RPC to ensure atomicity
await supabase.rpc('process_email_transfer', { 
  sender_user_id: user.id, 
  sender_account_id: account.id, 
  recipient_user_id: recipientUserId, 
  recipient_account_id: recipientAccountIdStr,
  amount: val,
  description: txDescription
});

newDocId = 'tx_' + Math.random().toString(36).substr(2, 9);
"""
content = re.sub(r"await runTransaction\(db, async \(transaction\) => \{.*?\}\);", rpc_replace, content, flags=re.DOTALL)

content = re.sub(r"const q = query\(collection\(db, 'accounts'\), where\('accountNumber', '==', recipient\)\);", "const { data: querySnapshot } = await supabase.from('accounts').select('id').eq('account_number', recipient);", content)
content = re.sub(r"const querySnapshot = await getDocs\(q\);", "", content)
content = content.replace("if (!querySnapshot.empty)", "if (querySnapshot && querySnapshot.length > 0)")
content = content.replace("recipientAccountId = querySnapshot.docs[0].id;", "recipientAccountId = querySnapshot[0].id;")

insert_tx = """const { data: insertedTx } = await supabase.from('transactions').insert([{
  user_id: user.id,
  account_id: account.id,
  type: 'transfer',
  transfer_type: transferType,
  amount: val,
  recipient: recipient,
  swift_code: transferType === 'international' ? swiftCode : null,
  bank_name: bankName,
  description: txDescription,
  status: transactionStatus,
  schedule_date: transferType === 'scheduled' ? scheduleDate : null
}]).select().single();
const docRef = { id: insertedTx?.id || 'pending' };"""

content = re.sub(r"const docRef = await addDoc\(collection\(db, 'transactions'\), txData\);", insert_tx, content)

update_sender = """
const { data: currAcc } = await supabase.from('accounts').select('balance').eq('id', account.id).single();
if(currAcc) {
  await supabase.from('accounts').update({ balance: currAcc.balance - val }).eq('id', account.id);
}
"""
content = re.sub(r"await updateDoc\(doc\(db, 'accounts', account\.id\), \{\s*balance: increment\(-val\)\s*\}\);", update_sender, content, flags=re.DOTALL)

update_recip = """
await supabase.rpc('increment_balance', { account_id_param: recipientAccountId, amount_param: val });
"""
content = re.sub(r"await updateDoc\(doc\(db, 'accounts', recipientAccountId\), \{\s*balance: increment\(val\)\s*\}\);", update_recip, content, flags=re.DOTALL)


insert_dep = """
await supabase.from('transactions').insert([{
  user_id: user.id, // mocked
  account_id: recipientAccountId,
  type: 'deposit',
  amount: val,
  description: `Transfer from ${account.account_number || account.accountNumber} - ${reference}`,
  status: 'completed'
}]);
"""
content = re.sub(r"await addDoc\(collection\(db, 'transactions'\), \{\s*userId: 'system',.*?\}\);", insert_dep, content, flags=re.DOTALL)

content = content.replace("user.uid", "user.id")
content = content.replace("txData,", "/* txData */") 

with open('src/components/dashboard/Transfers.tsx', 'w') as f:
    f.write(content)

