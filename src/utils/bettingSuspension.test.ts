import { describe, expect, it } from 'vitest'
import type { Highlight } from '../data/highlights'
import { deriveBettingSuspension, GOAL_BET_LOCK_MS } from './bettingSuspension'

function h(partial: Partial<Highlight> & Pick<Highlight, 'id' | 'type'>): Highlight {
  return {
    minute: 0,
    title: '',
    detail: '',
    ...partial,
  }
}

describe('deriveBettingSuspension', () => {
  const now = 1_700_000_000_000

  it('suspend après un but récent sur la timeline', () => {
    const res = deriveBettingSuspension({
      status: 'live',
      minute: 88,
      highlights: [h({ id: 'g1', type: 'But', minute: 88, title: 'Goal' })],
      sessionAnchorMinute: 10,
      nowMs: now,
    })
    expect(res.suspended).toBe(true)
    expect(res.reason).toMatch(/but récent/i)
  })

  it('ignore les buts avant l’arrivée sur le match', () => {
    const res = deriveBettingSuspension({
      status: 'live',
      minute: 88,
      highlights: [h({ id: 'g1', type: 'But', minute: 70, title: 'Goal' })],
      sessionAnchorMinute: 80,
      nowMs: now,
    })
    expect(res.suspended).toBe(false)
  })

  it('verrouille 90 s après détection score (goalLockUntilMs)', () => {
    const res = deriveBettingSuspension({
      status: 'live',
      minute: 88,
      highlights: [],
      goalLockUntilMs: now + GOAL_BET_LOCK_MS / 2,
      nowMs: now,
    })
    expect(res.suspended).toBe(true)
    expect(res.reason).toMatch(/mise à jour des cotes/i)
  })

  it('ne suspend pas une action dangereuse trop ancienne', () => {
    const res = deriveBettingSuspension({
      status: 'live',
      minute: 60,
      highlights: [h({ id: 'd1', type: 'Occasion', minute: 55, title: 'Big chance' })],
      sessionAnchorMinute: 10,
      nowMs: now,
    })
    expect(res.suspended).toBe(false)
  })

  it('suspend une action dangereuse récente', () => {
    const res = deriveBettingSuspension({
      status: 'live',
      minute: 60,
      highlights: [h({ id: 'd1', type: 'Occasion', minute: 60, title: 'Big chance' })],
      sessionAnchorMinute: 10,
      nowMs: now,
    })
    expect(res.suspended).toBe(true)
    expect(res.reason).toMatch(/action dangereuse/i)
  })
})
