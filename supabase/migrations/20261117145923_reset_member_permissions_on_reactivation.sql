create or replace function public.reset_account_visibility_on_reactivation()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if old.is_active = false and new.is_active = true then
    new.can_add_transactions := true;
    new.can_edit_transactions := true;
    new.can_delete_transactions := false;
    new.can_view_other_accounts := false;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_reset_account_visibility_on_reactivation on public.household_members;
create trigger trg_reset_account_visibility_on_reactivation
before update of is_active on public.household_members
for each row
execute function public.reset_account_visibility_on_reactivation();
