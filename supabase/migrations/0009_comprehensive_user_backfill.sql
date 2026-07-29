
-- ==============================================================================
-- 0009_comprehensive_user_backfill.sql
-- Description: Ensures all users in auth.users have full application records.
-- ==============================================================================

DO $$
DECLARE
    user_record RECORD;
    gen_acc_num TEXT;
    user_display TEXT;
    assigned_currency TEXT := 'USD';
    assigned_symbol TEXT := '$';
    user_country TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
    user_phone TEXT;
    user_role_val TEXT;
    user_pin TEXT;
BEGIN
    -- Loop through all users in auth.users
    FOR user_record IN SELECT * FROM auth.users LOOP
        
        -- 1. Extract metadata with safety defaults
        user_country := COALESCE(user_record.raw_user_meta_data->>'country', 'United States');
        user_first_name := COALESCE(user_record.raw_user_meta_data->>'first_name', user_record.raw_user_meta_data->>'firstName', '');
        user_last_name := COALESCE(user_record.raw_user_meta_data->>'last_name', user_record.raw_user_meta_data->>'lastName', '');
        user_phone := COALESCE(user_record.raw_user_meta_data->>'phone', '');
        user_role_val := COALESCE(user_record.raw_user_meta_data->>'role', 'user');
        user_pin := COALESCE(user_record.raw_user_meta_data->>'pin', '');

        -- 2. Determine currency and symbol (try to be smart)
        BEGIN
            SELECT currency_code, currency_symbol INTO assigned_currency, assigned_symbol
            FROM public.supported_countries 
            WHERE LOWER(country_name) = LOWER(user_country) AND is_active = true
            LIMIT 1;
            
            IF NOT FOUND THEN
                assigned_currency := 'USD';
                assigned_symbol := '$';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            assigned_currency := 'USD';
            assigned_symbol := '$';
        END;

        -- 3. Determine display name
        user_display := COALESCE(
            user_record.raw_user_meta_data->>'display_name',
            user_record.raw_user_meta_data->>'displayName',
            user_record.raw_user_meta_data->>'username',
            NULLIF(TRIM(CONCAT(user_first_name, ' ', user_last_name)), ''),
            split_part(user_record.email, '@', 1)
        );

        -- 4. Create or update profile
        INSERT INTO public.profiles (
            id, email, first_name, last_name, display_name, phone, address, 
            city, state, zip, country, pin, transaction_pin, kyc_status, role, account_currency, currency_symbol, status
        )
        VALUES (
            user_record.id, 
            user_record.email, 
            user_first_name,
            user_last_name, 
            user_display,
            user_phone, 
            COALESCE(user_record.raw_user_meta_data->>'address', ''),
            COALESCE(user_record.raw_user_meta_data->>'city', ''), 
            COALESCE(user_record.raw_user_meta_data->>'state', ''),
            COALESCE(user_record.raw_user_meta_data->>'zip', ''), 
            user_country,
            user_pin, 
            user_pin, 
            'pending',
            user_role_val,
            assigned_currency, 
            assigned_symbol,
            'active'
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
            first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
            last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
            country = COALESCE(public.profiles.country, EXCLUDED.country),
            role = COALESCE(public.profiles.role, EXCLUDED.role);

        -- 5. Create bank account if missing
        IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = user_record.id) THEN
            gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
            INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
            VALUES (user_record.id, gen_acc_num, 1000.00, assigned_currency, 'checking', 'active');
        END IF;

        -- 6. Create wallets (idempotent via unique constraint)
        INSERT INTO public.wallets (user_id, wallet_type, balance, currency)
        VALUES 
            (user_record.id, 'main', 0.00, assigned_currency),
            (user_record.id, 'trading', 0.00, assigned_currency),
            (user_record.id, 'investment', 0.00, assigned_currency),
            (user_record.id, 'bonus', 0.00, assigned_currency),
            (user_record.id, 'profit', 0.00, assigned_currency)
        ON CONFLICT (user_id, wallet_type) DO NOTHING;

        -- 7. Create broker account
        INSERT INTO public.broker_accounts (user_id, broker_name, tier, status)
        VALUES (user_record.id, 'Safe Global Prime', 'Standard', 'active')
        ON CONFLICT (user_id) DO NOTHING;

        -- 8. Create trading statistics
        INSERT INTO public.trading_statistics (user_id, total_trades, total_profit)
        VALUES (user_record.id, 0, 0.00)
        ON CONFLICT (user_id) DO NOTHING;

        -- 9. Create trading account
        IF NOT EXISTS (SELECT 1 FROM public.trading_accounts WHERE user_id = user_record.id) THEN
            INSERT INTO public.trading_accounts (user_id, account_number, balance, equity, margin, free_margin, leverage, status)
            VALUES (user_record.id, 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'), 10000.00, 10000.00, 0.00, 10000.00, '1:100', 'Active');
        END IF;

        -- 10. Create identity verification and kyc documents
        INSERT INTO public.identity_verification (user_id, document_type, document_url, status)
        VALUES (user_record.id, 'National ID', 'pending', 'pending')
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO public.kyc_documents (user_id, document_type, document_url, status)
        VALUES (user_record.id, 'Identity Card', 'pending', 'pending')
        ON CONFLICT (user_id) DO NOTHING;

        -- 11. Admin promotion based on email
        IF user_record.email IN ('admin@safeglobal.com', 'admin@safeglobalbank.com') THEN
            INSERT INTO public.admins (user_id) VALUES (user_record.id) ON CONFLICT (user_id) DO NOTHING;
            UPDATE public.profiles SET role = 'admin' WHERE id = user_record.id;
        END IF;

    END LOOP;
END $$;
