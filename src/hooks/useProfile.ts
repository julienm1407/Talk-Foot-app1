import { useCallback, useEffect, useMemo } from 'react'
import type { AvatarCharacterLook, AvatarSlot, JerseyCustomization, UserProfile } from '../types/profile'

const EQUIPPED_BASE: Record<AvatarSlot, string | null> = {
  scarf: null,
  hat: null,
  jersey: null,
  accessory: null,
  pants: 'pants-kit',
  shoes: 'shoes-studs',
}
import { useLocalStorageState } from './useLocalStorage'
import { levelFromXp, getLevelTier, xpPerLevel } from '../data/shop'
import { DEFAULT_CHARACTER_LOOK, mergeCharacterLook } from '../data/characterPresets'
import { defaultUserProfile } from '../data/userAppStateDefaults'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { resolveAvatarLoadout, styleCatalog } from '../data/avatar2dCatalog'
import {
  isModularAvatarState,
  resolveModularAvatarState,
  sanitizeModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'
import { avatarItems } from '../data/shop'
import { sanitizeModularGarmentAccess } from '../utils/modularGarmentAccess'

function catalogItemOwned(itemId: string, ownedItemIds: string[]): boolean {
  if (ownedItemIds.includes(itemId)) return true
  const row = avatarItems.find((i) => i.id === itemId)
  return Boolean(row && row.cost === 0)
}

export const PROFILE_STORAGE_KEY = 'talkfoot.profile.v1'

/** Synchronise tous les hooks useProfile() dans l’onglet après une mise à jour. */
export const PROFILE_BROADCAST = 'talkfoot-profile-broadcast'

const defaultProfile: UserProfile = {
  ...defaultUserProfile,
  characterLook: { ...DEFAULT_CHARACTER_LOOK },
}

function isUserProfileStored(p: unknown): boolean {
  if (p === null || typeof p !== 'object' || Array.isArray(p)) return false
  const o = p as Record<string, unknown>
  if (
    typeof o.level !== 'number' ||
    typeof o.xp !== 'number' ||
    o.equippedItems === null ||
    typeof o.equippedItems !== 'object' ||
    Array.isArray(o.equippedItems) ||
    !Array.isArray(o.ownedItemIds)
  ) {
    return false
  }
  if (o.characterLook != null && (typeof o.characterLook !== 'object' || Array.isArray(o.characterLook))) {
    return false
  }
  if (
    o.jerseyCustomizations != null &&
    (typeof o.jerseyCustomizations !== 'object' || Array.isArray(o.jerseyCustomizations))
  ) {
    return false
  }
  if (
    o.profilePhotoDataUrl != null &&
    (typeof o.profilePhotoDataUrl !== 'string' || !o.profilePhotoDataUrl.startsWith('data:image/'))
  ) {
    return false
  }
  if (o.avatarLoadout != null && (typeof o.avatarLoadout !== 'object' || Array.isArray(o.avatarLoadout))) {
    return false
  }
  if (o.modularAvatar != null && !isModularAvatarState(o.modularAvatar)) {
    return false
  }
  if (o.premiumInventory != null && (typeof o.premiumInventory !== 'object' || Array.isArray(o.premiumInventory))) {
    return false
  }
  const backdrops = new Set([
    'tribune',
    'club_sunburst',
    'club_stripes',
    'bubbles',
    'confetti',
    'calm',
  ])
  if (
    o.portraitBackdrop != null &&
    (typeof o.portraitBackdrop !== 'string' || !backdrops.has(o.portraitBackdrop))
  ) {
    return false
  }
  if (o.portraitBackdropClubId != null && typeof o.portraitBackdropClubId !== 'string') {
    return false
  }
  return true
}

export function useProfile() {
  const cloud = useOptionalCloudUserState()
  const persistLocal = !isSupabaseConfigured()
  const [localProfile, setLocalProfileRaw] = useLocalStorageState<UserProfile>(
    PROFILE_STORAGE_KEY,
    defaultProfile,
    isUserProfileStored,
    { persist: persistLocal },
  )

  const profile = cloud !== undefined ? cloud.app.profile : localProfile

  const broadcastProfile = useCallback((next: UserProfile) => {
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent<UserProfile>(PROFILE_BROADCAST, { detail: next }))
    })
  }, [])

  const setProfileStore = useCallback(
    (u: React.SetStateAction<UserProfile>) => {
      if (cloud) {
        cloud.patchApp((prev) => ({
          ...prev,
          profile: typeof u === 'function' ? (u as (p: UserProfile) => UserProfile)(prev.profile) : u,
        }))
        const next =
          typeof u === 'function'
            ? (u as (p: UserProfile) => UserProfile)(cloud.app.profile)
            : u
        broadcastProfile(next)
      } else {
        setLocalProfileRaw((prev) => {
          const next = typeof u === 'function' ? u(prev) : u
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* quota */
          }
          broadcastProfile(next)
          return next
        })
      }
    },
    [cloud, setLocalProfileRaw, broadcastProfile],
  )

  useEffect(() => {
    const onBroadcast = (e: Event) => {
      const ce = e as CustomEvent<UserProfile>
      const d = ce.detail
      if (!d || !isUserProfileStored(d)) return
      if (cloud) {
        cloud.patchApp((prev) => ({ ...prev, profile: d }))
      } else {
        setLocalProfileRaw(d)
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_STORAGE_KEY || !e.newValue) return
      try {
        const parsed: unknown = JSON.parse(e.newValue)
        if (!isUserProfileStored(parsed)) return
        if (cloud) {
          cloud.patchApp((prev) => ({ ...prev, profile: parsed as UserProfile }))
        } else {
          setLocalProfileRaw(parsed as UserProfile)
        }
      } catch {
        /* ignore */
      }
    }
    window.addEventListener(PROFILE_BROADCAST, onBroadcast as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(PROFILE_BROADCAST, onBroadcast as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [cloud, setLocalProfileRaw])

  const computedLevel = useMemo(() => levelFromXp(profile.xp), [profile.xp])
  const tier = useMemo(() => getLevelTier(computedLevel), [computedLevel])
  const xpForCurrentLevel = useMemo(() => {
    let total = 0
    for (let l = 2; l <= computedLevel; l++) total += xpPerLevel(l)
    return total
  }, [computedLevel])
  const xpForNextLevel = useMemo(() => xpPerLevel(computedLevel + 1), [computedLevel])
  const xpProgress = useMemo(() => {
    if (!xpForNextLevel || xpForNextLevel <= 0) return 0
    const currentLevelXp = profile.xp - xpForCurrentLevel
    return Math.min(100, Math.max(0, Math.round((currentLevelXp / xpForNextLevel) * 100)))
  }, [profile.xp, xpForCurrentLevel, xpForNextLevel])

  const addXp = useCallback(
    (amount: number) => {
      setProfileStore((p) => ({ ...p, xp: p.xp + amount }))
    },
    [setProfileStore],
  )

  const equipItem = useCallback(
    (itemId: string, slot: AvatarSlot) => {
      setProfileStore((p) => {
        const owned = Array.isArray(p.ownedItemIds) ? p.ownedItemIds : []
        if (!catalogItemOwned(itemId, owned)) return p
        const current = {
          ...EQUIPPED_BASE,
          ...(p.equippedItems && typeof p.equippedItems === 'object' ? p.equippedItems : {}),
        }
        return {
          ...p,
          equippedItems: { ...current, [slot]: itemId },
          avatarLoadout: {
            ...resolveAvatarLoadout(p),
            ...(slot === 'jersey' ? { kit: itemId } : {}),
            ...(slot === 'accessory' ? { accessory: itemId } : {}),
          },
          premiumInventory: {
            ownedItemIds: Array.from(new Set([...(p.premiumInventory?.ownedItemIds ?? []), itemId])),
            equippedByCategory: {
              ...(p.premiumInventory?.equippedByCategory ?? {}),
              ...(slot === 'jersey' ? { kit: itemId } : {}),
              ...(slot === 'accessory' ? { accessory: itemId } : {}),
            },
          },
        }
      })
    },
    [setProfileStore],
  )

  const unequipSlot = useCallback(
    (slot: AvatarSlot) => {
      setProfileStore((p) => ({
        ...(p as UserProfile),
        ...p,
        equippedItems: {
          ...EQUIPPED_BASE,
          ...(p.equippedItems && typeof p.equippedItems === 'object' ? p.equippedItems : {}),
          [slot]: null,
        },
        avatarLoadout: {
          ...resolveAvatarLoadout(p),
          ...(slot === 'jersey' ? { kit: 'kit-default' } : {}),
          ...(slot === 'accessory' ? { accessory: 'accessory-default' } : {}),
        },
        premiumInventory: {
          ownedItemIds: p.premiumInventory?.ownedItemIds ?? [],
          equippedByCategory: {
            ...(p.premiumInventory?.equippedByCategory ?? {}),
            ...(slot === 'jersey' ? { kit: undefined } : {}),
            ...(slot === 'accessory' ? { accessory: undefined } : {}),
          },
        },
      }))
    },
    [setProfileStore],
  )

  const addOwnedItem = useCallback(
    (itemId: string) => {
      setProfileStore((p) => {
        const ids = Array.isArray(p.ownedItemIds) ? p.ownedItemIds : []
        const nextOwned = ids.includes(itemId) ? ids : [...ids, itemId]
        return {
          ...p,
          ownedItemIds: nextOwned,
          premiumInventory: {
            ownedItemIds: Array.from(
              new Set([
                ...(p.premiumInventory?.ownedItemIds ?? []),
                ...styleCatalog.filter((s) => s.id === itemId).map((s) => s.id),
              ]),
            ),
            equippedByCategory: p.premiumInventory?.equippedByCategory ?? {},
          },
        }
      })
    },
    [setProfileStore],
  )

  const updateCharacterLook = useCallback(
    (patch: Partial<AvatarCharacterLook>) => {
      setProfileStore((p) => {
        const base = mergeCharacterLook(p.characterLook ?? {})
        return {
          ...p,
          characterLook: { ...base, ...patch },
          avatarLoadout: {
            ...resolveAvatarLoadout(p),
            ...(patch.skinTone ? { skinColor: patch.skinTone } : {}),
            ...(patch.eyeColor ? { eyeColor: patch.eyeColor } : {}),
            ...(patch.hairColor ? { hairColor: patch.hairColor } : {}),
          },
        }
      })
    },
    [setProfileStore],
  )

  const setJerseyCustomization = useCallback(
    (jerseyId: string, data: JerseyCustomization) => {
      setProfileStore((p) => ({
        ...p,
        jerseyCustomizations: {
          ...(typeof p.jerseyCustomizations === 'object' && p.jerseyCustomizations !== null
            ? p.jerseyCustomizations
            : {}),
          [jerseyId]: data,
        },
      }))
    },
    [setProfileStore],
  )

  const updateModularAvatar = useCallback(
    (updater: (prev: ModularAvatarState) => ModularAvatarState) => {
      setProfileStore((p) => {
        const owned = Array.isArray(p.ownedItemIds) ? p.ownedItemIds : []
        const next = sanitizeModularGarmentAccess(
          updater(resolveModularAvatarState(p.modularAvatar)),
          owned,
        )
        return {
          ...p,
          modularAvatar: sanitizeModularAvatarState(next),
        }
      })
    },
    [setProfileStore],
  )

  const setProfilePhotoDataUrl = useCallback(
    (url: string | null) => {
      setProfileStore((p) => {
        const next = { ...p }
        if (url) next.profilePhotoDataUrl = url
        else delete next.profilePhotoDataUrl
        return next
      })
    },
    [setProfileStore],
  )

  const creditWonBets = useCallback(
    (wonBetIds: string[]) => {
      const credited = profile.creditedBetIds ?? []
      const toCredit = wonBetIds.filter((id) => !credited.includes(id))
      if (toCredit.length === 0) return
      const xpGain = toCredit.length * 35
      setProfileStore((p) => ({
        ...p,
        xp: p.xp + xpGain,
        creditedBetIds: [...(p.creditedBetIds ?? []), ...toCredit],
      }))
    },
    [profile.creditedBetIds, setProfileStore],
  )

  const safeProfile = useMemo(() => {
    const jerseyCustomizations =
      profile.jerseyCustomizations &&
      typeof profile.jerseyCustomizations === 'object' &&
      !Array.isArray(profile.jerseyCustomizations)
        ? profile.jerseyCustomizations
        : {}
    return {
      ...profile,
      // La photo perso est désactivée: l'identité visuelle provient du personnage Talk Foot.
      profilePhotoDataUrl: undefined,
      level: computedLevel,
      ownedItemIds: Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : [],
      equippedItems: (() => {
        if (profile.equippedItems && typeof profile.equippedItems === 'object') {
          return { ...EQUIPPED_BASE, ...profile.equippedItems }
        }
        return { ...EQUIPPED_BASE }
      })(),
      characterLook: mergeCharacterLook(profile.characterLook),
      jerseyCustomizations,
      avatarLoadout: resolveAvatarLoadout(profile),
      modularAvatar: sanitizeModularAvatarState(
        sanitizeModularGarmentAccess(
          resolveModularAvatarState(profile.modularAvatar),
          Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : [],
        ),
      ),
      premiumInventory: {
        ownedItemIds: Array.from(
          new Set([
            ...(profile.premiumInventory?.ownedItemIds ?? []),
            ...(Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : []).filter((id) =>
              styleCatalog.some((it) => it.id === id),
            ),
          ]),
        ),
        equippedByCategory: {
          kit: profile.premiumInventory?.equippedByCategory?.kit ?? profile.equippedItems?.jersey ?? undefined,
          accessory:
            profile.premiumInventory?.equippedByCategory?.accessory ??
            profile.equippedItems?.accessory ??
            undefined,
        },
      },
    }
  }, [profile, computedLevel])

  return {
    profile: safeProfile,
    tier,
    xpProgress,
    xpForNextLevel,
    addXp,
    equipItem,
    unequipSlot,
    addOwnedItem,
    updateCharacterLook,
    setJerseyCustomization,
    setProfilePhotoDataUrl,
    updateModularAvatar,
    creditWonBets,
    ownsItem: (id: string) =>
      catalogItemOwned(id, Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : []),
    setProfile: setProfileStore,
  }
}
