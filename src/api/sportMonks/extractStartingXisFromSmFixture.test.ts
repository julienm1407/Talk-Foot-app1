import { describe, expect, it } from 'vitest'
import { extractMatchLineupBundleFromFixture } from './extractStartingXisFromSmFixture'
import type { SmFixture } from './types'

describe('extractMatchLineupBundleFromFixture', () => {
  it('lit les compos via participant_id (UCL / SM v3)', () => {
    const fx = {
      participants: [
        { id: 591, name: 'PSG', meta: { location: 'home' } },
        { id: 1887, name: 'Slovan', meta: { location: 'away' } },
      ],
      lineups: [
        ...Array.from({ length: 11 }, (_, i) => ({
          participant_id: 591,
          player_id: 100 + i,
          player: { id: 100 + i, display_name: `Home${i}` },
          formation_field: `${Math.floor(i / 4) + 1}:${(i % 4) + 1}`,
          formation_position: i + 1,
          type: { developer_name: 'LINEUP' },
          jersey_number: i + 1,
        })),
        ...Array.from({ length: 11 }, (_, i) => ({
          participant_id: 1887,
          player_id: 200 + i,
          player: { id: 200 + i, display_name: `Away${i}` },
          formation_field: `${Math.floor(i / 4) + 1}:${(i % 4) + 1}`,
          formation_position: i + 1,
          type: { developer_name: 'LINEUP' },
          jersey_number: i + 1,
        })),
      ],
      formations: [
        { participant_id: 591, formation: '4-3-3', location: 'home' },
        { participant_id: 1887, formation: '4-4-2', location: 'away' },
      ],
    } as unknown as SmFixture

    const bundle = extractMatchLineupBundleFromFixture(fx)
    expect(bundle?.starters?.home?.length).toBe(11)
    expect(bundle?.starters?.away?.length).toBe(11)
    expect(bundle?.formations.home).toBe('4-3-3')
    expect(bundle?.starters?.home?.[0]?.label).toBe('Home0')
  })

  it('déplie participants/lineups imbriqués dans data', () => {
    const fx = {
      participants: {
        data: [
          { id: 1, meta: { location: 'home' } },
          { id: 2, meta: { location: 'away' } },
        ],
      },
      lineups: {
        data: [
          ...Array.from({ length: 11 }, (_, i) => ({
            participant_id: 1,
            player: { display_name: `H${i}` },
            formation_field: `1:${i + 1}`,
            type: { developer_name: 'LINEUP' },
          })),
          ...Array.from({ length: 11 }, (_, i) => ({
            participant_id: 2,
            player: { display_name: `A${i}` },
            formation_field: `1:${i + 1}`,
            type: { developer_name: 'LINEUP' },
          })),
        ],
      },
    } as unknown as SmFixture

    const bundle = extractMatchLineupBundleFromFixture(fx)
    expect(bundle?.starters?.home?.length).toBe(11)
    expect(bundle?.starters?.away?.length).toBe(11)
  })
})
