import { describe, expect, it } from 'vitest'
import {
  extractSidelinedPlayersFromSmFixture,
  translateSidelineReasonFr,
} from './extractSidelinedFromSm'
import { extractCoachesFromSmFixture } from './extractCoachesFromSmFixture'
import type { SmFixture } from './types'

describe('sidelines / coaches compos', () => {
  it('traduit les motifs d’absence', () => {
    expect(translateSidelineReasonFr('Knee Injury')).toBe('Genou')
    expect(translateSidelineReasonFr('Suspended')).toBe('Suspension')
    expect(translateSidelineReasonFr('Doubtful')).toBe('Incertain')
  })

  it('répartit absents et coachs par camp', () => {
    const fx = {
      participants: [
        { id: 10, meta: { location: 'home' } },
        { id: 20, meta: { location: 'away' } },
      ],
      sidelined: [
        {
          participant_id: 10,
          player_id: 1,
          sideline: {
            player: { display_name: 'Jean Neige', image_path: 'https://img/j.png' },
            type: { name: 'Hamstring Injury' },
          },
        },
        {
          team_id: 20,
          player: { name: 'Marc Carton' },
          type: { developer_name: 'SUSPENDED' },
        },
      ],
      coaches: [
        {
          participant_id: 10,
          coach: { display_name: 'Arne Slot', image_path: 'https://img/c.png' },
          type: { developer_name: 'HEAD_COACH' },
        },
      ],
    } as SmFixture

    const abs = extractSidelinedPlayersFromSmFixture(fx)
    expect(abs.home[0]?.shortName).toBe('Neige')
    expect(abs.home[0]?.reason).toBe('Ischio-jambiers')
    expect(abs.away[0]?.reason).toBe('Suspension')

    const coaches = extractCoachesFromSmFixture(fx)
    expect(coaches.home?.name).toBe('Arne Slot')
    expect(coaches.away).toBeNull()
  })
})
