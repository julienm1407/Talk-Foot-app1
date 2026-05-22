import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserBets } from './useUserBets'
import type { LeaderboardEntry } from '../data/leaderboard'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchBettorLeaderboard } from '../lib/supabase/bettorLeaderboard'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  buildLeaderboardEntry,
  rankLeaderboardEntries,
  statsFromBets,
} from '../utils/bettorLeaderboard'

export function useLeaderboard() {
  const { user: authUser } = useAuth()
  const [bets] = useUserBets()
  const [cloudEntries, setCloudEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setCloudEntries([])
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    let cancelled = false
    const run = async () => {
      const rows = await fetchBettorLeaderboard(sb, 250)
      if (!cancelled) setCloudEntries(rows)
    }
    void run()
    const t = window.setInterval(run, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [])

  const myUserId = authUser?.id ?? 'me'
  const myUsername = authUser?.displayName?.trim() || 'Toi'

  const { leaderboard, myRank, myEntry } = useMemo(() => {
    const myStats = statsFromBets(bets)
    const byId = new Map<string, LeaderboardEntry>()

    for (const e of cloudEntries) {
      if (e.userId !== myUserId) byId.set(e.userId, e)
    }

    if (myStats.isActive) {
      byId.set(
        myUserId,
        buildLeaderboardEntry(0, myUserId, myUsername, myStats.score, myStats.wins, myStats.totalBets),
      )
    }

    const ranked = rankLeaderboardEntries(Array.from(byId.values()))
    const myIdx = ranked.findIndex((e) => e.userId === myUserId)
    const myR = myIdx >= 0 ? ranked[myIdx].rank : ranked.length + 1
    const me =
      myIdx >= 0
        ? ranked[myIdx]
        : buildLeaderboardEntry(myR, myUserId, myUsername, myStats.score, myStats.wins, myStats.totalBets)

    return {
      leaderboard: ranked,
      myRank: myR,
      myEntry: me,
    }
  }, [bets, cloudEntries, myUserId, myUsername])

  const top12 = useMemo(() => leaderboard.slice(0, 12), [leaderboard])
  const top250 = useMemo(() => leaderboard.slice(0, 250), [leaderboard])

  return {
    top12,
    top250,
    myRank,
    myEntry,
    totalActive: leaderboard.length,
  }
}
