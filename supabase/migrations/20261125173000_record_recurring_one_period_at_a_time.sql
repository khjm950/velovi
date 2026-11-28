-- Advance a recurring template by exactly one occurrence per recorded transaction.
-- Overdue occurrences remain visible and can be recorded one by one; none are silently skipped.
create or replace function public.record_due_recurring_transaction(p_recurring_id uuid)
returns uuid
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_entry public.recurring_entries%rowtype;
  v_transaction_id uuid;
  v_next date;
  v_today date := current_date;
  v_account_currency text;
begin
  select * into v_entry
  from public.recurring_entries
  where id = p_recurring_id
    and is_active = true
  for update;

  if not found then
    raise exception 'Recurring entry not found or inactive';
  end if;
  if v_entry.next_due_date > v_today then
    raise exception 'This recurring entry is not due yet';
  end if;
  if v_entry.end_date is not null and v_entry.next_due_date > v_entry.end_date then
    raise exception 'Recurring entry has passed its end date';
  end if;

  select currency into v_account_currency
  from public.financial_accounts
  where id = v_entry.account_id
    and household_id = v_entry.household_id
    and owner_member_id = v_entry.owner_member_id
    and is_active = true;

  if not found or v_account_currency <> v_entry.currency then
    raise exception 'The linked account is unavailable or its currency has changed';
  end if;

  insert into public.financial_transactions (
    household_id, owner_member_id, account_id, transaction_type,
    amount, currency, description, category, transaction_date, created_by
  ) values (
    v_entry.household_id, v_entry.owner_member_id, v_entry.account_id, v_entry.transaction_type,
    v_entry.amount, v_entry.currency, v_entry.description, v_entry.category, v_entry.next_due_date, auth.uid()
  ) returning id into v_transaction_id;

  if v_entry.frequency = 'weekly' then
    v_next := v_entry.next_due_date + interval '1 week';
  elsif v_entry.frequency = 'monthly' then
    v_next := (v_entry.next_due_date + interval '1 month')::date;
  elsif v_entry.frequency = 'quarterly' then
    v_next := (v_entry.next_due_date + interval '3 months')::date;
  else
    v_next := (v_entry.next_due_date + interval '1 year')::date;
  end if;

  update public.recurring_entries
  set next_due_date = case when end_date is not null and v_next > end_date then v_entry.next_due_date else v_next end,
      is_active = case when end_date is not null and v_next > end_date then false else true end,
      updated_at = now()
  where id = p_recurring_id;

  return v_transaction_id;
end;
$function$;

revoke all on function public.record_due_recurring_transaction(uuid) from public, anon;
grant execute on function public.record_due_recurring_transaction(uuid) to authenticated;
notify pgrst, 'reload schema';
