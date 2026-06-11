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
import { applyDebateLeaderboardRanks } from '../data/debates'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import {
  adminDeleteDebate,
  fetchAdminRemovedDebateIds,
} from '../lib/supabase/adminContent'
import { fetchDebatesWithStats } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { useAuth } from './AuthContext'
import {
  findCustomDebateById,
  readCustomDebatesBucket,
  removeCustomDebateById,
} from '../utils/customGroupDebatesStorage'
import { pickDailyDebateOfTheDay, pickDailyTrendingDebates } from '../utils/dailyDebateRotation'
import { toParisDayKey } from '../utils/dailyTokenBonus'

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
  deleteDebateAsAdmin: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

const DebatesContext = createContext<DebatesContextValue | null>(null)

/** Cloud prioritaire : le local ne complète que les débats pas encore synchronisés (sans faux compteurs). */
function mergeCustomDebates(cloud: Debate[], hiddenIds: Set<string>): Debate[] {
  const bucket = readCustomDebatesBucket()
  const custom = Object.values(bucket).flat()
  const byId = new Map<string, Debate>()
  for (const d of cloud) {
    if (hiddenIds.has(d.id)) continue
    byId.set(d.id, d)
  }
  for (const d of custom) {
    if (hiddenIds.has(d.id) || byId.has(d.id)) continue
    byId.set(d.id, {
      ...d,
      messagesCount: 0,
      participantsCount: 0,
      messages24h: 0,
      trending: false,
      createdAt: d.createdAt,
    })
  }
  return applyDebateLeaderboardRanks(Array.from(byId.values()))
}

export function DebatesProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth()
  const isAdmin = Boolean(authUser?.isAdmin)
  const [debates, setDebates] = useState<Debate[]>([])
  const [adminRemovedDebateIds, setAdminRemovedDebateIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dayKey, setDayKey] = useState(() => toParisDayKey())
  const refreshInFlight = useRef(false)

  const refreshAdminRemovedDebates = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAdminRemovedDebateIds(new Set())
      return new Set<string>()
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) return new Set<string>()
    const ids = await fetchAdminRemovedDebateIds(sb)
    setAdminRemovedDebateIds(ids)
    return ids
  }, [])

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const hiddenIds = await refreshAdminRemovedDebates()
      if (!isSupabaseConfigured()) {
        setDebates(mergeCustomDebates([], hiddenIds))
        setError(null)
        return
      }
      const sb = getSupabaseBrowserClient()
      if (!sb) {
        setDebates(mergeCustomDebates([], hiddenIds))
        return
      }
      const cloud = await fetchDebatesWithStats(sb)
      setDebates(mergeCustomDebates(cloud, hiddenIds))
      setError(null)
    } catch (e) {
      setDebates(mergeCustomDebates([], adminRemovedDebateIds))
      setError(e instanceof Error ? e.message : 'Impossible de charger les débats.')
    } finally {
      setLoading(false)
      refreshInFlight.current = false
    }
  }, [adminRemovedDebateIds, refreshAdminRemovedDebates])

  const deleteDebateAsAdmin = useCallback(
    async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!isAdmin) return { ok: false, error: 'admin_only' }
      const debateId = id.trim()
      if (!debateId) return { ok: false, error: 'missing_debate_id' }

      if (isSupabaseConfigured()) {
        const sb = getSupabaseBrowserClient()
        if (!sb) return { ok: false, error: 'offline' }
        const result = await adminDeleteDebate(sb, debateId)
        if (!result.ok) return result
      }

      removeCustomDebateById(debateId)
      setAdminRemovedDebateIds((prev) => new Set([...prev, debateId]))
      setDebates((prev) => prev.filter((d) => d.id !== debateId))
      void refresh()
      return { ok: true }
    },
    [isAdmin, refresh],
  )

  useEffect(() => {
    const id = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(id)
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

  /** Bascule à minuit (heure de Paris) pour renouveler débat du jour + top débats. */
  useEffect(() => {
    const syncDayKey = () => {
      const next = toParisDayKey()
      setDayKey((prev) => (prev === next ? prev : next))
    }
    const id = window.setInterval(syncDayKey, 60_000)
    document.addEventListener('visibilitychange', syncDayKey)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', syncDayKey)
    }
  }, [])

  const debateOfTheDay = useMemo(
    () => pickDailyDebateOfTheDay(debates, dayKey),
    [debates, dayKey],
  )
  const trendingDebates = useMemo(
    () => pickDailyTrendingDebates(debates, debateOfTheDay, TRENDING_TOP_N, dayKey),
    [debates, debateOfTheDay, dayKey],
  )

  const getDebateById = useCallback(
    (id: string) => {
      if (adminRemovedDebateIds.has(id)) return undefined
      const fromList = debates.find((d) => d.id === id)
      if (fromList) return fromList
      return findCustomDebateById(id)
    },
    [adminRemovedDebateIds, debates],
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
      deleteDebateAsAdmin,
    }),
    [debates, debateOfTheDay, trendingDebates, loading, error, getDebateById, refresh, deleteDebateAsAdmin],
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
