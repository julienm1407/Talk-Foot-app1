-- Remboursements : table + RPC (insert fiable via service_role, idempotent).

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

grant all on public.refund_requests to service_role;

create or replace function public.submit_refund_request(
  p_purchase_kind text,
  p_user_email text default null,
  p_user_id text default null,
  p_payment_ref text default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_created timestamptz;
begin
  if p_purchase_kind is null or p_purchase_kind not in ('medal_pack', 'subscription') then
    return jsonb_build_object('ok', false, 'error', 'invalid_purchase_kind');
  end if;

  if length(trim(coalesce(p_reason, ''))) < 8 then
    return jsonb_build_object('ok', false, 'error', 'reason_too_short');
  end if;

  insert into public.refund_requests (
    purchase_kind,
    user_email,
    user_id,
    payment_ref,
    reason,
    status
  )
  values (
    p_purchase_kind,
    nullif(trim(coalesce(p_user_email, '')), ''),
    nullif(trim(coalesce(p_user_id, '')), ''),
    nullif(trim(coalesce(p_payment_ref, '')), ''),
    left(trim(p_reason), 4000),
    'pending'
  )
  returning id, created_at into v_id, v_created;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'created_at', v_created
  );
exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', 'save_failed',
      'detail', sqlerrm
    );
end;
$$;

revoke all on function public.submit_refund_request(text, text, text, text, text) from public;
grant execute on function public.submit_refund_request(text, text, text, text, text) to service_role;

comment on function public.submit_refund_request is
  'Enregistre une demande de remboursement (API Vercel / service_role).';
