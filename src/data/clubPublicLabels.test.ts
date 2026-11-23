import { describe, expect, it } from 'vitest'
import { searchClubsCatalog } from './allClubsCatalog'
import { clubJerseyByClubId } from './clubJerseys'
import { clubShortByClubId } from './clubShorts'
import { teams } from './teams'

describe('libellés boutique vs matchs', () => {
  it('garde PSG / OM sur les matchs', () => {
    const psg = teams['ligue-1'].find((t) => t.id === 'psg')
    const om = teams['ligue-1'].find((t) => t.id === 'om')
    expect(psg?.shortName).toBe('PSG')
    expect(om?.shortName).toBe('OM')
  })

  it('nomme la boutique Maillot Paris / Short Marseille', () => {
    expect(clubJerseyByClubId.psg?.name).toMatch(/Paris/)
    expect(clubJerseyByClubId.psg?.name).not.toMatch(/PSG/)
    expect(clubShortByClubId.om?.name).toMatch(/Marseille/)
    expect(clubShortByClubId.om?.name).not.toMatch(/\bOM\b/)
  })

  it('retrouve le club si on tape PSG, OM ou Marseille', () => {
    expect(searchClubsCatalog('PSG', 5)[0]?.id).toBe('psg')
    expect(searchClubsCatalog('OM', 5)[0]?.id).toBe('om')
    expect(searchClubsCatalog('Marseille', 5)[0]?.id).toBe('om')
  })
})
