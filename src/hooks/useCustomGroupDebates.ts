import { useCallback, useMemo } from 'react'
import type { Debate } from '../data/debates'
import { currentUser } from '../data/users'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import {
  CUSTOM_GROUP_DEBATES_KEY,
  createCustomGroupDebateRecord,
  type CustomDebatesBucket,
} from '../utils/customGroupDebatesStorage'
import { useLocalStorageState } from './useLocalStorage'

const isBucket = (p: unknown): p is CustomDebatesBucket =>
  p !== null && typeof p === 'object' && !Array.isArray(p)

export function useCustomGroupDebates(groupId: string | undefined) {
  const { favoriteClubIds } = useFanPreferences()
  const fanClubId = favoriteClubIds[0] ?? 'psg'

  const [bucket, setBucket] = useLocalStorageState<CustomDebatesBucket>(
    CUSTOM_GROUP_DEBATES_KEY,
    {},
    isBucket,
  )

  const customForGroup = useMemo(
    () => (groupId ? bucket[groupId] ?? [] : []),
    [bucket, groupId],
  )

  const addCustomDebate = useCallback(
    (input: { title: string; excerpt: string; accent: string }): Debate | null => {
      if (!groupId) return null
      const debate = createCustomGroupDebateRecord(
        groupId,
        input,
        currentUser.username,
        fanClubId,
      )
      setBucket((prev) => {
        const nextList = [...(prev[groupId] ?? []), debate].slice(-50)
        return { ...prev, [groupId]: nextList }
      })
      return debate
    },
    [fanClubId, groupId, setBucket],
  )

  return { customForGroup, addCustomDebate }
}
