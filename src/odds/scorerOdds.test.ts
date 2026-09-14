import assert from 'node:assert/strict'
import test from 'node:test'
import { anytimeScorerOddsFromEngine } from './internalOddsEngine'
import { isAnytimeScorerEligible, resolveScorerPositionTier } from './scorerPosition'

test('gardien remplaçant n’est pas un buteur (Chevalier)', () => {
  const tier = resolveScorerPositionTier({
    positionLabel: 'Goalkeeper',
    isStarter: false,
  })
  assert.equal(tier, 'gk')
  assert.equal(isAnytimeScorerEligible(tier), false)
  const odds = anytimeScorerOddsFromEngine(
    {
      name: 'Lucas Chevalier',
      side: 'home',
      isStarter: false,
      positionLabel: 'Goalkeeper',
    },
    70,
    false,
  )
  assert.ok(odds >= 40, `gardien trop court: ${odds}`)
})

test('attaquant titulaire plus court qu’un défenseur', () => {
  const fwd = anytimeScorerOddsFromEngine(
    {
      name: 'Kylian Mbappé',
      side: 'home',
      isStarter: true,
      positionLabel: 'Attacker',
      goalsPerMatch: 0.85,
      recentGoalsLast5: 4,
      isPenaltyTaker: true,
    },
    78,
    false,
  )
  const def = anytimeScorerOddsFromEngine(
    {
      name: 'Marquinhos',
      side: 'home',
      isStarter: true,
      positionLabel: 'Defender',
    },
    78,
    false,
  )
  assert.ok(fwd < def, `attaquant ${fwd} vs défenseur ${def}`)
  assert.ok(fwd <= 3.4, `star trop long: ${fwd}`)
  assert.ok(def >= 8, `défenseur trop court: ${def}`)
})

test('remplaçant attaquant n’est pas calé à 9 comme un milieu/def', () => {
  const fwdBench = anytimeScorerOddsFromEngine(
    {
      name: 'Bradley Barcola',
      side: 'home',
      isStarter: false,
      positionLabel: 'Attacker',
    },
    72,
    false,
  )
  const defBench = anytimeScorerOddsFromEngine(
    {
      name: 'Presnel Kimpembe',
      side: 'home',
      isStarter: false,
      positionLabel: 'Defender',
    },
    72,
    false,
  )
  assert.ok(fwdBench < defBench, `banc att ${fwdBench} vs def ${defBench}`)
  assert.ok(fwdBench <= 8.2)
  assert.ok(defBench >= 14)
})

test('banc sans poste n’est pas traité comme un milieu à 9', () => {
  const tier = resolveScorerPositionTier({ isStarter: false })
  assert.equal(tier, 'def')
  const odds = anytimeScorerOddsFromEngine(
    { name: 'Inconnu Banc', side: 'away', isStarter: false },
    55,
    false,
  )
  assert.ok(odds >= 14, `banc inconnu trop court: ${odds}`)
})
