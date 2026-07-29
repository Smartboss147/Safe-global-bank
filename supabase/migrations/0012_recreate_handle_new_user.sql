-- ==============================================================================
-- 0012_recreate_handle_new_user.sql
-- Description: Recreates handle_new_user_logic to be resilient to schema differences.
-- It explicitly qualifies columns and uses IF NOT EXISTS logic over ON CONFLICT.
-- ==============================================================================

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
    BEGIN
        INSERT INTO public.profiles (
            id, email, first_name, last_name, display_name, phone, address, 
            city, state, zip, country, pin, transaction_pin, 
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
            status = COALESCE(public.profiles.status, EXCLUDED.status);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Update enums separately so we don't fail the whole transaction if casting fails
    BEGIN
        EXECUTE format('UPDATE public.profiles SET role = %L WHERE id = %L', v_user_role_val, p_user_id);
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        EXECUTE format('UPDATE public.profiles SET kyc_status = %L WHERE id = %L', 'pending', p_user_id);
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 2. Create Admin record
    IF v_user_role_val = 'admin' THEN
        IF NOT EXISTS (SELECT 1 FROM public.admins WHERE public.admins.user_id = p_user_id) THEN
            BEGIN
                INSERT INTO public.admins (user_id) VALUES (p_user_id);
            EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;
    END IF;

    -- 3. Create Bank Account
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE public.accounts.user_id = p_user_id) THEN
        v_gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
        BEGIN
            INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
            VALUES (p_user_id, v_gen_acc_num, 1000.00, v_assigned_currency, 'checking', 'active');
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- 4. Create Wallets
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE public.wallets.user_id = p_user_id AND public.wallets.wallet_type = 'main') THEN
        BEGIN
            INSERT INTO public.wallets (user_id, wallet_type, balance, currency) VALUES (p_user_id, 'main', 0.00, v_assigned_currency);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE public.wallets.user_id = p_user_id AND public.wallets.wallet_type = 'trading') THEN
        BEGIN
            INSERT INTO public.wallets (user_id, wallet_type, balance, currency) VALUES (p_user_id, 'trading', 0.00, v_assigned_currency);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE public.wallets.user_id = p_user_id AND public.wallets.wallet_type = 'investment') THEN
        BEGIN
            INSERT INTO public.wallets (user_id, wallet_type, balance, currency) VALUES (p_user_id, 'investment', 0.00, v_assigned_currency);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- 5. Create Broker & Trading records
    IF NOT EXISTS (SELECT 1 FROM public.broker_accounts WHERE public.broker_accounts.user_id = p_user_id) THEN
        BEGIN
            INSERT INTO public.broker_accounts (user_id, broker_name, tier, status)
            VALUES (p_user_id, 'Safe Global Prime', 'Standard', 'active');
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.trading_statistics WHERE public.trading_statistics.user_id = p_user_id) THEN
        BEGIN
            INSERT INTO public.trading_statistics (user_id, total_trades, total_profit)
            VALUES (p_user_id, 0, 0.00);
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.trading_accounts WHERE public.trading_accounts.user_id = p_user_id) THEN
        BEGIN
            INSERT INTO public.trading_accounts (user_id, account_number, balance, equity, margin, free_margin, leverage, status)
            VALUES (p_user_id, 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'), 10000.00, 10000.00, 0.00, 10000.00, '1:100', 'Active');
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- 6. Create Verification records
    IF NOT EXISTS (SELECT 1 FROM public.identity_verification WHERE public.identity_verification.user_id = p_user_id) THEN
        BEGIN
            INSERT INTO public.identity_verification (user_id, document_type, document_url, status)
            VALUES (p_user_id, 'National ID', 'pending', 'pending');
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.kyc_documents WHERE public.kyc_documents.user_id = p_user_id) THEN
        BEGIN
            INSERT INTO public.kyc_documents (user_id, document_type, document_url, status)
            VALUES (p_user_id, 'Identity Card', 'pending', 'pending');
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RECREATE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.handle_new_user_logic(new.id, new.email, new.raw_user_meta_data);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
