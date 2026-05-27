-- Articles V1 SEO + authoring markdown (admin only write path)

alter table public.articles
  add column if not exists body_markdown text not null default '',
  add column if not exists cover_image_url text,
  add column if not exists author_name text not null default 'Talk Foot';

-- Backfill markdown from legacy body jsonb paragraphs.
update public.articles
set body_markdown = coalesce(
  nullif(
    (
      select string_agg(trim(value), E'\n\n')
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(body) = 'array' then body
          else '[]'::jsonb
        end
      ) as value
      where trim(value) <> ''
    ),
    ''
  ),
  body_markdown
)
where coalesce(body_markdown, '') = '';

-- Keep updated_at fresh when an article is modified.
create or replace function public.set_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_articles_set_updated_at on public.articles;
create trigger trg_articles_set_updated_at
before update on public.articles
for each row
execute function public.set_articles_updated_at();

create index if not exists articles_status_updated_idx
  on public.articles (status, updated_at desc);

create index if not exists articles_status_created_idx
  on public.articles (status, created_at desc);

-- Admin registry (RLS helper): emails allowed to write/read drafts.
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_service_role_all" on public.admin_users;
create policy "admin_users_service_role_all"
  on public.admin_users for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "articles_admin_read_all" on public.articles;
create policy "articles_admin_read_all"
  on public.articles for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "articles_admin_insert" on public.articles;
create policy "articles_admin_insert"
  on public.articles for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "articles_admin_update" on public.articles;
create policy "articles_admin_update"
  on public.articles for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "articles_admin_delete" on public.articles;
create policy "articles_admin_delete"
  on public.articles for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

comment on column public.articles.body_markdown is
  'Source auteur markdown. body jsonb legacy conservé pour compatibilité.';
