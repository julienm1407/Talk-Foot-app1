import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getFavoriteTeamRecord, isSupporterTintActive } from '../utils/supporterMode'

/** Contenu app centré club quand le mode supporter (teinte maillot) est actif + club choisi */
export function useSupporterTintMode() {
  const { profile } = useProfile()
  const { favoriteClubId, favoriteLeagueId, preferencesComplete } = useFanPreferences()

  const active = useMemo(
    () =>
      isSupporterTintActive(profile.characterLook, preferencesComplete, favoriteClubId),
    [profile.characterLook, preferencesComplete, favoriteClubId],
  )

  const team = useMemo(
    () => getFavoriteTeamRecord(favoriteLeagueId, favoriteClubId),
    [favoriteLeagueId, favoriteClubId],
  )

  return {
    supporterTintActive: active,
    team,
    favoriteClubId,
    favoriteLeagueId,
  }
}
