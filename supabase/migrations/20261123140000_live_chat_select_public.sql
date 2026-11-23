-- Lecture du tchat live (replay inclus) pour les visiteurs non connectés.
-- L’écriture / les likes restent réservés aux comptes authentifiés.

drop policy if exists "live_match_messages_select_authenticated" on public.live_match_messages;
drop policy if exists "live_match_messages_select_public" on public.live_match_messages;
create policy "live_match_messages_select_public"
  on public.live_match_messages for select
  to anon, authenticated
  using (true);

grant select on public.live_match_messages to anon, authenticated;

drop policy if exists "live_match_message_likes_select" on public.live_match_message_likes;
drop policy if exists "live_match_message_likes_select_public" on public.live_match_message_likes;
create policy "live_match_message_likes_select_public"
  on public.live_match_message_likes for select
  to anon, authenticated
  using (true);

grant select on public.live_match_message_likes to anon, authenticated;
