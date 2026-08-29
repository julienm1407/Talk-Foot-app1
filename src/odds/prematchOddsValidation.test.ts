import assert from 'node:assert/strict'
import test from 'node:test'
import { standingsByLeague } from '../data/leagueStandings'
import { buildMatchOddsContext, findStandingForTeam } from './buildTeamOddsInput'
import { computePrematch1x2FromContext } from './internalOddsEngine'
import { align1x2OddsToInternalFavorite, isCredibleExternal1x2Odds } from './prematchOddsValidation'

test('PSG (domicile) vs Lille — favori domicile ~1,2–1,45', () => {
  const rows = standingsByLeague['ligue-1']
  const h = findStandingForTeam(rows, 'psg', 591)
  const a = findStandingForTeam(rows, 'lille', 690)
  assert.ok(h && a)
  const ctx = buildMatchOddsContext(h, a, 'psg', 'lille')
  assert.ok(ctx)
  const { odds1x2 } = computePrematch1x2FromContext(ctx)
  assert.ok(odds1x2.home >= 1.18 && odds1x2.home <= 1.45, `home=${odds1x2.home}`)
  assert.ok(odds1x2.away >= 7, `away=${odds1x2.away}`)
})

test('cotes SM inversées (10,3 domicile) corrigées puis validées', () => {
  const rows = standingsByLeague['ligue-1']
  const h = findStandingForTeam(rows, 'psg', 591)
  const a = findStandingForTeam(rows, 'lille', 690)
  const { odds1x2: internal } = computePrematch1x2FromContext(
    buildMatchOddsContext(h, a, 'psg', 'lille')!,
  )
  const invertedSm = { home: 10.3, draw: 5.5, away: 1.28 }
  assert.equal(isCredibleExternal1x2Odds(invertedSm, null), false)
  const aligned = align1x2OddsToInternalFavorite(invertedSm, internal)
  assert.ok(aligned.home < 2, `aligned home=${aligned.home}`)
  assert.ok(isCredibleExternal1x2Odds(aligned, internal))
})

test('Strasbourg–Lens : cotes SM aberrantes (16,5 / 8,98 / 2,45) rejetées', () => {
  const rows = standingsByLeague['ligue-1']
  const h = findStandingForTeam(rows, 'strasbourg', 686)
  const a = findStandingForTeam(rows, 'lens', 271)
  assert.ok(h && a)
  const { odds1x2: internal } = computePrematch1x2FromContext(
    buildMatchOddsContext(h, a, 'strasbourg', 'lens')!,
  )
  const smBad = { home: 16.5, draw: 8.98, away: 2.45 }
  assert.equal(isCredibleExternal1x2Odds(smBad, internal), false)
})
