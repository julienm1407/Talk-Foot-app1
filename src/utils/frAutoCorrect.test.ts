import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { correctFrenchText, correctFrenchTyping } from './frAutoCorrect'

describe('correctFrenchTyping', () => {
  it('corrige un mot fermé par un espace, pas le mot en cours', () => {
    assert.equal(correctFrenchTyping('cest un '), "c'est un ")
    assert.equal(correctFrenchTyping('cest'), 'cest')
  })

  it('corrige le dernier mot à l’envoi', () => {
    assert.equal(correctFrenchText('cest'), "c'est")
    assert.equal(correctFrenchText('jai vu lequipe'), "j'ai vu l'équipe")
  })

  it('préserve la casse et les acronymes', () => {
    assert.equal(correctFrenchText('Cest'), "C'est")
    assert.equal(correctFrenchText('CA'), 'CA')
  })

  it('laisse les mentions et URLs', () => {
    assert.equal(correctFrenchText('voir @cest https://cest.test'), 'voir @cest https://cest.test')
  })
})
