const fs = require('fs');

const sql = `
-- ==============================================================================
-- 0006_comprehensive_schema.sql
-- Description: Configures backend services, tables, authentication settings, 
-- storage buckets, functions, and RLS policies for a production environment.
--
-- Deployment Checklist:
-- 1. Execute this file in the Supabase SQL Editor.
-- 2. Verify all tables, views, and functions are created without error.
-- 3. Verify Edge Functions deployment via Supabase CLI.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & CUSTOM TYPES (Idempotent)
DO $$ BEGIN
    CREATE TYPE wallet_type_enum AS ENUM ('main', 'trading', 'investment', 'bonus', 'profit');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. EXISTING TABLES ALTERATIONS (Idempotent)
-- Profiles (Ensuring all required fields exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- Accounts (Ensure we maintain the link)
-- 4. NEW CORE TABLES

-- Currencies
CREATE TABLE IF NOT EXISTS public.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Countries (if missing, though supported_countries exists, we can alias or create)
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    currency_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(15,6) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (base_currency, target_currency)
);

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_type wallet_type_enum NOT NULL DEFAULT 'main',
    balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, wallet_type)
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'credit', 'debit'
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Deposits
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT,
    status TEXT DEFAULT 'pending',
    reference TEXT UNIQUE,
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    method TEXT,
    destination_details JSONB,
    status TEXT DEFAULT 'pending',
    reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Transfers
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    receiver_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'completed',
    reference TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trading Module
CREATE TABLE IF NOT EXISTS public.trading_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.market_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.trading_categories(id) ON DELETE SET NULL,
    current_price DECIMAL(15, 4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trading_account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.market_assets(id) ON DELETE SET NULL,
    asset_symbol TEXT NOT NULL,
    amount DECIMAL(15, 4) NOT NULL,
    entry_price DECIMAL(15, 4) NOT NULL,
    leverage DECIMAL(5, 2) DEFAULT 1.00,
    type TEXT NOT NULL, -- 'buy', 'sell'
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    close_price DECIMAL(15, 4),
    profit_loss DECIMAL(15, 2),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.trading_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_symbol TEXT NOT NULL,
    order_type TEXT NOT NULL, -- 'market', 'limit', 'stop'
    direction TEXT NOT NULL, -- 'buy', 'sell'
    amount DECIMAL(15, 4) NOT NULL,
    target_price DECIMAL(15, 4),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.trading_positions(id) ON DELETE SET NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Broker Module
CREATE TABLE IF NOT EXISTS public.broker_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    broker_name TEXT NOT NULL,
    tier TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Investment Module
CREATE TABLE IF NOT EXISTS public.investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    min_amount DECIMAL(15, 2) NOT NULL,
    max_amount DECIMAL(15, 2) NOT NULL,
    roi_percentage DECIMAL(5, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.investment_plans(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    expected_roi DECIMAL(15, 2) NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.investment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES public.user_investments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'profit', 'principal_return', 'penalty'
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Support Module
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Identity & KYC
CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Referrals & Bonuses
CREATE TABLE IF NOT EXISTS public.referral_program (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    reward_amount DECIMAL(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    reward_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- System Settings & Stats
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.maintenance_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_maintenance_mode BOOLEAN DEFAULT false,
    message TEXT,
    allowed_ips TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dashboard_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_key TEXT UNIQUE NOT NULL,
    stat_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Logs & Sessions
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    ip_address TEXT,
    device_info TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. STORAGE BUCKETS (If they don't exist, these commands insert safely)
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-photos', 'profile-photos', true),
('identity-documents', 'identity-documents', false),
('kyc-documents', 'kyc-documents', false),
('proof-of-address', 'proof-of-address', false),
('trading-documents', 'trading-documents', false),
('receipts', 'receipts', false),
('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 6. FUNCTIONS & TRIGGERS

-- Re-write the handle_new_user to include wallets and dynamic currency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    gen_acc_num TEXT;
    user_display TEXT;
    assigned_currency TEXT := 'USD';
    assigned_symbol TEXT := '$';
    user_country TEXT;
BEGIN
    user_country := new.raw_user_meta_data->>'country';

    -- Try to find currency based on country
    IF user_country IS NOT NULL THEN
        SELECT currency_code, currency_symbol INTO assigned_currency, assigned_symbol
        FROM public.supported_countries 
        WHERE LOWER(country_name) = LOWER(user_country) AND is_active = true
        LIMIT 1;
    END IF;

    -- Determine display name
    user_display := COALESCE(
        new.raw_user_meta_data->>'display_name',
        NULLIF(TRIM(CONCAT(new.raw_user_meta_data->>'first_name', ' ', new.raw_user_meta_data->>'last_name')), ''),
        split_part(new.email, '@', 1)
    );

    -- Insert into profiles
    INSERT INTO public.profiles (
        id, email, first_name, last_name, display_name, phone, address, 
        city, state, zip, country, pin, kyc_status, role, account_currency, currency_symbol
    )
    VALUES (
        new.id, new.email, new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name', user_display,
        new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'address',
        new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'zip', user_country,
        new.raw_user_meta_data->>'pin', 'Unverified',
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        assigned_currency, assigned_symbol
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc'::text, now());

    -- Create default bank account if not existing (preserving existing behavior)
    gen_acc_num := '9424' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE user_id = new.id) THEN
        INSERT INTO public.accounts (user_id, account_number, balance, currency, account_type, status)
        VALUES (new.id, gen_acc_num, 1000.00, assigned_currency, 'checking', 'active');
    END IF;

    -- Create the requested wallets
    INSERT INTO public.wallets (user_id, wallet_type, balance, currency)
    VALUES 
        (new.id, 'main', 0.00, assigned_currency),
        (new.id, 'trading', 0.00, assigned_currency),
        (new.id, 'investment', 0.00, assigned_currency),
        (new.id, 'bonus', 0.00, assigned_currency),
        (new.id, 'profit', 0.00, assigned_currency)
    ON CONFLICT (user_id, wallet_type) DO NOTHING;

    -- Automatically grant admin if email is admin@safeglobal.com
    IF new.email = 'admin@safeglobal.com' THEN
        INSERT INTO public.admins (user_id) VALUES (new.id) ON CONFLICT DO NOTHING;
        UPDATE public.profiles SET role = 'admin' WHERE id = new.id;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Trigger is already attached in 0001, but REPLACE FUNCTION updates the logic)

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_wallets_timestamp BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_deposits_timestamp BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 7. RLS POLICIES (Idempotent by enabling, policies can be DROP/CREATE or IF NOT EXISTS)

-- Helper macro for dropping policies safely
CREATE OR REPLACE FUNCTION drop_policy_if_exists(table_name text, policy_name text) RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_statistics ENABLE ROW LEVEL SECURITY;

-- Admins function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can see their own data, Admins see all
SELECT drop_policy_if_exists('wallets', 'Wallets user access');
CREATE POLICY "Wallets user access" ON public.wallets FOR ALL USING (auth.uid() = user_id OR public.is_admin());

SELECT drop_policy_if_exists('wallet_transactions', 'Wallet tx access');
CREATE POLICY "Wallet tx access" ON public.wallet_transactions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

SELECT drop_policy_if_exists('deposits', 'Deposits access');
CREATE POLICY "Deposits access" ON public.deposits FOR ALL USING (auth.uid() = user_id OR public.is_admin());

SELECT drop_policy_if_exists('withdrawals', 'Withdrawals access');
CREATE POLICY "Withdrawals access" ON public.withdrawals FOR ALL USING (auth.uid() = user_id OR public.is_admin());

SELECT drop_policy_if_exists('transfers', 'Transfers access');
CREATE POLICY "Transfers access" ON public.transfers FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

-- Public reads
SELECT drop_policy_if_exists('investment_plans', 'Public investment plans');
CREATE POLICY "Public investment plans" ON public.investment_plans FOR SELECT USING (true);

SELECT drop_policy_if_exists('app_settings', 'Public app settings');
CREATE POLICY "Public app settings" ON public.app_settings FOR SELECT USING (true);

-- End of schema creation
`;

fs.writeFileSync('supabase/migrations/0006_comprehensive_schema.sql', sql);
