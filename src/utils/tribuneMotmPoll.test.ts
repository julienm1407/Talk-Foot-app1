import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rankMotmPollNames } from './tribuneMotmPoll'

describe('rankMotmPollNames', () => {
  it('met un doublé et un gardien devant un titulaire sans stat', () => {
    const names = rankMotmPollNames({
      homeStarters: ['Gardien A', 'Milieu B', 'Attaquant C'],
      awayStarters: ['Gardien D', 'Attaquant E'],
      highlights: [
        { id: '1', matchId: 'm', minute: 10, type: 'But', title: 'C', detail: '', scorerName: 'Attaquant C' },
        { id: '2', matchId: 'm', minute: 40, type: 'But', title: 'C', detail: '', scorerName: 'Attaquant C', assistName: 'Milieu B' },
      ],
      fixture: {
        lineups: [
          {
            player: { display_name: 'Gardien A' },
            formation_position: 1,
            details: [{ type: { developer_name: 'SAVES' }, value: 6 }],
          },
        ],
      },
      max: 8,
    })
    assert.equal(names[0], 'Attaquant C')
    assert.ok(names.includes('Gardien A'))
    assert.ok(names.includes('Milieu B'))
    assert.ok(names.indexOf('Gardien A') < names.indexOf('Gardien D'))
  })

  it('ignore un commentaire de but à la place d’un joueur', () => {
    const names = rankMotmPollNames({
      homeStarters: ['Vinicius Junior', 'Rodrygo'],
      awayStarters: ['Lamine Yamal'],
      highlights: [
        {
          id: '1',
          matchId: 'm',
          minute: 12,
          type: 'But',
          title: 'left-footed shot from the center of the box',
          detail: '',
          scorerName: 'footed shot from the center of the box',
        },
        {
          id: '2',
          matchId: 'm',
          minute: 40,
          type: 'But',
          title: 'Vinicius Junior',
          detail: '',
          scorerName: 'Vinicius Junior',
        },
      ],
      max: 8,
    })
    assert.equal(
      names.some((n) => /shot|box|footed/i.test(n)),
      false,
    )
    assert.equal(names[0], 'Vinicius Junior')
  })

  it('garde tous les titulaires pour ne pas en oublier', () => {
    const home = Array.from({ length: 11 }, (_, i) => `Dupont${i}`)
    const away = Array.from({ length: 11 }, (_, i) => `Martin${i}`)
    const names = rankMotmPollNames({
      homeStarters: home,
      awayStarters: away,
      max: 22,
    })
    assert.equal(names.length, 22)
  })
})
