import {
  sportMonksFetchJson,
  type SportMonksListEnvelope,
  sportMonksPaginationHasMore,
} from './client'
import type { SmFixture, SmPlayer, SmRoundWithOdds } from './types'
import {
  SM_INCLUDE_FIXTURE_EVENTS_COMMENTS,
  SM_INCLUDE_FIXTURE_EVENTS_TIMELINE,
  SM_INCLUDE_FIXTURE_TRENDS,
  SM_INCLUDE_FIXTURE_LINEUPS,
  SM_INCLUDE_FIXTURE_LIST,
  SM_INCLUDE_FIXTURE_XG,
  SM_INCLUDE_INPLAY,
  SM_INCLUDE_LEAGUE_BY_DATE,
  SM_INCLUDE_ROUND_ODDS,
  SM_INCLUDE_FIXTURE_PREMATCH_ODDS,
  smRoundOddsFiltersDefault,
  SM_INCLUDE_TEAM_FORM,
  SM_INCLUDE_TEAM_SEASON_STATS,
  SM_INCLUDE_TEAM_SQUAD,
  SM_INCLUDE_STANDINGS,
  SM_INCLUDE_TEAM_UPCOMING_AND_LATEST,
} from './includes'

const PER_PAGE = 50
const MAX_PAGES = 30

function asFixtureArray(data: unknown): SmFixture[] {
  if (Array.isArray(data)) return data as SmFixture[]
  if (data && typeof data === 'object' && 'id' in data) return [data as SmFixture]
  return []
}

/** Matchs en cours (rafraîchissement recommandé ~30–60 s). */
export async function fetchSportMonksInplay(token: string): Promise<SmFixture[]> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    '/livescores/inplay',
    token,
    { include: SM_INCLUDE_INPLAY },
  )
  return asFixtureArray(json.data)
}

/**
 * Cotes prématch pour toutes les fixtures d’une journée (round).
 * @see https://api.sportmonks.com/v3/football/rounds/{id}?include=fixtures.odds…&filters=markets:1;bookmakers:{id}
 */
export async function fetchSportMonksRoundWithOdds(
  token: string,
  roundId: number,
  opts?: { include?: string; filters?: string },
): Promise<SmRoundWithOdds> {
  const json = await sportMonksFetchJson<{ data: SmRoundWithOdds }>(`/rounds/${roundId}`, token, {
    include: opts?.include ?? SM_INCLUDE_ROUND_ODDS,
    filters: opts?.filters ?? smRoundOddsFiltersDefault(),
  })
  return json.data
}

/**
 * Cotes prématch pour **une** fixture (`odds` + participants), sans passer par la journée.
 * Utilisé en repli quand `GET /rounds/{roundId}` ne contient pas ce match ou n’expose pas les `odds`.
 */
export async function fetchSportMonksFixturePrematchOdds(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/fixtures/${fixtureId}`, token, {
    include: SM_INCLUDE_FIXTURE_PREMATCH_ODDS,
  })
  return envelopeDataAsFixture(json.data)
}

/** Tous les matchs entre deux dates (pagination). */
export async function fetchSportMonksFixturesBetween(
  token: string,
  fromDate: string,
  toDate: string,
  include: string = SM_INCLUDE_FIXTURE_LIST,
): Promise<SmFixture[]> {
  const out: SmFixture[] = []
  let page = 1
  while (page <= MAX_PAGES) {
    const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
      `/fixtures/between/${fromDate}/${toDate}`,
      token,
      { include, per_page: PER_PAGE, page },
    )
    const chunk = asFixtureArray(json.data)
    out.push(...chunk)
    if (!sportMonksPaginationHasMore(json, PER_PAGE, chunk.length)) break
    page += 1
  }
  return out
}

/** Matchs d’un jour civil précis `YYYY-MM-DD` (complète souvent `fixtures/between` selon les plans SM). */
export async function fetchSportMonksFixturesByDate(
  token: string,
  dateYmd: string,
  include: string = SM_INCLUDE_FIXTURE_LIST,
): Promise<SmFixture[]> {
  const out: SmFixture[] = []
  let page = 1
  while (page <= MAX_PAGES) {
    const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
      `/fixtures/date/${dateYmd}`,
      token,
      { include, per_page: PER_PAGE, page },
    )
    const chunk = asFixtureArray(json.data)
    out.push(...chunk)
    if (!sportMonksPaginationHasMore(json, PER_PAGE, chunk.length)) break
    page += 1
  }
  return out
}

function envelopeDataAsFixture(data: unknown): SmFixture | null {
  if (!data || typeof data !== 'object') return null
  if (Array.isArray(data)) {
    const first = data[0]
    return first && typeof first === 'object' && 'id' in first ? (first as SmFixture) : null
  }
  return 'id' in data ? (data as SmFixture) : null
}

/**
 * Détail fixture avec la même chaîne `include` que l’API xG / events / compos :
 * `participants;league;venue;state;scores;events.type;events.period;events.player;xGFixture.type;lineups…`
 */
export async function fetchSportMonksFixtureWithXG(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_XG },
  )
  return envelopeDataAsFixture(json.data)
}

/**
 * Stats live, événements, blessés, météo + **commentaires texte** (`include` de base + `comments`).
 * Un seul `GET /fixtures/{id}` alimente stats (`MatchLiveStatsStrip`) et timeline (`MatchHighlights`).
 */
export async function fetchSportMonksFixtureEventsWeather(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_EVENTS_COMMENTS },
  )
  return envelopeDataAsFixture(json.data)
}

/** Événements + score + minute — charge utile réduite pour synchroniser animations (cartons, buts…). */
export async function fetchSportMonksFixtureEventsTimeline(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_EVENTS_TIMELINE },
  )
  return envelopeDataAsFixture(json.data)
}

/**
 * Tendances fixture (`trends.type`, `trends.participant`) + contexte scores / events légers.
 */
export async function fetchSportMonksFixtureTrends(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_TRENDS },
  )
  return envelopeDataAsFixture(json.data)
}

/**
 * Compos officielles + staff — même `include` que l’API fixture :
 * `…lineups…;metadata.type;coaches;formations;trends.type;trends.participant` (forme + compos en un appel)
 */
export async function fetchSportMonksFixtureLineups(
  token: string,
  fixtureId: number,
): Promise<SmFixture | null> {
  const json = await sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_LINEUPS },
  )
  return envelopeDataAsFixture(json.data)
}

/**
 * Planning d’une équipe (`/schedules/teams/{id}`).
 * La réponse embarque déjà `rounds[].fixtures[]` — pas d’includes imbriqués `fixture.*` (HTTP 400 côté SM).
 */
export async function fetchSportMonksTeamSchedule(token: string, teamId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/schedules/teams/${teamId}`, token, {
    per_page: 50,
    page: 1,
  })
}

/** Forme + derniers matchs / xG équipe. */
export async function fetchSportMonksTeamDetail(token: string, teamId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/teams/${teamId}`,
    token,
    { include: SM_INCLUDE_TEAM_FORM },
  )
}

/**
 * À venir + derniers matchs (`upcoming` + `latest` sur l’entité team).
 * @example `GET /teams/9?include=upcoming.participants;upcoming.league;latest.participants;latest.league;…`
 */
export async function fetchSportMonksTeamUpcoming(token: string, teamId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/teams/${teamId}`, token, {
    include: SM_INCLUDE_TEAM_UPCOMING_AND_LATEST,
  })
}

/**
 * Liste des équipes d’une **saison** (`season_id`) — pagination.
 * Pour les stats d’**une** équipe, préfère `fetchSportMonksTeamStatisticsForSeason`.
 */
export async function fetchSportMonksTeamSeasonStatistics(
  token: string,
  teamSeasonId: number,
  opts?: { include?: string; filters?: string },
) {
  const filters = opts?.filters ?? `teamstatisticSeasons:${teamSeasonId}`
  return sportMonksFetchJson<{ data: unknown }>(`/teams/seasons/${teamSeasonId}`, token, {
    include: opts?.include ?? SM_INCLUDE_TEAM_SEASON_STATS,
    filters,
  })
}

/** Saisons actives liées à l’équipe (pour résoudre un `season_id`). */
export async function fetchSportMonksTeamActiveSeasons(token: string, teamId: number) {
  return sportMonksFetchJson<{ data: unknown }>(`/teams/${teamId}`, token, {
    include: 'activeSeasons',
  })
}

/**
 * Statistiques agrégées équipe pour une saison donnée (filtre doc SM sur l’entité team).
 * @see https://docs.sportmonks.com/football/endpoints-and-entities/endpoints/teams/get-team-by-id
 */
export async function fetchSportMonksTeamStatisticsForSeason(
  token: string,
  teamId: number,
  seasonId: number,
) {
  return sportMonksFetchJson<{ data: unknown }>(`/teams/${teamId}`, token, {
    include: SM_INCLUDE_TEAM_SEASON_STATS,
    filters: `teamstatisticSeasons:${seasonId}`,
  })
}

/** Profil joueur (stats, palmarès, derniers matchs). */
export async function fetchSportMonksPlayer(token: string, playerId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/players/${playerId}`,
    token,
    {
      include:
        'trophies.league;trophies.season;trophies.trophy;trophies.team;teams.team;statistics.details.type;statistics.team;statistics.season.league;latest.fixture.participants;latest.fixture.league;latest.fixture.scores;latest.details.type;nationality;detailedPosition;metadata.type',
    },
  )
}

/**
 * Effectif d’une équipe (`/squads/teams/{teamId}`).
 * @example `GET /squads/teams/9?include=team;player.nationality;…&filters=playerstatisticSeasons:25583`
 */
export async function fetchSportMonksTeamSquad(
  token: string,
  teamId: number,
  playerStatisticSeasons?: string,
) {
  const filters =
    playerStatisticSeasons != null && String(playerStatisticSeasons).trim() !== ''
      ? `playerstatisticSeasons:${String(playerStatisticSeasons).trim()}`
      : undefined
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/squads/teams/${teamId}`,
    token,
    {
      include: SM_INCLUDE_TEAM_SQUAD,
      filters,
    },
  )
}

/**
 * Matchs du jour regroupés par ligue (`YYYY-MM-DD`, fuseau géré côté client + `timezone` sur les autres appels SM).
 * @example `GET /leagues/date/2026-04-24?include=today.tvstations…;today.participants;…;country`
 */
export async function fetchSportMonksLeaguesByDate(token: string, dateYmd: string) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/leagues/date/${dateYmd}`, token, {
    include: SM_INCLUDE_LEAGUE_BY_DATE,
  })
}

/**
 * Classement live par ligue — chemin officiel v3 : `…/live/leagues/{id}` (pluriel `leagues`).
 * @see https://docs.sportmonks.com/v3/endpoints-and-entities/endpoints/standings/get-live-standings-by-league-id
 */
export async function fetchSportMonksStandingsLiveByLeague(token: string, smLeagueId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/standings/live/leagues/${smLeagueId}`,
    token,
    { include: SM_INCLUDE_STANDINGS },
  )
}

/** Équipes d’une saison + stats (repli classement si live / standings/seasons insuffisants). */
export async function fetchSportMonksTeamsBySeason(token: string, seasonId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/teams/seasons/${seasonId}`, token, {
    include: 'statistics.details.type',
  })
}

/** Classement sur une saison (`standings/seasons/{seasonId}`). */
export async function fetchSportMonksStandingsBySeason(token: string, seasonId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/standings/seasons/${seasonId}`,
    token,
    { include: SM_INCLUDE_STANDINGS },
  )
}

export type { SmFixture, SmPlayer }
