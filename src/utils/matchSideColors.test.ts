import { describe, expect, it } from 'vitest'
import type { Team } from '../types/match'
import { matchSpotlightGradient, resolveSpotlightMatchColors } from './matchSideColors'

const blandTeam = (id: string, name: string): Team => ({
  id,
  name,
  shortName: name.slice(0, 3).toUpperCase(),
  colors: { primary: '#111827', secondary: '#f9fafb' },
})

describe('resolveSpotlightMatchColors', () => {
  it('assigne 2 couleurs distinctes quand SM renvoie du gris générique', () => {
    const home = blandTeam('tobol', 'Tobol')
    const away = blandTeam('partizan', 'Partizan')
    const { home: h, away: a } = resolveSpotlightMatchColors(home, away, 'uel')
    expect(h.primary).not.toBe(a.primary)
    expect(matchSpotlightGradient(home, away, 'uel')).toContain(h.primary)
    expect(matchSpotlightGradient(home, away, 'uel')).toContain(a.primary)
  })

  it('colore aussi les clubs hors nations même si la compétition est CDM', () => {
    const home = blandTeam('ki', 'KÍ')
    const away = blandTeam('lech', 'Lech Poznań')
    const { home: h, away: a } = resolveSpotlightMatchColors(home, away, 'wc-2026')
    expect(h.primary).not.toBe('#111827')
    expect(a.primary).not.toBe('#111827')
    expect(h.primary).not.toBe(a.primary)
  })
})
