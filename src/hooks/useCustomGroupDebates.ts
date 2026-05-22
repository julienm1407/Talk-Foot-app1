import { useCallback, useMemo } from 'react'
import type { Debate } from '../data/debates'
import { useAuth } from '../contexts/AuthContext'
import { useDebates } from '../contexts/DebatesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { upsertPublishedDebate } from '../lib/supabase/debates'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import {
  CUSTOM_GROUP_DEBATES_KEY,
  createCustomGroupDebateRecord,
  type CustomDebatesBucket,
} from '../utils/customGroupDebatesStorage'
import { moderateDebateInput } from '../utils/bannedWords'
import { useLocalStorageState } from './useLocalStorage'

const isBucket = (p: unknown): p is CustomDebatesBucket =>
  p !== null && typeof p === 'object' && !Array.isArray(p)

export function useCustomGroupDebates(groupId: string | undefined) {
  const { user: authUser } = useAuth()
  const { favoriteClubIds } = useFanPreferences()
  const { refresh: refreshDebates } = useDebates()
  const fanClubId = favoriteClubIds[0] ?? 'psg'
  const username = authUser?.displayName ?? 'Toi'

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
      if (!moderateDebateInput(input).ok) return null
      const debate = createCustomGroupDebateRecord(
        groupId,
        input,
        username,
        fanClubId,
      )
      setBucket((prev) => {
        const nextList = [...(prev[groupId] ?? []), debate].slice(-50)
        return { ...prev, [groupId]: nextList }
      })
      if (isSupabaseConfigured()) {
        const sb = getSupabaseBrowserClient()
        if (sb) {
          void (async () => {
            const session = await ensureTalkFootSupabaseSession(sb)
            if (!session) return
            const res = await upsertPublishedDebate(sb, {
              id: debate.id,
              groupId: debate.groupId,
              title: debate.title,
              excerpt: debate.excerpt,
              accent: debate.accent,
              salonAccess: debate.salonAccess ?? 'members',
            })
            if (res.ok) await refreshDebates()
          })()
        }
      } else {
        void refreshDebates()
      }
      return debate
    },
    [fanClubId, groupId, refreshDebates, setBucket, username],
  )

  return { customForGroup, addCustomDebate }
}
