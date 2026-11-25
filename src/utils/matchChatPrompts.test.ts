import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isBareMatchChatPromptQuestion,
  isUnfilledMatchChatPromptDraft,
  matchChatPromptIdFromReply,
  matchChatPromptStarter,
} from './matchChatPrompts'

describe('matchChatPrompts', () => {
  it('prépare le score avec les équipes et le curseur sur le premier ?', () => {
    const s = matchChatPromptStarter('exact_score', 'PSG', 'Roma')
    assert.equal(s.text, 'Mon score : PSG ? - ? Roma')
    assert.equal(s.cursor, s.text.indexOf('?'))
  })

  it('prépare la compo rêvée', () => {
    const s = matchChatPromptStarter('dream_xi', 'PSG', 'Roma')
    assert.equal(s.text, 'Ma compo : ')
    assert.equal(s.cursor, s.text.length)
  })

  it('refuse d’envoyer le libellé de suggestion', () => {
    assert.equal(isBareMatchChatPromptQuestion('Ton score exact ?'), true)
    assert.equal(isBareMatchChatPromptQuestion('Ta compo rêvée ?'), true)
    assert.equal(isBareMatchChatPromptQuestion('Mon score : PSG 2 - 1 Roma'), false)
  })

  it('reconnaît une réponse issue d’une suggestion', () => {
    assert.equal(matchChatPromptIdFromReply('Mon score : PSG 2 - 1 Roma'), 'exact_score')
    assert.equal(matchChatPromptIdFromReply('Ma compo : Donnarumma, Hakimi…'), 'dream_xi')
    assert.equal(isUnfilledMatchChatPromptDraft('Ma compo : ', 'PSG', 'Roma'), true)
    assert.equal(isUnfilledMatchChatPromptDraft('Ma compo : 4-3-3', 'PSG', 'Roma'), false)
  })
})
