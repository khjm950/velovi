-- Velovi: read-only permission to view other members' account records.
-- Run once in Supabase SQL Editor before deploying this application update.
ALTER TABLE public.household_members
  ADD COLUMN IF NOT EXISTS can_view_other_accounts boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.can_view_member_accounts(p_household_id uuid, p_owner_member_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT public.is_household_admin(p_household_id)
    OR EXISTS (
      SELECT 1 FROM public.household_members viewer
      WHERE viewer.household_id = p_household_id
        AND viewer.user_id = (SELECT auth.uid())
        AND viewer.is_active = true
        AND (viewer.id = p_owner_member_id OR viewer.can_view_other_accounts = true)
    );
$function$;

REVOKE ALL ON FUNCTION public.can_view_member_accounts(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_member_accounts(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "View own accounts or admin accounts" ON public.financial_accounts;
CREATE POLICY "View permitted member accounts"
ON public.financial_accounts FOR SELECT TO authenticated
USING (public.can_view_member_accounts(household_id, owner_member_id));

-- A reactivated member starts with the new visibility permission disabled.
CREATE OR REPLACE FUNCTION public.reset_account_visibility_on_reactivation()
RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $function$
BEGIN
  IF OLD.is_active = false AND NEW.is_active = true THEN
    NEW.can_view_other_accounts := false;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_reset_account_visibility_on_reactivation ON public.household_members;
CREATE TRIGGER trg_reset_account_visibility_on_reactivation
BEFORE UPDATE OF is_active ON public.household_members
FOR EACH ROW EXECUTE FUNCTION public.reset_account_visibility_on_reactivation();

-- Replace the previous five-argument RPC with the expanded permission function.
DROP FUNCTION IF EXISTS public.update_member_permissions(uuid, uuid, boolean, boolean, boolean);

CREATE OR REPLACE FUNCTION public.update_member_permissions(
  p_household_id uuid, p_member_id uuid,
  p_can_add boolean, p_can_edit boolean, p_can_delete boolean,
  p_can_view_other_accounts boolean
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_old_permissions jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can update permissions';
  END IF;
  IF p_can_add IS NULL OR p_can_edit IS NULL OR p_can_delete IS NULL OR p_can_view_other_accounts IS NULL THEN
    RAISE EXCEPTION 'All permission values must be provided';
  END IF;

  SELECT pg_catalog.jsonb_build_object(
    'can_add', can_add_transactions,
    'can_edit', can_edit_transactions,
    'can_delete', can_delete_transactions,
    'can_view_other_accounts', can_view_other_accounts
  ) INTO v_old_permissions
  FROM public.household_members
  WHERE id = p_member_id AND household_id = p_household_id
    AND role = 'member' AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Active member not found or cannot be modified'; END IF;

  UPDATE public.household_members
  SET can_add_transactions = p_can_add,
      can_edit_transactions = p_can_edit,
      can_delete_transactions = p_can_delete,
      can_view_other_accounts = p_can_view_other_accounts
  WHERE id = p_member_id AND household_id = p_household_id
    AND role = 'member' AND is_active = true;

  INSERT INTO public.audit_log(household_id, actor_user_id, action, entity_table, entity_id, details)
  VALUES (
    p_household_id, auth.uid(), 'member_permissions_updated',
    'household_members', p_member_id,
    pg_catalog.jsonb_build_object(
      'old', v_old_permissions,
      'new', pg_catalog.jsonb_build_object(
        'can_add', p_can_add, 'can_edit', p_can_edit,
        'can_delete', p_can_delete,
        'can_view_other_accounts', p_can_view_other_accounts
      )
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.update_member_permissions(uuid, uuid, boolean, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_member_permissions(uuid, uuid, boolean, boolean, boolean, boolean) TO authenticated;
