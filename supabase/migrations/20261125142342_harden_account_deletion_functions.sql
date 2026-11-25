-- Keep privileged account-deletion implementations outside the exposed public API schema.
-- Public RPC wrappers remain SECURITY INVOKER and delegate to these private functions.
CREATE OR REPLACE FUNCTION private.admin_delete_velovi_member(
  p_household_id uuid,
  p_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_target_user uuid;
  v_accounts bigint;
  v_transactions bigint;
BEGIN
  IF v_actor IS NULL OR NOT private.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only an active household administrator can permanently delete a member';
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = v_actor AND f.status = 'verified'
  ) AND COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Multi-factor authentication is required for permanent member deletion';
  END IF;

  SELECT m.user_id INTO v_target_user
  FROM public.household_members m
  WHERE m.id = p_member_id AND m.household_id = p_household_id AND m.role = 'member'
  FOR UPDATE;

  IF NOT FOUND OR v_target_user IS NULL THEN
    RAISE EXCEPTION 'Member not found or account already deleted';
  END IF;
  IF v_target_user = v_actor THEN
    RAISE EXCEPTION 'You cannot permanently delete your own administrator account here';
  END IF;

  SELECT count(*) INTO v_accounts
  FROM public.financial_accounts a
  WHERE a.household_id = p_household_id AND a.owner_member_id = p_member_id;
  SELECT count(*) INTO v_transactions
  FROM public.financial_transactions t
  WHERE t.household_id = p_household_id AND t.owner_member_id = p_member_id;

  INSERT INTO public.audit_log
    (household_id, actor_user_id, action, entity_table, entity_id, details)
  VALUES
    (p_household_id, v_actor, 'member_permanently_deleted', 'household_members', p_member_id,
     pg_catalog.jsonb_build_object('accounts_deleted', v_accounts,
       'transactions_deleted', v_transactions, 'financial_data_deleted', true));

  DELETE FROM public.household_members
  WHERE id = p_member_id AND household_id = p_household_id;

  RETURN pg_catalog.jsonb_build_object('target_user_id', v_target_user,
    'accounts_deleted', v_accounts, 'transactions_deleted', v_transactions);
END;
$function$;

CREATE OR REPLACE FUNCTION private.self_delete_velovi_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_household record;
  v_successor uuid;
  v_other_admin boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.mfa_factors f
    WHERE f.user_id = v_user_id AND f.status = 'verified'
  ) AND COALESCE(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Multi-factor authentication is required for account deletion';
  END IF;

  FOR v_household IN
    SELECT m.id, m.household_id, m.role
    FROM public.household_members m
    WHERE m.user_id = v_user_id AND m.is_active = true
    FOR UPDATE
  LOOP
    IF v_household.role = 'admin' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.household_members m
        WHERE m.household_id = v_household.household_id
          AND m.user_id <> v_user_id AND m.role = 'admin' AND m.is_active = true
      ) INTO v_other_admin;

      IF NOT v_other_admin THEN
        SELECT m.id INTO v_successor
        FROM public.household_members m
        WHERE m.household_id = v_household.household_id
          AND m.user_id <> v_user_id AND m.role = 'member' AND m.is_active = true
        ORDER BY m.created_at ASC, m.id ASC
        LIMIT 1 FOR UPDATE;

        IF v_successor IS NULL THEN
          RAISE EXCEPTION 'Transfer administrator access before deleting this account';
        END IF;
        UPDATE public.household_members SET role = 'admin' WHERE id = v_successor;
      END IF;
    END IF;

    INSERT INTO public.audit_log
      (household_id, actor_user_id, action, entity_table, entity_id, details)
    VALUES
      (v_household.household_id, v_user_id, 'account_self_deletion_requested',
       'household_members', v_household.id,
       pg_catalog.jsonb_build_object('financial_history_retained', true));
  END LOOP;

  UPDATE public.household_members
  SET is_active = false, display_name = 'حساب محذوف'
  WHERE user_id = v_user_id;

  RETURN pg_catalog.jsonb_build_object('user_id', v_user_id, 'history_retained', true);
END;
$function$;

REVOKE ALL ON FUNCTION private.admin_delete_velovi_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.self_delete_velovi_account() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_delete_velovi_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.self_delete_velovi_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_velovi_member(uuid, uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT private.admin_delete_velovi_member($1, $2);
$function$;

CREATE OR REPLACE FUNCTION public.self_delete_velovi_account()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT private.self_delete_velovi_account();
$function$;

REVOKE ALL ON FUNCTION public.admin_delete_velovi_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.self_delete_velovi_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_velovi_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.self_delete_velovi_account() TO authenticated;

NOTIFY pgrst, 'reload schema';
