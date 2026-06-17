import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchMatch1x2BetCounts,
  recordMatch1x2BetRemote,
} from '../lib/supabase/match1x2BetVolume'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  emptyMatch1x2BetCounts,
  match1x2BetShares,
  readLocalMatch1x2BetCounts,
  recordLocalMatch1x2Bet,
  type Match1x2BetCounts,
} from '../utils/match1x2BetVolume'

export function useMatch1x2BetVolume(matchId: string | undefined) {
  const [remoteCounts, setRemoteCounts] = useState<Match1x2BetCounts>(emptyMatch1x2BetCounts)
  const [localTick, setLocalTick] = useState(0)

  const refresh = useCallback(async () => {
    if (!matchId) {
      setRemoteCounts(emptyMatch1x2BetCounts())
      return
    }
    if (!isSupabaseConfigured()) return
    const next = await fetchMatch1x2BetCounts(matchId)
    if (next) setRemoteCounts(next)
  }, [matchId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!matchId) return
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [matchId, refresh])

  const counts = useMemo(() => {
    if (!matchId) return emptyMatch1x2BetCounts()
    if (isSupabaseConfigured()) return remoteCounts
    return readLocalMatch1x2BetCounts(matchId)
  }, [matchId, remoteCounts, localTick])

  const shares = useMemo(() => match1x2BetShares(counts), [counts])

  const recordBet = useCallback(
    async (selection: 'home' | 'draw' | 'away') => {
      if (!matchId) return
      if (isSupabaseConfigured()) {
        setRemoteCounts((prev) => ({
          ...prev,
          [selection]: prev[selection] + 1,
        }))
        const updated = await recordMatch1x2BetRemote(matchId, selection)
        if (updated) setRemoteCounts(updated)
        else void refresh()
        return
      }
      recordLocalMatch1x2Bet(matchId, selection)
      setLocalTick((n) => n + 1)
    },
    [matchId, refresh],
  )

  return { counts, shares, recordBet, refresh }
}
