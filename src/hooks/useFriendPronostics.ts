import { useEffect, useMemo, useState } from 'react'
import { mergeUserAppState } from '../data/userAppStateDefaults'
import { fetchFriendPronostics } from '../lib/supabase/friendPronostics'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Bet } from '../types/bet'

export function useFriendPronostics({
  friendActorKey,
  viewerActorKey,
  enabled,
}: {
  friendActorKey: string | null | undefined
  viewerActorKey: string | null | undefined
  enabled: boolean
}) {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBets([])
    setError(null)

    if (!enabled || !friendActorKey?.trim() || !viewerActorKey?.trim() || !isSupabaseConfigured()) {
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

    void fetchFriendPronostics(sb, viewerActorKey, friendActorKey)
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setError(result.error)
          setBets([])
          return
        }
        setBets(result.bets)
      })
      .catch(() => {
        if (!cancelled) {
          setError('load_failed')
          setBets([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, friendActorKey, viewerActorKey])

  const counts = useMemo(
    () => ({
      all: bets.length,
      open: bets.filter((b) => b.status === 'open').length,
      won: bets.filter((b) => b.status === 'won').length,
      lost: bets.filter((b) => b.status === 'lost').length,
    }),
    [bets],
  )

  return { bets, loading, error, counts }
}

/** Parse bets depuis un snapshot profil déjà chargé (évite un second appel). */
export function betsFromProfileAppState(appState: unknown): Bet[] {
  return mergeUserAppState(appState).bets
}
