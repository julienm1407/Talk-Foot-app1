import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mergeWalletMedals, mergeWalletTokens } from './walletBackup'

describe('mergeWalletTokens', () => {
  it('conserve une dépense locale (80) face au défaut cloud (100)', () => {
    assert.equal(mergeWalletTokens(100, 80), 80)
  })

  it('relève un solde cloud enrichi face à un backup par défaut', () => {
    assert.equal(mergeWalletTokens(250, 100), 250)
  })

  it('relève un gain local non encore synchronisé', () => {
    assert.equal(mergeWalletTokens(100, 150), 150)
  })

  it('fait confiance au cloud déjà synchronisé après dépense', () => {
    assert.equal(mergeWalletTokens(80, 80), 80)
  })

  it('conserve une dépense admin (99 980) face au cloud non synchronisé (100 000)', () => {
    assert.equal(mergeWalletTokens(100_000, 99_980), 99_980)
  })
})

describe('mergeWalletMedals', () => {
  it('conserve une dépense boutique (cloud 2900, backup périmé 3000 → 2900)', () => {
    assert.equal(mergeWalletMedals(2900, 3000), 2900)
  })

  it('conserve une dépense locale pas encore sync (cloud 3000, backup 2900 → 2900)', () => {
    assert.equal(mergeWalletMedals(3000, 2900), 2900)
  })

  it('ne wipe pas le cloud si backup médailles à 0', () => {
    assert.equal(mergeWalletMedals(500, 0), 500)
  })
})
