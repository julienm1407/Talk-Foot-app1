-- Cartes de partage prono (lien court /p/:id) + tally 1N2 public.

create table if not exists public.prono_shares (
  id text primary key,
  created_at timestamptz not null default now(),
  sharer_id text,
  match_id text not null,
  payload jsonb not null,
  story_image_url text,
  og_image_url text,
  clicks int not null default 0
);

alter table public.prono_shares enable row level security;

drop policy if exists prono_shares_select_public on public.prono_shares;
create policy prono_shares_select_public
  on public.prono_shares for select
  to anon, authenticated
  using (true);

drop policy if exists prono_shares_insert_public on public.prono_shares;
create policy prono_shares_insert_public
  on public.prono_shares for insert
  to anon, authenticated
  with check (true);

grant select, insert on public.prono_shares to anon, authenticated;

create table if not exists public.match_prono_tally (
  match_id text primary key,
  home int not null default 0,
  draw int not null default 0,
  away int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.match_prono_tally enable row level security;

drop policy if exists match_prono_tally_select_public on public.match_prono_tally;
create policy match_prono_tally_select_public
  on public.match_prono_tally for select
  to anon, authenticated
  using (true);

grant select on public.match_prono_tally to anon, authenticated;

create or replace function public.increment_match_prono_tally(p_match text, p_side text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_side not in ('home', 'draw', 'away') then
    return;
  end if;
  insert into public.match_prono_tally (match_id, home, draw, away)
  values (
    p_match,
    case when p_side = 'home' then 1 else 0 end,
    case when p_side = 'draw' then 1 else 0 end,
    case when p_side = 'away' then 1 else 0 end
  )
  on conflict (match_id) do update set
    home = public.match_prono_tally.home + excluded.home,
    draw = public.match_prono_tally.draw + excluded.draw,
    away = public.match_prono_tally.away + excluded.away,
    updated_at = now();
end;
$$;

revoke all on function public.increment_match_prono_tally(text, text) from public;
grant execute on function public.increment_match_prono_tally(text, text) to anon, authenticated;

create or replace function public.bump_prono_share_click(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prono_shares set clicks = clicks + 1 where id = p_id;
end;
$$;

revoke all on function public.bump_prono_share_click(text) from public;
grant execute on function public.bump_prono_share_click(text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('prono-shares', 'prono-shares', true)
on conflict (id) do nothing;

drop policy if exists prono_shares_storage_read on storage.objects;
create policy prono_shares_storage_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'prono-shares');

drop policy if exists prono_shares_storage_insert on storage.objects;
create policy prono_shares_storage_insert
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'prono-shares');
