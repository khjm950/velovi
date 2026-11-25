create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_household_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
      and m.is_active = true
  );
$function$;

create or replace function private.can_view_member_data(p_household_id uuid, p_owner_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select private.is_household_admin(p_household_id)
    or exists (
      select 1
      from public.household_members m
      where m.id = p_owner_member_id
        and m.household_id = p_household_id
        and m.user_id = (select auth.uid())
        and m.is_active = true
    );
$function$;

create or replace function private.can_view_member_accounts(p_household_id uuid, p_owner_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select private.is_household_admin(p_household_id)
    or exists (
      select 1
      from public.household_members viewer
      where viewer.household_id = p_household_id
        and viewer.user_id = (select auth.uid())
        and viewer.is_active = true
        and (viewer.id = p_owner_member_id or viewer.can_view_other_accounts = true)
    );
$function$;

create or replace function private.can_manage_member_transactions(
  p_household_id uuid,
  p_owner_member_id uuid,
  p_action text
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select private.is_household_admin(p_household_id)
    or exists (
      select 1
      from public.household_members m
      where m.id = p_owner_member_id
        and m.household_id = p_household_id
        and m.user_id = (select auth.uid())
        and m.is_active = true
        and (
          (p_action = 'add' and m.can_add_transactions)
          or (p_action = 'edit' and m.can_edit_transactions)
          or (p_action = 'delete' and m.can_delete_transactions)
        )
    );
$function$;

revoke all on function private.is_household_admin(uuid) from public, anon;
revoke all on function private.can_view_member_data(uuid, uuid) from public, anon;
revoke all on function private.can_view_member_accounts(uuid, uuid) from public, anon;
revoke all on function private.can_manage_member_transactions(uuid, uuid, text) from public, anon;
grant execute on function private.is_household_admin(uuid) to authenticated;
grant execute on function private.can_view_member_data(uuid, uuid) to authenticated;
grant execute on function private.can_view_member_accounts(uuid, uuid) to authenticated;
grant execute on function private.can_manage_member_transactions(uuid, uuid, text) to authenticated;

revoke all on function public.is_household_admin(uuid) from public, anon, authenticated;
revoke all on function public.can_view_member_data(uuid, uuid) from public, anon, authenticated;
revoke all on function public.can_view_member_accounts(uuid, uuid) from public, anon, authenticated;
revoke all on function public.can_manage_member_transactions(uuid, uuid, text) from public, anon, authenticated;

drop policy if exists "Admins can view audit log" on public.audit_log;
create policy "Admins can view audit log" on public.audit_log
for select to authenticated
using (private.is_household_admin(household_id));

drop policy if exists "Add own accounts or admin accounts" on public.financial_accounts;
create policy "Add own accounts or admin accounts" on public.financial_accounts
for insert to authenticated
with check (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Delete own accounts or admin accounts" on public.financial_accounts;
create policy "Delete own accounts or admin accounts" on public.financial_accounts
for delete to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Update own accounts or admin accounts" on public.financial_accounts;
create policy "Update own accounts or admin accounts" on public.financial_accounts
for update to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "View permitted member accounts" on public.financial_accounts;
create policy "View permitted member accounts" on public.financial_accounts
for select to authenticated
using (private.can_view_member_accounts(household_id, owner_member_id));

drop policy if exists "Add permitted transactions" on public.financial_transactions;
create policy "Add permitted transactions" on public.financial_transactions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_manage_member_transactions(household_id, owner_member_id, 'add')
);

drop policy if exists "Delete permitted transactions" on public.financial_transactions;
create policy "Delete permitted transactions" on public.financial_transactions
for delete to authenticated
using (private.can_manage_member_transactions(household_id, owner_member_id, 'delete'));

drop policy if exists "Edit permitted transactions" on public.financial_transactions;
create policy "Edit permitted transactions" on public.financial_transactions
for update to authenticated
using (private.can_manage_member_transactions(household_id, owner_member_id, 'edit'))
with check (private.can_manage_member_transactions(household_id, owner_member_id, 'edit'));

drop policy if exists "View own transactions or admin transactions" on public.financial_transactions;
create policy "View own transactions or admin transactions" on public.financial_transactions
for select to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Members see themselves and admins see all" on public.household_members;
create policy "Members see themselves and admins see all" on public.household_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_household_admin(household_id)
);

drop policy if exists "Members can view their households" on public.households;
create policy "Members can view their households" on public.households
for select to authenticated
using (
  exists (
    select 1 from public.household_members m
    where m.household_id = households.id
      and m.user_id = (select auth.uid())
      and m.is_active = true
  )
);
