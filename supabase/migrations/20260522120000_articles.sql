-- Actus / articles éditoriaux (source unique pour l’accueil et /article/:slug).

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text not null default '',
  tag text not null default 'Analyse'
    check (tag in ('Breaking', 'Analyse', 'Rumeurs', 'Débrief')),
  body jsonb not null default '[]'::jsonb,
  league_ids text[] not null default '{}',
  club_ids text[] not null default '{}',
  published_at timestamptz not null default now(),
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists articles_slug_key on public.articles (slug);
create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_status_published_idx on public.articles (status)
  where status = 'published';

alter table public.articles enable row level security;

drop policy if exists "articles_select_published" on public.articles;
create policy "articles_select_published"
  on public.articles for select
  using (status = 'published');

drop policy if exists "articles_service_role_all" on public.articles;
create policy "articles_service_role_all"
  on public.articles for all
  to service_role
  using (true)
  with check (true);

comment on table public.articles is
  'Articles éditoriaux Talk Foot. Seuls les statuts published sont lisibles (anon + authentifié).';
