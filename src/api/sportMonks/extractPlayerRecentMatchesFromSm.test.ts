import { describe, expect, it } from 'vitest'
import {
  extractPlayerRecentMatchesFromSmPlayerPayload,
  minutesPlayedLabel,
} from './extractPlayerRecentMatchesFromSm'

describe('extractPlayerRecentMatchesFromSmPlayerPayload', () => {
  it('lit minutes, buts et résultat', () => {
    const rows = extractPlayerRecentMatchesFromSmPlayerPayload({
      data: {
        id: 99,
        latest: [
          {
            team_id: 10,
            fixture: {
              id: 1,
              starting_at: '2026-10-01T19:00:00.000Z',
              participants: [
                { id: 10, name: 'Olympique Lyonnais', meta: { location: 'home' } },
                { id: 20, name: 'Crystal Palace', meta: { location: 'away' } },
              ],
              scores: [
                { description: 'CURRENT', score: { participant: 'home', goals: 2 } },
                { description: 'CURRENT', score: { participant: 'away', goals: 1 } },
              ],
            },
            details: [
              { type: { developer_name: 'MINUTES_PLAYED' }, value: 90 },
              { type: { developer_name: 'GOALS' }, data: { value: 1 } },
              { type: { developer_name: 'ASSISTS' }, value: 1 },
            ],
          },
        ],
      },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.opponent).toContain('Palace')
    expect(rows[0]?.result).toBe('W')
    expect(rows[0]?.goals).toBe(1)
    expect(rows[0]?.assists).toBe(1)
    expect(minutesPlayedLabel(rows[0]!)).toContain('tout le match')
  })

  it('ne prend pas les dégagements / tirs cadrés / buts encaissés pour un gardien', () => {
    const rows = extractPlayerRecentMatchesFromSmPlayerPayload({
      data: {
        id: 1,
        latest: [
          {
            team_id: 10,
            fixture: {
              id: 2,
              starting_at: '2026-10-04T18:00:00.000Z',
              participants: [
                { id: 10, name: 'Torino', meta: { location: 'home' } },
                { id: 20, name: 'Roma', meta: { location: 'away' } },
              ],
              scores: [
                { description: 'CURRENT', score: { participant: 'home', goals: 0 } },
                { description: 'CURRENT', score: { participant: 'away', goals: 1 } },
              ],
            },
            details: [
              { type: { developer_name: 'MINUTES_PLAYED' }, value: 90 },
              { type: { developer_name: 'GOAL_KICKS' }, value: 1 },
              { type: { developer_name: 'SHOTS_ON_GOAL' }, value: 4 },
              { type: { developer_name: 'GOALS_CONCEDED' }, value: 1 },
              { type: { developer_name: 'SAVES' }, value: 3 },
            ],
          },
        ],
      },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.opponent).toContain('Roma')
    expect(rows[0]?.goals).toBe(0)
    expect(rows[0]?.assists).toBe(0)
  })
})
