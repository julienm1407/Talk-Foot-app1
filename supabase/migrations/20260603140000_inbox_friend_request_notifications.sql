-- Notifications pour demandes d'amis + refus côté destinataire.

alter table public.inbox_notifications
  drop constraint if exists inbox_notifications_kind_check;

alter table public.inbox_notifications
  add constraint inbox_notifications_kind_check
  check (kind in ('message_like', 'friend_request'));

alter table public.inbox_notifications
  add column if not exists requester_supabase_id uuid references auth.users (id) on delete cascade;

create index if not exists inbox_notifications_friend_request_idx
  on public.inbox_notifications (recipient_supabase_id, created_at desc)
  where kind = 'friend_request' and read_at is null;

drop policy if exists "friendships_delete_pending_recipient" on public.friendships;
create policy "friendships_delete_pending_recipient"
  on public.friendships for delete
  to authenticated
  using (
    status = 'pending'
    and auth.uid() <> requested_by
    and (auth.uid() = user_low or auth.uid() = user_high)
  );
