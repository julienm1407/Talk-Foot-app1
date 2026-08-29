import { useMemo } from 'react'
import type { LiveFixtureStatRow } from '../api/sportMonks/extractLiveFixtureStatistics'
import type { BigFiveLeagueId, LeagueStandingRow } from '../data/leagueStandings'
import { standingsByLeague } from '../data/leagueStandings'
import {
  buildMatchOddsContextFromNations,
  catalogAttackIndexForTeam,
  computePrematch1x2ForMatch,
  findStandingForTeam,
} from '../odds/buildTeamOddsInput'
import {
  adjust1x2OddsForLiveInternal,
  adjustOverUnder25ForLiveInternal,
  computePrematch1x2FromContext,
  prematchOverUnder25From1x2,
  impliedProbsFromDecimalOdds,
  DEFAULT_BOOK_MARGIN,
} from '../odds/internalOddsEngine'
import {
  align1x2OddsToInternalFavorite,
  isCredibleExternal1x2Odds,
} from '../odds/prematchOddsValidation'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../odds/types'
import type { Match } from '../types/match'
import type { FormResult } from '../types/standings'
import { getNationFifaRank, nationStrengthScoreFromRank } from '../data/nationFifaStrength'

const BIG_FIVE_IDS = new Set<string>(['ligue-1', 'epl', 'laliga', 'serie-a', 'bund'])

function effectiveStandingsRows(match: Match | null, standingsRows: LeagueStandingRow[]): LeagueStandingRow[] {
  if (standingsRows.length > 0) return standingsRows
  const leagueId = match?.competition.id
  if (!leagueId || !BIG_FIVE_IDS.has(leagueId)) return standingsRows
  return standingsByLeague[leagueId as BigFiveLeagueId] ?? []
}

function statValue(rows: LiveFixtureStatRow[], key: string, side: 'home' | 'away'): number {
  const row = rows.find((r) => r.key === key || r.key.replace(/_/g, '') === key.replace(/_/g, ''))
  if (!row) return 0
  return side === 'home' ? row.home : row.away
}

export type TalkFootOddsMeta = {
  source: 'talkfoot' | 'bookmaker' | 'fallback'
  marginPct: number
  homePower?: number
  awayPower?: number
}

export type ExternalPrematchOdds = {
  odds1x2: SmBookOdds1x2
  oddsOverUnder25?: SmBookOddsOverUnder25 | null
}

export function useTalkFootInternalOdds(opts: {
  match: Match | null
  standingsRows: LeagueStandingRow[]
  standingsLoading?: boolean
  homeFormOverride?: FormResult[]
  awayFormOverride?: FormResult[]
  homeAbsences?: number
  awayAbsences?: number
  liveStatRows?: LiveFixtureStatRow[]
  liveScore?: { home: number; away: number } | null
  liveMinute?: number | null
  homeNationIso?: string | null
  awayNationIso?: string | null
  /** Cotes bookmaker SportMonks — prioritaires si crédibles vs modèle interne. */
  externalPrematch?: ExternalPrematchOdds | null
  /** En cours de chargement des cotes bookmaker (évite flash fallback). */
  bookOddsLoading?: boolean
}) {
  const {
    match,
    standingsRows,
    standingsLoading = false,
    homeFormOverride,
    awayFormOverride,
    homeAbsences = 0,
    awayAbsences = 0,
    liveStatRows = [],
    liveScore,
    liveMinute,
    homeNationIso,
    awayNationIso,
    externalPrematch,
    bookOddsLoading: _bookOddsLoading = false,
  } = opts
  void _bookOddsLoading

  const prematch = useMemo(() => {
    if (!match) return null

    const rows = effectiveStandingsRows(match, standingsRows)

    let internal: ReturnType<typeof computePrematch1x2FromContext> | null = null

    if (homeNationIso && awayNationIso) {
      const ctx = buildMatchOddsContextFromNations(homeNationIso, awayNationIso, {
        homeFormOverride,
        awayFormOverride,
        homeAbsences,
        awayAbsences,
      })
      internal = computePrematch1x2FromContext(ctx)
    } else {
      internal = computePrematch1x2ForMatch(match, rows, {
        homeFormOverride,
        awayFormOverride,
        homeAbsences,
        awayAbsences,
      })
    }

    if (externalPrematch?.odds1x2 && internal) {
      const aligned = align1x2OddsToInternalFavorite(externalPrematch.odds1x2, internal.odds1x2)
      if (isCredibleExternal1x2Odds(aligned, internal.odds1x2)) {
        const probs = impliedProbsFromDecimalOdds(aligned)
        return {
          odds1x2: aligned,
          oddsOverUnder25:
            externalPrematch.oddsOverUnder25 ?? prematchOverUnder25From1x2(probs),
          probs1x2: probs,
          source: 'bookmaker' as const,
          marginPct: DEFAULT_BOOK_MARGIN,
        }
      }
    }

    return internal
  }, [
    match,
    standingsRows,
    homeFormOverride,
    awayFormOverride,
    homeAbsences,
    awayAbsences,
    homeNationIso,
    awayNationIso,
    externalPrematch,
  ])

  const isLive = match?.status === 'live'
  const scoreHome = liveScore?.home ?? match?.score?.home ?? 0
  const scoreAway = liveScore?.away ?? match?.score?.away ?? 0
  const minute = Math.max(0, liveMinute ?? match?.minute ?? 0)

  const odds1x2 = useMemo((): SmBookOdds1x2 | null => {
    if (!prematch || !match) return null
    if (!isLive) return prematch.odds1x2
    return adjust1x2OddsForLiveInternal(prematch.odds1x2, {
      minute,
      homeGoals: scoreHome,
      awayGoals: scoreAway,
      homeRedCards: statValue(liveStatRows, 'redcards', 'home') || statValue(liveStatRows, 'red_cards', 'home'),
      awayRedCards: statValue(liveStatRows, 'redcards', 'away') || statValue(liveStatRows, 'red_cards', 'away'),
      homeShotsOnTarget:
        statValue(liveStatRows, 'shots_on_target', 'home') || statValue(liveStatRows, 'shotsontarget', 'home'),
      awayShotsOnTarget:
        statValue(liveStatRows, 'shots_on_target', 'away') || statValue(liveStatRows, 'shotsontarget', 'away'),
    })
  }, [prematch, match, isLive, minute, scoreHome, scoreAway, liveStatRows])

  const oddsOverUnder25 = useMemo((): SmBookOddsOverUnder25 | null => {
    if (!prematch || !match) return null
    if (!isLive) return prematch.oddsOverUnder25
    return adjustOverUnder25ForLiveInternal(
      prematch.oddsOverUnder25,
      scoreHome + scoreAway,
      minute,
    )
  }, [prematch, match, isLive, scoreHome, scoreAway, minute])

  const meta: TalkFootOddsMeta = useMemo(
    () => ({
      source: prematch?.source ?? 'talkfoot',
      marginPct: prematch?.marginPct ?? 0.075,
    }),
    [prematch],
  )

  const loading = Boolean(
    match?.sportMonksFixtureId &&
      standingsLoading &&
      standingsRows.length === 0 &&
      effectiveStandingsRows(match, standingsRows).length === 0,
  )

  return {
    odds1x2,
    oddsOverUnder25,
    oddsLoading: loading,
    oddsError: null as string | null,
    oddsMeta: meta,
    prematchProbs: prematch?.probs1x2 ?? null,
  }
}

/** Indices attaque des deux camps (pour cotes buteur). */
export function teamAttackIndicesFromStandings(
  standingsRows: LeagueStandingRow[],
  homeTeamId: string,
  awayTeamId: string,
  opts?: {
    homeSportMonksTeamId?: number
    awaySportMonksTeamId?: number
    homeName?: string
    awayName?: string
    homeShortName?: string
    awayShortName?: string
  },
): { home: number; away: number } {
  const h = findStandingForTeam(standingsRows, {
    teamId: homeTeamId,
    sportMonksTeamId: opts?.homeSportMonksTeamId,
    name: opts?.homeName,
    shortName: opts?.homeShortName,
  })
  const a = findStandingForTeam(standingsRows, {
    teamId: awayTeamId,
    sportMonksTeamId: opts?.awaySportMonksTeamId,
    name: opts?.awayName,
    shortName: opts?.awayShortName,
  })
  return {
    home: h?.attackIndex ?? catalogAttackIndexForTeam(homeTeamId),
    away: a?.attackIndex ?? catalogAttackIndexForTeam(awayTeamId),
  }
}

export function teamAttackIndicesFromNations(
  homeNationIso: string,
  awayNationIso: string,
): { home: number; away: number } {
  return {
    home: nationStrengthScoreFromRank(getNationFifaRank(homeNationIso)),
    away: nationStrengthScoreFromRank(getNationFifaRank(awayNationIso)),
  }
}
