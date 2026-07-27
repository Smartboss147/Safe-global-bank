# Deployment Report for Supabase Migration

## Overview
This report details the comprehensive migration script (`supabase/migrations/0006_comprehensive_schema.sql`) designed to configure all requested backend services, database objects, authentication settings, and policies.

## Validation & Strategy
- **Idempotency**: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF NOT EXISTS`, and safe `DROP POLICY` helper functions are used throughout.
- **Existing Resources**: 
  - `profiles`, `admins`, `accounts`, `transactions`, `notifications`, `beneficiaries`, `audit_logs`, `kyc_documents`, `trading_accounts`, `trades` are preserved.
  - The `handle_new_user()` trigger was carefully overwritten using `CREATE OR REPLACE` to seamlessly assign currencies and create five specialized wallets (main, trading, investment, bonus, profit) for new users, while maintaining existing default accounts.
- **Rollback Strategy**: Every structural change can be reverted by running a `DROP TABLE IF EXISTS` for the newly created tables, or by reverting the `handle_new_user` function to its `0001` state. Existing data is not mutated or destroyed.

## Tables Validated & Created
- **Created**: `currencies`, `countries`, `exchange_rates`, `wallets`, `wallet_transactions`, `deposits`, `withdrawals`, `transfers`, `trading_categories`, `market_assets`, `trading_positions`, `trading_orders`, `trading_history`, `trading_statistics`, `broker_accounts`, `investment_plans`, `user_investments`, `investment_transactions`, `support_tickets`, `ticket_messages`, `identity_verification`, `referral_program`, `referrals`, `bonuses`, `commissions`, `app_settings`, `maintenance_settings`, `dashboard_statistics`, `activity_logs`, `login_history`, `sessions`, `api_keys`.
- **Preserved/Verified**: `auth.users` (users), `profiles` (user_profiles), `admins` (admin_users), `beneficiaries`, `trading_accounts`, `notifications`, `kyc_documents`, `audit_logs`.

## Functions & Triggers Updated
- **`handle_new_user()`**: Updated to query `supported_countries` on signup, assign default currencies, seed `wallets`, and update `profiles`.
- **`update_timestamp_column()`**: Helper trigger for standard table timestamps (`updated_at`).
- **`is_admin()`**: Utility function for RLS checks against the `admins` table.

## Row Level Security (RLS)
- RLS enabled on all 29 new tables.
- **Policies**: 
  - Users are strictly scoped to rows where `user_id = auth.uid()` or similar relations.
  - Admins (verified via `is_admin()`) have global access for maintenance and support dashboards.
  - Public read access is granted for `investment_plans` and `app_settings`.

## Storage Buckets Created
- `profile-photos` (Public)
- `identity-documents` (Private)
- `kyc-documents` (Private)
- `proof-of-address` (Private)
- `trading-documents` (Private)
- `receipts` (Private)
- `attachments` (Private)

## Manual Steps & Environment Variables
1. **Migration Execution**: Because this environment runs as a generated codebase without direct superuser access to the hosted Supabase database, **you must copy the contents of `supabase/migrations/0006_comprehensive_schema.sql` and run it manually in the Supabase SQL Editor.**
2. **Storage Policies**: While buckets are created if permissions allow, it is highly recommended to verify bucket settings and RLS via the Supabase Storage Dashboard.
3. **Environment Variables**:
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
   - For backend/Edge Functions, `SUPABASE_SERVICE_ROLE_KEY` must be configured securely.
4. **Edge Functions**: Deploy specific business logic endpoints using the Supabase CLI (`supabase functions deploy`).
