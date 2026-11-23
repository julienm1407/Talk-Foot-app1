-- Accueil visiteur : actus publiées + tribunes publiques lisibles sans session.

grant select on public.articles to anon, authenticated;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published"
  on public.articles for select
  to anon, authenticated
  using (status = 'published');

grant select on public.supporter_groups to anon, authenticated;

drop policy if exists "supporter_groups_select_authenticated" on public.supporter_groups;
drop policy if exists "supporter_groups_select_public" on public.supporter_groups;
create policy "supporter_groups_select_public"
  on public.supporter_groups for select
  to anon, authenticated
  using (
    auth.role() = 'authenticated'
    or coalesce(group_kind, 'public') is distinct from 'private'
  );
