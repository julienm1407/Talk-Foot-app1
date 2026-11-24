import { describe, expect, it } from 'vitest'
import type { Match } from '../types/match'
import {
  isTalkFootFeaturedMatch,
  isTalkFootMatchToday,
  pickTalkFootHomeBoard,
  pickTalkFootMatchOfTheDay,
} from './talkFootMatchOfTheDay'
import type { TalkFootEditorialResolved } from './talkFootEditorialStore'

function match(partial: {
  id: string
  competitionId: string
  kickoffAt: string
  status: Match['status']
  home?: string
  away?: string
}): Match {
  const home = partial.home ?? 'home'
  const away = partial.away ?? 'away'
  return {
    id: partial.id,
    kickoffAt: partial.kickoffAt,
    status: partial.status,
    competition: { id: partial.competitionId, name: partial.competitionId, shortName: partial.competitionId },
    home: { id: home, name: home, shortName: home, colors: { primary: '#000', secondary: '#fff' } },
    away: { id: away, name: away, shortName: away, colors: { primary: '#000', secondary: '#fff' } },
  } as Match
}

const editorial: TalkFootEditorialResolved = {
  chocPairs: [
    ['psg', 'om'],
    ['lille', 'lens'],
  ],
  top5Ids: ['psg', 'om', 'monaco', 'lille', 'lyon'],
  forceByDay: {},
}

describe('pickTalkFootHomeBoard', () => {
  it('priorité 1 : PSG du jour, choc L1 dans Ce soir aussi', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const board = pickTalkFootHomeBoard(
      [
        match({
          id: 'om-lyon',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T19:00:00.000Z',
          status: 'upcoming',
          home: 'om',
          away: 'lyon',
        }),
        match({
          id: 'psg-roma',
          competitionId: 'ucl',
          kickoffAt: '2026-11-23T20:00:00.000Z',
          status: 'upcoming',
          home: 'psg',
          away: 'roma',
        }),
      ],
      now,
      editorial,
    )
    expect(board.featured?.id).toBe('psg-roma')
    expect(board.alsoTonight.map((m) => m.id)).toEqual(['om-lyon'])
  })

  it('priorité 2 : club L1 en Europe si pas de PSG', () => {
    const now = new Date('2026-11-24T12:00:00+01:00')
    const board = pickTalkFootHomeBoard(
      [
        match({
          id: 'city-liv',
          competitionId: 'ucl',
          kickoffAt: '2026-11-24T20:00:00.000Z',
          status: 'upcoming',
          home: 'mci',
          away: 'liv',
        }),
        match({
          id: 'lyon-bayern',
          competitionId: 'ucl',
          kickoffAt: '2026-11-24T20:00:00.000Z',
          status: 'upcoming',
          home: 'lyon',
          away: 'bayern',
        }),
      ],
      now,
      editorial,
    )
    expect(board.featured?.id).toBe('lyon-bayern')
    expect(board.multiplex?.id).toBe('m-mux-ucl-2026-11-24')
    expect(board.multiplex?.matches.map((m) => m.id)).toEqual(['city-liv', 'lyon-bayern'])
  })

  it('ne met pas en avant un filler L1 ni une affiche étrangère', () => {
    const now = new Date('2026-11-23T16:00:00+01:00')
    const picked = pickTalkFootMatchOfTheDay(
      [
        match({
          id: 'aux-tro',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T20:00:00.000Z',
          status: 'upcoming',
          home: 'auxerre',
          away: 'troyes',
        }),
        match({
          id: 'inter-juve',
          competitionId: 'serie-a',
          kickoffAt: '2026-11-23T18:00:00.000Z',
          status: 'live',
          home: 'inter',
          away: 'juve',
        }),
      ],
      [],
      now,
    )
    expect(picked).toBeNull()
  })

  it('prend un choc Ligue 1 (top 5) comme Match Talk Foot', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const board = pickTalkFootHomeBoard(
      [
        match({
          id: 'monaco-lille',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T20:00:00.000Z',
          status: 'upcoming',
          home: 'monaco',
          away: 'lille',
        }),
      ],
      now,
      editorial,
    )
    expect(board.featured?.id).toBe('monaco-lille')
  })

  it('force manuel du jour', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const board = pickTalkFootHomeBoard(
      [
        match({
          id: 'psg-l1',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T20:00:00.000Z',
          status: 'upcoming',
          home: 'psg',
          away: 'nantes',
        }),
        match({
          id: 'force-me',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T17:00:00.000Z',
          status: 'upcoming',
          home: 'auxerre',
          away: 'troyes',
        }),
      ],
      now,
      { ...editorial, forceByDay: { '2026-11-23': 'force-me' } },
    )
    expect(board.featured?.id).toBe('force-me')
  })

  it('semaine : PSG dans les 7 jours même si un choc L1 Europe est plus tôt', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const board = pickTalkFootHomeBoard(
      [
        match({
          id: 'leipzig-lens',
          competitionId: 'uel',
          kickoffAt: '2026-11-24T20:00:00.000Z',
          status: 'upcoming',
          home: 'leipzig',
          away: 'lens',
        }),
        match({
          id: 'psg-roma',
          competitionId: 'ucl',
          kickoffAt: '2026-11-25T20:00:00.000Z',
          status: 'upcoming',
          home: 'psg',
          away: 'roma',
        }),
      ],
      now,
      editorial,
    )
    expect(board.weekMatch?.id).toBe('psg-roma')
    expect(board.featured?.id).toBe('psg-roma')
  })

  it('le jour d’un club L1 en Europe : Match du jour, PSG reste match de la semaine', () => {
    const now = new Date('2026-11-24T12:00:00+01:00')
    const matches = [
      match({
        id: 'leipzig-lens',
        competitionId: 'uel',
        kickoffAt: '2026-11-24T20:00:00.000Z',
        status: 'upcoming',
        home: 'leipzig',
        away: 'lens',
      }),
      match({
        id: 'psg-roma',
        competitionId: 'ucl',
        kickoffAt: '2026-11-25T20:00:00.000Z',
        status: 'upcoming',
        home: 'psg',
        away: 'roma',
      }),
    ]
    const board = pickTalkFootHomeBoard(matches, now, editorial)
    expect(board.featured?.id).toBe('leipzig-lens')
    expect(board.weekMatch?.id).toBe('psg-roma')
    expect(isTalkFootFeaturedMatch('psg-roma', matches, [], now)).toBe(true)
    expect(isTalkFootFeaturedMatch('leipzig-lens', matches, [], now)).toBe(true)
  })

  it('semaine : prochain PSG si rien aujourd’hui', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const picked = pickTalkFootMatchOfTheDay(
      [
        match({
          id: 'psg-roma',
          competitionId: 'ucl',
          kickoffAt: '2026-11-25T20:00:00.000Z',
          status: 'upcoming',
          home: 'psg',
          away: 'roma',
        }),
      ],
      [],
      now,
    )
    expect(picked?.id).toBe('psg-roma')
    expect(isTalkFootMatchToday(picked!, now)).toBe(false)
  })
})
