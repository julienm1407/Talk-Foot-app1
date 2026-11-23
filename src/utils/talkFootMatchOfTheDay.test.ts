import { describe, expect, it } from 'vitest'
import type { Match } from '../types/match'
import { pickTalkFootMatchOfTheDay } from './talkFootMatchOfTheDay'

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

describe('pickTalkFootMatchOfTheDay', () => {
  it('préfère un match Ligue 1 du jour à un live Serie A', () => {
    const now = new Date('2026-11-23T12:00:00+01:00')
    const picked = pickTalkFootMatchOfTheDay(
      [
        match({
          id: 'monza',
          competitionId: 'serie-a',
          kickoffAt: '2026-11-23T15:00:00.000Z',
          status: 'live',
        }),
        match({
          id: 'l1',
          competitionId: 'ligue-1',
          kickoffAt: '2026-11-23T20:00:00.000Z',
          status: 'upcoming',
        }),
      ],
      [],
      now,
    )
    expect(picked?.id).toBe('l1')
  })

  it('prend une grosse affiche de Premier League plutôt que Monza–Florence', () => {
    const now = new Date('2026-11-23T16:00:00+01:00')
    const picked = pickTalkFootMatchOfTheDay(
      [
        match({
          id: 'monza-fio',
          competitionId: 'serie-a',
          kickoffAt: '2026-11-23T15:00:00.000Z',
          status: 'live',
          home: 'monza',
          away: 'fiorentina',
        }),
        match({
          id: 'city-liv',
          competitionId: 'epl',
          kickoffAt: '2026-11-23T17:30:00.000Z',
          status: 'upcoming',
          home: 'mci',
          away: 'liv',
        }),
      ],
      [],
      now,
    )
    expect(picked?.id).toBe('city-liv')
  })

  it('prend Inter–Turin plutôt qu’un petit match de Ligue 1', () => {
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
    expect(picked?.id).toBe('inter-juve')
  })

  it('prend une Ligue des champions plutôt qu’un filler italien', () => {
    const now = new Date('2026-11-25T18:00:00+01:00')
    const picked = pickTalkFootMatchOfTheDay(
      [
        match({
          id: 'sa',
          competitionId: 'serie-a',
          kickoffAt: '2026-11-25T18:00:00.000Z',
          status: 'live',
        }),
        match({
          id: 'ucl',
          competitionId: 'ucl',
          kickoffAt: '2026-11-25T20:00:00.000Z',
          status: 'upcoming',
        }),
      ],
      [],
      now,
    )
    expect(picked?.id).toBe('ucl')
  })
})
