import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured } from './isEnabled'
import type { PronoShareVote } from '../../utils/pronoSharePayload'

export async function fetchMatchPronoTally(matchId: string): Promise<PronoShareVote | null> {
  if (!isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('match_prono_tally')
    .select('home, draw, away')
    .eq('match_id', matchId)
    .maybeSingle()
  if (error || !data) return null
  return { home: data.home ?? 0, draw: data.draw ?? 0, away: data.away ?? 0 }
}

export function incrementMatchPronoTally(matchId: string, side: 'home' | 'draw' | 'away'): void {
  if (!isSupabaseConfigured()) return
  const sb = getSupabaseBrowserClient()
  if (!sb) return
  void sb.rpc('increment_match_prono_tally', { p_match: matchId, p_side: side })
}
