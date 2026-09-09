import { describe, expect, it } from 'vitest'
import { rankingsTeamShort } from './rankingsTeamLabel'
import type { LeagueStandingRow } from '../data/leagueStandings'

function row(partial: Partial<LeagueStandingRow> & Pick<LeagueStandingRow, 'teamId'>): LeagueStandingRow {
  return {
    rank: 1,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
    form: [],
    attackIndex: 0,
    defenseIndex: 0,
    momentumIndex: 0,
    ...partial,
  }
}

describe('rankingsTeamShort', () => {
  it('préfère le sigle catalogue (PSG / RMA) aux troncatures SM', () => {
    expect(
      rankingsTeamShort(
        'ligue-1',
        row({ teamId: 'psg', displayName: 'PARGE' }),
      ),
    ).toBe('PSG')
    expect(
      rankingsTeamShort(
        'laliga',
        row({ teamId: 'rma', displayName: 'REAMA' }),
      ),
    ).toBe('RMA')
  })

  it('résout via id SportMonks même hors ligue', () => {
    expect(
      rankingsTeamShort(
        'ucl',
        row({ teamId: 'sm-591', sportMonksParticipantId: 591, displayName: 'PARGE' }),
      ),
    ).toBe('PSG')
  })
})
