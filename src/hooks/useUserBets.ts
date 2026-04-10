import { useCallback } from 'react'
import type { Bet } from '../types/bet'
import { useLocalStorageState } from './useLocalStorage'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

const BETS_KEY = 'talkfoot.bets.v1'

export function useUserBets() {
  const cloud = useOptionalCloudUserState()
  const persistLocal = !isSupabaseConfigured()
  const [localBets, setLocalBets] = useLocalStorageState<Bet[]>(BETS_KEY, [], Array.isArray, {
    persist: persistLocal,
  })
  const bets = cloud !== undefined ? cloud.app.bets : localBets

  const setBets = useCallback(
    (u: React.SetStateAction<Bet[]>) => {
      if (cloud) {
        cloud.patchApp((prev) => ({
          ...prev,
          bets: typeof u === 'function' ? (u as (b: Bet[]) => Bet[])(prev.bets) : u,
        }))
      } else {
        setLocalBets(u)
      }
    },
    [cloud, setLocalBets],
  )

  return [bets, setBets] as const
}
