import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeaderboardEntry } from '../../data/leaderboard'
import { accentForBettorId, avatarSeedFromUsername } from '../../utils/bettorLeaderboard'

export async function fetchBettorLeaderboard(
  sb: SupabaseClient,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await sb.rpc('get_bettor_leaderboard', { p_limit: limit })
  if (error) {
    console.warn('[Talk Foot] get_bettor_leaderboard:', error.message)
    return []
  }
  const out: LeaderboardEntry[] = []
  let rank = 0
  for (const row of data ?? []) {
    const userId = row?.user_id
    if (typeof userId !== 'string' || !userId) continue
    rank += 1
    const username =
      typeof row.display_name === 'string' && row.display_name.trim()
        ? row.display_name.trim()
        : 'Parieur'
    out.push({
      rank,
      userId,
      username,
      avatarSeed: avatarSeedFromUsername(username, userId),
      accent: accentForBettorId(userId),
      score: Number(row.score) || 0,
      wins: Number(row.wins) || 0,
      totalBets: Number(row.total_bets) || 0,
    })
  }
  return out
}
