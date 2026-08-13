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
  fetchSportMonksFixturesForSeason,
  fetchSportMonksInplay,
  fetchSportMonksLeaguesByDate,
  fetchSportMonksSeasonSchedule,
  mergeSportMonksFixtureLists,
  smFixtureToMatch,
  smFixturesFromLeaguesDateEnvelope,
  smFixturesFromSeasonScheduleEnvelope,
  type SmFixture,
} from '../api/sportMonks'
import { resolveSportMonksWc2026SeasonId } from '../data/wc2026SportMonks'
import { API_TOKENS_CHANGED_EVENT } from '../constants/apiKeysStorage'
import { getSportMonksToken, getSportMonksTokenSource } from '../utils/apiTokens'
import { getFootballCalendarWindow } from '../utils/footballCalendarWindow'
import {
  addParisCalendarDays,
  matchCalendarDayKeyParis,
  parisCalendarDayKeysInclusive,
} from '../utils/time'
import { useKickoffScheduledRefetch } from '../hooks/useKickoffScheduledRefetch'
import { useVisibilityAwareInterval } from '../hooks/useVisibilityAwareInterval'
import { matchNeedsLiveAttention } from '../utils/footballMatchAttention'
import { useOptionalSeasonMode } from './SeasonModeContext'
import {
  readMatchesSessionCache,
  writeMatchesSessionCache,
} from '../utils/matchesSessionCache'

/** Appels `leagues/date` par vague pour compléter le calendrier (surtout matchs à venir). */
const LEAGUES_DATE_BATCH = 10
/** Aligné sur `getFootballCalendarWindow` : même étendue que `fixtures/between`. */
const LEAGUES_DATE_FULL_BACK = 7
const LEAGUES_DATE_FULL_FORWARD = 10
/** Pendant un live, on rafraîchit plus souvent pour propager score/buts sans F5. */
const LIVE_SILENT_POLL_MS = 12_000

const NO_SM_TOKEN_MESSAGE_FR =
  'Aucune clé SportMonks : ajoute-la dans Profil → Données (ou VITE_SPORTMONKS_TOKEN dans .env.local), puis recharge la page. Les matchs démo ne sont plus affichés.'

function reasonFromSettled(r: PromiseRejectedResult): string {
  const x = r.reason
  return x instanceof Error ? x.message : String(x)
}

async function smFixturesFromLeaguesDateKeys(token: string, keys: string[]): Promise<SmFixture[]> {
  const acc: SmFixture[] = []
  for (let i = 0; i < keys.length; i += LEAGUES_DATE_BATCH) {
    const slice = keys.slice(i, i + LEAGUES_DATE_BATCH)
    const settled = await Promise.allSettled(slice.map((d) => fetchSportMonksLeaguesByDate(token, d)))
    for (const r of settled) {
      if (r.status === 'fulfilled') acc.push(...smFixturesFromLeaguesDateEnvelope(r.value))
    }
  }
  return acc
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
  const season = useOptionalSeasonMode()
  const cdmSeasonActive = season?.isCdm2026 === true
  const cachedOnMount = useMemo(() => readMatchesSessionCache(), [])
  const [matches, setMatches] = useState<Match[]>(() => cachedOnMount)
  const [loading, setLoading] = useState(() => cachedOnMount.length === 0)
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
        const range = getFootballCalendarWindow(new Date(), { cdmExtended: cdmSeasonActive })
        const cdmExtended = range.cdmExtended
        const todayParis = matchCalendarDayKeyParis(new Date())
        const [inplaySettled, betweenSettled] = await Promise.allSettled([
          fetchSportMonksInplay(sportmonksToken),
          fetchSportMonksFixturesBetween(sportmonksToken, range.from, range.to),
        ])
        const inplay =
          inplaySettled.status === 'fulfilled' ? inplaySettled.value : ([] as SmFixture[])
        const between =
          betweenSettled.status === 'fulfilled' ? betweenSettled.value : ([] as SmFixture[])
        const primaryFetchFailures: string[] = []
        if (inplaySettled.status === 'rejected') primaryFetchFailures.push(reasonFromSettled(inplaySettled))
        if (betweenSettled.status === 'rejected') primaryFetchFailures.push(reasonFromSettled(betweenSettled))

        let fromLeaguesDate: SmFixture[] = []
        let fromWcSeason: SmFixture[] = []
        if (cdmExtended) {
          const seasonId = resolveSportMonksWc2026SeasonId()
          try {
            const scheduleEnv = await fetchSportMonksSeasonSchedule(sportmonksToken, seasonId)
            fromWcSeason = smFixturesFromSeasonScheduleEnvelope(scheduleEnv)
          } catch (wcSchedErr) {
            if (import.meta.env.DEV) {
              console.warn('[TalkFoot] schedules/seasons CDM:', wcSchedErr)
            }
          }
          if (fromWcSeason.length === 0) {
            try {
              fromWcSeason = await fetchSportMonksFixturesForSeason(sportmonksToken, seasonId)
            } catch (wcFxErr) {
              if (!silent) {
                const msg = wcFxErr instanceof Error ? wcFxErr.message : String(wcFxErr)
                primaryFetchFailures.push(`CDM saison ${seasonId}: ${msg}`)
              }
            }
          }
        }
        /**
         * Poll silencieux live : éviter la passe `leagues/date` (coûteuse) pour accélérer
         * la remontée score/événements. Le chargement initial garde la passe complète.
         */
        /** En mode CDM : `fixtures/between` jusqu’au 31/07 suffit — évite ~90 appels `leagues/date`. */
        if (!silent && !cdmExtended) {
          const leaguesDateKeys = parisCalendarDayKeysInclusive(
            addParisCalendarDays(todayParis, -LEAGUES_DATE_FULL_BACK),
            addParisCalendarDays(todayParis, LEAGUES_DATE_FULL_FORWARD),
          )
          try {
            fromLeaguesDate = await smFixturesFromLeaguesDateKeys(sportmonksToken, leaguesDateKeys)
          } catch {
            fromLeaguesDate = []
          }
        }

        const mergedSm = new Map<number, (typeof between)[number]>()
        for (const f of mergeSportMonksFixtureLists(between, inplay)) mergedSm.set(f.id, f)
        for (const f of fromWcSeason) mergedSm.set(f.id, f)
        for (const f of fromLeaguesDate) {
          if (!mergedSm.has(f.id)) mergedSm.set(f.id, f)
        }
        const merged = Array.from(mergedSm.values())

        const baseList = merged
          .map(smFixtureToMatch)
          .filter((m) => !cdmExtended || m.competition.id === 'wc-2026')
          .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
        if (baseList.length > 0) {
          setMatches(baseList)
          writeMatchesSessionCache(baseList)
          setError(null)
        } else if (silent) {
          /* poll silencieux : ne pas vider une liste déjà correcte */
        } else {
          setMatches((prev) => {
            if (prev.length > 0) {
              queueMicrotask(() =>
                setError(
                  primaryFetchFailures.length
                    ? primaryFetchFailures.join(' — ')
                    : 'SportMonks a renvoyé une liste vide (quota, filtre ou coupure). La dernière version du calendrier reste affichée.',
                ),
              )
              return prev
            }
            queueMicrotask(() =>
              setError(
                primaryFetchFailures.length
                  ? `Échec des appels SportMonks : ${primaryFetchFailures.join(' — ')}. Si tu es sur Vercel avec le relais /api/sm, vérifie que la route n’est pas renvoyée vers index.html (onglet Réseau) et que SPORTMONKS_TOKEN est bien défini.`
                  : cdmExtended
                    ? 'SportMonks n’a renvoyé aucun match Coupe du monde pour cette période (jusqu’au 31 juillet 2026, fuseau Paris). Vérifie ton abonnement CDM et la clé API.'
                    : 'SportMonks n’a renvoyé aucun match pour cette période (~7 jours passés + ~10 jours à venir, fuseau Paris). Vérifie ton plan SportMonks (ligues / pays inclus) ou un créneau sans matchs du Big 5.',
              ),
            )
            return []
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur SportMonks'
        const rateLimited =
          /rate\s*limit|429|too\s*many\s*requests/i.test(msg) ||
          /you have reached your rate limit/i.test(msg)
        if (!silent) {
          setError(
            rateLimited
              ? `${msg} — les matchs affichés sont la dernière mise à jour reçue ; rafraîchissement autour des coups d’envoi et en filet de sécurité.`
              : msg,
          )
          setMatches((prev) => (prev.length > 0 ? prev : []))
        } else if (rateLimited) {
          setError(
            'SportMonks (quota) : les matchs affichés sont conservés. Nouvelle tentative au prochain créneau planifié ou filet de rafraîchissement.',
          )
        } else if (import.meta.env.DEV) {
          console.warn('[TalkFoot] fetchMatches silent:', msg)
        }
      } finally {
        if (!silent) setLoading(false)
      }
      return
    }

    setMatches([])
    setError(NO_SM_TOKEN_MESSAGE_FR)
    setLoading(false)
  }, [cdmSeasonActive])

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
    const run = () => void fetchMatches()
    if (cachedOnMount.length > 0) {
      const id = window.setTimeout(run, 0)
      return () => window.clearTimeout(id)
    }
    run()
  }, [fetchMatches, tokenRev, cachedOnMount.length])

  const silentRefetch = useCallback(() => void fetchMatches({ silent: true }), [fetchMatches])

  /** Rafraîchissements ciblés : 1 min avant le coup d’envoi, au coup d’envoi, puis +2 min (live SM). */
  useKickoffScheduledRefetch(
    matches,
    silentRefetch,
    getSportMonksTokenSource() !== 'none',
  )

  /** Live en cours ou fenêtre autour du KO : cadence courte (évite d’attendre F5 si SM tarde sur le statut). */
  const needsLiveAttention = useMemo(
    () => matches.some((m) => matchNeedsLiveAttention(m)),
    [matches, tick],
  )

  useVisibilityAwareInterval(
    () => void silentRefetch(),
    LIVE_SILENT_POLL_MS,
    getSportMonksTokenSource() !== 'none' && needsLiveAttention,
    true,
  )

  /** Filet de sécurité : poll long + pause hors onglet actif (quota API / relais). */
  useVisibilityAwareInterval(
    () => void silentRefetch(),
    20 * 60_000,
    getSportMonksTokenSource() !== 'none',
    true,
  )

  /** Au retour sur l’onglet / la fenêtre : mise à jour sans bloquer l’UI (débounce un peu plus long pour éviter les rafales). */
  useEffect(() => {
    if (getSportMonksTokenSource() === 'none') return
    let debounce: number
    const schedule = () => {
      window.clearTimeout(debounce)
      debounce = window.setTimeout(() => void fetchMatches({ silent: true }), 3500)
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
    const liveIds = new Set(lives.map((m) => m.id))
    const win = getFootballCalendarWindow(new Date(), { cdmExtended: cdmSeasonActive })
    const rest = matches
      .filter((m) => !liveIds.has(m.id))
      .filter((m) => {
        const kickoff = new Date(m.kickoffAt).getTime()
        return kickoff >= win.cutoffMs - 60_000 && kickoff <= win.endMs
      })
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 14)
    return [...lives, ...rest]
  }, [matches, tick, cdmSeasonActive])

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
