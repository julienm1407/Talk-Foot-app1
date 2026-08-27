-- Retirer un ami (lien accepté) ou annuler sa propre demande en attente.

drop policy if exists "friendships_delete_accepted_participant" on public.friendships;
create policy "friendships_delete_accepted_participant"
  on public.friendships for delete
  to authenticated
  using (
    status = 'accepted'
    and (auth.uid() = user_low or auth.uid() = user_high)
  );

drop policy if exists "friendships_delete_pending_requester" on public.friendships;
create policy "friendships_delete_pending_requester"
  on public.friendships for delete
  to authenticated
  using (
    status = 'pending'
    and auth.uid() = requested_by
    and (auth.uid() = user_low or auth.uid() = user_high)
  );
