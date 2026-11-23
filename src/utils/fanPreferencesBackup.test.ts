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

  it('conserve les cases notification d’un match suivi', () => {
    const merged = mergeFanPreferencesKeepFilled(
      {
        favoriteMatchIds: ['m-sm-1'],
        favoriteMatchAlertPrefs: { 'm-sm-1': { goal: false, kickoff: true } },
      },
      {
        favoriteMatchIds: ['m-sm-1'],
        favoriteMatchAlertPrefs: { 'm-sm-1': { goal: true, kickoff: true } },
      },
    )
    expect(merged.favoriteMatchAlertPrefs?.['m-sm-1']).toEqual({ goal: false, kickoff: true })
  })
})
