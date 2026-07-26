-- Grant full access to admins on relevant tables

-- Profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Accounts
DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
CREATE POLICY "Admins can update all accounts" ON public.accounts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Transactions
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Audit Logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- KYC
DROP POLICY IF EXISTS "Admins can update kyc" ON public.kyc_documents;
CREATE POLICY "Admins can update kyc" ON public.kyc_documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Delete policies
-- Profiles (soft delete / hard delete? The app says "Delete users (with confirmation)")
-- Let's give them DELETE access on profiles, accounts, transactions, etc.
-- But wait, deleting a profile might fail due to FKs if ON DELETE CASCADE is not set, or we can just delete from auth.users (which requires service_role).
-- Let's provide DELETE policies just in case.
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" ON public.profiles FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
