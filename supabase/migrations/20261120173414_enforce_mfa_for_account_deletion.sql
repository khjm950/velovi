create or replace function public.self_delete_velovi_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_household record;
  v_successor uuid;
  v_other_admin boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1 from auth.mfa_factors f
    where f.user_id = v_user_id and f.status = 'verified'
  ) and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'Multi-factor authentication is required for account deletion';
  end if;

  for v_household in
    select m.id, m.household_id, m.role
    from public.household_members m
    where m.user_id = v_user_id and m.is_active = true
    for update
  loop
    if v_household.role = 'admin' then
      select exists (
        select 1 from public.household_members m
        where m.household_id = v_household.household_id
          and m.user_id <> v_user_id and m.role = 'admin' and m.is_active = true
      ) into v_other_admin;

      if not v_other_admin then
        select m.id into v_successor
        from public.household_members m
        where m.household_id = v_household.household_id
          and m.user_id <> v_user_id and m.role = 'member' and m.is_active = true
        order by m.created_at asc, m.id asc
        limit 1 for update;

        if v_successor is null then
          raise exception 'Transfer administrator access before deleting this account';
        end if;

        update public.household_members set role = 'admin' where id = v_successor;
      end if;
    end if;

    insert into public.audit_log
      (household_id, actor_user_id, action, entity_table, entity_id, details)
    values
      (v_household.household_id, v_user_id, 'account_self_deletion_requested',
       'household_members', v_household.id,
       pg_catalog.jsonb_build_object('financial_history_retained', true));
  end loop;

  update public.household_members
  set is_active = false, display_name = 'حساب محذوف'
  where user_id = v_user_id;

  return pg_catalog.jsonb_build_object('user_id', v_user_id, 'history_retained', true);
end;
$function$;

create or replace function public.admin_delete_velovi_member(
  p_household_id uuid,
  p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_target_user uuid;
  v_accounts bigint;
  v_transactions bigint;
begin
  if v_actor is null or not public.is_household_admin(p_household_id) then
    raise exception 'Only an active household administrator can permanently delete a member';
  end if;

  if exists (
    select 1 from auth.mfa_factors f
    where f.user_id = v_actor and f.status = 'verified'
  ) and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'Multi-factor authentication is required for permanent member deletion';
  end if;

  select m.user_id into v_target_user
  from public.household_members m
  where m.id = p_member_id and m.household_id = p_household_id and m.role = 'member'
  for update;

  if not found or v_target_user is null then
    raise exception 'Member not found or account already deleted';
  end if;
  if v_target_user = v_actor then
    raise exception 'You cannot permanently delete your own administrator account here';
  end if;

  select count(*) into v_accounts
  from public.financial_accounts a
  where a.household_id = p_household_id and a.owner_member_id = p_member_id;
  select count(*) into v_transactions
  from public.financial_transactions t
  where t.household_id = p_household_id and t.owner_member_id = p_member_id;

  insert into public.audit_log
    (household_id, actor_user_id, action, entity_table, entity_id, details)
  values
    (p_household_id, v_actor, 'member_permanently_deleted', 'household_members', p_member_id,
     pg_catalog.jsonb_build_object('accounts_deleted', v_accounts,
       'transactions_deleted', v_transactions, 'financial_data_deleted', true));

  delete from public.household_members
  where id = p_member_id and household_id = p_household_id;

  return pg_catalog.jsonb_build_object('target_user_id', v_target_user,
    'accounts_deleted', v_accounts, 'transactions_deleted', v_transactions);
end;
$function$;

revoke all on function public.self_delete_velovi_account() from public, anon;
grant execute on function public.self_delete_velovi_account() to authenticated;
revoke all on function public.admin_delete_velovi_member(uuid, uuid) from public, anon;
grant execute on function public.admin_delete_velovi_member(uuid, uuid) to authenticated;
