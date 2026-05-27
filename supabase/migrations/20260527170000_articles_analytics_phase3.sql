-- Phase 3 (MVP) : analytics articles (vues / clics)

create table if not exists public.article_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'cta_click', 'share')),
  source text not null default 'web',
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists article_events_article_type_created_idx
  on public.article_events (article_id, event_type, created_at desc);

create index if not exists article_events_created_idx
  on public.article_events (created_at desc);

alter table public.article_events enable row level security;

drop policy if exists "article_events_public_insert" on public.article_events;
create policy "article_events_public_insert"
  on public.article_events for insert
  to anon, authenticated
  with check (true);

drop policy if exists "article_events_admin_read" on public.article_events;
create policy "article_events_admin_read"
  on public.article_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
