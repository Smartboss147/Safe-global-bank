-- ==============================================================================
-- 0013_dynamic_handle_new_user.sql
-- Description: A completely schema-agnostic dynamic provisioning function.
-- It queries information_schema to ONLY insert into columns that actually exist.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_logic(p_user_id UUID, p_user_email TEXT, p_user_metadata JSONB)
RETURNS VOID AS $$
DECLARE
    v_user_display TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_pin TEXT;
    v_country TEXT;
    v_role TEXT;
    
    v_gen_acc_num TEXT;
    v_trd_acc_num TEXT;
    
    v_cols TEXT;
    v_vals TEXT;
    
    v_col_name TEXT;
BEGIN
    -- Extract values safely
    v_user_display := COALESCE(p_user_metadata->>'display_name', p_user_metadata->>'displayName', p_user_metadata->>'username', split_part(p_user_email, '@', 1));
    v_first_name := COALESCE(p_user_metadata->>'first_name', p_user_metadata->>'firstName', '');
    v_last_name := COALESCE(p_user_metadata->>'last_name', p_user_metadata->>'lastName', '');
    v_pin := COALESCE(p_user_metadata->>'pin', '');
    v_country := COALESCE(p_user_metadata->>'country', 'United States');
    
    IF p_user_email IN ('admin@safeglobal.com', 'admin@safeglobalbank.com') THEN
        v_role := 'admin';
    ELSE
        v_role := COALESCE(p_user_metadata->>'role', 'user');
    END IF;

    -- =========================================================
    -- 1. Insert into PROFILES dynamically
    -- =========================================================
    v_cols := 'id';
    v_vals := quote_literal(p_user_id);
    
    FOR v_col_name IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' LOOP
        IF v_col_name = 'email' THEN
            v_cols := v_cols || ', email'; v_vals := v_vals || ', ' || quote_literal(p_user_email);
        ELSIF v_col_name = 'display_name' THEN
            v_cols := v_cols || ', display_name'; v_vals := v_vals || ', ' || quote_literal(v_user_display);
        ELSIF v_col_name = 'first_name' THEN
            v_cols := v_cols || ', first_name'; v_vals := v_vals || ', ' || quote_literal(v_first_name);
        ELSIF v_col_name = 'last_name' THEN
            v_cols := v_cols || ', last_name'; v_vals := v_vals || ', ' || quote_literal(v_last_name);
        ELSIF v_col_name = 'pin' THEN
            v_cols := v_cols || ', pin'; v_vals := v_vals || ', ' || quote_literal(v_pin);
        ELSIF v_col_name = 'transaction_pin' THEN
            v_cols := v_cols || ', transaction_pin'; v_vals := v_vals || ', ' || quote_literal(v_pin);
        ELSIF v_col_name = 'country' THEN
            v_cols := v_cols || ', country'; v_vals := v_vals || ', ' || quote_literal(v_country);
        ELSIF v_col_name = 'role' THEN
            v_cols := v_cols || ', role'; v_vals := v_vals || ', ' || quote_literal(v_role);
        ELSIF v_col_name = 'status' THEN
            v_cols := v_cols || ', status'; v_vals := v_vals || ', ' || quote_literal('active');
        ELSIF v_col_name = 'kyc_status' THEN
            v_cols := v_cols || ', kyc_status'; v_vals := v_vals || ', ' || quote_literal('pending');
        END IF;
    END LOOP;

    BEGIN
        EXECUTE 'INSERT INTO public.profiles (' || v_cols || ') VALUES (' || v_vals || ') ON CONFLICT (id) DO NOTHING';
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- =========================================================
    -- 2. Insert into ADMINS
    -- =========================================================
    IF v_role = 'admin' THEN
        BEGIN
            INSERT INTO public.admins (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;

    -- =========================================================
    -- 3. Insert into ACCOUNTS dynamically
    -- =========================================================
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = p_user_id) THEN
            v_gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
            v_cols := 'user_id';
            v_vals := quote_literal(p_user_id);
            
            FOR v_col_name IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounts' LOOP
                IF v_col_name = 'account_number' THEN
                    v_cols := v_cols || ', account_number'; v_vals := v_vals || ', ' || quote_literal(v_gen_acc_num);
                ELSIF v_col_name = 'balance' THEN
                    v_cols := v_cols || ', balance'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'currency' THEN
                    v_cols := v_cols || ', currency'; v_vals := v_vals || ', ' || quote_literal('USD');
                ELSIF v_col_name = 'status' THEN
                    v_cols := v_cols || ', status'; v_vals := v_vals || ', ' || quote_literal('active');
                ELSIF v_col_name = 'account_type' THEN
                    v_cols := v_cols || ', account_type'; v_vals := v_vals || ', ' || quote_literal('checking');
                END IF;
            END LOOP;
            
            EXECUTE 'INSERT INTO public.accounts (' || v_cols || ') VALUES (' || v_vals || ')';
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        NULL; 
    END;

    -- =========================================================
    -- 4. Insert into TRADING_ACCOUNTS dynamically
    -- =========================================================
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.trading_accounts WHERE user_id = p_user_id) THEN
            v_trd_acc_num := 'TRD-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
            v_cols := 'user_id';
            v_vals := quote_literal(p_user_id);
            
            FOR v_col_name IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trading_accounts' LOOP
                IF v_col_name = 'account_number' THEN
                    v_cols := v_cols || ', account_number'; v_vals := v_vals || ', ' || quote_literal(v_trd_acc_num);
                ELSIF v_col_name = 'balance' THEN
                    v_cols := v_cols || ', balance'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'equity' THEN
                    v_cols := v_cols || ', equity'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'margin' THEN
                    v_cols := v_cols || ', margin'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'free_margin' THEN
                    v_cols := v_cols || ', free_margin'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'leverage' THEN
                    v_cols := v_cols || ', leverage'; v_vals := v_vals || ', ' || quote_literal('1:100');
                ELSIF v_col_name = 'status' THEN
                    v_cols := v_cols || ', status'; v_vals := v_vals || ', ' || quote_literal('Active');
                END IF;
            END LOOP;
            
            EXECUTE 'INSERT INTO public.trading_accounts (' || v_cols || ') VALUES (' || v_vals || ')';
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        NULL; 
    END;

    -- =========================================================
    -- 5. Insert into WALLETS dynamically
    -- =========================================================
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') THEN
            v_cols := 'user_id';
            v_vals := quote_literal(p_user_id);
            
            FOR v_col_name IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' LOOP
                IF v_col_name = 'wallet_type' THEN
                    v_cols := v_cols || ', wallet_type'; v_vals := v_vals || ', ' || quote_literal('main');
                ELSIF v_col_name = 'balance' THEN
                    v_cols := v_cols || ', balance'; v_vals := v_vals || ', 0.00';
                ELSIF v_col_name = 'currency' THEN
                    v_cols := v_cols || ', currency'; v_vals := v_vals || ', ' || quote_literal('USD');
                END IF;
            END LOOP;
            
            BEGIN
                EXECUTE 'INSERT INTO public.wallets (' || v_cols || ') VALUES (' || v_vals || ')';
            EXCEPTION WHEN OTHERS THEN NULL; END;
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        NULL; 
    END;

    -- =========================================================
    -- 6. Insert into BROKER_ACCOUNTS dynamically
    -- =========================================================
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broker_accounts') THEN
            IF NOT EXISTS (SELECT 1 FROM public.broker_accounts WHERE user_id = p_user_id) THEN
                v_cols := 'user_id';
                v_vals := quote_literal(p_user_id);
                FOR v_col_name IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'broker_accounts' LOOP
                    IF v_col_name = 'broker_name' THEN
                        v_cols := v_cols || ', broker_name'; v_vals := v_vals || ', ' || quote_literal('Safe Global Prime');
                    ELSIF v_col_name = 'tier' THEN
                        v_cols := v_cols || ', tier'; v_vals := v_vals || ', ' || quote_literal('Standard');
                    ELSIF v_col_name = 'status' THEN
                        v_cols := v_cols || ', status'; v_vals := v_vals || ', ' || quote_literal('active');
                    END IF;
                END LOOP;
                BEGIN
                    EXECUTE 'INSERT INTO public.broker_accounts (' || v_cols || ') VALUES (' || v_vals || ')';
                EXCEPTION WHEN OTHERS THEN NULL; END;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger wrapper
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.handle_new_user_logic(new.id, new.email, new.raw_user_meta_data);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- BACKFILL EXISTING USERS
-- ==============================================================================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT * FROM auth.users LOOP
        PERFORM public.handle_new_user_logic(user_record.id, user_record.email, user_record.raw_user_meta_data);
    END LOOP;
END $$;
