const fs = require('fs');
const sql = `
-- COMPREHENSIVE BACKEND SCHEMA ADDITIONS
-- Retains existing tables, creates missing ones, sets up triggers and RLS policies

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. INVESTMENTS
CREATE TABLE IF NOT EXISTS public.investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    min_amount DECIMAL(15,2) NOT NULL,
    max_amount DECIMAL(15,2) NOT NULL,
    roi_percentage DECIMAL(5,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.investment_plans(id),
    amount DECIMAL(15,2) NOT NULL,
    expected_roi DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.investment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES public.user_investments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BROKER MODULE
CREATE TABLE IF NOT EXISTS public.broker_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    broker_name TEXT,
    tier TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.market_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_price DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trading_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. REFERRALS & BONUSES
CREATE TABLE IF NOT EXISTS public.referral_program (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    reward_amount DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    status TEXT DEFAULT 'pending',
    reward_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. APP SETTINGS & STATS
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    stat_key TEXT NOT NULL UNIQUE,
    stat_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. SYSTEM LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. IDENTITY & KYC
CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. EXCHANGE RATES & CURRENCIES
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(15,6) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(base_currency, target_currency)
);

CREATE TABLE IF NOT EXISTS public.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ENABLE RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- GENERAL POLICIES (Read for everyone or user, Write for admin or user)
-- Note: Requires an admin check function or role. For simplicity, we check public.admins table.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Support Tickets: Users can read/write their own, admins can read/write all
CREATE POLICY "Tickets user access" ON public.support_tickets FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Ticket messages user access" ON public.ticket_messages FOR ALL USING (
    (SELECT user_id FROM public.support_tickets WHERE id = ticket_id) = auth.uid() OR public.is_admin()
);

-- Investments: Users read their own, admins all. Plans are public read.
CREATE POLICY "Investment plans read" ON public.investment_plans FOR SELECT USING (true);
CREATE POLICY "Investment plans admin" ON public.investment_plans FOR ALL USING (public.is_admin());

CREATE POLICY "User investments access" ON public.user_investments FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Investment tx access" ON public.investment_transactions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Broker and Market
CREATE POLICY "Broker account access" ON public.broker_accounts FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Market assets read" ON public.market_assets FOR SELECT USING (true);
CREATE POLICY "Market assets admin" ON public.market_assets FOR ALL USING (public.is_admin());
CREATE POLICY "Trading categories read" ON public.trading_categories FOR SELECT USING (true);
CREATE POLICY "Trading categories admin" ON public.trading_categories FOR ALL USING (public.is_admin());
CREATE POLICY "Trading stats access" ON public.trading_statistics FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Referrals and Bonuses
CREATE POLICY "Referral program read" ON public.referral_program FOR SELECT USING (true);
CREATE POLICY "Referral program admin" ON public.referral_program FOR ALL USING (public.is_admin());
CREATE POLICY "Referrals access" ON public.referrals FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());
CREATE POLICY "Bonuses access" ON public.bonuses FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Commissions access" ON public.commissions FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- System & App Settings
CREATE POLICY "App settings read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "App settings admin" ON public.app_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Maintenance read" ON public.maintenance_settings FOR SELECT USING (true);
CREATE POLICY "Maintenance admin" ON public.maintenance_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Dashboard stats read" ON public.dashboard_statistics FOR SELECT USING (public.is_admin());
CREATE POLICY "Dashboard stats admin" ON public.dashboard_statistics FOR ALL USING (public.is_admin());

-- Logs
CREATE POLICY "Activity logs access" ON public.activity_logs FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Login history access" ON public.login_history FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "API keys access" ON public.api_keys FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Identity
CREATE POLICY "Identity access" ON public.identity_verification FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Currencies & Exchange
CREATE POLICY "Exchange read" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Exchange admin" ON public.exchange_rates FOR ALL USING (public.is_admin());
CREATE POLICY "Currencies read" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "Currencies admin" ON public.currencies FOR ALL USING (public.is_admin());

-- DATABASE TRIGGERS & FUNCTIONS
-- Create Wallet function
CREATE OR REPLACE FUNCTION public.create_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', now())
  ON CONFLICT DO NOTHING;

  -- Insert into accounts (wallets)
  INSERT INTO public.accounts (user_id, account_number, balance, currency)
  VALUES (
    NEW.id, 
    'ACC-' || upper(substring(NEW.id::text from 1 for 6)),
    0,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  )
  ON CONFLICT DO NOTHING;
  
  -- Record login history
  INSERT INTO public.login_history (user_id, ip_address, user_agent)
  VALUES (NEW.id, '127.0.0.1', 'System Auto Login')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_new_user_setup();

-- STORAGE BUCKETS
-- (This uses Supabase storage functions if available, generally run via UI, but here's SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT DO NOTHING;

-- Storage RLS
CREATE POLICY "Users can upload their own KYC" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid() = owner);
CREATE POLICY "Users can view their own KYC" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND (auth.uid() = owner OR public.is_admin()));

CREATE POLICY "Users can upload their own photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() = owner);
CREATE POLICY "Photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() = owner);
CREATE POLICY "Users can view own receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND (auth.uid() = owner OR public.is_admin()));

`;

fs.writeFileSync('supabase/migrations/0006_comprehensive_schema.sql', sql);
