import { useEffect, useMemo, useState } from 'react'
import type { ModularAvatarState } from '../features/avatar2d/modularAvatarState'
import { fetchTalkfootProfileSnapshot } from '../lib/supabase/profileAppState'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  modularAvatarFromSnapshot,
  shouldFetchCloudChatAvatar,
} from '../utils/chatAuthorModularAvatar'

const avatarCache = new Map<string, ModularAvatarState | null>()

/** PP modulaire des auteurs de messages (profils cloud Clerk / Supabase). */
export function useChatAuthorModularAvatars(userIds: string[], selfUserId: string) {
  const [tick, setTick] = useState(0)

  const pendingKey = useMemo(() => {
    return [...new Set(userIds)]
      .filter((id) => shouldFetchCloudChatAvatar(id, selfUserId))
      .filter((id) => !avatarCache.has(id))
      .sort()
      .join(',')
  }, [userIds, selfUserId])

  useEffect(() => {
    if (!pendingKey || !isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    const ids = pendingKey.split(',')
    let cancelled = false

    void (async () => {
      await Promise.all(
        ids.map(async (actorKey) => {
          try {
            const snap = await fetchTalkfootProfileSnapshot(sb, actorKey)
            avatarCache.set(actorKey, modularAvatarFromSnapshot(snap) ?? null)
          } catch {
            avatarCache.set(actorKey, null)
          }
        }),
      )
      if (!cancelled) setTick((n) => n + 1)
    })()

    return () => {
      cancelled = true
    }
  }, [pendingKey])

  return useMemo(() => {
    const out: Record<string, ModularAvatarState> = {}
    for (const id of userIds) {
      const cached = avatarCache.get(id)
      if (cached) out[id] = cached
    }
    return out
  }, [userIds, tick])
}
