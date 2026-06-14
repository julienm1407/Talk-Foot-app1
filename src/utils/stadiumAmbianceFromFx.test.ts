import { describe, expect, it } from 'vitest'
import {
  STADIUM_AMBIANCE_FX_FULL,
  stadiumAmbiancePercentFromFxCount,
  stadiumAmbianceTierLabel,
} from './stadiumAmbianceFromFx'

describe('stadiumAmbianceFromFx', () => {
  it('retourne 0 sans FX', () => {
    expect(stadiumAmbiancePercentFromFxCount(0)).toBe(0)
  })

  it('monte avec le cumul FX jusqu’à 100 %', () => {
    expect(stadiumAmbiancePercentFromFxCount(1)).toBeGreaterThan(0)
    expect(stadiumAmbiancePercentFromFxCount(STADIUM_AMBIANCE_FX_FULL)).toBe(100)
    expect(stadiumAmbiancePercentFromFxCount(STADIUM_AMBIANCE_FX_FULL + 5)).toBe(100)
  })

  it('libellé d’ambiance selon le pourcentage', () => {
    expect(stadiumAmbianceTierLabel(0)).toBe('CALME')
    expect(stadiumAmbianceTierLabel(40)).toBe('ÇA MONTE')
    expect(stadiumAmbianceTierLabel(70)).toBe('AMBIANCE')
    expect(stadiumAmbianceTierLabel(90)).toBe('MODE STADE')
  })
})
