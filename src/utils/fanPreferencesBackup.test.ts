import { describe, expect, it } from 'vitest'
import { mergeFanPreferencesKeepFilled } from './fanPreferencesBackup'

describe('mergeFanPreferencesKeepFilled', () => {
  it('conserve le retrait d’un match favori (ne re-unionne pas le backup)', () => {
    const merged = mergeFanPreferencesKeepFilled(
      { favoriteMatchIds: [] },
      { favoriteMatchIds: ['torino-roma'] },
    )
    expect(merged.favoriteMatchIds).toEqual([])
  })

  it('garde les matchs cloud si la session n’a pas encore la clé', () => {
    const merged = mergeFanPreferencesKeepFilled(
      { favoriteClubIds: ['psg'] },
      { favoriteMatchIds: ['torino-roma'] },
    )
    expect(merged.favoriteMatchIds).toEqual(['torino-roma'])
  })
})
