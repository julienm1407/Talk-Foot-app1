import { describe, expect, it } from 'vitest'
import { shortNameFromApiTeamName } from './teamCardLabel'

describe('shortNameFromApiTeamName', () => {
  it('ne confond pas Lillestrøm avec Lille', () => {
    expect(shortNameFromApiTeamName('Lillestrøm SK')).toBe('LSK')
    expect(shortNameFromApiTeamName('Lille OSC')).toBe('LIL')
  })

  it('distingue OM et Olympiakos', () => {
    expect(shortNameFromApiTeamName('Olympique de Marseille')).toBe('OM')
    expect(shortNameFromApiTeamName('Olympiakos')).toBe('OLY')
  })
})
