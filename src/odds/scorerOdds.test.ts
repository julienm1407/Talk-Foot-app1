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
  assert.ok(fwdBench <= 6.4)
  assert.ok(defBench >= 10.5)
  assert.ok(defBench <= 19)
})

test('Dembélé banc n’est pas à 32 (poste inconnu SM)', () => {
  const tier = resolveScorerPositionTier({ isStarter: false, playerName: 'Ousmane Dembélé' })
  assert.equal(tier, 'fwd')
  const odds = anytimeScorerOddsFromEngine(
    { name: 'Ousmane Dembélé', side: 'home', isStarter: false },
    78,
    false,
  )
  assert.ok(odds <= 6.4, `Dembélé banc trop long: ${odds}`)
})

test('Vitinha banc n’est pas calé défenseur à 32', () => {
  const tier = resolveScorerPositionTier({ isStarter: false, playerName: 'Vitinha' })
  assert.equal(tier, 'mid')
  const odds = anytimeScorerOddsFromEngine(
    { name: 'Vitinha', side: 'home', isStarter: false },
    72,
    false,
  )
  assert.ok(odds <= 10.5, `Vitinha banc trop long: ${odds}`)
})

test('banc sans poste est un milieu neutre, pas un défenseur à 32', () => {
  const tier = resolveScorerPositionTier({ isStarter: false })
  assert.equal(tier, 'mid')
  const odds = anytimeScorerOddsFromEngine(
    { name: 'Inconnu Banc', side: 'away', isStarter: false },
    55,
    false,
  )
  assert.ok(odds <= 10.5, `banc inconnu trop long: ${odds}`)
})

test('Nuno Mendes n’a pas la cote d’un gardien', () => {
  const mendes = anytimeScorerOddsFromEngine(
    { name: 'Nuno Mendes', side: 'home', isStarter: true, positionLabel: 'Defender' },
    70,
    false,
  )
  const chevalier = anytimeScorerOddsFromEngine(
    {
      name: 'Lucas Chevalier',
      side: 'home',
      isStarter: false,
      positionLabel: 'Goalkeeper',
    },
    70,
    false,
  )
  assert.ok(mendes < chevalier, `Mendes ${mendes} vs Chevalier ${chevalier}`)
  assert.ok(mendes <= 16.5)
})
