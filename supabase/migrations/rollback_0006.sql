-- ==============================================================================
-- ROLLBACK SCRIPT FOR 0006_comprehensive_schema.sql
--
-- Safely removes tables and functions added during the 0006 migration.
-- WARNING: This will permanently delete data stored in these tables.
-- ==============================================================================

-- 1. DROP RLS POLICIES (Handled automatically when dropping tables)
-- 2. DROP TRIGGERS
DROP TRIGGER IF EXISTS update_wallets_timestamp ON public.wallets;
DROP TRIGGER IF EXISTS update_deposits_timestamp ON public.deposits;

-- 3. DROP NEW TABLES
DROP TABLE IF EXISTS public.dashboard_statistics CASCADE;
DROP TABLE IF EXISTS public.trading_statistics CASCADE;
DROP TABLE IF EXISTS public.market_assets CASCADE;
DROP TABLE IF EXISTS public.trading_categories CASCADE;
DROP TABLE IF EXISTS public.maintenance_settings CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.login_history CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.commissions CASCADE;
DROP TABLE IF EXISTS public.bonuses CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.referral_program CASCADE;
DROP TABLE IF EXISTS public.identity_verification CASCADE;
DROP TABLE IF EXISTS public.ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.investment_transactions CASCADE;
DROP TABLE IF EXISTS public.user_investments CASCADE;
DROP TABLE IF EXISTS public.investment_plans CASCADE;
DROP TABLE IF EXISTS public.broker_accounts CASCADE;
DROP TABLE IF EXISTS public.trading_history CASCADE;
DROP TABLE IF EXISTS public.trading_orders CASCADE;
DROP TABLE IF EXISTS public.trading_positions CASCADE;
DROP TABLE IF EXISTS public.transfers CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.deposits CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.exchange_rates CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.currencies CASCADE;

-- 4. DROP CUSTOM TYPES
DROP TYPE IF EXISTS wallet_type_enum CASCADE;

-- 5. REVERT PROFILES COLUMNS (Optional, usually we keep these)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_currency;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS currency_symbol;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS account_status;

-- 6. REVERT auth.users TRIGGER TO 0001 STATE
-- Note: To fully revert handle_new_user(), you would need to run the specific CREATE OR REPLACE FUNCTION from 0001_initial_schema.sql.
