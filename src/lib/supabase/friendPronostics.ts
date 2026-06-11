import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeUserAppState } from '../../data/userAppStateDefaults'
import type { Bet } from '../../types/bet'

type FriendPronosticsRpc = {
  ok?: boolean
  error?: string
  bets?: unknown
}

export async function fetchFriendPronostics(
  sb: SupabaseClient,
  viewerActorKey: string,
  friendActorKey: string,
): Promise<{ ok: true; bets: Bet[] } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('get_friend_pronostics', {
    p_viewer_actor_key: viewerActorKey,
    p_friend_actor_key: friendActorKey,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as FriendPronosticsRpc | null
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? 'fetch_failed' }
  }

  const bets = mergeUserAppState({ bets: payload.bets }).bets
  return { ok: true, bets }
}
