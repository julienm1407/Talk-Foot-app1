import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMatchOddsContextFromNations } from './buildTeamOddsInput'
import { computePrematch1x2FromContext } from './internalOddsEngine'
import { exactScorePicksFrom1x2 } from './exactScoreOdds'

test('Portugal vs RD Congo — 1-0 Portugal moins coté que 0-1 Congo', () => {
  const { odds1x2 } = computePrematch1x2FromContext(buildMatchOddsContextFromNations('PRT', 'COD'))
  const picks = exactScorePicksFrom1x2(odds1x2)
  const winHome = picks.find((p) => p.label === '1-0')
  const winAway = picks.find((p) => p.label === '0-1')
  assert.ok(winHome, '1-0 Portugal présent')
  assert.ok(winAway, '0-1 Congo présent')
  assert.ok(winHome.odds < winAway.odds, `1-0=${winHome.odds} doit être < 0-1=${winAway.odds}`)
  assert.ok(winHome.odds >= 4.5 && winHome.odds <= 12, `1-0=${winHome.odds}`)
  assert.ok(winAway.odds >= 10 && winAway.odds <= 90, `0-1=${winAway.odds}`)
})

test('scores exacts — cotes dans une fourchette bookmaker', () => {
  const { odds1x2 } = computePrematch1x2FromContext(buildMatchOddsContextFromNations('CHE', 'QAT'))
  const picks = exactScorePicksFrom1x2(odds1x2)
  assert.ok(picks.length >= 10)
  for (const p of picks) {
    assert.ok(p.odds >= 4.5 && p.odds <= 90, `${p.label}=${p.odds}`)
  }
})
