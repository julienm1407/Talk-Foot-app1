-- Connexion par email ou pseudo : résolution côté serveur (lecture auth.users via security definer).
create or replace function public.resolve_login_identifier(p_identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_trim text := trim(p_identifier);
  v_email text;
  v_norm text;
begin
  if v_trim is null or v_trim = '' then
    return null;
  end if;

  if position('@' in v_trim) > 0 then
    select u.email
    into v_email
    from auth.users u
    where lower(trim(u.email)) = lower(v_trim)
    limit 1;
    return v_email;
  end if;

  v_norm := public.normalize_display_name(v_trim);
  if v_norm is null or v_norm = '' then
    return null;
  end if;

  select u.email
  into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.display_name_normalized = v_norm
  limit 1;

  return v_email;
end;
$$;

revoke all on function public.resolve_login_identifier(text) from public;
grant execute on function public.resolve_login_identifier(text) to anon, authenticated;
