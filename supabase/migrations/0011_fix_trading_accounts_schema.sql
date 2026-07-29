-- 1. CREATE MISSING TABLES IF THEY DON'T EXIST

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_type TEXT NOT NULL,
    UNIQUE(user_id, wallet_type)
);

CREATE TABLE IF NOT EXISTS public.broker_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.trading_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. FIX TRADING_ACCOUNTS SCHEMA
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS equity DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS margin DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS free_margin DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS leverage TEXT DEFAULT '1:100';
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 3. FIX ACCOUNTS SCHEMA
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'checking';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. FIX WALLETS SCHEMA
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- 5. FIX BROKER_ACCOUNTS SCHEMA
ALTER TABLE public.broker_accounts ADD COLUMN IF NOT EXISTS broker_name TEXT;
ALTER TABLE public.broker_accounts ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Standard';
ALTER TABLE public.broker_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 6. FIX TRADING_STATISTICS SCHEMA
ALTER TABLE public.trading_statistics ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.trading_statistics ADD COLUMN IF NOT EXISTS total_profit DECIMAL(15, 2) DEFAULT 0.00;

-- 7. FIX IDENTITY_VERIFICATION SCHEMA
ALTER TABLE public.identity_verification ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.identity_verification ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.identity_verification ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 8. FIX KYC_DOCUMENTS SCHEMA
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.kyc_documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 9. FIX PROFILES SCHEMA
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

