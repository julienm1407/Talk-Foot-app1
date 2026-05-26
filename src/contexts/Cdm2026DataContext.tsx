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
import type {
  WcDataset,
  WcGroup,
  WcGroupId,
  WcMatch,
  WcStandingRow,
  WcTournamentStats,
  WcVenue,
} from '../types/wc2026'

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

export function Cdm2026DataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<WcDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
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

  useEffect(() => {
    refresh()
  }, [refresh])

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
