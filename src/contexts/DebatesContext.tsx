import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Debate } from '../data/debates'
import { rankDebatesByActivity } from '../data/debates'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchDebatesWithStats } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { findCustomDebateById, readCustomDebatesBucket } from '../utils/customGroupDebatesStorage'

const TRENDING_TOP_N = 8
const REFRESH_INTERVAL_MS = 45_000

type DebatesContextValue = {
  debates: Debate[]
  debateOfTheDay: Debate | null
  trendingDebates: Debate[]
  loading: boolean
  error: string | null
  getDebateById: (id: string) => Debate | undefined
  refresh: () => Promise<void>
}

const DebatesContext = createContext<DebatesContextValue | null>(null)

/** Cloud prioritaire : le local ne complète que les débats pas encore synchronisés (sans faux compteurs). */
function mergeCustomDebates(cloud: Debate[]): Debate[] {
  const bucket = readCustomDebatesBucket()
  const custom = Object.values(bucket).flat()
  const byId = new Map<string, Debate>()
  for (const d of cloud) byId.set(d.id, d)
  for (const d of custom) {
    if (byId.has(d.id)) continue
    byId.set(d.id, {
      ...d,
      messagesCount: 0,
      participantsCount: 0,
      messages24h: 0,
      trending: false,
    })
  }
  return Array.from(byId.values())
}

function pickDebateOfTheDay(all: Debate[]): Debate | null {
  if (!all.length) return null
  const featured = all.find((d) => d.featured)
  if (featured) return featured
  return [...all].sort(rankDebatesByActivity)[0] ?? null
}

/** Meilleurs débats (y compris créés dans un groupe) selon l’activité mesurée en base. */
function pickTrending(all: Debate[], debateOfTheDay: Debate | null): Debate[] {
  const pool = debateOfTheDay ? all.filter((d) => d.id !== debateOfTheDay.id) : all
  return [...pool].sort(rankDebatesByActivity).slice(0, TRENDING_TOP_N)
}

export function DebatesProvider({ children }: { children: ReactNode }) {
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refreshInFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      if (!isSupabaseConfigured()) {
        setDebates(mergeCustomDebates([]))
        setError(null)
        return
      }
      const sb = getSupabaseBrowserClient()
      if (!sb) {
        setDebates(mergeCustomDebates([]))
        return
      }
      const cloud = await fetchDebatesWithStats(sb)
      setDebates(mergeCustomDebates(cloud))
      setError(null)
    } catch (e) {
      setDebates(mergeCustomDebates([]))
      setError(e instanceof Error ? e.message : 'Impossible de charger les débats.')
    } finally {
      setLoading(false)
      refreshInFlight.current = false
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Reclassement périodique pour refléter les nouveaux messages dans les débats de groupe. */
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const id = window.setInterval(() => {
      void refresh()
    }, REFRESH_INTERVAL_MS)
    const onVis = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refresh])

  const debateOfTheDay = useMemo(() => pickDebateOfTheDay(debates), [debates])
  const trendingDebates = useMemo(
    () => pickTrending(debates, debateOfTheDay),
    [debates, debateOfTheDay],
  )

  const getDebateById = useCallback(
    (id: string) => {
      const fromList = debates.find((d) => d.id === id)
      if (fromList) return fromList
      return findCustomDebateById(id)
    },
    [debates],
  )

  const value = useMemo(
    () => ({
      debates,
      debateOfTheDay,
      trendingDebates,
      loading,
      error,
      getDebateById,
      refresh,
    }),
    [debates, debateOfTheDay, trendingDebates, loading, error, getDebateById, refresh],
  )

  return <DebatesContext.Provider value={value}>{children}</DebatesContext.Provider>
}

export function useDebates(): DebatesContextValue {
  const ctx = useContext(DebatesContext)
  if (!ctx) {
    throw new Error('useDebates must be used within DebatesProvider')
  }
  return ctx
}
