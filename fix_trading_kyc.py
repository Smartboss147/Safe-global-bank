import re

# TradingPlatform
with open('src/components/dashboard/TradingPlatform.tsx', 'r') as f:
    content = f.read()

content = content.replace("user.uid", "user.id")

sub_trades = """
    const fetchTrades = async () => {
      const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setTrades(data);
    };
    fetchTrades();
    const channel = supabase.channel('trading_platform')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, payload => {
        fetchTrades();
      })
      .subscribe();
"""
content = re.sub(r"const q = query\(.*?const unsubscribe = onSnapshot.*?\}\);", sub_trades, content, flags=re.DOTALL)
content = content.replace("return () => unsubscribe();", "return () => { supabase.removeChannel(channel); };")

add_trade = """
      await supabase.from('trades').insert([{
        user_id: user.id,
        trading_account_id: account?.id || null, // Might need to fetch trading_account_id
        symbol: asset,
        type,
        amount: Number(amount),
        price: 166.00, // Mock current price
        status: 'pending'
      }]);
"""
content = re.sub(r"await addDoc\(collection\(db, 'trades'\), \{.*?\}\);", add_trade, content, flags=re.DOTALL)
content = content.replace("trade.createdAt?.toDate ? new Date(trade.createdAt.toDate()).toLocaleString() : 'Just now'", "trade.created_at ? new Date(trade.created_at).toLocaleString() : 'Just now'")

with open('src/components/dashboard/TradingPlatform.tsx', 'w') as f:
    f.write(content)

# KYCUpload
with open('src/components/dashboard/KYCUpload.tsx', 'r') as f:
    content = f.read()

content = content.replace("user.uid", "user.id")

add_kyc = """
      await supabase.from('kyc_documents').insert([{
        user_id: user.id,
        document_type: documentType,
        document_url: downloadURL,
        status: 'pending'
      }]);
"""
content = re.sub(r"await addDoc\(collection\(db, 'kyc_documents'\), \{.*?\}\);", add_kyc, content, flags=re.DOTALL)

update_user = """
      await supabase.from('profiles').update({ kyc_status: 'Pending' }).eq('id', user.id);
"""
content = re.sub(r"await updateDoc\(doc\(db, 'users', user\.id\), \{.*?\}\);", update_user, content, flags=re.DOTALL)

with open('src/components/dashboard/KYCUpload.tsx', 'w') as f:
    f.write(content)
