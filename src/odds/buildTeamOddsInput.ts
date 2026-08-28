import type { LeagueStandingRow } from '../data/leagueStandings'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
import type { FormResult } from '../types/standings'
import { nationPowerFactorsFromIso } from '../data/nationFifaStrength'
import type { MatchOddsContext, StandingSlice, TeamOddsContext, TeamPowerFactors } from './types'

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
  teamId: string,
  sportMonksTeamId?: number,
): LeagueStandingRow | null {
  const direct = rows.find((r) => r.teamId === teamId)
  if (direct) return direct

  const smId = sportMonksTeamId ?? SPORTMONKS_TEAM_ID_BY_CLUB_ID[teamId]
  if (smId != null) {
    const bySm = rows.find((r) => r.teamId === `sm-${smId}`)
    if (bySm) return bySm
  }

  if (teamId.startsWith('sm-')) {
    const pid = Number(teamId.slice(3))
    if (Number.isFinite(pid)) {
      for (const [clubId, mappedSmId] of Object.entries(SPORTMONKS_TEAM_ID_BY_CLUB_ID)) {
        if (mappedSmId === pid) {
          const byClub = rows.find((r) => r.teamId === clubId)
          if (byClub) return byClub
        }
      }
    }
  }

  return null
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
  },
): MatchOddsContext | null {
  const leagueSize = opts?.leagueSize ?? Math.max(homeRow?.rank ?? 0, awayRow?.rank ?? 0, 18)

  const fallbackSlice = (teamId: string, rank: number): StandingSlice => ({
    teamId,
    rank,
    played: 10,
    gf: 12,
    ga: 12,
    form: ['D', 'D', 'D', 'D', 'D'],
    attackIndex: 50,
    defenseIndex: 50,
    momentumIndex: 50,
  })

  const hSlice = homeRow ? standingRowToSlice(homeRow) : fallbackSlice(homeTeamId, 10)
  const aSlice = awayRow ? standingRowToSlice(awayRow) : fallbackSlice(awayTeamId, 10)

  return {
    leagueSize,
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
