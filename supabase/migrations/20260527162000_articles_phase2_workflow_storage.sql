-- Phase 2 : workflow éditorial + médias articles (storage)

-- 1) Workflow : statuts élargis + planification.
alter table public.articles
  add column if not exists scheduled_at timestamptz,
  add column if not exists reviewed_by text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'articles_status_check'
      and conrelid = 'public.articles'::regclass
  ) then
    alter table public.articles drop constraint articles_status_check;
  end if;
end $$;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'review', 'scheduled', 'published'));

create index if not exists articles_status_scheduled_idx
  on public.articles (status, scheduled_at asc)
  where status = 'scheduled';

-- 2) Bucket storage : médias articles.
insert into storage.buckets (id, name, public)
values ('articles-media', 'articles-media', true)
on conflict (id) do update set public = excluded.public;

-- Lecture publique du bucket.
drop policy if exists "articles_media_public_read" on storage.objects;
create policy "articles_media_public_read"
  on storage.objects for select
  using (bucket_id = 'articles-media');

-- Écriture réservée aux admins authentifiés.
drop policy if exists "articles_media_admin_insert" on storage.objects;
create policy "articles_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'articles-media'
    and exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "articles_media_admin_update" on storage.objects;
create policy "articles_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'articles-media'
    and exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    bucket_id = 'articles-media'
    and exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "articles_media_admin_delete" on storage.objects;
create policy "articles_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'articles-media'
    and exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
