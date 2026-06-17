import { useMemo } from 'react'
import type { LiveFixtureStatRow } from '../api/sportMonks/extractLiveFixtureStatistics'
import type { LeagueStandingRow } from '../data/leagueStandings'
import { buildMatchOddsContext, buildMatchOddsContextFromNations, findStandingForTeam } from '../odds/buildTeamOddsInput'
import {
  adjust1x2OddsForLiveInternal,
  adjustOverUnder25ForLiveInternal,
  computePrematch1x2FromContext,
  synthetic1x2FromSeed,
  prematchOverUnder25From1x2,
  impliedProbsFromDecimalOdds,
} from '../odds/internalOddsEngine'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../odds/types'
import type { Match } from '../types/match'
import type { FormResult } from '../types/standings'
import { getNationFifaRank, nationStrengthScoreFromRank } from '../data/nationFifaStrength'

function statValue(rows: LiveFixtureStatRow[], key: string, side: 'home' | 'away'): number {
  const row = rows.find((r) => r.key === key || r.key.replace(/_/g, '') === key.replace(/_/g, ''))
  if (!row) return 0
  return side === 'home' ? row.home : row.away
}

export type TalkFootOddsMeta = {
  source: 'talkfoot' | 'fallback'
  marginPct: number
  homePower?: number
  awayPower?: number
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
  } = opts

  const prematch = useMemo(() => {
    if (!match) return null

    if (homeNationIso && awayNationIso) {
      const ctx = buildMatchOddsContextFromNations(homeNationIso, awayNationIso, {
        homeFormOverride,
        awayFormOverride,
        homeAbsences,
        awayAbsences,
      })
      return computePrematch1x2FromContext(ctx)
    }

    const homeRow = findStandingForTeam(standingsRows, match.home.id)
    const awayRow = findStandingForTeam(standingsRows, match.away.id)
    const leagueSize = Math.max(standingsRows.length, 18)

    if (homeRow || awayRow) {
      const ctx = buildMatchOddsContext(homeRow, awayRow, match.home.id, match.away.id, {
        leagueSize,
        homeFormOverride,
        awayFormOverride,
        homeAbsences,
        awayAbsences,
      })
      if (ctx) return computePrematch1x2FromContext(ctx)
    }

    const fid = match.sportMonksFixtureId ?? hashMatchId(match.id)
    const odds1x2 = synthetic1x2FromSeed(fid)
    const probs = impliedProbsFromDecimalOdds(odds1x2)
    return {
      odds1x2,
      oddsOverUnder25: prematchOverUnder25From1x2(probs),
      probs1x2: probs,
      source: 'fallback' as const,
      marginPct: 0.062,
    }
  }, [
    match,
    standingsRows,
    homeFormOverride,
    awayFormOverride,
    homeAbsences,
    awayAbsences,
    homeNationIso,
    awayNationIso,
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
      source: prematch?.source ?? 'fallback',
      marginPct: prematch?.marginPct ?? 0.075,
    }),
    [prematch],
  )

  const loading = Boolean(match?.sportMonksFixtureId && standingsLoading && standingsRows.length === 0)

  return {
    odds1x2,
    oddsOverUnder25,
    oddsLoading: loading,
    oddsError: null as string | null,
    oddsMeta: meta,
    prematchProbs: prematch?.probs1x2 ?? null,
  }
}

function hashMatchId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h || 1
}

/** Indices attaque des deux camps (pour cotes buteur). */
export function teamAttackIndicesFromStandings(
  standingsRows: LeagueStandingRow[],
  homeTeamId: string,
  awayTeamId: string,
): { home: number; away: number } {
  const h = findStandingForTeam(standingsRows, homeTeamId)
  const a = findStandingForTeam(standingsRows, awayTeamId)
  return {
    home: h?.attackIndex ?? 50,
    away: a?.attackIndex ?? 50,
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

