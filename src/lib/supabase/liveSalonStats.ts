import type { SupabaseClient } from '@supabase/supabase-js'

export type LiveSalonStats = {
  messagesCount: number
  participantsCount: number
}

export async function fetchLiveSalonStats(
  sb: SupabaseClient,
  matchId: string,
): Promise<LiveSalonStats | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await sb
    .from('live_match_messages')
    .select('user_id')
    .eq('match_id', matchId)
    .gte('created_at', since)
    .limit(5000)
  if (error || !data?.length) {
    const { data: allData, error: allErr } = await sb
      .from('live_match_messages')
      .select('user_id')
      .eq('match_id', matchId)
      .limit(2000)
    if (allErr || !allData?.length) return null
    const users = new Set(allData.map((r) => r.user_id).filter(Boolean))
    return { messagesCount: allData.length, participantsCount: users.size }
  }
  const users = new Set(data.map((r) => r.user_id).filter(Boolean))
  return { messagesCount: data.length, participantsCount: users.size }
}
