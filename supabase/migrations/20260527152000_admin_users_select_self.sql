-- Allow authenticated users to read their own admin row.
drop policy if exists "admin_users_authenticated_self_select" on public.admin_users;
create policy "admin_users_authenticated_self_select"
  on public.admin_users for select
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
