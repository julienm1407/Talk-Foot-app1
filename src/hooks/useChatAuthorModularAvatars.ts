import { useEffect, useMemo, useState } from 'react'
import type { ModularAvatarState } from '../features/avatar2d/modularAvatarState'
import { fetchProfilesByIds } from '../lib/supabase/friendships'
import { fetchTalkfootProfileSnapshot } from '../lib/supabase/profileAppState'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  modularAvatarFromSnapshot,
  shouldFetchCloudChatAvatar,
} from '../utils/chatAuthorModularAvatar'

type AuthorCacheEntry = {
  modularAvatar: ModularAvatarState | null
  displayName: string | null
}

const authorCache = new Map<string, AuthorCacheEntry>()

export function clearChatAuthorAvatarCache(userId?: string) {
  if (userId) {
    authorCache.delete(userId)
    return
  }
  authorCache.clear()
}

type SelfAvatarOptions = {
  /** Profil modulaire local (compte connecté) — prioritaire sur le cache cloud. */
  selfModularAvatar?: ModularAvatarState | null
  /** Tous les ids possibles pour « moi » (Clerk, UUID Supabase, `me`). */
  selfUserKeys?: string[]
}

/** PP modulaire + pseudo cloud des auteurs de messages tribune / live. */
export function useChatAuthorModularAvatars(
  userIds: string[],
  selfUserId: string,
  options?: SelfAvatarOptions,
) {
  const [tick, setTick] = useState(0)
  const selfUserKeys = options?.selfUserKeys
  const selfModularAvatar = options?.selfModularAvatar

  const pendingKey = useMemo(() => {
    return [...new Set(userIds)]
      .filter((id) => shouldFetchCloudChatAvatar(id, selfUserId))
      .filter((id) => !authorCache.get(id)?.modularAvatar)
      .sort()
      .join(',')
  }, [userIds, selfUserId])

  useEffect(() => {
    if (!pendingKey || !isSupabaseConfigured()) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return

    const ids = pendingKey.split(',').filter(Boolean)
    let cancelled = false

    void (async () => {
      const profileNames = await fetchProfilesByIds(sb, ids).catch(() => new Map())

      await Promise.all(
        ids.map(async (actorKey) => {
          try {
            const snap = await fetchTalkfootProfileSnapshot(sb, actorKey)
            const modularAvatar = modularAvatarFromSnapshot(snap) ?? null
            const fromSnap = snap?.displayName?.trim() || null
            const fromTable = profileNames.get(actorKey)?.display_name?.trim() || null
            authorCache.set(actorKey, {
              modularAvatar,
              displayName: fromSnap || fromTable,
            })
          } catch {
            const fromTable = profileNames.get(actorKey)?.display_name?.trim() || null
            const prev = authorCache.get(actorKey)
            authorCache.set(actorKey, {
              modularAvatar: prev?.modularAvatar ?? null,
              displayName: fromTable ?? prev?.displayName ?? null,
            })
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
    const avatars: Record<string, ModularAvatarState> = {}
    const displayNames: Record<string, string> = {}

    if (selfModularAvatar && selfUserKeys?.length) {
      for (const id of selfUserKeys) {
        if (id) avatars[id] = selfModularAvatar
      }
    }

    for (const id of userIds) {
      const cached = authorCache.get(id)
      if (cached?.modularAvatar && !avatars[id]) avatars[id] = cached.modularAvatar
      if (cached?.displayName) displayNames[id] = cached.displayName
    }
    return { avatars, displayNames }
  }, [userIds, tick, selfModularAvatar, selfUserKeys])
}
