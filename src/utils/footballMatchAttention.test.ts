import { describe, expect, it } from 'vitest'
import {
  isKickoffInLiveAttentionWindow,
  matchNeedsLiveAttention,
  resolveEffectiveMatchStatus,
} from './footballMatchAttention'

const KO = '2026-06-20T19:00:00.000Z'

describe('footballMatchAttention', () => {
  it('détecte la fenêtre autour du coup d’envoi', () => {
    const ko = Date.parse(KO)
    expect(isKickoffInLiveAttentionWindow(KO, ko - 6 * 60_000)).toBe(false)
    expect(isKickoffInLiveAttentionWindow(KO, ko - 4 * 60_000)).toBe(true)
    expect(isKickoffInLiveAttentionWindow(KO, ko + 90 * 60_000)).toBe(true)
    expect(isKickoffInLiveAttentionWindow(KO, ko + 4 * 60 * 60_000)).toBe(false)
  })

  it('passe en live effectif si SM est encore upcoming après le KO', () => {
    const ko = Date.parse(KO)
    expect(
      resolveEffectiveMatchStatus(
        { status: 'upcoming', kickoffAt: KO },
        ko + 15 * 60_000,
      ),
    ).toBe('live')
  })

  it('garde upcoming avant le coup d’envoi hors pré-fenêtre', () => {
    const ko = Date.parse(KO)
    expect(
      resolveEffectiveMatchStatus(
        { status: 'upcoming', kickoffAt: KO },
        ko - 10 * 60_000,
      ),
    ).toBe('upcoming')
  })

  it('demande l’attention live pendant la fenêtre même si statut pas encore live', () => {
    const ko = Date.parse(KO)
    expect(
      matchNeedsLiveAttention({ status: 'upcoming', kickoffAt: KO }, ko + 30 * 60_000),
    ).toBe(true)
    expect(
      matchNeedsLiveAttention({ status: 'finished', kickoffAt: KO }, ko + 30 * 60_000),
    ).toBe(true)
  })
})
