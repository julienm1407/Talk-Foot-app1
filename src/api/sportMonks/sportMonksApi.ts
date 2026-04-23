import {
  sportMonksFetchJson,
  type SportMonksListEnvelope,
  sportMonksPaginationHasMore,
} from './client'
import type { SmFixture, SmPlayer } from './types'
import {
  SM_INCLUDE_FIXTURE_EVENTS,
  SM_INCLUDE_FIXTURE_LINEUPS,
  SM_INCLUDE_FIXTURE_LIST,
  SM_INCLUDE_FIXTURE_XG,
  SM_INCLUDE_INPLAY,
  SM_INCLUDE_LEAGUE_BY_DATE,
  SM_INCLUDE_TEAM_FORM,
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

/** Détail fixture + xG + compos (includes riches). */
export async function fetchSportMonksFixtureWithXG(token: string, fixtureId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<SmFixture>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_XG },
  )
}

/** Événements, stats, blessés, météo. */
export async function fetchSportMonksFixtureEventsWeather(token: string, fixtureId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<SmFixture>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_EVENTS },
  )
}

/** Compos officielles + staff. */
export async function fetchSportMonksFixtureLineups(token: string, fixtureId: number) {
  return sportMonksFetchJson<SportMonksListEnvelope<SmFixture>>(
    `/fixtures/${fixtureId}`,
    token,
    { include: SM_INCLUDE_FIXTURE_LINEUPS },
  )
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

/** Effectif club + stats joueurs (filtrer la saison si besoin). */
export async function fetchSportMonksTeamSquad(
  token: string,
  teamId: number,
  playerStatisticSeasons?: string,
) {
  const filters =
    playerStatisticSeasons != null
      ? `playerstatisticSeasons:${playerStatisticSeasons}`
      : undefined
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(
    `/squads/teams/${teamId}`,
    token,
    {
      include: 'team;player.nationality;player.statistics.details.type;player.position',
      filters,
    },
  )
}

/** Matchs du jour par ligue (date ISO `YYYY-MM-DD`). */
export async function fetchSportMonksLeaguesByDate(token: string, dateYmd: string) {
  return sportMonksFetchJson<SportMonksListEnvelope<unknown>>(`/leagues/date/${dateYmd}`, token, {
    include: SM_INCLUDE_LEAGUE_BY_DATE,
  })
}

export type { SmFixture, SmPlayer }
