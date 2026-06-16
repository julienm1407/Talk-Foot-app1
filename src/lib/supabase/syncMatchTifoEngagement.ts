import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured } from './isEnabled'
import { ensureTalkFootSupabaseSession } from './talkfootSession'

export type MatchTifoEngagementSync = {
  placement_count: number
  bonus_allowance: number
  daily_limit: number
  remaining: number
  new_bonus_pixels: number
}

export async function syncMatchTifoEngagementBonuses(
  groupId: string,
  matchId: string,
): Promise<MatchTifoEngagementSync | null> {
  if (!groupId || !matchId || !isSupabaseConfigured()) return null
  const sb = getSupabaseBrowserClient()
  if (!sb) return null

  const session = await ensureTalkFootSupabaseSession(sb)
  if (!session) return null

  const { data, error } = await sb.rpc('sync_match_tifo_engagement_bonuses', {
    p_group_id: groupId,
    p_match_id: matchId,
  })

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[Talk Foot] sync_match_tifo_engagement_bonuses:', error.message)
    }
    return null
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const row = data as Record<string, unknown>
  return {
    placement_count: typeof row.placement_count === 'number' ? row.placement_count : 0,
    bonus_allowance: typeof row.bonus_allowance === 'number' ? row.bonus_allowance : 0,
    daily_limit: typeof row.daily_limit === 'number' ? row.daily_limit : 3,
    remaining: typeof row.remaining === 'number' ? row.remaining : 0,
    new_bonus_pixels: typeof row.new_bonus_pixels === 'number' ? row.new_bonus_pixels : 0,
  }
}
