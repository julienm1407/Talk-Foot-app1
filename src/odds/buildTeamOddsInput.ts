import type { LeagueStandingRow } from '../data/leagueStandings'
import { BIG_FIVE_LEAGUE_IDS, getStandingsForLeague } from '../data/leagueStandings'
import type { FormResult } from '../types/standings'
import { nationPowerFactorsFromIso } from '../data/nationFifaStrength'
import { apiNameToOurId, clubIdFromSportMonksTeamId } from '../api/footballApi'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import type { Match } from '../types/match'
import { computePrematch1x2FromContext } from './internalOddsEngine'
import type { InternalOddsResult } from './types'
import type { MatchOddsContext, StandingSlice, TeamOddsContext, TeamPowerFactors } from './types'
export type StandingTeamLookup = {
  teamId: string
  sportMonksTeamId?: number
  name?: string
  shortName?: string
}

/** Grands favoris habituels (coupes / classement SM manquant). */
const ELITE_CLUB_IDS = new Set([
  'psg', 'mci', 'liv', 'ars', 'che', 'tot', 'mun', 'new', 'avl',
  'rma', 'fcb', 'atleti', 'bayern', 'bvb', 'leverkusen', 'leipzig',
  'inter', 'juve', 'milan', 'napoli', 'atalanta', 'roma', 'lazio',
  'lille', 'monaco', 'lyon', 'lens', 'om', 'rennes',
])

/** D2 / petits clubs coupe — prior plus bas qu’un milieu de tableau générique. */
const LOWER_TIER_CLUB_IDS = new Set([
  'elversberg', 'paderborn', 'parisfc', 'lemans', 'troyes', 'stetienne',
  'bochum', 'hamburg', 'schalke', 'heidenheim', 'koln',
])

type StrengthBand = 'elite' | 'strong' | 'mid' | 'lower'

function strengthBandForClub(teamId: string): StrengthBand {
  if (ELITE_CLUB_IDS.has(teamId)) return 'elite'
  if (LOWER_TIER_CLUB_IDS.has(teamId)) return 'lower'
  const club = ALL_CLUBS_BY_ID[teamId]
  if (club?.leagueId === 'ligue-2') return 'lower'
  if (club && (BIG_FIVE_LEAGUE_IDS as readonly string[]).includes(club.leagueId)) return 'strong'
  return 'mid'
}

function catalogStrengthSlice(teamId: string): StandingSlice {
  const band = strengthBandForClub(teamId)
  const presets: Record<
    StrengthBand,
    { rank: number; attack: number; defense: number; momentum: number; form: FormResult[] }
  > = {
    elite: {
      rank: 2,
      attack: 90,
      defense: 66,
      momentum: 78,
      form: ['W', 'W', 'D', 'W', 'W'],
    },
    strong: {
      rank: 7,
      attack: 70,
      defense: 58,
      momentum: 58,
      form: ['W', 'D', 'W', 'L', 'W'],
    },
    mid: {
      rank: 11,
      attack: 54,
      defense: 52,
      momentum: 48,
      form: ['D', 'D', 'W', 'L', 'D'],
    },
    lower: {
      rank: 17,
      attack: 40,
      defense: 42,
      momentum: 38,
      form: ['L', 'D', 'L', 'W', 'L'],
    },
  }
  const preset = presets[band]
  return {
    teamId,
    rank: preset.rank,
    played: 12,
    gf: 14,
    ga: 14,
    form: preset.form,
    attackIndex: preset.attack,
    defenseIndex: preset.defense,
    momentumIndex: preset.momentum,
  }
}

/**
 * Fusionne le classement SM du match + classements statiques des championnats des deux clubs.
 * Indispensable en coupe (DFB-Pokal, etc.) où le match n’est pas en Big 5.
 */
export function buildOddsStandingsPool(
  match: Match,
  sportMonksRows: LeagueStandingRow[],
): LeagueStandingRow[] {
  const byKey = new Map<string, LeagueStandingRow>()
  const add = (row: LeagueStandingRow) => {
    const prev = byKey.get(row.teamId)
    if (!prev || row.rank < prev.rank) byKey.set(row.teamId, row)
  }

  for (const row of sportMonksRows) add(row)

  const leagueIds = new Set<string>()
  if ((BIG_FIVE_LEAGUE_IDS as readonly string[]).includes(match.competition.id)) {
    leagueIds.add(match.competition.id)
  }
  for (const teamId of [match.home.id, match.away.id]) {
    const club = ALL_CLUBS_BY_ID[teamId]
    if (club?.leagueId) leagueIds.add(club.leagueId)
  }

  for (const leagueId of leagueIds) {
    for (const row of getStandingsForLeague(leagueId)) add(row)
  }

  return [...byKey.values()]
}
export function formScoreFromResults(form: FormResult[]): number {
  if (!form.length) return 50
  let pts = 0
  for (const r of form) {
    if (r === 'W') pts += 100
    else if (r === 'D') pts += 50
    else pts += 0
  }
  return pts / form.length
}

export function rankingScoreFromRank(rank: number, leagueSize: number): number {
  const n = Math.max(2, leagueSize)
  const r = Math.max(1, Math.min(rank, n))
  return Math.round(100 * (1 - (r - 1) / (n - 1)))
}

export function standingRowToSlice(row: LeagueStandingRow): StandingSlice {
  return {
    teamId: row.teamId,
    rank: row.rank,
    played: row.played,
    gf: row.gf,
    ga: row.ga,
    form: row.form,
    attackIndex: row.attackIndex,
    defenseIndex: row.defenseIndex,
    momentumIndex: row.momentumIndex,
  }
}

export function buildTeamPowerFactors(
  slice: StandingSlice,
  opts: { isHomeInMatch: boolean; leagueSize: number; formOverride?: FormResult[] },
): TeamPowerFactors {
  const form = opts.formOverride?.length ? opts.formOverride : slice.form
  const formScore = Math.round(
    formScoreFromResults(form) * 0.55 + slice.momentumIndex * 0.45,
  )
  return {
    form: Math.max(0, Math.min(100, formScore)),
    attack: slice.attackIndex,
    defense: slice.defenseIndex,
    // Léger bonus domicile (~bookmaker), pas 100 vs 0 qui écrasait le classement.
    home: opts.isHomeInMatch ? 72 : 48,
    ranking: rankingScoreFromRank(slice.rank, opts.leagueSize),
  }
}

export function absenceFactorFromCount(keyAbsences: number): number {
  if (keyAbsences <= 0) return 1
  return Math.max(0.72, 1 - keyAbsences * 0.04)
}

export function buildTeamOddsContext(
  slice: StandingSlice,
  opts: {
    isHomeInMatch: boolean
    leagueSize: number
    formOverride?: FormResult[]
    keyAbsences?: number
  },
): TeamOddsContext {
  const factors = buildTeamPowerFactors(slice, opts)
  const absenceFactor = absenceFactorFromCount(opts.keyAbsences ?? 0)
  return {
    teamId: slice.teamId,
    factors,
    absenceFactor,
  }
}

export function findStandingForTeam(
  rows: LeagueStandingRow[],
  lookup: string | StandingTeamLookup,
): LeagueStandingRow | null {
  const teamId = typeof lookup === 'string' ? lookup : lookup.teamId
  const sportMonksTeamId = typeof lookup === 'string' ? undefined : lookup.sportMonksTeamId
  const nameHints =
    typeof lookup === 'string'
      ? []
      : [lookup.name, lookup.shortName].filter((v): v is string => Boolean(v?.trim()))

  const exact = rows.find((r) => r.teamId === teamId)
  if (exact) return exact

  const catalogSmId = SPORTMONKS_TEAM_ID_BY_CLUB_ID[teamId]
  const smIds = new Set<number>()
  if (sportMonksTeamId != null) smIds.add(sportMonksTeamId)
  if (catalogSmId != null) smIds.add(catalogSmId)

  for (const smId of smIds) {
    const byParticipant = rows.find((r) => r.sportMonksParticipantId === smId)
    if (byParticipant) return byParticipant
    const bySmTeamId = rows.find((r) => r.teamId === `sm-${smId}`)
    if (bySmTeamId) return bySmTeamId
    const canon = clubIdFromSportMonksTeamId(smId)
    if (canon) {
      const byCanon = rows.find((r) => r.teamId === canon)
      if (byCanon) return byCanon
    }
  }

  for (const r of rows) {
    if (!r.teamId.startsWith('sm-')) continue
    const pid = Number(r.teamId.slice(3))
    if (!Number.isFinite(pid)) continue
    if (clubIdFromSportMonksTeamId(pid) === teamId) return r
  }

  for (const r of rows) {
    const label = r.displayName?.trim()
    if (!label) continue
    if (apiNameToOurId(label) === teamId) return r
  }

  for (const hint of nameHints) {
    const inferred = apiNameToOurId(hint)
    const byInferred = rows.find((r) => r.teamId === inferred)
    if (byInferred) return byInferred
    const byLabel = rows.find((r) => r.displayName && apiNameToOurId(r.displayName) === inferred)
    if (byLabel) return byLabel
  }

  return null
}

function fallbackStandingSlice(
  teamId: string,
  _leagueSize: number,
  sportMonksTeamId?: number,
  rows: LeagueStandingRow[] = [],
): StandingSlice {
  const resolved = findStandingForTeam(rows, { teamId, sportMonksTeamId })
  if (resolved) return standingRowToSlice(resolved)
  return catalogStrengthSlice(teamId)
}

/** Indice attaque catalogue (fallback buteurs / cotes sans classement SM). */
export function catalogAttackIndexForTeam(teamId: string): number {
  return catalogStrengthSlice(teamId).attackIndex
}

/** Point d’entrée unique : cotes prematch club à partir du match + classement. */
export function computePrematch1x2ForMatch(
  match: Match,
  sportMonksRows: LeagueStandingRow[],
  opts?: {
    homeFormOverride?: FormResult[]
    awayFormOverride?: FormResult[]
    homeAbsences?: number
    awayAbsences?: number
  },
): InternalOddsResult {
  const standingsPool = buildOddsStandingsPool(match, sportMonksRows)
  const homeRow = findStandingForTeam(standingsPool, {
    teamId: match.home.id,
    sportMonksTeamId: match.home.sportMonksTeamId,
    name: match.home.name,
    shortName: match.home.shortName,
  })
  const awayRow = findStandingForTeam(standingsPool, {
    teamId: match.away.id,
    sportMonksTeamId: match.away.sportMonksTeamId,
    name: match.away.name,
    shortName: match.away.shortName,
  })
  const leagueSize = Math.max(standingsPool.length, 18)
  const ctx = buildMatchOddsContext(homeRow, awayRow, match.home.id, match.away.id, {
    leagueSize,
    homeFormOverride: opts?.homeFormOverride,
    awayFormOverride: opts?.awayFormOverride,
    homeAbsences: opts?.homeAbsences,
    awayAbsences: opts?.awayAbsences,
    homeSportMonksTeamId: match.home.sportMonksTeamId,
    awaySportMonksTeamId: match.away.sportMonksTeamId,
    standingsRows: standingsPool,
  })
  if (!ctx) {
    throw new Error(`computePrematch1x2ForMatch: contexte impossible pour ${match.id}`)
  }
  return computePrematch1x2FromContext(ctx)
}

export function buildMatchOddsContext(
  homeRow: LeagueStandingRow | null,
  awayRow: LeagueStandingRow | null,
  homeTeamId: string,
  awayTeamId: string,
  opts?: {
    leagueSize?: number
    homeFormOverride?: FormResult[]
    awayFormOverride?: FormResult[]
    homeAbsences?: number
    awayAbsences?: number
    homeSportMonksTeamId?: number
    awaySportMonksTeamId?: number
    standingsRows?: LeagueStandingRow[]
  },
): MatchOddsContext | null {
  const leagueSize = opts?.leagueSize ?? Math.max(homeRow?.rank ?? 0, awayRow?.rank ?? 0, 18)
  const allRows = opts?.standingsRows ?? []

  const hSlice = homeRow
    ? standingRowToSlice(homeRow)
    : fallbackStandingSlice(homeTeamId, leagueSize, opts?.homeSportMonksTeamId, allRows)
  const aSlice = awayRow
    ? standingRowToSlice(awayRow)
    : fallbackStandingSlice(awayTeamId, leagueSize, opts?.awaySportMonksTeamId, allRows)

  return {
    leagueSize,
    maxPowerDiff: 14,
    home: buildTeamOddsContext(hSlice, {
      isHomeInMatch: true,
      leagueSize,
      formOverride: opts?.homeFormOverride,
      keyAbsences: opts?.homeAbsences,
    }),
    away: buildTeamOddsContext(aSlice, {
      isHomeInMatch: false,
      leagueSize,
      formOverride: opts?.awayFormOverride,
      keyAbsences: opts?.awayAbsences,
    }),
  }
}

/** Cotes sélections — classement FIFA + forme récente (CDM / matchs internationaux). */
export function buildMatchOddsContextFromNations(
  homeNationIso: string,
  awayNationIso: string,
  opts?: {
    homeFormOverride?: FormResult[]
    awayFormOverride?: FormResult[]
    homeAbsences?: number
    awayAbsences?: number
  },
): MatchOddsContext {
  const homeFactors = nationPowerFactorsFromIso(homeNationIso, true, opts?.homeFormOverride)
  const awayFactors = nationPowerFactorsFromIso(awayNationIso, false, opts?.awayFormOverride)
  return {
    leagueSize: 32,
    maxPowerDiff: 22,
    home: {
      teamId: homeNationIso.toUpperCase(),
      factors: homeFactors,
      absenceFactor: absenceFactorFromCount(opts?.homeAbsences ?? 0),
    },
    away: {
      teamId: awayNationIso.toUpperCase(),
      factors: awayFactors,
      absenceFactor: absenceFactorFromCount(opts?.awayAbsences ?? 0),
    },
  }
}
