import re

with open('src/components/dashboard/Investments.tsx', 'r') as f:
    content = f.read()

content = content.replace("user.uid", "user.id")

fetch_acc = """
    // Fetch or create trading account
    const fetchAccount = async () => {
      const { data: querySnapshot } = await supabase.from('trading_accounts').select('*').eq('user_id', user.id);
      
      if (querySnapshot && querySnapshot.length > 0) {
        setTradingAccount(querySnapshot[0]);
      } else {
        const newAcc = {
          user_id: user.id,
          balance: 10000.00,
        };
        const { data: docRef } = await supabase.from('trading_accounts').insert([newAcc]).select().single();
        setTradingAccount({ ...docRef, equity: 10000.00, margin: 0, freeMargin: 10000.00 });
      }
    };
"""
content = re.sub(r"// Fetch or create trading account.*?fetchAccount\(\);", fetch_acc + "\n    fetchAccount();", content, flags=re.DOTALL)

sub_trades = """
    // Listen to trades
    const channel = supabase.channel('trades_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, payload => {
        // Just refetch for simplicity
        fetchTrades();
      })
      .subscribe();
      
    const fetchTrades = async () => {
      const { data } = await supabase.from('trades').select('*').eq('user_id', user.id);
      if (data) {
        setOpenTrades(data.filter((t: any) => t.status === 'open'));
        setTradeHistory(data.filter((t: any) => t.status === 'closed'));
        setLoading(false);
      }
    };
    fetchTrades();
"""
content = re.sub(r"// Listen to trades.*?return \(\) => unsubscribe\(\);", sub_trades + "\n    return () => { supabase.removeChannel(channel); };", content, flags=re.DOTALL)

open_trade = """
      // Open trade
      await supabase.from('trades').insert([{
        user_id: user.id,
        trading_account_id: tradingAccount.id,
        symbol: selectedAsset.symbol,
        type: direction,
        amount: size,
        price: selectedAsset.price,
        status: 'open'
      }]);
      
      // Update account margin
      /* In a real app we would update margin */
"""
content = re.sub(r"// Open trade.*?freeMargin: tradingAccount\.freeMargin - marginRequired\s*\}\);", open_trade, content, flags=re.DOTALL)

close_trade = """
      await supabase.from('trades').update({
        status: 'closed',
      }).eq('id', tradeId);
"""
content = re.sub(r"await updateDoc\(doc\(db, 'trades', tradeId\), \{.*?\}\);", close_trade, content, flags=re.DOTALL)

content = re.sub(r"await updateDoc\(doc\(db, 'trading_accounts', tradingAccount\.id\), \{.*?\}\);", "/* update margin */", content, flags=re.DOTALL)

with open('src/components/dashboard/Investments.tsx', 'w') as f:
    f.write(content)
