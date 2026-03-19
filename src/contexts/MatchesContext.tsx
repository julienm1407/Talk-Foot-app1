import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react'
import type { Match } from '../types/match'
import { fetchFixtures, fetchLiveFixtures, fetchRennesPsgReplay } from '../api/footballApi'
import { apiFixtureToMatch } from '../api/transformFixtures'
import { generateRealFixtures } from '../data/realFixtures'
import { teams } from '../data/teams'

// Rennes–PSG 8 mars 2025 17h — utilisé comme match live (replay accéléré)
export const REPLAY_LIVE_ID = 'm-api-1213970'

const FALLBACK_LIVE_MATCH: Match = {
  id: REPLAY_LIVE_ID,
  competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
  home: teams['ligue-1'].find((t) => t.id === 'rennes') ?? teams['ligue-1'][0],
  away: teams['ligue-1'].find((t) => t.id === 'psg') ?? teams['ligue-1'][0],
  kickoffAt: '2025-03-08T17:00:00+01:00',
  status: 'live',
  minute: 0,
  score: { home: 0, away: 0 },
}

// Fenêtre dynamique : 3 semaines avant → 4 semaines après aujourd'hui (pas seulement mars)
function getDateRange() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 21)
  const to = new Date(now)
  to.setDate(to.getDate() + 28)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    cutoff: from.getTime(),
  }
}

const INIT_RANGE = getDateRange()
const CUTOFF_DATE = INIT_RANGE.cutoff
const CAROUSEL_WINDOW_MS = 28 * 24 * 60 * 60 * 1000 // 4 semaines (au lieu d'1)

type MatchesContextValue = {
  matches: Match[]
  carouselMatches: Match[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const MatchesContext = createContext<MatchesContextValue | null>(null)

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Rafraîchir encarts et calendrier chaque minute pour garder les plages à jour
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const fetchMatches = useCallback(async () => {
    const apiKey = import.meta.env.VITE_API_SPORTS_KEY
    if (!apiKey) {
      const fallback = [FALLBACK_LIVE_MATCH, ...generateRealFixtures()].filter(
        (m) =>
          m.id === REPLAY_LIVE_ID || new Date(m.kickoffAt).getTime() >= CUTOFF_DATE,
      )
      setMatches(fallback)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [liveFixtures, apiFixtures, replayFixture] = await Promise.all([
        fetchLiveFixtures(apiKey),
        fetchFixtures(apiKey),
        fetchRennesPsgReplay(apiKey),
      ])
      const liveIds = new Set(liveFixtures.map((f) => f.fixture.id))
      const fixturesSansLive = apiFixtures.filter((f) => !liveIds.has(f.fixture.id))
      const convertedLive = liveFixtures.map(apiFixtureToMatch)
      const convertedFixtures = fixturesSansLive.map(apiFixtureToMatch)
      let baseList = [...convertedLive, ...convertedFixtures].sort(
        (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
      )
      // Rennes–PSG toujours en live pour les tests — simulation de replay toujours active
      const replayAsLive: Match = replayFixture
        ? (() => {
            const replayMatch = apiFixtureToMatch(replayFixture)
            return {
              ...replayMatch,
              id: REPLAY_LIVE_ID,
              status: 'live' as const,
              minute: 0,
              score: { home: 0, away: 0 },
            }
          })()
        : FALLBACK_LIVE_MATCH
      baseList = [
        replayAsLive,
        ...baseList.filter(
          (m) => m.id !== REPLAY_LIVE_ID && m.id !== `m-api-${replayFixture?.fixture.id}`,
        ),
      ]
      const upcomingSimulated = generateRealFixtures()
      let combined = [...baseList, ...upcomingSimulated]
      if (combined.length === 0) combined = [FALLBACK_LIVE_MATCH]
      setMatches(
        combined.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement matchs')
      const fallback = [FALLBACK_LIVE_MATCH, ...generateRealFixtures()].filter(
        (m) =>
          m.id === REPLAY_LIVE_ID ||
          new Date(m.kickoffAt).getTime() >= CUTOFF_DATE,
      )
      setMatches(fallback)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMatches()
  }, [fetchMatches])

  const carouselMatches = useMemo(() => {
    const now = Date.now()
    const liveMatch = matches.find((m) => m.id === REPLAY_LIVE_ID || m.status === 'live')
    const rest = matches
      .filter((m) => m.id !== liveMatch?.id)
      .filter((m) => {
        const kickoff = new Date(m.kickoffAt).getTime()
        return kickoff >= now - 60_000 && kickoff <= now + CAROUSEL_WINDOW_MS
      })
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 14)
    return [...(liveMatch ? [liveMatch] : []), ...rest]
  }, [matches, tick])

  const value: MatchesContextValue = {
    matches,
    carouselMatches,
    loading,
    error,
    refetch: fetchMatches,
  }

  return (
    <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>
  )
}

export function useMatches() {
  const ctx = useContext(MatchesContext)
  if (!ctx) throw new Error('useMatches must be used within MatchesProvider')
  return ctx
}
