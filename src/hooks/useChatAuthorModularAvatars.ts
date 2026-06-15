import { useEffect, useMemo, useState } from 'react'
import type { ModularAvatarState } from '../features/avatar2d/modularAvatarState'
import type { SubscriptionTierId } from '../types/subscription'
import { fetchTalkfootPublicProfiles } from '../lib/supabase/profileAppState'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  modularAvatarFromPublicRow,
  profilePhotoFromPublicRow,
  shouldFetchCloudChatAvatar,
} from '../utils/chatAuthorModularAvatar'

type AuthorCacheEntry = {
  modularAvatar: ModularAvatarState | null
  displayName: string | null
  subscriptionTier: SubscriptionTierId | null
  profilePhotoDataUrl: string | null
  loaded: boolean
}

const authorCache = new Map<string, AuthorCacheEntry>()
const cacheInvalidateListeners = new Set<() => void>()

function notifyCacheInvalidate() {
  cacheInvalidateListeners.forEach((fn) => fn())
}

function markAuthorCacheLoaded(actorKey: string, partial?: Partial<Omit<AuthorCacheEntry, 'loaded'>>) {
  const prev = authorCache.get(actorKey)
  authorCache.set(actorKey, {
    modularAvatar: partial?.modularAvatar ?? prev?.modularAvatar ?? null,
    displayName: partial?.displayName ?? prev?.displayName ?? null,
    subscriptionTier: partial?.subscriptionTier ?? prev?.subscriptionTier ?? null,
    profilePhotoDataUrl: partial?.profilePhotoDataUrl ?? prev?.profilePhotoDataUrl ?? null,
    loaded: true,
  })
}

/** Réinitialise le cache d’un ou plusieurs auteurs et relance le fetch côté chat. */
export function invalidateChatAuthorAvatars(userIds: string[]) {
  const keys = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))]
  if (!keys.length) return
  for (const id of keys) authorCache.delete(id)
  notifyCacheInvalidate()
}

export function clearChatAuthorAvatarCache(userId?: string) {
  if (userId) {
    authorCache.delete(userId)
    notifyCacheInvalidate()
    return
  }
  authorCache.clear()
  notifyCacheInvalidate()
}

/** Vrai tant que l’avatar cloud d’un auteur n’a pas encore été résolu. */
export function isChatAuthorAvatarPending(userId: string, selfUserId: string): boolean {
  if (!shouldFetchCloudChatAvatar(userId, selfUserId)) return false
  if (!isSupabaseConfigured()) return false
  return !authorCache.get(userId)?.loaded
}

type SelfAvatarOptions = {
  /** Profil modulaire local (compte connecté) — prioritaire sur le cache cloud. */
  selfModularAvatar?: ModularAvatarState | null
  /** Formule du compte connecté (cadre Ultra sur sa PP). */
  selfSubscriptionTier?: SubscriptionTierId
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
  const [cacheEpoch, setCacheEpoch] = useState(0)
  const selfUserKeys = options?.selfUserKeys
  const selfModularAvatar = options?.selfModularAvatar
  const selfSubscriptionTier = options?.selfSubscriptionTier

  useEffect(() => {
    const bump = () => setCacheEpoch((n) => n + 1)
    cacheInvalidateListeners.add(bump)
    return () => {
      cacheInvalidateListeners.delete(bump)
    }
  }, [])

  const pendingKey = useMemo(() => {
    return [...new Set(userIds)]
      .filter((id) => shouldFetchCloudChatAvatar(id, selfUserId))
      .filter((id) => !authorCache.get(id)?.loaded)
      .sort()
      .join(',')
  }, [userIds, selfUserId, cacheEpoch])

  useEffect(() => {
    if (!pendingKey || !isSupabaseConfigured()) return

    const ids = pendingKey.split(',').filter(Boolean)
    let cancelled = false

    const markUnresolvedLoaded = () => {
      for (const actorKey of ids) {
        if (!authorCache.get(actorKey)?.loaded) {
          markAuthorCacheLoaded(actorKey)
        }
      }
    }

    const sb = getSupabaseBrowserClient()
    if (!sb) {
      markUnresolvedLoaded()
      if (!cancelled) setTick((n) => n + 1)
      return
    }

    void (async () => {
      try {
        const rows = await fetchTalkfootPublicProfiles(sb, ids)
        if (cancelled) return

        const byActorKey = new Map(rows.map((row) => [row.actorKey, row]))
        const byProfileId = new Map(rows.map((row) => [row.profileId, row]))

        for (const actorKey of ids) {
          const row = byActorKey.get(actorKey) ?? byProfileId.get(actorKey)
          const modularAvatar = row ? modularAvatarFromPublicRow(row.modularAvatar) ?? null : null
          const displayName = row?.displayName?.trim() || null
          const subscriptionTier = row?.subscriptionTier ?? null
          const profilePhotoDataUrl = row
            ? profilePhotoFromPublicRow(row.profilePhotoDataUrl) ?? null
            : null
          markAuthorCacheLoaded(actorKey, {
            modularAvatar,
            displayName,
            subscriptionTier,
            profilePhotoDataUrl,
          })
          if (row?.profileId && row.profileId !== actorKey) {
            markAuthorCacheLoaded(row.profileId, {
              modularAvatar,
              displayName,
              subscriptionTier,
              profilePhotoDataUrl,
            })
          }
        }
      } catch {
        if (!cancelled) markUnresolvedLoaded()
      } finally {
        if (cancelled) markUnresolvedLoaded()
        if (!cancelled) setTick((n) => n + 1)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pendingKey])

  return useMemo(() => {
    const avatars: Record<string, ModularAvatarState> = {}
    const profilePhotos: Record<string, string> = {}
    const displayNames: Record<string, string> = {}
    const subscriptionTiers: Record<string, SubscriptionTierId> = {}

    if (selfModularAvatar && selfUserKeys?.length) {
      for (const id of selfUserKeys) {
        if (id) avatars[id] = selfModularAvatar
      }
    }
    if (selfSubscriptionTier && selfUserKeys?.length) {
      for (const id of selfUserKeys) {
        if (id) subscriptionTiers[id] = selfSubscriptionTier
      }
    }

    for (const id of userIds) {
      const cached = authorCache.get(id)
      if (cached?.modularAvatar && !avatars[id]) avatars[id] = cached.modularAvatar
      if (cached?.profilePhotoDataUrl && !profilePhotos[id]) {
        profilePhotos[id] = cached.profilePhotoDataUrl
      }
      if (cached?.displayName) displayNames[id] = cached.displayName
      if (cached?.subscriptionTier) subscriptionTiers[id] = cached.subscriptionTier
    }
    return { avatars, profilePhotos, displayNames, subscriptionTiers }
  }, [userIds, tick, selfModularAvatar, selfSubscriptionTier, selfUserKeys])
}
