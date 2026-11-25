-- Tighten policy shape and index all foreign-key access paths for planning data.
drop policy if exists "Members manage own monthly budgets" on public.monthly_budgets;
drop policy if exists "Members insert own monthly budgets" on public.monthly_budgets;
create policy "Members insert own monthly budgets"
on public.monthly_budgets for insert to authenticated
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members update permitted monthly budgets" on public.monthly_budgets;
create policy "Members update permitted monthly budgets"
on public.monthly_budgets for update to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members delete permitted monthly budgets" on public.monthly_budgets;
create policy "Members delete permitted monthly budgets"
on public.monthly_budgets for delete to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Members manage own savings goals" on public.savings_goals;
drop policy if exists "Members insert own savings goals" on public.savings_goals;
create policy "Members insert own savings goals"
on public.savings_goals for insert to authenticated
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members update permitted savings goals" on public.savings_goals;
create policy "Members update permitted savings goals"
on public.savings_goals for update to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members delete permitted savings goals" on public.savings_goals;
create policy "Members delete permitted savings goals"
on public.savings_goals for delete to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

drop policy if exists "Members manage own recurring entries" on public.recurring_entries;
drop policy if exists "Members insert own recurring entries" on public.recurring_entries;
create policy "Members insert own recurring entries"
on public.recurring_entries for insert to authenticated
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members update permitted recurring entries" on public.recurring_entries;
create policy "Members update permitted recurring entries"
on public.recurring_entries for update to authenticated
using (private.can_view_member_data(household_id, owner_member_id))
with check (private.can_view_member_data(household_id, owner_member_id));
drop policy if exists "Members delete permitted recurring entries" on public.recurring_entries;
create policy "Members delete permitted recurring entries"
on public.recurring_entries for delete to authenticated
using (private.can_view_member_data(household_id, owner_member_id));

create index if not exists monthly_budgets_created_by_idx on public.monthly_budgets(created_by);
create index if not exists monthly_budgets_owner_fk_idx on public.monthly_budgets(owner_member_id, household_id);
create index if not exists savings_goals_created_by_idx on public.savings_goals(created_by);
create index if not exists savings_goals_owner_fk_idx on public.savings_goals(owner_member_id, household_id);
create index if not exists savings_goal_contributions_created_by_idx on public.savings_goal_contributions(created_by);
create index if not exists savings_goal_contributions_contributor_fk_idx on public.savings_goal_contributions(contributor_member_id, household_id);
create index if not exists savings_goal_contributions_goal_fk_idx on public.savings_goal_contributions(goal_id, household_id);
create index if not exists recurring_entries_created_by_idx on public.recurring_entries(created_by);
create index if not exists recurring_entries_owner_fk_idx on public.recurring_entries(owner_member_id, household_id);
create index if not exists recurring_entries_account_fk_idx on public.recurring_entries(account_id, owner_member_id, household_id);

notify pgrst, 'reload schema';
