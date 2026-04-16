-- Corrige « infinite recursion detected in policy for relation supporter_group_members » :
-- l’ancienne policy SELECT utilisait EXISTS (SELECT … FROM supporter_group_members), ce qui
-- réévaluait la même policy. Lecture limitée à ses propres lignes : suffit pour l’app et
-- pour les EXISTS des policies sur supporter_group_channel_messages (même user_id).

drop policy if exists "supporter_group_members_select" on public.supporter_group_members;
create policy "supporter_group_members_select"
  on public.supporter_group_members for select
  to authenticated
  using (
    (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
    and user_id = auth.uid()
  );
