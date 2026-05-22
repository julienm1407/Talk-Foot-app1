import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchLiveSalonStats, type LiveSalonStats } from '../lib/supabase/liveSalonStats'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

export function useLiveMatchSalonStats(matchId: string | undefined) {
  const [stats, setStats] = useState<LiveSalonStats | null>(null)

  useEffect(() => {
    if (!matchId || !isSupabaseConfigured()) {
      setStats(null)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    let cancelled = false
    const run = async () => {
      const row = await fetchLiveSalonStats(sb, matchId)
      if (!cancelled) setStats(row)
    }
    void run()
    const t = window.setInterval(run, 45_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [matchId])

  return stats
}
