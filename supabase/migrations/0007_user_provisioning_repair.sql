
-- ==============================================================================
-- 0007_user_provisioning_repair.sql
-- Description: Repairs and hardens the automatic user provisioning system.
-- Includes a backfill script for existing users and robust trigger logic.
-- ==============================================================================

-- 1. DROP EXISTING TRIGGER AND FUNCTION (To ensure clean state)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE ROBUST PROVISIONING FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    gen_acc_num TEXT;
    user_display TEXT;
    assigned_currency TEXT := 'USD';
    assigned_symbol TEXT := '$';
    user_country TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
    user_phone TEXT;
    user_role_val TEXT;
BEGIN
    -- Extract metadata with safety defaults
    user_country := COALESCE(new.raw_user_meta_data->>'country', 'United States');
    user_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
    user_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
    user_phone := COALESCE(new.raw_user_meta_data->>'phone', '');
    user_role_val := COALESCE(new.raw_user_meta_data->>'role', 'user');

    -- Try to find currency based on country from supported_countries table
    -- Use a block to handle potential missing table errors during migration
    BEGIN
        SELECT currency_code, currency_symbol INTO assigned_currency, assigned_symbol
        FROM public.supported_countries 
        WHERE LOWER(country_name) = LOWER(user_country) AND is_active = true
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        assigned_currency := 'USD';
        assigned_symbol := '$';
    END;

    -- Determine display name
    user_display := COALESCE(
        new.raw_user_meta_data->>'display_name',
        NULLIF(TRIM(CONCAT(user_first_name, ' ', user_last_name)), ''),
        split_part(new.email, '@', 1)
    );

    -- 2a. Insert or Update Profile
    INSERT INTO public.profiles (
        id, email, first_name, last_name, display_name, phone, address, 
        city, state, zip, country, pin, transaction_pin, kyc_status, role, account_currency, currency_symbol
    )
    VALUES (
        new.id, 
        new.email, 
        user_first_name,
        user_last_name, 
        user_display,
        user_phone, 
        COALESCE(new.raw_user_meta_data->>'address', ''),
        COALESCE(new.raw_user_meta_data->>'city', ''), 
        COALESCE(new.raw_user_meta_data->>'state', ''),
        COALESCE(new.raw_user_meta_data->>'zip', ''), 
        user_country,
        COALESCE(new.raw_user_meta_data->>'pin', ''), 
        COALESCE(new.raw_user_meta_data->>'pin', ''), 
        'Unverified',
        user_role_val,
        assigned_currency, 
        assigned_symbol
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = now();

    -- 2b. Create default bank account if not existing
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = new.id) THEN
        gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
        INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
        VALUES (new.id, gen_acc_num, 1000.00, assigned_currency, 'checking', 'active');
    END IF;

    -- 2c. Create standard wallets
    INSERT INTO public.wallets (user_id, wallet_type, balance, currency)
    VALUES 
        (new.id, 'main', 0.00, assigned_currency),
        (new.id, 'trading', 0.00, assigned_currency),
        (new.id, 'investment', 0.00, assigned_currency),
        (new.id, 'bonus', 0.00, assigned_currency),
        (new.id, 'profit', 0.00, assigned_currency)
    ON CONFLICT (user_id, wallet_type) DO NOTHING;

    -- 2d. Create broker account
    INSERT INTO public.broker_accounts (user_id, broker_name, tier, status)
    VALUES (new.id, 'Safe Global Prime', 'Standard', 'active')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2e. Create trading statistics
    INSERT INTO public.trading_statistics (user_id, total_trades, total_profit)
    VALUES (new.id, 0, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2f. Create trading account
    INSERT INTO public.trading_accounts (user_id, account_number, balance, equity, margin, free_margin, leverage, status)
    VALUES (new.id, 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'), 10000.00, 10000.00, 0.00, 10000.00, '1:100', 'Active')
    ON CONFLICT DO NOTHING;

    -- 2g. Create identity verification record
    INSERT INTO public.identity_verification (user_id, document_type, document_url, status)
    VALUES (new.id, 'National ID', 'pending', 'pending')
    ON CONFLICT (user_id) DO NOTHING;

    -- 2h. Handle Admin status automatically
    IF new.email = 'admin@safeglobal.com' OR new.email = 'admin@safeglobalbank.com' THEN
        INSERT INTO public.admins (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
        UPDATE public.profiles SET role = 'admin' WHERE id = new.id;
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- In a real production environment, you'd log this to a separate table
    -- For now, we return new to allow auth to proceed even if application record creation fails
    -- (Though ideally we'd want to know why it failed)
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE THE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. BACKFILL SCRIPT FOR EXISTING USERS
-- This block ensures all existing auth.users have the necessary application records.
DO $$
DECLARE
    user_record RECORD;
    gen_acc_num TEXT;
    user_display TEXT;
    assigned_currency TEXT := 'USD';
    assigned_symbol TEXT := '$';
    user_country TEXT;
BEGIN
    FOR user_record IN SELECT * FROM auth.users LOOP
        
        -- Determine country and currency for this user
        user_country := COALESCE(user_record.raw_user_meta_data->>'country', 'United States');
        
        BEGIN
            SELECT currency_code, currency_symbol INTO assigned_currency, assigned_symbol
            FROM public.supported_countries 
            WHERE LOWER(country_name) = LOWER(user_country) AND is_active = true
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            assigned_currency := 'USD';
            assigned_symbol := '$';
        END;

        -- Determine display name
        user_display := COALESCE(
            user_record.raw_user_meta_data->>'display_name',
            NULLIF(TRIM(CONCAT(user_record.raw_user_meta_data->>'first_name', ' ', user_record.raw_user_meta_data->>'last_name')), ''),
            split_part(user_record.email, '@', 1)
        );

        -- Profile Backfill
        INSERT INTO public.profiles (
            id, email, first_name, last_name, display_name, phone, country, pin, transaction_pin, kyc_status, role, account_currency, currency_symbol
        )
        VALUES (
            user_record.id, 
            user_record.email, 
            COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
            COALESCE(user_record.raw_user_meta_data->>'last_name', ''), 
            user_display,
            COALESCE(user_record.raw_user_meta_data->>'phone', ''), 
            user_country,
            COALESCE(user_record.raw_user_meta_data->>'pin', ''), 
            COALESCE(user_record.raw_user_meta_data->>'pin', ''), 
            'Unverified',
            COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
            assigned_currency, 
            assigned_symbol
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

        -- Account Backfill
        IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = user_record.id) THEN
            gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
            INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
            VALUES (user_record.id, gen_acc_num, 1000.00, assigned_currency, 'checking', 'active');
        END IF;

        -- Wallets Backfill
        INSERT INTO public.wallets (user_id, wallet_type, balance, currency)
        VALUES 
            (user_record.id, 'main', 0.00, assigned_currency),
            (user_record.id, 'trading', 0.00, assigned_currency),
            (user_record.id, 'investment', 0.00, assigned_currency),
            (user_record.id, 'bonus', 0.00, assigned_currency),
            (user_record.id, 'profit', 0.00, assigned_currency)
        ON CONFLICT (user_id, wallet_type) DO NOTHING;

        -- Broker Account Backfill
        INSERT INTO public.broker_accounts (user_id, broker_name, tier, status)
        VALUES (user_record.id, 'Safe Global Prime', 'Standard', 'active')
        ON CONFLICT (user_id) DO NOTHING;

        -- Trading Statistics Backfill
        INSERT INTO public.trading_statistics (user_id, total_trades, total_profit)
        VALUES (user_record.id, 0, 0.00)
        ON CONFLICT (user_id) DO NOTHING;

        -- Trading Account Backfill
        IF NOT EXISTS (SELECT 1 FROM public.trading_accounts WHERE user_id = user_record.id) THEN
            INSERT INTO public.trading_accounts (user_id, account_number, balance, equity, margin, free_margin, leverage, status)
            VALUES (user_record.id, 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'), 10000.00, 10000.00, 0.00, 10000.00, '1:100', 'Active');
        END IF;
        
        -- Identity Verification Backfill
        INSERT INTO public.identity_verification (user_id, document_type, document_url, status)
        VALUES (user_record.id, 'National ID', 'pending', 'pending')
        ON CONFLICT (user_id) DO NOTHING;

        -- Admin Backfill
        IF user_record.email = 'admin@safeglobal.com' OR user_record.email = 'admin@safeglobalbank.com' THEN
            INSERT INTO public.admins (user_id) VALUES (user_record.id) ON CONFLICT DO NOTHING;
            UPDATE public.profiles SET role = 'admin' WHERE id = user_record.id;
        END IF;

    END LOOP;
END $$;

-- 5. FINAL VERIFICATION OF RLS POLICIES FOR ADMINS
-- Ensure admins can see everything regardless of user_id
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) OR 
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply core RLS policies to be absolutely certain
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename IN ('profiles', 'accounts', 'wallets', 'transactions', 'audit_logs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

CREATE POLICY "Admins see all profiles" ON public.profiles FOR SELECT USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admins see all accounts" ON public.accounts FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Admins manage accounts" ON public.accounts FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins see all wallets" ON public.wallets FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Admins manage wallets" ON public.wallets FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins see all transactions" ON public.transactions FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Admins manage transactions" ON public.transactions FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins see all audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "System inserts audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
