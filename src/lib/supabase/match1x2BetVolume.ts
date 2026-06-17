import type { Match1x2BetCounts } from '../../utils/match1x2BetVolume'
import { emptyMatch1x2BetCounts } from '../../utils/match1x2BetVolume'
import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured } from './isEnabled'
import { ensureTalkFootSupabaseSession } from './talkfootSession'

function parseCounts(row: Record<string, unknown> | null): Match1x2BetCounts {
  if (!row) return emptyMatch1x2BetCounts()
  return {
    home: Math.max(0, Number(row.home) || 0),
    draw: Math.max(0, Number(row.draw) || 0),
    away: Math.max(0, Number(row.away) || 0),
  }
}

export async function fetchMatch1x2BetCounts(matchId: string): Promise<Match1x2BetCounts | null> {
  if (!matchId || !isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null

  const { data, error } = await sb.rpc('get_match_1x2_bet_counts', { p_match_id: matchId })
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[Talk Foot] get_match_1x2_bet_counts:', error.message)
    }
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return emptyMatch1x2BetCounts()
  return parseCounts(data as Record<string, unknown>)
}

export async function recordMatch1x2BetRemote(
  matchId: string,
  selection: 'home' | 'draw' | 'away',
): Promise<Match1x2BetCounts | null> {
  if (!matchId || !isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null

  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return null

  const { data, error } = await sb.rpc('record_match_1x2_bet', {
    p_match_id: matchId,
    p_selection: selection,
  })
  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[Talk Foot] record_match_1x2_bet:', error.message)
    }
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  return parseCounts(data as Record<string, unknown>)
}
