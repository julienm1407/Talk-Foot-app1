import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mergeWalletTokens } from './walletBackup'

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
})
