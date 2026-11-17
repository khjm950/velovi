-- Bootstrap only: ensure the optional account-visibility permission column exists.
-- The current private helper functions and RLS policies are maintained in
-- SUPABASE_HARDEN_RLS_HELPERS.sql. The reactivation defaults are maintained in
-- SUPABASE_RESET_MEMBER_PERMISSIONS_ON_REACTIVATION.sql.
-- Do not restore the older public SECURITY DEFINER helper or RPC definitions.

alter table public.household_members
  add column if not exists can_view_other_accounts boolean not null default false;
