import { describe, expect, it } from 'vitest'
import { careerSpellLabel, extractPlayerProfileFromSmPayload } from './extractPlayerProfileFromSm'

const payload = {
  data: {
    id: 448389,
    display_name: 'Warren Zaïre-Emery',
    date_of_birth: '2006-03-08',
    height: '178 cm',
    weight: '68',
    image_path: 'https://cdn.example/p.png',
    nationality: { name: 'France' },
    detailedPosition: { name: 'Central Midfielder' },
    metadata: [{ type: { developer_name: 'preferred_foot' }, values: 'Right' }],
    teams: [
      { start: '2022-08-01', end: null, team: { name: 'Paris Saint Germain' } },
      { start: '2021-07-01', end: '2022-06-30', team: { name: 'PSG U19' } },
    ],
    trophies: [
      {
        trophy: { name: 'Ligue 1' },
        team: { name: 'Paris Saint Germain' },
        season: { name: '2023/2024' },
      },
      {
        trophy: { name: 'Trophée des Champions' },
        team: { name: 'Paris Saint Germain' },
        season: { name: '2024' },
      },
    ],
    statistics: [
      {
        season_id: 23614,
        season: { name: '2024/2025', league: { name: 'Ligue 1' } },
        team: { name: 'Paris Saint Germain' },
        details: [
          { type: { developer_name: 'APPEARANCES' }, value: 28 },
          { type: { developer_name: 'MINUTES_PLAYED' }, value: 1980 },
          { type: { developer_name: 'GOALS' }, data: { value: 2 } },
          { type: { developer_name: 'ASSISTS' }, value: 4 },
          { type: { developer_name: 'RATING' }, value: 7.12 },
        ],
      },
      {
        season_id: 21000,
        season: { name: '2023/2024', league: { name: 'Ligue 1' } },
        details: [{ type: { developer_name: 'GOALS' }, value: 99 }],
      },
    ],
    latest: [
      {
        team_id: 10,
        fixture: {
          id: 1,
          starting_at: '2026-10-01T19:00:00.000Z',
          participants: [
            { id: 10, name: 'Paris Saint Germain', meta: { location: 'home' } },
            { id: 20, name: 'Marseille', meta: { location: 'away' } },
          ],
          scores: [
            { description: 'CURRENT', score: { participant: 'home', goals: 3 } },
            { description: 'CURRENT', score: { participant: 'away', goals: 1 } },
          ],
        },
        details: [
          { type: { developer_name: 'MINUTES_PLAYED' }, value: 90 },
          { type: { developer_name: 'GOALS' }, value: 0 },
          { type: { developer_name: 'RATING' }, value: 6.8 },
        ],
      },
    ],
  },
}

describe('extractPlayerProfileFromSmPayload', () => {
  it('lit bio, stats saison, carrière et palmarès', () => {
    const p = extractPlayerProfileFromSmPayload(payload)
    expect(p?.name).toBe('Warren Zaïre-Emery')
    expect(p?.country).toBe('France')
    expect(p?.position).toBe('Milieu')
    expect(p?.height).toBe('178 cm')
    expect(p?.weight).toBe('68 kg')
    expect(p?.foot).toBe('Pied droit')
    expect(p?.dateOfBirth).toMatch(/2006/)
    expect(p?.seasonLabel).toContain('Ligue 1')
    expect(p?.seasonStats.find((s) => s.label === 'Buts')?.value).toBe('2')
    expect(p?.seasonStats.find((s) => s.label === 'Note')?.value).toBe('7,1')
    expect(p?.career[0]?.team).toBe('Paris Saint Germain')
    expect(p?.career[0]?.current).toBe(true)
    expect(careerSpellLabel(p!.career[0]!)).toContain('auj.')
    expect(p?.trophies[0]?.title).toBe('Trophée des Champions')
    expect(p?.pitchSlot).toBe('mid-c')
    expect(p?.trophyGroups[0]?.team).toBe('Paris Saint Germain')
    expect(p?.matches).toHaveLength(1)
    expect(p?.matches[0]?.rating).toBe(6.8)
  })
})
