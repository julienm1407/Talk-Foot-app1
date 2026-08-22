import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMatchOddsContextFromNations } from './buildTeamOddsInput'
import { adjust1x2OddsForLiveInternal, computePrematch1x2FromContext } from './internalOddsEngine'
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

test('scores exacts live 2-0 — cotes différenciées (pas toutes identiques)', () => {
  const prematch = { home: 4.8, draw: 3.9, away: 1.72 }
  const liveOdds = adjust1x2OddsForLiveInternal(prematch, {
    minute: 50,
    homeGoals: 2,
    awayGoals: 0,
  })
  const picks = exactScorePicksFrom1x2(liveOdds, {
    liveScore: { home: 2, away: 0 },
    liveMinute: 50,
    prematchOdds1x2: prematch,
  })
  const s22 = picks.find((p) => p.label === '2-2')
  const s33 = picks.find((p) => p.label === '3-3')
  const s23 = picks.find((p) => p.label === '2-3')
  const s20 = picks.find((p) => p.label === '2-0')
  assert.ok(s20 && s22 && s33 && s23, 'scores attendus présents')
  assert.ok(s20.odds < s22.odds, `2-0=${s20.odds} doit être < 2-2=${s22.odds}`)
  assert.notEqual(s22.odds, s33.odds, `2-2=${s22.odds} ≠ 3-3=${s33.odds}`)
  assert.notEqual(s22.odds, s23.odds, `2-2=${s22.odds} ≠ 2-3=${s23.odds}`)
  assert.notEqual(s22.odds, 55.56, `2-2=${s22.odds} ne doit plus être bloqué à 55,56`)
})
