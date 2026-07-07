import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { activeWcDataSource } from '../api/wc2026'
import { mergeWcBracketWithMatches } from '../api/wc2026/extractWcMatchesFromSmFixtures'
import { WC_DATASET } from '../data/wc2026Mock'
import { getSportMonksTokenSource } from '../utils/apiTokens'
import { wcMatchNeedsLiveAttention } from '../utils/footballMatchAttention'
import { useVisibilityAwareInterval } from '../hooks/useVisibilityAwareInterval'
import type {
  WcDataset,
  WcGroup,
  WcGroupId,
  WcMatch,
  WcStandingRow,
  WcTournamentStats,
  WcVenue,
} from '../types/wc2026'

/** Pendant un match / TAB : même cadence que MatchesContext. */
const CDM_LIVE_POLL_MS = 12_000
/** Filet hors match : classements et arbre sans F5. */
const CDM_BACKGROUND_POLL_MS = 60_000

type Cdm2026DataContextValue = {
  dataset: WcDataset | null
  loading: boolean
  error: string | null
  /** Force un rafraîchissement complet (au moins l'agrégat). */
  refresh: () => Promise<void>
  /** Helpers pratiques typés. */
  getGroup: (id: WcGroupId) => WcGroup | null
  getStanding: (id: WcGroupId) => WcStandingRow[]
  getMatchesByGroup: (id: WcGroupId) => WcMatch[]
  getMatchesByDay: (dayKeyUtc: string) => WcMatch[]
  getVenue: (id: string) => WcVenue | null
  /** Stats compétition (peuvent être vides au début). */
  stats: WcTournamentStats | null
}

const Cdm2026DataContext = createContext<Cdm2026DataContextValue | null>(null)

function dayKeyUtcOf(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function mergeLivePatch(prev: WcDataset | null, patch: Pick<WcDataset, 'matches' | 'standings' | 'stats'>): WcDataset {
  const base = prev ?? WC_DATASET
  const matches = patch.matches
  return {
    ...base,
    matches,
    standings: patch.standings ?? base.standings,
    stats: patch.stats ?? base.stats,
    bracket: mergeWcBracketWithMatches(base.bracket, matches),
    updatedAt: new Date().toISOString(),
  }
}

export function Cdm2026DataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<WcDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attentionTick, setAttentionTick] = useState(0)

  const refreshFull = useCallback(async () => {
    setError(null)
    try {
      const next = await activeWcDataSource.loadDataset()
      setDataset(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement CDM')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSilent = useCallback(async () => {
    setError(null)
    try {
      if (activeWcDataSource.refreshLive) {
        const patch = await activeWcDataSource.refreshLive()
        setDataset((prev) => mergeLivePatch(prev, patch))
      } else {
        const next = await activeWcDataSource.loadDataset()
        setDataset(next)
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[TalkFoot] CDM refresh silencieux:', e)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = refreshFull

  useEffect(() => {
    void refreshFull()
  }, [refreshFull])

  useEffect(() => {
    const id = window.setInterval(() => setAttentionTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const needsLiveAttention = useMemo(() => {
    void attentionTick
    const matches = dataset?.matches ?? []
    return matches.some((m) => wcMatchNeedsLiveAttention(m))
  }, [dataset?.matches, attentionTick])

  const smEnabled = getSportMonksTokenSource() !== 'none'

  useVisibilityAwareInterval(
    () => void refreshSilent(),
    CDM_LIVE_POLL_MS,
    smEnabled && needsLiveAttention,
    true,
  )

  useVisibilityAwareInterval(
    () => void refreshSilent(),
    CDM_BACKGROUND_POLL_MS,
    smEnabled,
    true,
  )

  const value = useMemo<Cdm2026DataContextValue>(() => {
    return {
      dataset,
      loading,
      error,
      refresh,
      getGroup: (id) => dataset?.groups.find((g) => g.id === id) ?? null,
      getStanding: (id) => dataset?.standings[id] ?? [],
      getMatchesByGroup: (id) =>
        (dataset?.matches ?? []).filter((m) => m.groupId === id),
      getMatchesByDay: (dayKey) =>
        (dataset?.matches ?? []).filter((m) => dayKeyUtcOf(m.kickoffAt) === dayKey),
      getVenue: (id) => dataset?.venues.find((v) => v.id === id) ?? null,
      stats: dataset?.stats ?? null,
    }
  }, [dataset, loading, error, refresh])

  return (
    <Cdm2026DataContext.Provider value={value}>{children}</Cdm2026DataContext.Provider>
  )
}

export function useCdm2026Data(): Cdm2026DataContextValue {
  const ctx = useContext(Cdm2026DataContext)
  if (!ctx) throw new Error('useCdm2026Data must be used within Cdm2026DataProvider')
  return ctx
}

export function useOptionalCdm2026Data(): Cdm2026DataContextValue | null {
  return useContext(Cdm2026DataContext)
}
