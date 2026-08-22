import type { SupabaseClient } from '@supabase/supabase-js'

export type LiveSalonStats = {
  messagesCount: number
  participantsCount: number
  /** Jusqu’à 3 auteurs récents du tribune (ordre anti-chronologique). */
  recentParticipantIds: string[]
}

type LiveSalonMessageRow = {
  user_id: string | null
  created_at: string
}

const MAX_RECENT_PARTICIPANTS = 3

function buildLiveSalonStats(rows: LiveSalonMessageRow[]): LiveSalonStats {
  const users = new Set<string>()
  for (const row of rows) {
    const id = row.user_id?.trim()
    if (id) users.add(id)
  }

  const recentParticipantIds: string[] = []
  const seenRecent = new Set<string>()
  const sorted = [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  for (const row of sorted) {
    const id = row.user_id?.trim()
    if (!id || seenRecent.has(id)) continue
    seenRecent.add(id)
    recentParticipantIds.push(id)
    if (recentParticipantIds.length >= MAX_RECENT_PARTICIPANTS) break
  }

  return {
    messagesCount: rows.length,
    participantsCount: users.size,
    recentParticipantIds,
  }
}

export async function fetchLiveSalonStats(
  sb: SupabaseClient,
  matchId: string,
): Promise<LiveSalonStats | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await sb
    .from('live_match_messages')
    .select('user_id, created_at')
    .eq('match_id', matchId)
    .gte('created_at', since)
    .limit(5000)
  if (error || !data?.length) {
    const { data: allData, error: allErr } = await sb
      .from('live_match_messages')
      .select('user_id, created_at')
      .eq('match_id', matchId)
      .limit(2000)
    if (allErr || !allData?.length) return null
    return buildLiveSalonStats(allData as LiveSalonMessageRow[])
  }
  return buildLiveSalonStats(data as LiveSalonMessageRow[])
}
