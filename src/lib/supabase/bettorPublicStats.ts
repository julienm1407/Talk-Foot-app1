import type { SupabaseClient } from '@supabase/supabase-js'
import { pronoHubStatsFromPublicRow, type PronoHubStats } from '../../utils/pronoStatsFromBets'

type PublicStatsRpc = {
  ok?: boolean
  error?: string
  total?: number
  decided?: number
  won?: number
  accuracy?: number
  points?: number
  streak?: number
  top_competition?: string | null
}

export async function fetchBettorPublicStats(
  sb: SupabaseClient,
  actorKey: string,
): Promise<{ ok: true; stats: PronoHubStats } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc('get_bettor_public_stats', { p_actor_key: actorKey })
  if (error) {
    console.warn('[Talk Foot] get_bettor_public_stats:', error.message)
    return { ok: false, error: error.message }
  }

  const row = (data ?? {}) as PublicStatsRpc
  if (!row.ok) {
    return { ok: false, error: row.error ?? 'not_found' }
  }

  return { ok: true, stats: pronoHubStatsFromPublicRow(row) }
}
