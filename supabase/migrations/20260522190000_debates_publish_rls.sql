-- Permettre la publication de débats depuis les sessions chat (y compris anonymes Clerk).

drop policy if exists "debates_insert_authenticated" on public.debates;
create policy "debates_insert_authenticated"
  on public.debates for insert
  to authenticated
  with check (status = 'published');

drop policy if exists "debates_update_authenticated" on public.debates;
create policy "debates_update_authenticated"
  on public.debates for update
  to authenticated
  using (status = 'published')
  with check (status = 'published');
