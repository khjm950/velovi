-- Velovi production hardening, applied directly to project on 2026-11-17.
-- Safe/idempotent: indexes only; no financial rows are changed or removed.
-- The event trigger is internal infrastructure, not an RPC endpoint.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_accounts_owner_household_fk
  ON public.financial_accounts (owner_member_id, household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_household_fk
  ON public.financial_transactions (account_id, household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_owner_household_fk
  ON public.financial_transactions (account_id, owner_member_id, household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner_household_fk
  ON public.financial_transactions (owner_member_id, household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by_fk
  ON public.financial_transactions (created_by);
CREATE INDEX IF NOT EXISTS idx_households_created_by_fk
  ON public.households (created_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_fk
  ON public.audit_log (actor_user_id);
