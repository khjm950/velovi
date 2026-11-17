-- Applied to the live Velovi Supabase project.
-- Move privileged household operations to the non-exposed private schema.
-- Keep stable public RPC names as SECURITY INVOKER wrappers so PostgREST can
-- call them while the actual privileged implementation stays out of public.

alter function public.create_household(text,text) set schema private;
alter function public.add_household_member(uuid,uuid,text) set schema private;
alter function public.remove_household_member(uuid,uuid) set schema private;
alter function public.update_member_permissions(uuid,uuid,boolean,boolean,boolean,boolean) set schema private;

revoke all on function private.create_household(text,text) from public, anon, authenticated;
revoke all on function private.add_household_member(uuid,uuid,text) from public, anon, authenticated;
revoke all on function private.remove_household_member(uuid,uuid) from public, anon, authenticated;
revoke all on function private.update_member_permissions(uuid,uuid,boolean,boolean,boolean,boolean) from public, anon, authenticated;

grant execute on function private.create_household(text,text) to authenticated;
grant execute on function private.add_household_member(uuid,uuid,text) to authenticated;
grant execute on function private.remove_household_member(uuid,uuid) to authenticated;
grant execute on function private.update_member_permissions(uuid,uuid,boolean,boolean,boolean,boolean) to authenticated;

create or replace function public.create_household(p_name text,p_display_name text)
returns uuid language sql security invoker set search_path to ''
as $function$
  select private.create_household(p_name,p_display_name);
$function$;

create or replace function public.add_household_member(p_household_id uuid,p_user_id uuid,p_display_name text)
returns uuid language sql security invoker set search_path to ''
as $function$
  select private.add_household_member(p_household_id,p_user_id,p_display_name);
$function$;

create or replace function public.remove_household_member(p_household_id uuid,p_member_id uuid)
returns void language sql security invoker set search_path to ''
as $function$
  select private.remove_household_member(p_household_id,p_member_id);
$function$;

create or replace function public.update_member_permissions(
  p_household_id uuid,p_member_id uuid,p_can_add boolean,p_can_edit boolean,
  p_can_delete boolean,p_can_view_other_accounts boolean
)
returns void language sql security invoker set search_path to ''
as $function$
  select private.update_member_permissions(
    p_household_id,p_member_id,p_can_add,p_can_edit,p_can_delete,p_can_view_other_accounts
  );
$function$;

revoke all on function public.create_household(text,text) from public, anon;
revoke all on function public.add_household_member(uuid,uuid,text) from public, anon;
revoke all on function public.remove_household_member(uuid,uuid) from public, anon;
revoke all on function public.update_member_permissions(uuid,uuid,boolean,boolean,boolean,boolean) from public, anon;
grant execute on function public.create_household(text,text) to authenticated;
grant execute on function public.add_household_member(uuid,uuid,text) to authenticated;
grant execute on function public.remove_household_member(uuid,uuid) to authenticated;
grant execute on function public.update_member_permissions(uuid,uuid,boolean,boolean,boolean,boolean) to authenticated;
