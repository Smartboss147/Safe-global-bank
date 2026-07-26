-- Create admins table if not exists
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can read their own status
DROP POLICY IF EXISTS "Users can view own admin status" ON public.admins;
CREATE POLICY "Users can view own admin status" ON public.admins FOR SELECT USING (auth.uid() = user_id);

-- Drop all existing admin policies first to avoid duplicates or conflicts
-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- ACCOUNTS
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;

-- TRANSACTIONS
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;

-- KYC DOCUMENTS
DROP POLICY IF EXISTS "Admins can view all kyc" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update kyc" ON public.kyc_documents;

-- AUDIT LOGS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

-- OTHERS
DROP POLICY IF EXISTS "Admins can view all beneficiaries" ON public.beneficiaries;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can view all crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "Admins can view all crypto tx" ON public.crypto_transactions;
DROP POLICY IF EXISTS "Admins can view all trading accounts" ON public.trading_accounts;
DROP POLICY IF EXISTS "Admins can view all trades" ON public.trades;


-- Create new comprehensive policies for Admins
-- We use a function or direct EXISTS check. EXISTS is standard.

-- PROFILES
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- ACCOUNTS
CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update all accounts" ON public.accounts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- TRANSACTIONS
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- KYC DOCUMENTS
CREATE POLICY "Admins can view all kyc" ON public.kyc_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can update kyc" ON public.kyc_documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- AUDIT LOGS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- OTHERS (SELECT ONLY for viewing)
CREATE POLICY "Admins can view all beneficiaries" ON public.beneficiaries FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all cards" ON public.cards FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all crypto wallets" ON public.crypto_wallets FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all crypto tx" ON public.crypto_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all trading accounts" ON public.trading_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all trades" ON public.trades FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

