-- Demandes de remboursement Stripe (saisies depuis l’app, lues par les admins).

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  purchase_kind text not null check (purchase_kind in ('medal_pack', 'subscription')),
  user_email text,
  user_id text,
  payment_ref text,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists refund_requests_created_at_idx
  on public.refund_requests (created_at desc);

create index if not exists refund_requests_status_idx
  on public.refund_requests (status);

alter table public.refund_requests enable row level security;

drop policy if exists "refund_requests_admin_select" on public.refund_requests;
create policy "refund_requests_admin_select"
  on public.refund_requests for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists "refund_requests_admin_update" on public.refund_requests;
create policy "refund_requests_admin_update"
  on public.refund_requests for update
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
