import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatKickoffCountdown, kickoffCountdownParts } from './kickoffCountdown'

describe('kickoffCountdown', () => {
  it('découpe jours / heures / min / s', () => {
    const now = Date.parse('2026-11-28T10:00:00.000Z')
    const p = kickoffCountdownParts('2026-11-29T12:05:07.000Z', now)
    assert.equal(p.days, 1)
    assert.equal(p.hours, 2)
    assert.equal(p.minutes, 5)
    assert.equal(p.seconds, 7)
    assert.equal(p.expired, false)
    assert.match(formatKickoffCountdown(p), /1j/)
  })

  it('expire à l’heure du coup d’envoi', () => {
    const t = Date.parse('2026-11-28T20:00:00.000Z')
    const p = kickoffCountdownParts('2026-11-28T20:00:00.000Z', t)
    assert.equal(p.expired, true)
    assert.equal(p.totalMs, 0)
  })
})
