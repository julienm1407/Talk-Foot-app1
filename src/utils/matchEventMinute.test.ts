import { describe, expect, it } from 'vitest'
import {
  eventInSecondHalf,
  eventMinuteTotal,
  formatEventMinuteLabel,
  formatGoalEventMinute,
} from './matchEventMinute'

describe('matchEventMinute', () => {
  it('affiche 45+5 pour un but à la 50e minute de la 1re MT', () => {
    expect(formatGoalEventMinute(50, { inSecondHalf: false })).toBe("45+5'")
  })

  it('affiche 50 en 2e MT sans le confondre avec 45+5', () => {
    expect(formatGoalEventMinute(50, { inSecondHalf: true })).toBe("50'")
  })

  it('cumule minute + extra_minute SM', () => {
    const row = { minute: 45, extra_minute: 5, period: { counts_from: 0, description: '1st-half' } }
    expect(eventMinuteTotal(row)).toBe(50)
    expect(formatEventMinuteLabel(row)).toBe("45+5'")
  })

  it('détecte la 2e période via period.counts_from', () => {
    const row = {
      minute: 47,
      period: { counts_from: 45, description: '2nd-half' },
    }
    expect(eventInSecondHalf(row)).toBe(true)
    expect(formatEventMinuteLabel(row)).toBe("47'")
  })

  it('ne re-ajoute counts_from si SM envoie déjà la minute cumulée', () => {
    const row = { minute: 47, period: { counts_from: 45, description: '2nd-half' } }
    expect(eventMinuteTotal(row)).toBe(47)
  })

  it('1re MT : minute brute sans addition counts_from', () => {
    const row = { minute: 38, period: { counts_from: 0, description: '1st-half', minutes: 50 } }
    expect(eventMinuteTotal(row)).toBe(38)
    expect(eventInSecondHalf(row)).toBe(false)
  })

  it('2e MT : minute 58 sans period SM → 58\' et non 45+13', () => {
    const row = { minute: 58, period: { counts_from: 0 } }
    expect(eventInSecondHalf(row, 58)).toBe(true)
    expect(formatEventMinuteLabel(row)).toBe("58'")
  })

  it('1re MT : 45+1 via extra_minute reste en 45+1', () => {
    const row = { minute: 45, extra_minute: 1, period: { counts_from: 0, description: '1st-half' } }
    expect(eventInSecondHalf(row, 46)).toBe(false)
    expect(formatEventMinuteLabel(row)).toBe("45+1'")
  })
})
