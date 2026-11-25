-- Velovi family planning: budgets, savings goals, contributions and recurring entries.
-- Additive schema only. Existing accounts, transactions and household data are untouched.

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_member_id uuid not null,
  category text not null check (length(btrim(category)) between 1 and 80),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  period_start date not null check (extract(day from period_start) = 1),
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  unique (household_id, owner_member_id, category, currency, period_start),
  foreign key (owner_member_id, household_id)
    references public.household_members(id, household_id) on delete cascade
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_member_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 120),
  target_amount numeric(14,2) not null check (target_amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  target_date date,
  visibility text not null default 'private' check (visibility in ('private','family')),
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  foreign key (owner_member_id, household_id)
    references public.household_members(id, household_id) on delete cascade
);

create table if not exists public.savings_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null,
  contributor_member_id uuid not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  contributed_on date not null default current_date,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (goal_id, household_id)
    references public.savings_goals(id, household_id) on delete cascade,
  foreign key (contributor_member_id, household_id)
    references public.household_members(id, household_id) on delete cascade
);

create table if not exists public.recurring_entries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  owner_member_id uuid not null,
  account_id uuid not null,
  transaction_type text not null check (transaction_type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  description text not null check (length(btrim(description)) between 1 and 180),
  category text not null default 'غير مصنف' check (length(btrim(category)) between 1 and 80),
  frequency text not null check (frequency in ('weekly','monthly','quarterly','yearly')),
  next_due_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  foreign key (owner_member_id, household_id)
    references public.household_members(id, household_id) on delete cascade,
  foreign key (account_id, owner_member_id, household_id)
    references public.financial_accounts(id, owner_member_id, household_id) on delete cascade,
  check (end_date is null or end_date >= next_due_date)
);

create index if not exists monthly_budgets_owner_period_idx
  on public.monthly_budgets(household_id, owner_member_id, period_start desc);
create index if not exists savings_goals_owner_status_idx
  on public.savings_goals(household_id, owner_member_id, status);
create index if not exists savings_goal_contributions_goal_date_idx
  on public.savings_goal_contributions(household_id, goal_id, contributed_on desc);
create index if not exists recurring_entries_owner_due_idx
  on public.recurring_entries(household_id, owner_member_id, next_due_date)
  where is_active;

alter table public.monthly_budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_goal_contributions enable row level security;
alter table public.recurring_entries enable row level security;

drop policy if exists "Members view permitted monthly budgets" on public.monthly_budgets;
create policy "Members view permitted monthly budgets"
on public.monthly_budgets for select to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Members manage own monthly budgets" on public.monthly_budgets;
create policy "Members manage own monthly budgets"
on public.monthly_budgets for all to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);

drop policy if exists "Members view permitted savings goals" on public.savings_goals;
create policy "Members view permitted savings goals"
on public.savings_goals for select to authenticated
using (
  private.can_view_member_data(household_id, owner_member_id)
  or (
    visibility = 'family'
    and exists (
      select 1 from public.household_members m
      where m.household_id = savings_goals.household_id
        and m.user_id = (select auth.uid())
        and m.is_active = true
    )
  )
);

drop policy if exists "Members manage own savings goals" on public.savings_goals;
create policy "Members manage own savings goals"
on public.savings_goals for all to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);

drop policy if exists "Members view permitted goal contributions" on public.savings_goal_contributions;
create policy "Members view permitted goal contributions"
on public.savings_goal_contributions for select to authenticated
using (
  exists (
    select 1 from public.savings_goals g
    where g.id = savings_goal_contributions.goal_id
      and g.household_id = savings_goal_contributions.household_id
      and (
        private.can_view_member_data(g.household_id, g.owner_member_id)
        or (
          g.visibility = 'family'
          and exists (
            select 1 from public.household_members m
            where m.household_id = g.household_id
              and m.user_id = (select auth.uid())
              and m.is_active = true
          )
        )
      )
  )
);

drop policy if exists "Members add contributions to visible goals" on public.savings_goal_contributions;
create policy "Members add contributions to visible goals"
on public.savings_goal_contributions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.household_members m
    where m.id = contributor_member_id
      and m.household_id = savings_goal_contributions.household_id
      and m.user_id = (select auth.uid())
      and m.is_active = true
  )
  and exists (
    select 1 from public.savings_goals g
    where g.id = savings_goal_contributions.goal_id
      and g.household_id = savings_goal_contributions.household_id
      and (
        private.can_view_member_data(g.household_id, g.owner_member_id)
        or (
          g.visibility = 'family'
          and exists (
            select 1 from public.household_members m
            where m.household_id = g.household_id
              and m.user_id = (select auth.uid())
              and m.is_active = true
          )
        )
      )
      and g.currency = savings_goal_contributions.currency
  )
);

drop policy if exists "Members view permitted recurring entries" on public.recurring_entries;
create policy "Members view permitted recurring entries"
on public.recurring_entries for select to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Members manage own recurring entries" on public.recurring_entries;
create policy "Members manage own recurring entries"
on public.recurring_entries for all to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);

-- Atomic "record now" action: inserts the real transaction and advances its schedule together.
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
  v_iterations integer := 0;
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

  v_next := v_entry.next_due_date;
  loop
    v_iterations := v_iterations + 1;
    if v_entry.frequency = 'weekly' then
      v_next := v_next + interval '1 week';
    elsif v_entry.frequency = 'monthly' then
      v_next := (v_next + interval '1 month')::date;
    elsif v_entry.frequency = 'quarterly' then
      v_next := (v_next + interval '3 months')::date;
    else
      v_next := (v_next + interval '1 year')::date;
    end if;
    exit when v_next > v_today or v_iterations >= 1200;
  end loop;

  update public.recurring_entries
  set next_due_date = v_next,
      is_active = case when end_date is not null and v_next > end_date then false else true end,
      updated_at = now()
  where id = p_recurring_id;

  return v_transaction_id;
end;
$function$;

revoke all on function public.record_due_recurring_transaction(uuid) from public, anon;
grant execute on function public.record_due_recurring_transaction(uuid) to authenticated;

grant select, insert, update, delete on public.monthly_budgets to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert on public.savings_goal_contributions to authenticated;
grant select, insert, update, delete on public.recurring_entries to authenticated;

notify pgrst, 'reload schema';
