-- Phase 4 : commentaires + rôles éditoriaux + newsletter (base solide)

create table if not exists public.editorial_users (
  email text primary key,
  role text not null check (role in ('redacteur', 'relecteur', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.editorial_users enable row level security;

drop policy if exists "editorial_users_admin_read" on public.editorial_users;
create policy "editorial_users_admin_read"
  on public.editorial_users for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "editorial_users_admin_write" on public.editorial_users;
create policy "editorial_users_admin_write"
  on public.editorial_users for all
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

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id text,
  author_name text not null,
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden', 'pending')),
  moderation_reason text,
  reported_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists article_comments_article_created_idx
  on public.article_comments (article_id, created_at desc);

create index if not exists article_comments_status_idx
  on public.article_comments (status, created_at desc);

create table if not exists public.article_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.article_comments(id) on delete cascade,
  reporter_id text,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.article_comments enable row level security;
alter table public.article_comment_reports enable row level security;

drop policy if exists "article_comments_public_read_published" on public.article_comments;
create policy "article_comments_public_read_published"
  on public.article_comments for select
  using (status = 'published');

drop policy if exists "article_comments_public_insert" on public.article_comments;
create policy "article_comments_public_insert"
  on public.article_comments for insert
  to anon, authenticated
  with check (true);

drop policy if exists "article_comments_admin_moderate" on public.article_comments;
create policy "article_comments_admin_moderate"
  on public.article_comments for update
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

drop policy if exists "article_comment_reports_public_insert" on public.article_comment_reports;
create policy "article_comment_reports_public_insert"
  on public.article_comment_reports for insert
  to anon, authenticated
  with check (true);

drop policy if exists "article_comment_reports_admin_read" on public.article_comment_reports;
create policy "article_comment_reports_admin_read"
  on public.article_comment_reports for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create table if not exists public.newsletter_subscribers (
  email text primary key,
  status text not null default 'active' check (status in ('active', 'paused', 'unsubscribed')),
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  content_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;

drop policy if exists "newsletter_subscribers_public_insert" on public.newsletter_subscribers;
create policy "newsletter_subscribers_public_insert"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "newsletter_admin_all_subscribers" on public.newsletter_subscribers;
create policy "newsletter_admin_all_subscribers"
  on public.newsletter_subscribers for all
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

drop policy if exists "newsletter_admin_all_campaigns" on public.newsletter_campaigns;
create policy "newsletter_admin_all_campaigns"
  on public.newsletter_campaigns for all
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
