import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMatchOddsContextFromNations } from './buildTeamOddsInput'
import {
  adjust1x2OddsForLiveInternal,
  computePrematch1x2FromContext,
  teamPowerScore,
} from './internalOddsEngine'

test('Suisse vs Qatar — favori clair (~1,15–1,35 / nul ~6–8 / outsider ~10–18)', () => {
  const ctx = buildMatchOddsContextFromNations('CHE', 'QAT')
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  assert.ok(odds1x2.home >= 1.12 && odds1x2.home <= 1.38, `home=${odds1x2.home}`)
  assert.ok(odds1x2.draw >= 5.5 && odds1x2.draw <= 8.5, `draw=${odds1x2.draw}`)
  assert.ok(odds1x2.away >= 9 && odds1x2.away <= 20, `away=${odds1x2.away}`)
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
  assert.ok(late.home >= 8, `home=${late.home}`)
  assert.ok(late.away >= 8, `away=${late.away}`)
})

test('live : 5-0 à la 40e — favori ~1,01, outsider ~100', () => {
  const ctx = buildMatchOddsContextFromNations('DEU', 'CUW')
  const prematch = computePrematch1x2FromContext(ctx).odds1x2
  const blowout = adjust1x2OddsForLiveInternal(prematch, {
    minute: 40,
    homeGoals: 5,
    awayGoals: 0,
  })
  assert.ok(blowout.home >= 1.01 && blowout.home <= 1.15, `home=${blowout.home}`)
  assert.ok(blowout.away >= 50, `away=${blowout.away}`)
  assert.ok(blowout.draw >= 40, `draw=${blowout.draw}`)
})

test('écart de puissance cohérent CHE > QAT', () => {
  const ctx = buildMatchOddsContextFromNations('CHE', 'QAT')
  const home = teamPowerScore(ctx.home.factors, ctx.home.absenceFactor ?? 1)
  const away = teamPowerScore(ctx.away.factors, ctx.away.absenceFactor ?? 1)
  assert.ok(home > away + 12)
})
