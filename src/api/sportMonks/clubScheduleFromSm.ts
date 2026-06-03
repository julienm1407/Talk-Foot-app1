import { clubIdFromSportMonksTeamId } from '../footballApi'
import { findTeamById } from '../../data/teamLookup'
import type { Match } from '../../types/match'
import type { SmFixture } from './types'
import { smFixtureToMatch } from './transformSportMonksToMatch'

type CrestFallback = {
  id: string
  shortName: string
  colors: { primary: string; secondary: string }
  sportMonksTeamId?: number
}

function weAreHome(m: Match, clubOurId: string, smTeamId?: number): boolean {
  if (m.home.id === clubOurId) return true
  if (smTeamId != null && m.home.sportMonksTeamId === smTeamId) return true
  return false
}

function weInMatch(m: Match, clubOurId: string, smTeamId?: number): boolean {
  if (weAreHome(m, clubOurId, smTeamId)) return true
  if (m.away.id === clubOurId) return true
  if (smTeamId != null && m.away.sportMonksTeamId === smTeamId) return true
  return false
}

function resultLetterForClub(m: Match, clubOurId: string, smTeamId?: number): 'V' | 'N' | 'D' | null {
  if (m.status !== 'finished' || !m.score) return null
  if (!weInMatch(m, clubOurId, smTeamId)) return null
  const { home: gh, away: ga } = m.score
  if (weAreHome(m, clubOurId, smTeamId)) {
    if (gh > ga) return 'V'
    if (gh < ga) return 'D'
    return 'N'
  }
  if (ga > gh) return 'V'
  if (ga < gh) return 'D'
  return 'N'
}

function fixtureFromScheduleRow(row: unknown): SmFixture | null {
  if (!row || typeof row !== 'object') return null
  const o = row as Record<string, unknown>
  const fx = o.fixture
  if (fx && typeof fx === 'object' && typeof (fx as SmFixture).id === 'number') return fx as SmFixture
  if (typeof o.id === 'number' && ('starting_at' in o || 'starting_at_timestamp' in o)) return row as SmFixture
  return null
}

function crestFromTeam(t: Match['home']): CrestFallback {
  const id = clubIdFromSportMonksTeamId(t.sportMonksTeamId) ?? (findTeamById(t.id) ? t.id : t.id)
  const catalog = findTeamById(id)
  return {
    id,
    shortName: catalog?.shortName ?? t.shortName,
    colors: catalog?.colors ?? t.colors,
    sportMonksTeamId: t.sportMonksTeamId,
  }
}

export type TeamScheduleFixtureRow = {
  fixture: SmFixture
  /** Libellé brut de la journée côté SM (souvent `17` → affiché `J17`). */
  roundName?: string
}

/** Libellé encart « L1 · J17 » à partir du nom de round SportMonks. */
export function formatScheduleRoundLabel(roundName: string | undefined): string {
  if (roundName == null || !String(roundName).trim()) return '—'
  const t = String(roundName).trim()
  if (/^\d{1,2}$/.test(t)) return `J${t}`
  return t
}

/**
 * Aplatit la réponse `schedules/teams/{id}` : `data[]` = stages, chaque stage a `rounds[].fixtures[]`.
 * Conserve la journée (`round.name`) pour le prochain match.
 */
export function teamScheduleFixtureRows(envelope: { data?: unknown }): TeamScheduleFixtureRow[] {
  const data = envelope.data
  if (!Array.isArray(data)) return []
  const flat: TeamScheduleFixtureRow[] = []

  for (const row of data) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    if (Array.isArray(r.rounds)) {
      for (const rnd of r.rounds) {
        if (!rnd || typeof rnd !== 'object') continue
        const roundName =
          typeof (rnd as { name?: unknown }).name === 'string'
            ? String((rnd as { name: string }).name).trim() || undefined
            : undefined
        const fixtures = (rnd as { fixtures?: unknown }).fixtures
        if (!Array.isArray(fixtures)) continue
        for (const fx of fixtures) {
          if (fx && typeof fx === 'object' && typeof (fx as SmFixture).id === 'number') {
            flat.push({ fixture: fx as SmFixture, roundName })
          }
        }
      }
      continue
    }
    const fx = fixtureFromScheduleRow(row)
    if (fx) flat.push({ fixture: fx, roundName: undefined })
  }

  const byId = new Map<number, TeamScheduleFixtureRow>()
  for (const row of flat) byId.set(row.fixture.id, row)
  return Array.from(byId.values())
}

export function smFixturesFromTeamScheduleEnvelope(envelope: { data?: unknown }): SmFixture[] {
  return teamScheduleFixtureRows(envelope).map((r) => r.fixture)
}

/** Même structure que `schedules/teams/{id}` — utilisé pour `schedules/seasons/{seasonId}`. */
export function smFixturesFromSeasonScheduleEnvelope(envelope: { data?: unknown }): SmFixture[] {
  return smFixturesFromTeamScheduleEnvelope(envelope)
}

/** Fixtures listées dans `data.upcoming` (réponse `GET /teams/{id}` + include upcoming). */
export function smFixturesFromTeamUpcomingEnvelope(envelope: { data?: unknown }): SmFixture[] {
  const data = envelope.data
  if (!data || typeof data !== 'object') return []
  const up = (data as { upcoming?: unknown }).upcoming
  if (Array.isArray(up)) {
    return up.filter(
      (x): x is SmFixture =>
        Boolean(x && typeof x === 'object' && typeof (x as SmFixture).id === 'number'),
    )
  }
  if (up && typeof up === 'object' && typeof (up as SmFixture).id === 'number') {
    return [up as SmFixture]
  }
  return []
}

/** Fixtures dans `data.latest` (réponse team + include latest). */
export function smFixturesFromTeamLatestEnvelope(envelope: { data?: unknown }): SmFixture[] {
  const data = envelope.data
  if (!data || typeof data !== 'object') return []
  const lat = (data as { latest?: unknown }).latest
  if (Array.isArray(lat)) {
    return lat.filter(
      (x): x is SmFixture =>
        Boolean(x && typeof x === 'object' && typeof (x as SmFixture).id === 'number'),
    )
  }
  if (lat && typeof lat === 'object' && typeof (lat as SmFixture).id === 'number') {
    return [lat as SmFixture]
  }
  return []
}

export type ClubLastMatchFromApi = {
  opponent: string
  kickoffIso: string
  league: string
  venue: 'dom' | 'ext'
  /** Score brut domicile–extérieur (terrain). */
  scoreLine: string
  homeName: string
  awayName: string
  homeLogoUrl?: string
  awayLogoUrl?: string
  homeCrest: CrestFallback
  awayCrest: CrestFallback
}

/** Dernier match terminé du club via `latest` (plus récent). */
export function findLastFinishedClubMatchFromTeamLatest(
  envelope: { data?: unknown },
  clubOurId: string,
  opts?: { sportMonksTeamId?: number },
): ClubLastMatchFromApi | null {
  const smTeamId = opts?.sportMonksTeamId
  const rows: Array<{ match: Match; fixture: SmFixture }> = []
  for (const fx of smFixturesFromTeamLatestEnvelope(envelope)) {
    try {
      rows.push({ match: smFixtureToMatch(fx), fixture: fx })
    } catch {
      /* fixture incomplète */
    }
  }
  const finished = rows
    .filter((x) => x.match.status === 'finished' && x.match.score != null)
    .filter((x) => weInMatch(x.match, clubOurId, smTeamId))
  finished.sort((a, b) => +new Date(b.match.kickoffAt) - +new Date(a.match.kickoffAt))
  const first = finished[0]
  const m = first?.match
  if (!m?.score || !first) return null
  const atHome = weAreHome(m, clubOurId, smTeamId)
  const home = m.home
  const away = m.away
  return {
    opponent: atHome ? m.away.name : m.home.name,
    kickoffIso: m.kickoffAt,
    league: m.competition.shortName,
    venue: atHome ? 'dom' : 'ext',
    scoreLine: `${m.score.home}-${m.score.away}`,
    homeName: home.name,
    awayName: away.name,
    homeLogoUrl: home.logoUrl,
    awayLogoUrl: away.logoUrl,
    homeCrest: crestFromTeam(home),
    awayCrest: crestFromTeam(away),
  }
}

/** Prochain match à venir via `upcoming` (prioritaire sur le planning si renseigné). */
export function findNextClubMatchFromTeamUpcoming(
  envelope: { data?: unknown },
  clubOurId: string,
  opts?: { sportMonksTeamId?: number },
): {
  opponent: string
  kickoffIso: string
  league: string
  venue: 'dom' | 'ext'
  matchday: string
  homeName: string
  awayName: string
  homeLogoUrl?: string
  awayLogoUrl?: string
  homeCrest: CrestFallback
  awayCrest: CrestFallback
} | null {
  const smTeamId = opts?.sportMonksTeamId
  const rows: { match: Match; roundName?: string; fixture: SmFixture }[] = []
  for (const fx of smFixturesFromTeamUpcomingEnvelope(envelope)) {
    try {
      const roundName =
        fx.round && typeof fx.round === 'object' && typeof (fx.round as { name?: string }).name === 'string'
          ? String((fx.round as { name: string }).name).trim() || undefined
          : undefined
      rows.push({ match: smFixtureToMatch(fx), roundName, fixture: fx })
    } catch {
      /* fixture incomplète */
    }
  }
  const ours = rows
    .filter((x) => x.match.status === 'upcoming' && weInMatch(x.match, clubOurId, smTeamId))
    .sort((a, b) => +new Date(a.match.kickoffAt) - +new Date(b.match.kickoffAt))
  const first = ours[0]
  if (!first) return null
  const m = first.match
  const atHome = weAreHome(m, clubOurId, smTeamId)
  const home = m.home
  const away = m.away
  return {
    opponent: atHome ? m.away.name : m.home.name,
    kickoffIso: m.kickoffAt,
    league: m.competition.shortName,
    venue: atHome ? 'dom' : 'ext',
    matchday: formatScheduleRoundLabel(first.roundName),
    homeName: home.name,
    awayName: away.name,
    homeLogoUrl: home.logoUrl,
    awayLogoUrl: away.logoUrl,
    homeCrest: crestFromTeam(home),
    awayCrest: crestFromTeam(away),
  }
}

/** Prochain match à venir d’un club (id interne ex. `psg`) à partir de `/schedules/teams/{id}`. */
export function findNextClubMatchFromSchedule(
  envelope: { data?: unknown },
  clubOurId: string,
  opts?: { sportMonksTeamId?: number },
): {
  opponent: string
  kickoffIso: string
  league: string
  venue: 'dom' | 'ext'
  matchday: string
  homeName: string
  awayName: string
  homeLogoUrl?: string
  awayLogoUrl?: string
  homeCrest: CrestFallback
  awayCrest: CrestFallback
} | null {
  const smTeamId = opts?.sportMonksTeamId
  const rows: { match: Match; roundName?: string; fixture: SmFixture }[] = []
  for (const { fixture: fx, roundName } of teamScheduleFixtureRows(envelope)) {
    try {
      rows.push({ match: smFixtureToMatch(fx), roundName, fixture: fx })
    } catch {
      /* fixture incomplète */
    }
  }
  const ours = rows
    .filter((x) => x.match.status === 'upcoming' && weInMatch(x.match, clubOurId, smTeamId))
    .sort((a, b) => +new Date(a.match.kickoffAt) - +new Date(b.match.kickoffAt))
  const first = ours[0]
  if (!first) return null
  const m = first.match
  const atHome = weAreHome(m, clubOurId, smTeamId)
  const home = m.home
  const away = m.away
  return {
    opponent: atHome ? m.away.name : m.home.name,
    kickoffIso: m.kickoffAt,
    league: m.competition.shortName,
    venue: atHome ? 'dom' : 'ext',
    matchday: formatScheduleRoundLabel(first.roundName),
    homeName: home.name,
    awayName: away.name,
    homeLogoUrl: home.logoUrl,
    awayLogoUrl: away.logoUrl,
    homeCrest: crestFromTeam(home),
    awayCrest: crestFromTeam(away),
  }
}

/**
 * Cinq derniers matchs terminés du club, du plus ancien au plus récent (gauche → droite dans l’UI),
 * à partir de `/schedules/teams/{id}`.
 */
/**
 * Cinq derniers matchs terminés via `GET /teams/{id}` + include `latest.*` (même logique que le planning club).
 */
export function lastFiveFormFromTeamLatestEnvelope(
  envelope: { data?: unknown },
  clubOurId: string,
  opts?: { sportMonksTeamId?: number },
): Array<'V' | 'N' | 'D'> | null {
  const smTeamId = opts?.sportMonksTeamId
  const matches: Match[] = []
  for (const fx of smFixturesFromTeamLatestEnvelope(envelope)) {
    try {
      matches.push(smFixtureToMatch(fx))
    } catch {
      /* fixture incomplète */
    }
  }
  const finished = matches
    .filter((m) => m.status === 'finished' && m.score != null)
    .filter((m) => weInMatch(m, clubOurId, smTeamId))
  finished.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  const last5 = finished.slice(-5)
  const strip: Array<'V' | 'N' | 'D'> = []
  for (const m of last5) {
    const r = resultLetterForClub(m, clubOurId, smTeamId)
    if (r) strip.push(r)
  }
  return strip.length ? strip : null
}

export function lastFiveFormFromTeamSchedule(
  envelope: { data?: unknown },
  clubOurId: string,
  opts?: { sportMonksTeamId?: number },
): Array<'V' | 'N' | 'D'> | null {
  const smTeamId = opts?.sportMonksTeamId
  const smFixtures = smFixturesFromTeamScheduleEnvelope(envelope)
  const matches: Match[] = []
  for (const fx of smFixtures) {
    try {
      matches.push(smFixtureToMatch(fx))
    } catch {
      /* fixture incomplète */
    }
  }
  const finished = matches
    .filter((m) => m.status === 'finished' && m.score != null)
    .filter((m) => weInMatch(m, clubOurId, smTeamId))
  finished.sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
  const last5 = finished.slice(-5)
  const strip: Array<'V' | 'N' | 'D'> = []
  for (const m of last5) {
    const r = resultLetterForClub(m, clubOurId, smTeamId)
    if (r) strip.push(r)
  }
  return strip.length ? strip : null
}
