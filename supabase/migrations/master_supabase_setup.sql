-- MASTER SUPABASE SETUP SCRIPT FOR SAFE GLOBAL BANK
-- Run this in your Supabase SQL Editor to provision all tables, policies, and admin RPC functions.

-- 1. Profiles Table
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
  currency TEXT DEFAULT 'USD',
  currency_code TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  pin TEXT,
  transaction_pin TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  kyc_status TEXT DEFAULT 'pending',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 1000.00,
  currency TEXT DEFAULT 'USD',
  account_type TEXT DEFAULT 'checking',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL,
  balance NUMERIC DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, wallet_type)
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  balance_after NUMERIC DEFAULT 0.00,
  description TEXT,
  status TEXT DEFAULT 'completed',
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KYC Documents Table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT DEFAULT 'National ID',
  document_url TEXT,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Helper is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'SUPER_ADMIN')
  ) OR (auth.jwt() ->> 'email' LIKE '%admin%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Admin Apply Action RPC (for balance modification, kyc approval/rejection, etc.)
CREATE OR REPLACE FUNCTION public.admin_apply_action(
  p_action TEXT,
  p_target_user_id UUID,
  p_wallet_type TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT public.is_admin() INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin privileges required');
  END IF;

  IF p_action = 'approve_kyc' THEN
    UPDATE public.kyc_documents
    SET status = 'approved', updated_at = NOW()
    WHERE user_id = p_target_user_id;

    UPDATE public.profiles
    SET kyc_status = 'approved', updated_at = NOW()
    WHERE id = p_target_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'KYC approved successfully');

  ELSIF p_action = 'reject_kyc' THEN
    UPDATE public.kyc_documents
    SET status = 'rejected', rejection_reason = p_reason, updated_at = NOW()
    WHERE user_id = p_target_user_id;

    UPDATE public.profiles
    SET kyc_status = 'rejected', updated_at = NOW()
    WHERE id = p_target_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'KYC rejected successfully');

  ELSIF p_action = 'credit_wallet' THEN
    IF p_wallet_type IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid wallet type or amount');
    END IF;

    INSERT INTO public.wallets (user_id, wallet_type, balance)
    VALUES (p_target_user_id, p_wallet_type, 0.00)
    ON CONFLICT (user_id, wallet_type) DO NOTHING;

    SELECT balance INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_target_user_id AND wallet_type = p_wallet_type;

    v_new_balance := v_current_balance + p_amount;

    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_id = p_target_user_id AND wallet_type = p_wallet_type;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference, status)
    VALUES (p_target_user_id, 'credit', p_amount, v_new_balance, COALESCE(p_reason, 'Admin credit to ' || p_wallet_type || ' wallet'), p_reference, 'completed');

    RETURN jsonb_build_object('success', true, 'balance', v_new_balance);

  ELSIF p_action = 'debit_wallet' THEN
    IF p_wallet_type IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid wallet type or amount');
    END IF;

    SELECT balance INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_target_user_id AND wallet_type = p_wallet_type;

    IF v_current_balance IS NULL THEN
      v_current_balance := 0.00;
    END IF;

    v_new_balance := v_current_balance - p_amount;
    IF v_new_balance < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds in wallet');
    END IF;

    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = NOW()
    WHERE user_id = p_target_user_id AND wallet_type = p_wallet_type;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, reference, status)
    VALUES (p_target_user_id, 'debit', p_amount, v_new_balance, COALESCE(p_reason, 'Admin debit from ' || p_wallet_type || ' wallet'), p_reference, 'completed');

    RETURN jsonb_build_object('success', true, 'balance', v_new_balance);

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported action: ' || p_action);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
