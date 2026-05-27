import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { API_TOKENS_CHANGED_EVENT, LS_KEY_SPORTMONKS_TOKEN } from '../constants/apiKeysStorage'
import {
  extractSquadPlayersFromSmEnvelope,
  extractTeamSeasonStatisticsFromSmPayload,
  fetchSportMonksTeamActiveSeasons,
  fetchSportMonksTeamSchedule,
  fetchSportMonksTeamStatisticsForSeason,
  fetchSportMonksTeamSquad,
  pickActiveSeasonIdFromSmTeamPayload,
  fetchSportMonksTeamUpcoming,
  findLastFinishedClubMatchFromTeamLatest,
  findNextClubMatchFromSchedule,
  findNextClubMatchFromTeamUpcoming,
  lastFiveFormFromTeamSchedule,
  overlayClubSquadWithSmPlayers,
} from '../api/sportMonks'
import { buildEmptyClubPageShell } from '../data/clubPageMock'
import { useDebates } from '../contexts/DebatesContext'
import type { ClubPageMock } from '../data/clubPageMock'
import { getExternalClubReadingLinks } from '../data/clubRelatedLinks'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { newsItemHasArticlePage, type NewsItem } from '../data/news'
import { useArticles } from '../contexts/ArticlesContext'
import type { SmSquadPlayerRow, TeamSeasonStatRow } from '../api/sportMonks'
import { useMatches } from '../contexts/MatchesContext'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { usePageSeo } from '../hooks/usePageSeo'
import { SITE_NAME } from '../seo/siteCopy'
import {
  SPORTMONKS_SQUAD_PLAYER_STAT_SEASON_BY_CLUB_ID,
  SPORTMONKS_TEAM_ID_BY_CLUB_ID,
  SPORTMONKS_TEAM_SEASON_ID_BY_CLUB_ID,
} from '../data/sportMonksKnownTeamIds'
import { findTeamById, resolveClubIdFromSlug } from '../utils/clubRoute'
import { countSalonChannelsForClub, getGroupsForClubPage } from '../utils/groupsForClubPage'
import { cn } from '../utils/cn'
import { ClubDataBar } from '../components/club-page/ClubDataBar'
import { ClubInfoDrawer } from '../components/club-page/ClubInfoDrawer'
import { ClubPageGrid } from '../components/club-page/ClubPageGrid'
import { ClubPageHero } from '../components/club-page/ClubPageHero'
import { getSportMonksToken } from '../utils/apiTokens'
import { formatKickoff } from '../utils/time'
import { AdSlot } from '../components/ui/AdSlot'
import { EditorialProse } from '../components/ads/EditorialProse'

function readPositiveInt(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

function inferSeasonIdFromSmFixturePayload(payload: unknown): number | null {
  const queue: unknown[] = [payload]
  const seen = new Set<object>()
  const hits = new Map<number, number>()

  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur || typeof cur !== 'object') continue
    if (seen.has(cur)) continue
    seen.add(cur)

    if (Array.isArray(cur)) {
      for (const x of cur) queue.push(x)
      continue
    }

    const o = cur as Record<string, unknown>
    const direct = readPositiveInt(o.season_id ?? o.seasonId)
    if (direct != null) hits.set(direct, (hits.get(direct) ?? 0) + 1)

    const season = o.season
    if (typeof season === 'number' || typeof season === 'string') {
      const sid = readPositiveInt(season)
      if (sid != null) hits.set(sid, (hits.get(sid) ?? 0) + 1)
    } else if (season && typeof season === 'object') {
      const sid = readPositiveInt((season as Record<string, unknown>).id)
      if (sid != null) hits.set(sid, (hits.get(sid) ?? 0) + 1)
      queue.push(season)
    }

    for (const v of Object.values(o)) {
      if (v && typeof v === 'object') queue.push(v)
    }
  }

  if (hits.size === 0) return null
  return [...hits.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function ClubPage() {
  const { clubSlug = '' } = useParams()
  const { pathname } = useLocation()
  const [infoOpen, setInfoOpen] = useState(false)
  const { sportMonksTeamIdByClubId } = useMatches()
  const { articles: publishedArticles } = useArticles()
  const [smScheduleUi, setSmScheduleUi] = useState<{
    upcoming:
      | (ClubPageMock['upcoming'] & {
          homeName: string
          awayName: string
          homeLogoUrl?: string
          awayLogoUrl?: string
          homeCrest: {
            id: string
            shortName: string
            colors: { primary: string; secondary: string }
            sportMonksTeamId?: number
          }
          awayCrest: {
            id: string
            shortName: string
            colors: { primary: string; secondary: string }
            sportMonksTeamId?: number
          }
        })
      | null
    formStrip: Array<'V' | 'N' | 'D'> | null
    lastMatch: {
      opponent: string
      league: string
      kickoff: string
      venue: 'dom' | 'ext'
      scoreLine: string
      homeName: string
      awayName: string
      homeLogoUrl?: string
      awayLogoUrl?: string
      homeCrest: { id: string; shortName: string; colors: { primary: string; secondary: string } }
      awayCrest: { id: string; shortName: string; colors: { primary: string; secondary: string } }
    } | null
  } | null>(null)
  /** Pourquoi l’encart reste en démo (token, CORS, 401, etc.). */
  const [clubScheduleHint, setClubScheduleHint] = useState<string | null>(null)
  const [clubSeasonStats, setClubSeasonStats] = useState<TeamSeasonStatRow[] | null>(null)
  const [clubSeasonStatsHint, setClubSeasonStatsHint] = useState<string | null>(null)
  const [smSeasonIdFromFixtures, setSmSeasonIdFromFixtures] = useState<number | null>(null)
  const scheduleFetchSeq = useRef(0)
  const seasonStatsFetchSeq = useRef(0)
  const squadFetchSeq = useRef(0)
  const [smSquadPlayers, setSmSquadPlayers] = useState<SmSquadPlayerRow[] | null>(null)
  /** Incrémenté quand la clé SportMonks change (localStorage / autre onglet) pour relancer le schedule. */
  const [smTokenTick, setSmTokenTick] = useState(0)

  useEffect(() => {
    const bump = () => setSmTokenTick((n) => n + 1)
    window.addEventListener(API_TOKENS_CHANGED_EVENT, bump)
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY_SPORTMONKS_TOKEN || e.key === null) bump()
    }
    window.addEventListener('storage', onStorage)
    let tabWasHidden = document.visibilityState === 'hidden'
    const onVis = () => {
      if (document.visibilityState === 'hidden') tabWasHidden = true
      else if (document.visibilityState === 'visible' && tabWasHidden) {
        tabWasHidden = false
        bump()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener(API_TOKENS_CHANGED_EVENT, bump)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const team = useMemo(() => {
    const id = resolveClubIdFromSlug(clubSlug)
    if (!id) return null
    return findTeamById(id)
  }, [clubSlug])

  const { debates: allDebates } = useDebates()
  const dataBase = useMemo(() => (team ? buildEmptyClubPageShell(team) : null), [team])

  const smTeamId = team
    ? sportMonksTeamIdByClubId[team.id] ?? SPORTMONKS_TEAM_ID_BY_CLUB_ID[team.id]
    : undefined

  /** Id **saison** SM optionnel — sinon déduit via `activeSeasons` sur `/teams/{id}`. */
  const smSeasonIdOverride = useMemo(() => {
    if (!team) return undefined
    const fromMap = SPORTMONKS_TEAM_SEASON_ID_BY_CLUB_ID[team.id]
    if (fromMap != null) return fromMap
    const env = import.meta.env.VITE_SPORTMONKS_TEAM_SEASON_ID
    if (env && String(env).trim()) {
      const n = Number(String(env).trim())
      if (Number.isFinite(n) && n > 0) return n
    }
    return undefined
  }, [team])

  const smSquadStatSeasonId = useMemo(() => {
    if (!team) return undefined
    const fromMap = SPORTMONKS_SQUAD_PLAYER_STAT_SEASON_BY_CLUB_ID[team.id]
    if (fromMap != null) return fromMap
    const env = import.meta.env.VITE_SPORTMONKS_SQUAD_STATISTIC_SEASON_ID
    if (env && String(env).trim()) {
      const n = Number(String(env).trim())
      if (Number.isFinite(n) && n > 0) return n
    }
    return undefined
  }, [team])

  useEffect(() => {
    if (!team || smTeamId == null) {
      setSmSquadPlayers(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setSmSquadPlayers(null)
      return
    }
    const seq = ++squadFetchSeq.current
    setSmSquadPlayers(null)
    let cancelled = false
    const seasonFilter =
      smSquadStatSeasonId != null ? String(smSquadStatSeasonId) : undefined
    void fetchSportMonksTeamSquad(token, smTeamId, seasonFilter)
      .then((json) => {
        if (cancelled || seq !== squadFetchSeq.current) return
        const rows = extractSquadPlayersFromSmEnvelope(json)
        setSmSquadPlayers(rows.length ? rows : null)
      })
      .catch(() => {
        if (!cancelled && seq === squadFetchSeq.current) setSmSquadPlayers(null)
      })
    return () => {
      cancelled = true
    }
  }, [team, smTeamId, smSquadStatSeasonId, smTokenTick])

  useEffect(() => {
    if (!team || smTeamId == null) {
      setSmScheduleUi(null)
      setClubScheduleHint(null)
      setSmSeasonIdFromFixtures(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setSmScheduleUi(null)
      setSmSeasonIdFromFixtures(null)
      setClubScheduleHint(
        'Jeton SportMonks introuvable dans ce navigateur : menu Profil → Données, ou variable VITE_SPORTMONKS_TOKEN + redémarrage de `npm run dev`.',
      )
      return
    }
    const seq = ++scheduleFetchSeq.current
    setClubScheduleHint(null)
    setSmScheduleUi(null)
    let cancelled = false
    void Promise.all([
      fetchSportMonksTeamSchedule(token, smTeamId),
      fetchSportMonksTeamUpcoming(token, smTeamId).catch((): null => null),
    ])
      .then(([scheduleJson, upcomingJson]) => {
        if (cancelled || seq !== scheduleFetchSeq.current) return
        const smOpts = { sportMonksTeamId: smTeamId }
        const fromUpcoming =
          upcomingJson && typeof upcomingJson === 'object'
            ? findNextClubMatchFromTeamUpcoming(upcomingJson, team.id, smOpts)
            : null
        const fromSchedule = findNextClubMatchFromSchedule(scheduleJson, team.id, smOpts)
        const next = fromUpcoming ?? fromSchedule
        const formStrip = lastFiveFormFromTeamSchedule(scheduleJson, team.id, smOpts)
        const inferredSeasonId =
          inferSeasonIdFromSmFixturePayload(upcomingJson) ??
          inferSeasonIdFromSmFixturePayload(scheduleJson)
        const lastFinished =
          upcomingJson && typeof upcomingJson === 'object'
            ? findLastFinishedClubMatchFromTeamLatest(upcomingJson, team.id, smOpts)
            : null
        setSmSeasonIdFromFixtures(inferredSeasonId)
        setClubScheduleHint(null)
        setSmScheduleUi({
          upcoming: next
            ? {
                league: next.league,
                matchday: next.matchday,
                opponent: next.opponent,
                kickoff: formatKickoff(next.kickoffIso),
                venue: next.venue,
              homeName: next.homeName,
              awayName: next.awayName,
              homeLogoUrl: next.homeLogoUrl,
              awayLogoUrl: next.awayLogoUrl,
              homeCrest: next.homeCrest,
              awayCrest: next.awayCrest,
              }
            : null,
          formStrip,
          lastMatch: lastFinished
            ? {
                opponent: lastFinished.opponent,
                league: lastFinished.league,
                kickoff: formatKickoff(lastFinished.kickoffIso),
                venue: lastFinished.venue,
                scoreLine: lastFinished.scoreLine,
                homeName: lastFinished.homeName,
                awayName: lastFinished.awayName,
                homeLogoUrl: lastFinished.homeLogoUrl,
                awayLogoUrl: lastFinished.awayLogoUrl,
                homeCrest: lastFinished.homeCrest,
                awayCrest: lastFinished.awayCrest,
              }
            : null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled || seq !== scheduleFetchSeq.current) return
        const msg = err instanceof Error ? err.message : String(err)
        setClubScheduleHint(
          `Impossible de charger le calendrier SportMonks (${msg}). L’encart reste en démo.`,
        )
        setSmScheduleUi(null)
        setSmSeasonIdFromFixtures(null)
      })
    return () => {
      cancelled = true
    }
  }, [team, smTeamId, smTokenTick])

  useEffect(() => {
    if (!team || smTeamId == null) {
      setClubSeasonStats(null)
      setClubSeasonStatsHint(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setClubSeasonStats(null)
      setClubSeasonStatsHint(null)
      return
    }
    const seq = ++seasonStatsFetchSeq.current
    setClubSeasonStats(null)
    setClubSeasonStatsHint(null)
    let cancelled = false

    void (async () => {
      try {
        let seasonId = smSeasonIdOverride ?? smSeasonIdFromFixtures
        if (seasonId == null) {
          const seasonsJson = await fetchSportMonksTeamActiveSeasons(token, smTeamId)
          if (cancelled || seq !== seasonStatsFetchSeq.current) return
          seasonId = pickActiveSeasonIdFromSmTeamPayload(seasonsJson) ?? null
        }
        if (seasonId == null) {
          if (!cancelled && seq === seasonStatsFetchSeq.current) {
            setClubSeasonStats(null)
            setClubSeasonStatsHint(
              'Saison SM introuvable pour cette équipe (réponse activeSeasons vide). Tu peux forcer un id saison avec `VITE_SPORTMONKS_TEAM_SEASON_ID` ou `SPORTMONKS_TEAM_SEASON_ID_BY_CLUB_ID`.',
            )
          }
          return
        }

        const statsJson = await fetchSportMonksTeamStatisticsForSeason(token, smTeamId, seasonId)
        if (cancelled || seq !== seasonStatsFetchSeq.current) return
        const rows = extractTeamSeasonStatisticsFromSmPayload(statsJson)
        setClubSeasonStats(rows.length ? rows : null)
        setClubSeasonStatsHint(
          rows.length ? null : 'Statistiques saison SM vides pour ce filtre (plan API ou saison).',
        )
      } catch (err: unknown) {
        if (cancelled || seq !== seasonStatsFetchSeq.current) return
        const msg = err instanceof Error ? err.message : String(err)
        setClubSeasonStats(null)
        setClubSeasonStatsHint(`Stats saison SM indisponibles (${msg}).`)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [team, smTeamId, smSeasonIdOverride, smSeasonIdFromFixtures, smTokenTick])

  const { groups } = useSupporterGroups()
  const clubGroups = useMemo(
    () => (team ? getGroupsForClubPage(team.id, groups, 6) : []),
    [team, groups],
  )
  const salonChannelCount = useMemo(
    () => (team ? countSalonChannelsForClub(team.id, groups) : 0),
    [team, groups],
  )
  const data = useMemo(() => {
    if (!dataBase) return null
    let out: ClubPageMock = { ...dataBase }
    if (smScheduleUi) {
      if (smScheduleUi.upcoming) out = { ...out, upcoming: smScheduleUi.upcoming }
      if (smScheduleUi.formStrip?.length) {
        out = { ...out, formStrip: smScheduleUi.formStrip, formStripFromApi: true }
      }
    }
    if (smSquadPlayers?.length) {
      out = {
        ...out,
        squad: overlayClubSquadWithSmPlayers(out.squad, smSquadPlayers),
        squadFromSportMonks: true,
      }
    }
    out = { ...out, openRooms: salonChannelCount }
    const clubDebates = allDebates
      .filter((d) => clubGroups.some((g) => g.id === d.groupId))
      .slice(0, 4)
      .map((d) => ({
        id: d.id,
        title: d.title,
        yesPct: 50,
        comments: d.messagesCount,
        isLive: d.trending ?? false,
      }))
    if (clubDebates.length) out = { ...out, debates: clubDebates }
    return out
  }, [dataBase, smScheduleUi, smSquadPlayers, salonChannelCount, allDebates, clubGroups])
  const clubReadingLinks = useMemo<
    Array<{ id: string; title: string; excerpt: string; url: string; source: string; internal: boolean }>
  >(() => {
    if (!team) return []
    const teamLeagueId = ALL_CLUBS_BY_ID[team.id]?.leagueId ?? null

    const toInternal = (n: NewsItem & { slug: string }) => ({
        id: n.id,
        title: n.title,
        excerpt: n.excerpt,
        url: `/article/${n.slug}`,
        source: 'Talk Foot',
        internal: true as const,
    })

    const byClub = publishedArticles
      .filter((n): n is NewsItem & { slug: string } => newsItemHasArticlePage(n) && !!n.clubIds?.includes(team.id))
      .map(toInternal)

    const byLeague = publishedArticles
      .filter(
        (n): n is NewsItem & { slug: string } =>
          newsItemHasArticlePage(n) &&
          !n.clubIds?.length &&
          !!teamLeagueId &&
          !!n.leagueIds?.includes(teamLeagueId),
      )
      .map(toInternal)

    const generic = publishedArticles
      .filter(
        (n): n is NewsItem & { slug: string } =>
          newsItemHasArticlePage(n) && !n.clubIds?.length && !n.leagueIds?.length,
      )
      .map(toInternal)

    const internal = [...byClub, ...byLeague, ...generic]
      .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
      .slice(0, 4)

    const external = getExternalClubReadingLinks(team.id, 4).map((x): {
      id: string
      title: string
      excerpt: string
      url: string
      source: string
      internal: boolean
    } => ({
      ...x,
      internal: false,
    }))

    return [...internal, ...external]
  }, [team, publishedArticles])

  usePageSeo(
    pathname,
    team
      ? {
          title: `${team.name} — hub & communauté — ${SITE_NAME}`,
          description: `Hub social ${team.shortName} : tribunes live, débats, voix, fans. Infos match en second plan.`,
          robots: 'index, follow',
        }
      : 'skip',
  )

  if (!team || !data) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      className={cn(
        'min-w-0 overflow-x-hidden bg-[#030712] pb-2',
        data.onFire && 'shadow-[inset_0_0_80px_rgba(251,191,36,0.06)]',
        data.matchMode && 'ring-1 ring-rose-500/10',
      )}
    >
      <ClubPageHero team={team} data={data} sportMonksTeamId={smTeamId} />
      <ClubDataBar
        data={data}
        onOpenInfo={() => setInfoOpen(true)}
        matchMode={data.matchMode}
        onFire={data.onFire}
        salonChannelCount={salonChannelCount}
        tribunesHubTo={`/groups?tab=discover&club=${encodeURIComponent(team.id)}`}
        salonClubName={team.shortName}
      />
      <div className="mx-auto max-w-tf-content px-[var(--tf-page-gutter)] py-4">
        <EditorialProse
          title={`Hub ${team.shortName}`}
          className="border-white/10 bg-white/[0.04]"
          paragraphs={[
            `Cette page présente le calendrier, la forme récente, l’effectif et les statistiques de saison de ${team.name}, ainsi que les tribunes et groupes supporters liés au club sur Talk Foot.`,
            'Les données sportives proviennent de sources officielles lorsque disponibles. Les tribunes de match en direct et les écrans plein écran ne comportent pas de publicité.',
          ]}
        />
        <div className="mt-4">
          <AdSlot
            compact
            tone="navy"
            brand="Talk Foot"
            body="Partenaire — fiche club."
            imageSeed="club-inline"
            contentReady={Boolean(data)}
          />
        </div>
      </div>
      <ClubPageGrid
        team={team}
        data={data}
        matchMode={data.matchMode}
        clubGroups={clubGroups}
        clubScheduleHint={clubScheduleHint}
        clubLastMatch={smScheduleUi?.lastMatch ?? null}
        squadFromSportMonks={Boolean(data.squadFromSportMonks)}
        clubSeasonStats={clubSeasonStats}
        clubSeasonStatsHint={clubSeasonStatsHint}
        clubReadingLinks={clubReadingLinks}
      />
      <ClubInfoDrawer
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        data={data}
        clubName={team.shortName}
      />
    </div>
  )
}
