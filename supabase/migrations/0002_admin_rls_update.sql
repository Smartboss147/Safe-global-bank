-- Ensure admins table exists and has RLS
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow users to check if they are an admin
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admins;
CREATE POLICY "Users can view own admin status" ON public.admins 
FOR SELECT USING (auth.uid() = user_id);

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Accounts
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Beneficiaries
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON public.beneficiaries;
CREATE POLICY "Admins can view all beneficiaries" ON public.beneficiaries FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Cards
DROP POLICY IF EXISTS "Admins can view all cards" ON public.cards;
CREATE POLICY "Admins can view all cards" ON public.cards FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Crypto Wallets
DROP POLICY IF EXISTS "Admins can view all crypto wallets" ON public.crypto_wallets;
CREATE POLICY "Admins can view all crypto wallets" ON public.crypto_wallets FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Crypto Tx
DROP POLICY IF EXISTS "Admins can view all crypto tx" ON public.crypto_transactions;
CREATE POLICY "Admins can view all crypto tx" ON public.crypto_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- KYC
DROP POLICY IF EXISTS "Admins can view all kyc" ON public.kyc_documents;
CREATE POLICY "Admins can view all kyc" ON public.kyc_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Trading Accounts
DROP POLICY IF EXISTS "Admins can view all trading accounts" ON public.trading_accounts;
CREATE POLICY "Admins can view all trading accounts" ON public.trading_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Trades
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;
CREATE POLICY "Admins can view all trades" ON public.trades FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

