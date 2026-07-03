import { describe, expect, it } from 'vitest'
import {
  extractMatchShootoutDisplay,
  extractMatchShootoutFromHighlights,
  extractPenaltyShootoutFromComments,
  extractPenaltyShootoutFromScores,
  extractPenaltyShootoutFromTexts,
  extractRegulationGoalsFromScores,
  isSmPenaltyShootoutEvent,
} from './matchRegulationScore'

describe('matchRegulationScore', () => {
  it('utilise CURRENT (1-1) et PENALTIES (2-3) comme SportMonks', () => {
    const scores = [
      { description: 'CURRENT', score: { participant: 'home', goals: 1 } },
      { description: 'CURRENT', score: { participant: 'away', goals: 1 } },
      { description: 'EXTRA_TIME', score: { participant: 'home', goals: 1 } },
      { description: 'EXTRA_TIME', score: { participant: 'away', goals: 1 } },
      { description: 'PENALTIES', score: { participant: 'home', goals: 2 } },
      { description: 'PENALTIES', score: { participant: 'away', goals: 3 } },
    ]
    expect(extractRegulationGoalsFromScores(scores)).toEqual({ home: 1, away: 1 })
    expect(extractPenaltyShootoutFromScores(scores)).toEqual({ home: 2, away: 3 })
    expect(extractMatchShootoutDisplay(scores)).toEqual({
      wentToExtraTime: true,
      penalties: { home: 2, away: 3 },
    })
  })

  it('lit le TAB depuis les commentaires live SM', () => {
    const comments = [
      {
        comment:
          'Penalty shootout ends avec Maroc winning 3-2 on penalties after a 1-1 draw.',
      },
      {
        comment:
          'Corner — But ! Pays-Bas 1(2), Maroc 1(3). Ismael Saibari (Maroc) converts the penalty.',
      },
    ]
    expect(extractPenaltyShootoutFromComments(comments, 'Pays-Bas', 'Maroc')).toEqual({
      home: 2,
      away: 3,
    })
    expect(
      extractPenaltyShootoutFromTexts(
        ['Maroc winning 3-2 on penalties'],
        'Netherlands',
        'Morocco',
      ),
    ).toEqual({ home: 2, away: 3 })
  })

  it('repli timeline highlights TalkFoot', () => {
    expect(
      extractMatchShootoutFromHighlights(
        [
          {
            title: 'Occasion',
            detail:
              'Penalty shootout ends avec Maroc winning 3-2 on penalties after a 1-1 draw.',
            minute: 130,
          },
        ],
        'NLD',
        'MAR',
      ),
    ).toEqual({
      wentToExtraTime: true,
      penalties: { home: 2, away: 3 },
    })
  })

  it('ignore les tirs au but dans les événements SM', () => {
    expect(
      isSmPenaltyShootoutEvent({
        minute: 31,
        extra_minute: 90,
        period: { description: 'penalty-shootout', counts_from: 90 },
        type: { developer_name: 'PENALTY' },
      }),
    ).toBe(true)
  })
})
