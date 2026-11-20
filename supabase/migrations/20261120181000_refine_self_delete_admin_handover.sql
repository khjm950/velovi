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

  for v_household in
    select m.id, m.household_id, m.role
    from public.household_members m
    where m.user_id = v_user_id
      and m.is_active = true
    for update
  loop
    if v_household.role = 'admin' then
      select exists (
        select 1
        from public.household_members m
        where m.household_id = v_household.household_id
          and m.user_id <> v_user_id
          and m.role = 'admin'
          and m.is_active = true
      ) into v_other_admin;

      if not v_other_admin then
        select m.id into v_successor
        from public.household_members m
        where m.household_id = v_household.household_id
          and m.user_id <> v_user_id
          and m.role = 'member'
          and m.is_active = true
        order by m.created_at asc, m.id asc
        limit 1
        for update;

        if v_successor is null then
          raise exception 'Transfer administrator access before deleting this account';
        end if;

        update public.household_members
        set role = 'admin'
        where id = v_successor;
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
