import { describe, expect, it } from 'vitest'
import { extractSeasonTopscorersFromSmPayload } from './extractSeasonTopscorersFromSm'

describe('extractSeasonTopscorersFromSmPayload', () => {
  it('classe les buteurs et ignore les assists', () => {
    const rows = extractSeasonTopscorersFromSmPayload({
      data: [
        {
          player_id: 2,
          position: 2,
          total: 8,
          type_id: 208,
          type: { id: 208, developer_name: 'GOAL' },
          player: { display_name: 'Ousmane Dembélé', image_path: 'https://cdn/d.png' },
          participant: { name: 'Paris Saint Germain', image_path: 'https://cdn/psg.png' },
        },
        {
          player_id: 1,
          position: 1,
          total: 14,
          type: { id: 208, name: 'Goals' },
          player: { display_name: 'Mason Greenwood' },
          participant: { name: 'Olympique de Marseille' },
        },
        {
          player_id: 9,
          total: 11,
          type: { id: 209, developer_name: 'ASSIST' },
          player: { display_name: 'Pas un buteur' },
          participant: { name: 'Lens' },
        },
      ],
    })
    expect(rows.map((r) => r.name)).toEqual(['Mason Greenwood', 'Ousmane Dembélé'])
    expect(rows[0]?.rank).toBe(1)
    expect(rows[0]?.goals).toBe(14)
    expect(rows[1]?.team).toContain('Paris')
    expect(rows[1]?.photoUrl).toContain('cdn/d')
  })
})
