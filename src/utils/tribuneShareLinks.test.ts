import { describe, expect, it } from 'vitest'
import type { Bet } from '../types/bet'
import type { Match } from '../types/match'
import { formatPronoShareLine, formatShareStoryPick, pronoSharePageUrl, tribuneShareUrl } from './tribuneShareLinks'

const match = {
  id: 'm-1',
  kickoffAt: '2026-11-23T20:00:00.000Z',
  status: 'upcoming',
  competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
  home: { id: 'psg', name: 'Paris SG', shortName: 'PSG', colors: { primary: '#000', secondary: '#fff' } },
  away: { id: 'om', name: 'Marseille', shortName: 'OM', colors: { primary: '#000', secondary: '#fff' } },
} as Match

describe('tribuneShareLinks', () => {
  it('ajoute src=share_prono à l’URL tribune', () => {
    expect(tribuneShareUrl('m-1', 'share_prono')).toContain('/channel/m-1')
    expect(tribuneShareUrl('m-1', 'share_prono')).toContain('src=share_prono')
  })

  it('formule un prono score exact', () => {
    const bet = {
      id: 'b1',
      matchId: 'm-1',
      market: 'exact_score',
      selection: 'ex:3:1',
      stake: 10,
      odds: 8,
      status: 'open',
      placedAt: '2026-11-23T10:00:00.000Z',
    } as Bet
    expect(formatPronoShareLine(bet, match)).toBe('Mon prono : PSG 3-1')
  })

  it('expose un lien court /p/:id avec src=share_prono', () => {
    const url = pronoSharePageUrl('x7k2', { src: 'share_prono', from: 'u1' })
    expect(url).toContain('/p/x7k2')
    expect(url).toContain('src=share_prono')
    expect(url).toContain('from=u1')
  })

  it('découpe un 1N2 en VICTOIRE + club', () => {
    const bet = {
      id: 'b2',
      matchId: 'm-1',
      market: 'result_1x2',
      selection: 'home',
      stake: 10,
      odds: 1.64,
      status: 'open',
      placedAt: '2026-11-23T10:00:00.000Z',
    } as Bet
    const pick = formatShareStoryPick(bet, match)
    expect(pick.outcome).toBe('VICTOIRE')
    expect(pick.team).toBe('PSG')
  })
})
