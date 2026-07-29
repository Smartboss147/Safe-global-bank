
-- ==============================================================================
-- 0010_comprehensive_schema_sync_and_backfill.sql
-- Description: Synchronizes all table schemas, updates the signup trigger,
--              and backfills all existing users from auth.users.
-- ==============================================================================

-- 1. EXTEND PROFILES TABLE
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_currency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT;

-- 2. EXTEND ACCOUNTS TABLE
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. EXTEND TRADING_ACCOUNTS TABLE
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS equity DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS margin DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS free_margin DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS leverage TEXT DEFAULT '1:100';
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 4. ENSURE AUXILIARY TABLES EXIST
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, wallet_type)
);

CREATE TABLE IF NOT EXISTS public.broker_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    broker_name TEXT NOT NULL,
    tier TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. REWRITE HANDLE_NEW_USER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user_logic(p_user_id UUID, p_user_email TEXT, p_user_metadata JSONB)
RETURNS VOID AS $$
DECLARE
    v_user_country TEXT;
    v_assigned_currency TEXT := 'USD';
    v_assigned_symbol TEXT := '$';
    v_user_role_val TEXT;
    v_gen_acc_num TEXT;
    v_user_display TEXT;
    v_user_first_name TEXT;
    v_user_last_name TEXT;
    v_user_pin TEXT;
BEGIN
    -- Extract basic info
    v_user_first_name := COALESCE(p_user_metadata->>'first_name', p_user_metadata->>'firstName', '');
    v_user_last_name := COALESCE(p_user_metadata->>'last_name', p_user_metadata->>'lastName', '');
    v_user_pin := COALESCE(p_user_metadata->>'pin', '');
    v_user_country := COALESCE(p_user_metadata->>'country', 'United States');

    -- Determine role
    IF p_user_email IN ('admin@safeglobal.com', 'admin@safeglobalbank.com') THEN
        v_user_role_val := 'admin';
    ELSE
        v_user_role_val := COALESCE(p_user_metadata->>'role', 'user');
    END IF;

    -- Determine currency and symbol
    BEGIN
        SELECT currency_code, currency_symbol INTO v_assigned_currency, v_assigned_symbol
        FROM public.supported_countries 
        WHERE LOWER(country_name) = LOWER(v_user_country) AND is_active = true
        LIMIT 1;
        
        IF NOT FOUND THEN
            v_assigned_currency := 'USD';
            v_assigned_symbol := '$';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_assigned_currency := 'USD';
        v_assigned_symbol := '$';
    END;

    -- Determine display name
    v_user_display := COALESCE(
        p_user_metadata->>'display_name',
        p_user_metadata->>'displayName',
        p_user_metadata->>'username',
        NULLIF(TRIM(CONCAT(v_user_first_name, ' ', v_user_last_name)), ''),
        split_part(p_user_email, '@', 1)
    );

    -- 1. Insert Profile
    INSERT INTO public.profiles (
        id, email, first_name, last_name, display_name, phone, address, 
        city, state, zip, country, pin, transaction_pin, kyc_status, role, 
        account_currency, currency, currency_code, currency_symbol, status
    )
    VALUES (
        p_user_id, 
        p_user_email, 
        v_user_first_name, 
        v_user_last_name, 
        v_user_display,
        COALESCE(p_user_metadata->>'phone', ''), 
        COALESCE(p_user_metadata->>'address', ''), 
        COALESCE(p_user_metadata->>'city', ''), 
        COALESCE(p_user_metadata->>'state', ''), 
        COALESCE(p_user_metadata->>'zip', ''), 
        v_user_country,
        v_user_pin, 
        v_user_pin, 
        'pending',
        v_user_role_val,
        v_assigned_currency, 
        v_assigned_currency,
        v_assigned_currency,
        v_assigned_symbol,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
        country = COALESCE(public.profiles.country, EXCLUDED.country),
        role = COALESCE(public.profiles.role, EXCLUDED.role),
        status = COALESCE(public.profiles.status, EXCLUDED.status);

    -- 2. Create Admin record
    IF v_user_role_val = 'admin' THEN
        INSERT INTO public.admins (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- 3. Create Bank Account
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE public.accounts.user_id = p_user_id) THEN
        v_gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
        INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
        VALUES (p_user_id, v_gen_acc_num, 1000.00, v_assigned_currency, 'checking', 'active');
    END IF;

    -- 4. Create Wallets
    INSERT INTO public.wallets (user_id, wallet_type, balance, currency)
    VALUES 
        (p_user_id, 'main', 0.00, v_assigned_currency),
        (p_user_id, 'trading', 0.00, v_assigned_currency),
        (p_user_id, 'investment', 0.00, v_assigned_currency),
        (p_user_id, 'bonus', 0.00, v_assigned_currency),
        (p_user_id, 'profit', 0.00, v_assigned_currency)
    ON CONFLICT (user_id, wallet_type) DO NOTHING;

    -- 5. Create Broker & Trading records
    INSERT INTO public.broker_accounts (user_id, broker_name, tier, status)
    VALUES (p_user_id, 'Safe Global Prime', 'Standard', 'active')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.trading_statistics (user_id, total_trades, total_profit)
    VALUES (p_user_id, 0, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM public.trading_accounts WHERE public.trading_accounts.user_id = p_user_id) THEN
        INSERT INTO public.trading_accounts (user_id, account_number, balance, equity, margin, free_margin, leverage, status)
        VALUES (p_user_id, 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'), 10000.00, 10000.00, 0.00, 10000.00, '1:100', 'Active');
    END IF;

    -- 6. Create Verification records
    INSERT INTO public.identity_verification (user_id, document_type, document_url, status)
    VALUES (p_user_id, 'National ID', 'pending', 'pending')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.kyc_documents (user_id, document_type, document_url, status)
    VALUES (p_user_id, 'Identity Card', 'pending', 'pending')
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. WRAPPER FOR TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.handle_new_user_logic(new.id, new.email, new.raw_user_meta_data);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. BACKFILL EXISTING USERS
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT * FROM auth.users LOOP
        PERFORM public.handle_new_user_logic(user_record.id, user_record.email, user_record.raw_user_meta_data);
    END LOOP;
END $$;

-- 9. ENSURE ADMIN RLS POLICIES ARE COMPREHENSIVE
DO $$
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) OR role = 'admin');
    
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) OR role = 'admin');

    -- Accounts
    DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
    CREATE POLICY "Admins can view all accounts" ON public.accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
    
    DROP POLICY IF EXISTS "Admins can update all accounts" ON public.accounts;
    CREATE POLICY "Admins can update all accounts" ON public.accounts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

    -- Trading Accounts
    DROP POLICY IF EXISTS "Admins can view all trading accounts" ON public.trading_accounts;
    CREATE POLICY "Admins can view all trading accounts" ON public.trading_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

    -- KYC Documents
    DROP POLICY IF EXISTS "Admins can view all kyc documents" ON public.kyc_documents;
    CREATE POLICY "Admins can view all kyc documents" ON public.kyc_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
END $$;
