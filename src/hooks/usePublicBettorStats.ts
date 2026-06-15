import { useEffect, useMemo, useState } from 'react'
import { fetchBettorPublicStats } from '../lib/supabase/bettorPublicStats'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  buildPronoBadges,
  buildPronoProgress,
  computePronoHubStats,
  type PronoHubStats,
} from '../utils/pronoStatsFromBets'
import type { Bet } from '../types/bet'
import { useAppearance } from '../contexts/AppearanceContext'

/** Stats badges / progression pour un profil tiers (RPC cloud). */
export function usePublicBettorStats(actorKey: string | null | undefined) {
  const [stats, setStats] = useState<PronoHubStats | null>(null)
  const [loading, setLoading] = useState(false)
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  useEffect(() => {
    setStats(null)

    const key = actorKey?.trim()
    if (!key || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void fetchBettorPublicStats(sb, key)
      .then((result) => {
        if (cancelled) return
        if (result.ok) setStats(result.stats)
        else setStats(computePronoHubStats([]))
      })
      .catch(() => {
        if (!cancelled) setStats(computePronoHubStats([]))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [actorKey])

  const hub = useMemo(() => stats ?? computePronoHubStats([]), [stats])

  return useMemo(
    () => ({
      loading,
      stats: hub,
      badges: buildPronoBadges(hub, L),
      progress: buildPronoProgress(hub),
    }),
    [hub, L, loading],
  )
}

/** Réutilise des paris déjà chargés (ex. amis) sans second appel RPC. */
export function usePronoStatsFromBets(bets: Bet[], loading = false) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return useMemo(() => {
    const stats = computePronoHubStats(bets)
    return {
      loading,
      stats,
      badges: buildPronoBadges(stats, L),
      progress: buildPronoProgress(stats),
    }
  }, [bets, L, loading])
}
