import { useCallback, useMemo } from 'react'
import type { AvatarCharacterLook, AvatarSlot, JerseyCustomization, UserProfile } from '../types/profile'
import { useLocalStorageState } from './useLocalStorage'
import { levelFromXp, getLevelTier, xpPerLevel } from '../data/shop'
import { DEFAULT_CHARACTER_LOOK, mergeCharacterLook } from '../data/characterPresets'

const PROFILE_KEY = 'talkfoot.profile.v1'

const defaultProfile: UserProfile = {
  level: 1,
  xp: 45,
  equippedItems: { scarf: null, hat: null, jersey: null, accessory: null },
  ownedItemIds: [],
  characterLook: DEFAULT_CHARACTER_LOOK,
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
  return true
}

export function useProfile() {
  const [profile, setProfile] = useLocalStorageState<UserProfile>(
    PROFILE_KEY,
    defaultProfile,
    isUserProfileStored,
  )

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
      setProfile((p) => ({ ...p, xp: p.xp + amount }))
    },
    [setProfile],
  )

  const equipItem = useCallback(
    (itemId: string, slot: AvatarSlot) => {
      setProfile((p) => {
        if (!(Array.isArray(p.ownedItemIds) ? p.ownedItemIds : []).includes(itemId)) return p
        const current = p.equippedItems && typeof p.equippedItems === 'object' ? p.equippedItems : { scarf: null, hat: null, jersey: null, accessory: null }
        return {
          ...p,
          equippedItems: { ...current, [slot]: itemId },
        }
      })
    },
    [setProfile],
  )

  const unequipSlot = useCallback(
    (slot: AvatarSlot) => {
      setProfile((p) => ({
        ...p,
        equippedItems: { scarf: null, hat: null, jersey: null, accessory: null, ...(p.equippedItems && typeof p.equippedItems === 'object' ? p.equippedItems : {}), [slot]: null },
      }))
    },
    [setProfile],
  )

  const addOwnedItem = useCallback(
    (itemId: string) => {
      setProfile((p) => {
        const ids = Array.isArray(p.ownedItemIds) ? p.ownedItemIds : []
        return ids.includes(itemId) ? p : { ...p, ownedItemIds: [...ids, itemId] }
      })
    },
    [setProfile],
  )

  const updateCharacterLook = useCallback(
    (patch: Partial<AvatarCharacterLook>) => {
      setProfile((p) => {
        const base = mergeCharacterLook(p.characterLook ?? {})
        return { ...p, characterLook: { ...base, ...patch } }
      })
    },
    [setProfile],
  )

  const setJerseyCustomization = useCallback(
    (jerseyId: string, data: JerseyCustomization) => {
      setProfile((p) => ({
        ...p,
        jerseyCustomizations: {
          ...(typeof p.jerseyCustomizations === 'object' && p.jerseyCustomizations !== null
            ? p.jerseyCustomizations
            : {}),
          [jerseyId]: data,
        },
      }))
    },
    [setProfile],
  )

  const creditWonBets = useCallback(
    (wonBetIds: string[]) => {
      const credited = profile.creditedBetIds ?? []
      const toCredit = wonBetIds.filter((id) => !credited.includes(id))
      if (toCredit.length === 0) return
      const xpGain = toCredit.length * 35
      setProfile((p) => ({
        ...p,
        xp: p.xp + xpGain,
        creditedBetIds: [...(p.creditedBetIds ?? []), ...toCredit],
      }))
    },
    [profile.creditedBetIds, setProfile],
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
      level: computedLevel,
      ownedItemIds: Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : [],
      equippedItems: (() => {
        const def = { scarf: null, hat: null, jersey: null, accessory: null } as Record<AvatarSlot, string | null>
        if (profile.equippedItems && typeof profile.equippedItems === 'object') {
          return { ...def, ...profile.equippedItems }
        }
        return def
      })(),
      characterLook: mergeCharacterLook(profile.characterLook),
      jerseyCustomizations,
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
    creditWonBets,
    ownsItem: (id: string) => (Array.isArray(profile.ownedItemIds) ? profile.ownedItemIds : []).includes(id),
    setProfile,
  }
}
