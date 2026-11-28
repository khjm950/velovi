-- Preserve trustworthy creator attribution on planning inserts.
drop policy if exists "Members insert own monthly budgets" on public.monthly_budgets;
create policy "Members insert own monthly budgets"
on public.monthly_budgets for insert to authenticated
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);

drop policy if exists "Members insert own savings goals" on public.savings_goals;
create policy "Members insert own savings goals"
on public.savings_goals for insert to authenticated
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);

drop policy if exists "Members insert own recurring entries" on public.recurring_entries;
create policy "Members insert own recurring entries"
on public.recurring_entries for insert to authenticated
with check (
  private.can_view_member_data(household_id, owner_member_id)
  and created_by = (select auth.uid())
);
