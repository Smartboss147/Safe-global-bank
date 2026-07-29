-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS transaction_pin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_currency TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency_symbol TEXT;

-- Ensure kyc_status can handle what we want or use the enum
-- The enum is ('pending', 'approved', 'rejected')
-- If we want 'Unverified', we might need to add it or use 'pending'

-- Add missing columns to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add missing columns to trading_accounts
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS equity DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS margin DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS free_margin DECIMAL(15, 2) DEFAULT 10000.00;
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS leverage TEXT DEFAULT '1:100';
ALTER TABLE public.trading_accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Create kyc_documents if it doesn't exist (referenced in src/components/dashboard/KYCUpload.tsx)
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Ensure identity_verification exists (referenced in profile.ts)
CREATE TABLE IF NOT EXISTS public.identity_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);
