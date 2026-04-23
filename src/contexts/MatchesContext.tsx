import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react'
import type { Match } from '../types/match'
import {
  fetchSportMonksFixturesBetween,
  fetchSportMonksFixturesByDate,
  fetchSportMonksInplay,
  mergeSportMonksFixtureLists,
  smFixtureToMatch,
} from '../api/sportMonks'
import { DEMO_EXTRA_LIVE_MATCHES } from '../data/demoLiveMatches'
import { generateRealFixtures } from '../data/realFixtures'
import { teams } from '../data/teams'
import { API_TOKENS_CHANGED_EVENT } from '../constants/apiKeysStorage'
import { getSportMonksToken, getSportMonksTokenSource } from '../utils/apiTokens'
import { getFootballCalendarWindow } from '../utils/footballCalendarWindow'
import { matchCalendarDayKeyParis, parisCalendarDayAfter } from '../utils/time'

// Rennes–PSG 8 mars 2025 17h — utilisé comme match live (replay accéléré)
export const REPLAY_LIVE_ID = 'm-api-1213970'

const FALLBACK_LIVE_MATCH: Match = {
  id: REPLAY_LIVE_ID,
  provider: 'demo',
  competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
  home: teams['ligue-1'].find((t) => t.id === 'rennes') ?? teams['ligue-1'][0],
  away: teams['ligue-1'].find((t) => t.id === 'psg') ?? teams['ligue-1'][0],
  kickoffAt: '2025-03-08T17:00:00+01:00',
  status: 'live',
  minute: 0,
  score: { home: 0, away: 0 },
}

/** `silent` : pas d’écran chargement ; en cas d’erreur API on garde les matchs déjà affichés (poll / onglet). */
type FetchMatchesOptions = { silent?: boolean }

type MatchesContextValue = {
  matches: Match[]
  carouselMatches: Match[]
  /** Derniers IDs équipe SM vus dans le calendrier (pour page club / planning). */
  sportMonksTeamIdByClubId: Readonly<Record<string, number>>
  loading: boolean
  error: string | null
  refetch: (opts?: FetchMatchesOptions) => Promise<void>
}

const MatchesContext = createContext<MatchesContextValue | null>(null)

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const [tokenRev, setTokenRev] = useState(0)

  // Rafraîchir encarts et calendrier chaque minute pour garder les plages à jour
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const fetchMatches = useCallback(async (opts?: FetchMatchesOptions) => {
    const silent = Boolean(opts?.silent)
    const sportmonksToken = getSportMonksToken()
    if (import.meta.env.DEV && !sportmonksToken) {
      // Aide au debug : sans VITE_SPORTMONKS_TOKEN ni clé navigateur, aucun hit sur le compte SportMonks.
      console.info(
        '[TalkFoot] Pas de jeton SportMonks — pas de requête vers api.sportmonks.com. Profil → Données / .env.local → VITE_SPORTMONKS_TOKEN',
      )
    }
    if (sportmonksToken) {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      try {
        const range = getFootballCalendarWindow()
        const todayParis = matchCalendarDayKeyParis(new Date())
        const tomorrowParis = parisCalendarDayAfter(todayParis)
        const [inplay, between, byToday, byTomorrow] = await Promise.all([
          fetchSportMonksInplay(sportmonksToken),
          fetchSportMonksFixturesBetween(sportmonksToken, range.from, range.to),
          fetchSportMonksFixturesByDate(sportmonksToken, todayParis),
          fetchSportMonksFixturesByDate(sportmonksToken, tomorrowParis),
        ])
        const mergedSm = new Map<number, (typeof between)[number]>()
        for (const f of mergeSportMonksFixtureLists(between, inplay)) mergedSm.set(f.id, f)
        for (const f of [...byToday, ...byTomorrow]) mergedSm.set(f.id, f)
        const merged = Array.from(mergedSm.values())

        const baseList = merged
          .map(smFixtureToMatch)
          .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())

        if (baseList.length > 0) {
          setMatches(baseList)
          setError(null)
        } else if (silent) {
          /* poll silencieux : ne pas vider une liste déjà correcte */
        } else {
          setMatches([])
          setError(
            'SportMonks n’a renvoyé aucun match pour cette période. Vérifie ton plan (ligues / pays inclus) ou la clé dans Profil → Données.',
          )
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur SportMonks')
        if (!silent) {
          const demoIds = new Set(DEMO_EXTRA_LIVE_MATCHES.map((m) => m.id))
          const fallback = [
            FALLBACK_LIVE_MATCH,
            ...DEMO_EXTRA_LIVE_MATCHES,
            ...generateRealFixtures().filter((m) => !demoIds.has(m.id)),
          ].filter(
            (m) =>
              m.id === REPLAY_LIVE_ID ||
              new Date(m.kickoffAt).getTime() >= getFootballCalendarWindow().cutoffMs,
          )
          setMatches(fallback)
        }
      } finally {
        if (!silent) setLoading(false)
      }
      return
    }

    /** Sans clé SportMonks : replay démo + matchs simulés (pas d’API-Football). */
    const demoIds = new Set(DEMO_EXTRA_LIVE_MATCHES.map((m) => m.id))
    const fallback = [
      FALLBACK_LIVE_MATCH,
      ...DEMO_EXTRA_LIVE_MATCHES,
      ...generateRealFixtures().filter((m) => !demoIds.has(m.id)),
    ].filter(
      (m) =>
        m.id === REPLAY_LIVE_ID ||
        new Date(m.kickoffAt).getTime() >= getFootballCalendarWindow().cutoffMs,
    )
    setMatches(fallback)
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    const bump = () => setTokenRev((n) => n + 1)
    window.addEventListener(API_TOKENS_CHANGED_EVENT, bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener(API_TOKENS_CHANGED_EVENT, bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  useEffect(() => {
    void fetchMatches()
  }, [fetchMatches, tokenRev])

  /** Rafraîchissement SportMonks : scores live + calendrier (inplay + fixtures/between). */
  useEffect(() => {
    if (getSportMonksTokenSource() === 'none') return
    const id = window.setInterval(() => void fetchMatches({ silent: true }), 45_000)
    return () => clearInterval(id)
  }, [fetchMatches, tokenRev])

  /** Au retour sur l’onglet / la fenêtre : mise à jour sans bloquer l’UI. */
  useEffect(() => {
    if (getSportMonksTokenSource() === 'none') return
    let debounce: number
    const schedule = () => {
      window.clearTimeout(debounce)
      debounce = window.setTimeout(() => void fetchMatches({ silent: true }), 1200)
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') schedule()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', schedule)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', schedule)
      window.clearTimeout(debounce)
    }
  }, [fetchMatches, tokenRev])

  const sportMonksTeamIdByClubId = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const m of matches) {
      const h = m.home.sportMonksTeamId
      const a = m.away.sportMonksTeamId
      if (h != null) acc[m.home.id] = h
      if (a != null) acc[m.away.id] = a
    }
    return acc
  }, [matches])

  const carouselMatches = useMemo(() => {
    const lives = matches.filter((m) => m.status === 'live')
    const replayFirst = lives.find((m) => m.id === REPLAY_LIVE_ID)
    const otherLives = lives.filter((m) => m.id !== REPLAY_LIVE_ID)
    const livesOrdered = replayFirst ? [replayFirst, ...otherLives] : lives
    const liveIds = new Set(livesOrdered.map((m) => m.id))
    const win = getFootballCalendarWindow()
    const rest = matches
      .filter((m) => !liveIds.has(m.id))
      .filter((m) => {
        const kickoff = new Date(m.kickoffAt).getTime()
        return kickoff >= win.cutoffMs - 60_000 && kickoff <= win.endMs
      })
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 14)
    return [...livesOrdered, ...rest]
  }, [matches, tick])

  const value: MatchesContextValue = {
    matches,
    carouselMatches,
    sportMonksTeamIdByClubId,
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
