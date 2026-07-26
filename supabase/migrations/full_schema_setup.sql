-- COMPLETE PRODUCTION-READY SCHEMA MIGRATION FOR SAFEGLOBAL BANK
-- Can be run directly in Supabase SQL Editor or applied via Supabase CLI migrations

-- 1. ENUMS (Safe creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status_type AS ENUM ('Unverified', 'Pending', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    pin TEXT,
    transaction_pin TEXT,
    biometric_login BOOLEAN DEFAULT false,
    kyc_status TEXT DEFAULT 'Unverified',
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on profiles if table was created previously with fewer columns
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transaction_pin TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biometric_login BOOLEAN DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'Unverified';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
END $$;

-- ADMINS TABLE (For explicit admin designation)
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 1000.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    account_type TEXT DEFAULT 'checking' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
    ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'checking';
    ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
END $$;

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    transfer_type TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    recipient TEXT,
    recipient_account TEXT,
    recipient_name TEXT,
    swift_code TEXT,
    bank_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed' NOT NULL,
    schedule_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$ BEGIN
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_type TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recipient TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recipient_account TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recipient_name TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS swift_code TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bank_name TEXT;
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS schedule_date TEXT;
END $$;

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    routing_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CARDS TABLE
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    cardholder_name TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    cvv TEXT NOT NULL,
    type TEXT DEFAULT 'debit' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CRYPTO WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balances JSONB DEFAULT '{}'::jsonb NOT NULL,
    trading_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CRYPTO TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.crypto_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.crypto_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    symbol TEXT,
    asset TEXT,
    network TEXT,
    amount DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 2),
    total DECIMAL(15, 2),
    address TEXT,
    status TEXT DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- KYC DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_number TEXT,
    file_url TEXT,
    document_url TEXT,
    status TEXT DEFAULT 'Pending' NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRADING ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_number TEXT,
    balance DECIMAL(15, 2) DEFAULT 10000.00 NOT NULL,
    equity DECIMAL(15, 2) DEFAULT 10000.00 NOT NULL,
    margin DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    free_margin DECIMAL(15, 2) DEFAULT 10000.00 NOT NULL,
    leverage TEXT DEFAULT '1:100',
    status TEXT DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRADES TABLE
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(15, 6) NOT NULL,
    units DECIMAL(15, 6),
    open_price DECIMAL(15, 2) NOT NULL,
    close_price DECIMAL(15, 2),
    profit DECIMAL(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'OPEN' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_documents(user_id);

-- 4. AUTOMATIC USER & ACCOUNT CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    gen_acc_num TEXT;
    user_display TEXT;
BEGIN
    -- Determine display name
    user_display := COALESCE(
        new.raw_user_meta_data->>'display_name',
        NULLIF(TRIM(CONCAT(new.raw_user_meta_data->>'first_name', ' ', new.raw_user_meta_data->>'last_name')), ''),
        split_part(new.email, '@', 1)
    );

    -- Insert into profiles
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        display_name, 
        phone, 
        address, 
        city, 
        state, 
        zip, 
        country, 
        pin, 
        kyc_status, 
        role
    )
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        user_display,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'address',
        new.raw_user_meta_data->>'city',
        new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'zip',
        new.raw_user_meta_data->>'country',
        new.raw_user_meta_data->>'pin',
        'Unverified',
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc'::text, now());

    -- Create default bank account if not existing
    gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = new.id) THEN
        INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
        VALUES (new.id, gen_acc_num, 1000.00, 'USD', 'checking', 'active');
    END IF;

    -- Automatically grant admin if email is admin@safeglobal.com
    IF new.email = 'admin@safeglobal.com' THEN
        INSERT INTO public.admins (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
        UPDATE public.profiles SET role = 'admin' WHERE id = new.id;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- Drop existing policies first
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Helper condition function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PERMISSIVE / SECURE POLICIES FOR USERS & ADMINS

-- Admins Table
CREATE POLICY "Admins full access" ON public.admins FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Profiles
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin() OR auth.uid() IS NOT NULL);
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles delete policy" ON public.profiles FOR DELETE USING (public.is_admin());

-- Accounts
CREATE POLICY "Accounts select policy" ON public.accounts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Accounts insert policy" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Accounts update policy" ON public.accounts FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Accounts delete policy" ON public.accounts FOR DELETE USING (public.is_admin());

-- Transactions
CREATE POLICY "Transactions select policy" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Transactions insert policy" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Transactions update policy" ON public.transactions FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Notifications
CREATE POLICY "Notifications select policy" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Notifications insert policy" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Notifications update policy" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Beneficiaries
CREATE POLICY "Beneficiaries select policy" ON public.beneficiaries FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Beneficiaries manage policy" ON public.beneficiaries FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Cards
CREATE POLICY "Cards select policy" ON public.cards FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Cards manage policy" ON public.cards FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Audit Logs
CREATE POLICY "Audit logs select policy" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Audit logs insert policy" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Crypto Wallets
CREATE POLICY "Crypto wallets select policy" ON public.crypto_wallets FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Crypto wallets manage policy" ON public.crypto_wallets FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Crypto Transactions
CREATE POLICY "Crypto transactions select policy" ON public.crypto_transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Crypto transactions manage policy" ON public.crypto_transactions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- KYC Documents
CREATE POLICY "KYC documents select policy" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "KYC documents manage policy" ON public.kyc_documents FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Trading Accounts
CREATE POLICY "Trading accounts select policy" ON public.trading_accounts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Trading accounts manage policy" ON public.trading_accounts FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Trades
CREATE POLICY "Trades select policy" ON public.trades FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Trades manage policy" ON public.trades FOR ALL USING (auth.uid() = user_id OR public.is_admin());
