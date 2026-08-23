import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMatchOddsContext, buildMatchOddsContextFromNations } from './buildTeamOddsInput'
import type { LeagueStandingRow } from '../data/leagueStandings'
import {
  adjust1x2OddsForLiveInternal,
  calibrate1x2OddsForMarket,
  computePrematch1x2FromContext,
  teamPowerScore,
} from './internalOddsEngine'

function standing(
  partial: Pick<LeagueStandingRow, 'teamId' | 'rank' | 'attackIndex' | 'defenseIndex' | 'momentumIndex'> & {
    form?: LeagueStandingRow['form']
  },
): LeagueStandingRow {
  return {
    teamId: partial.teamId,
    name: partial.teamId,
    shortName: partial.teamId.slice(0, 3).toUpperCase(),
    rank: partial.rank,
    played: 22,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    form: partial.form ?? ['W', 'D', 'W', 'L', 'D'],
    attackIndex: partial.attackIndex,
    defenseIndex: partial.defenseIndex,
    momentumIndex: partial.momentumIndex,
  }
}

test('Suisse vs Qatar — favori clair (~1,15–1,35 / nul ~6–8 / outsider ~10–18)', () => {
  const ctx = buildMatchOddsContextFromNations('CHE', 'QAT')
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  assert.ok(odds1x2.home >= 1.12 && odds1x2.home <= 1.38, `home=${odds1x2.home}`)
  assert.ok(odds1x2.draw >= 5.5 && odds1x2.draw <= 8.5, `draw=${odds1x2.draw}`)
  assert.ok(odds1x2.away >= 9 && odds1x2.away <= 20, `away=${odds1x2.away}`)
})

test('Angers (domicile) vs Lille — Lille reste largement favori', () => {
  const ctx = buildMatchOddsContext(
    standing({
      teamId: 'angers',
      rank: 14,
      attackIndex: 44,
      defenseIndex: 42,
      momentumIndex: 40,
      form: ['L', 'D', 'W', 'L', 'D'],
    }),
    standing({
      teamId: 'lille',
      rank: 4,
      attackIndex: 74,
      defenseIndex: 76,
      momentumIndex: 72,
      form: ['W', 'W', 'D', 'W', 'W'],
    }),
    'angers',
    'lille',
    { leagueSize: 18 },
  )
  assert.ok(ctx)
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  assert.ok(odds1x2.away < odds1x2.home, `Lille doit être favori (home=${odds1x2.home} away=${odds1x2.away})`)
  assert.ok(odds1x2.away <= 2.35, `away Lille trop haut: ${odds1x2.away}`)
  assert.ok(odds1x2.home >= 2.7, `home Angers trop bas: ${odds1x2.home}`)
})

test('gros favori à l’extérieur reste favori (City @ Monaco-style)', () => {
  const ctx = buildMatchOddsContext(
    standing({
      teamId: 'monaco',
      rank: 6,
      attackIndex: 68,
      defenseIndex: 62,
      momentumIndex: 64,
      form: ['W', 'D', 'W', 'W', 'L'],
    }),
    standing({
      teamId: 'mci',
      rank: 1,
      attackIndex: 92,
      defenseIndex: 88,
      momentumIndex: 90,
      form: ['W', 'W', 'W', 'D', 'W'],
    }),
    'monaco',
    'mci',
    { leagueSize: 18 },
  )
  assert.ok(ctx)
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  assert.ok(odds1x2.away < odds1x2.home, `City favori à l’extérieur (home=${odds1x2.home} away=${odds1x2.away})`)
  assert.ok(odds1x2.away <= 2.1, `City away trop haut: ${odds1x2.away}`)
})

test('live : but outsider resserre sa cote et allonge celle du favori', () => {
  const ctx = buildMatchOddsContextFromNations('CHE', 'QAT')
  const prematch = computePrematch1x2FromContext(ctx).odds1x2
  const afterUnderdogGoal = adjust1x2OddsForLiveInternal(prematch, {
    minute: 35,
    homeGoals: 0,
    awayGoals: 1,
  })
  assert.ok(afterUnderdogGoal.away < prematch.away, 'Qatar plus favori après son but')
  assert.ok(afterUnderdogGoal.home > prematch.home, 'Suisse moins favorie après avoir encaissé')
})

test('live : 1-1 à la 91e — cote nul proche de 1 (résultat le plus probable)', () => {
  const ctx = buildMatchOddsContextFromNations('DEU', 'CUW')
  const prematch = computePrematch1x2FromContext(ctx).odds1x2
  const late = adjust1x2OddsForLiveInternal(prematch, {
    minute: 91,
    homeGoals: 1,
    awayGoals: 1,
  })
  assert.ok(late.draw >= 1.01 && late.draw <= 1.35, `draw=${late.draw}`)
  assert.ok(late.home >= 6, `home=${late.home}`)
  assert.ok(late.away >= 6, `away=${late.away}`)
})

test('live : 5-0 à la 40e — favori attendu ~1,05–1,22, outsider ~50+', () => {
  const ctx = buildMatchOddsContextFromNations('DEU', 'CUW')
  const prematch = computePrematch1x2FromContext(ctx).odds1x2
  const blowout = adjust1x2OddsForLiveInternal(prematch, {
    minute: 40,
    homeGoals: 5,
    awayGoals: 0,
  })
  assert.ok(blowout.home >= 1.01 && blowout.home <= 1.25, `home=${blowout.home}`)
  assert.ok(blowout.away >= 45, `away=${blowout.away}`)
  assert.ok(blowout.draw >= 25, `draw=${blowout.draw}`)
})

test('live : outsider mène 2-0 (favori pré-match mené) — cotes plus réalistes', () => {
  const prematch = { home: 4.8, draw: 3.9, away: 1.72 }
  const live = adjust1x2OddsForLiveInternal(prematch, {
    minute: 50,
    homeGoals: 2,
    awayGoals: 0,
  })
  assert.ok(live.home >= 1.25 && live.home <= 1.85, `home=${live.home}`)
  assert.ok(live.draw >= 3.5 && live.draw <= 8.5, `draw=${live.draw}`)
  assert.ok(live.away >= 5 && live.away <= 16, `away=${live.away}`)
})

test('écart de puissance cohérent CHE > QAT', () => {
  const ctx = buildMatchOddsContextFromNations('CHE', 'QAT')
  const home = teamPowerScore(ctx.home.factors, ctx.home.absenceFactor ?? 1)
  const away = teamPowerScore(ctx.away.factors, ctx.away.absenceFactor ?? 1)
  assert.ok(home > away + 12)
})

test('Portugal vs RD Congo — calibrage bookmaker (~1,25 / ~5,5 / ~12)', () => {
  const ctx = buildMatchOddsContextFromNations('PRT', 'COD')
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  const live00 = adjust1x2OddsForLiveInternal(odds1x2, { minute: 35, homeGoals: 0, awayGoals: 0 })
  assert.ok(odds1x2.home >= 1.2 && odds1x2.home <= 1.34, `pre home=${odds1x2.home}`)
  assert.ok(odds1x2.draw >= 5 && odds1x2.draw <= 7.5, `pre draw=${odds1x2.draw}`)
  assert.ok(odds1x2.away >= 9.5 && odds1x2.away <= 16.5, `pre away=${odds1x2.away}`)
  assert.ok(live00.home >= 1.22 && live00.home <= 1.38, `live home=${live00.home}`)
  assert.ok(live00.away >= 9 && live00.away <= 18, `live away=${live00.away}`)
})

test('calibration relève l’outsider sur gros écart', () => {
  const raw = { home: 1.12, draw: 6.4, away: 24 }
  const calibrated = calibrate1x2OddsForMarket(raw)
  assert.ok(calibrated.home > raw.home, 'favori un peu moins écrasé')
  assert.ok(calibrated.away < raw.away, 'outsider plus haut en cote')
})
