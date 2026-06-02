import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorage'
import {
  DEMO_FAN_ONBOARDING_EVERY_LOGIN,
  PENDING_FAN_ONBOARDING_KEY,
} from '../constants/fanSession'
import type { FanPreferencesStoredShape } from '../types/fanPreferences'
import { useOptionalCloudUserState } from './CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

export type { FanPreferencesStoredShape }

const STORAGE_KEY = 'talkfoot.fanPreferences.v1'
const MAX_FAVORITE_CLUBS = 3
const MAX_FAVORITE_NATIONS = 5

type StoredShape = FanPreferencesStoredShape

function normalizeClubIds(stored: StoredShape): string[] {
  const fromArray = stored.favoriteClubIds
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return [...new Set(fromArray.filter(Boolean))].slice(0, MAX_FAVORITE_CLUBS)
  }
  if (stored.favoriteClubId) return [stored.favoriteClubId]
  return []
}

function normalizeNationIsos(stored: StoredShape): string[] {
  const raw = stored.favoriteNationIsos
  if (!Array.isArray(raw)) return []
  return [
    ...new Set(
      raw.filter((v): v is string => typeof v === 'string' && v.length > 0).map((v) => v.toUpperCase()),
    ),
  ].slice(0, MAX_FAVORITE_NATIONS)
}

export type FanPreferencesState = {
  favoriteLeagueId: string | null
  /** Premier club (rétrocompat & teinte maillot) */
  favoriteClubId: string | null
  /** Jusqu’à 3 clubs dans la ligue favorite */
  favoriteClubIds: string[]
  /** Sélections nationales suivies (ISO-3) */
  favoriteNationIsos: string[]
  /** Onboarding terminé dès qu’une ligue favorite est choisie (clubs optionnels) */
  preferencesComplete: boolean
  hideRivalSalons: boolean
  virageMode: boolean
}

type FanPreferencesContextValue = FanPreferencesState & {
  setFavoriteLeagueId: (id: string | null) => void
  setFavoriteClubId: (id: string | null) => void
  setFavoriteClubIds: (ids: string[]) => void
  setFavoriteNationIsos: (isos: string[]) => void
  toggleFavoriteNation: (iso: string) => void
  isNationFavorite: (iso: string) => boolean
  maxFavoriteNations: number
  setHideRivalSalons: (v: boolean) => void
  setVirageMode: (v: boolean) => void
  completeOnboarding: (leagueId: string, clubIds: string[]) => void
  resetPreferences: () => void
  openOnboarding: () => void
  onboardingOpen: boolean
  closeOnboarding: () => void
}

const FanPreferencesContext = createContext<FanPreferencesContextValue | null>(null)

export function FanPreferencesProvider({ children }: { children: React.ReactNode }) {
  const cloud = useOptionalCloudUserState()
  const persistLocal = !isSupabaseConfigured()
  const [localStored, setLocalStored] = useLocalStorageState<StoredShape>(
    STORAGE_KEY,
    {},
    (p) => p !== null && typeof p === 'object' && !Array.isArray(p),
    { persist: persistLocal },
  )
  const stored = cloud !== undefined ? cloud.app.fanPreferences : localStored
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const consumedPostLoginFlag = useRef(false)

  const state: FanPreferencesState = useMemo(() => {
    const favoriteClubIds = normalizeClubIds(stored)
    const favoriteClubId = favoriteClubIds[0] ?? null
    return {
      favoriteLeagueId: stored.favoriteLeagueId ?? null,
      favoriteClubId,
      favoriteClubIds,
      favoriteNationIsos: normalizeNationIsos(stored),
      preferencesComplete: stored.preferencesComplete ?? false,
      hideRivalSalons: stored.hideRivalSalons ?? false,
      virageMode: stored.virageMode ?? false,
    }
  }, [stored])

  /** Modal config : uniquement juste après la connexion (flag session), pas à chaque visite */
  useEffect(() => {
    if (consumedPostLoginFlag.current) return
    try {
      if (sessionStorage.getItem(PENDING_FAN_ONBOARDING_KEY) === '1') {
        consumedPostLoginFlag.current = true
        sessionStorage.removeItem(PENDING_FAN_ONBOARDING_KEY)
        if (DEMO_FAN_ONBOARDING_EVERY_LOGIN || !state.preferencesComplete) {
          setOnboardingOpen(true)
        }
      }
    } catch {
      /* ignore */
    }
  }, [state.preferencesComplete])

  const patch = useCallback(
    (p: Partial<StoredShape>) => {
      const mergeInto = (prev: StoredShape): StoredShape => {
        const next = { ...prev, ...p }
        if (next.favoriteClubIds !== undefined) {
          const ids = [...new Set((next.favoriteClubIds ?? []).filter(Boolean))].slice(
            0,
            MAX_FAVORITE_CLUBS,
          )
          next.favoriteClubIds = ids
          next.favoriteClubId = ids[0] ?? null
        } else if (next.favoriteClubId !== undefined && next.favoriteClubIds === undefined) {
          const id = next.favoriteClubId
          next.favoriteClubIds = id ? [id] : []
        }
        if (next.favoriteNationIsos !== undefined) {
          next.favoriteNationIsos = [
            ...new Set(
              (next.favoriteNationIsos ?? [])
                .filter((v): v is string => typeof v === 'string' && v.length > 0)
                .map((v) => v.toUpperCase()),
            ),
          ].slice(0, MAX_FAVORITE_NATIONS)
        }
        return next
      }
      if (cloud) {
        cloud.patchFanPreferences(mergeInto(cloud.app.fanPreferences))
      } else {
        setLocalStored((prev) => mergeInto(prev))
      }
    },
    [cloud, setLocalStored],
  )

  const setFavoriteLeagueId = useCallback(
    (id: string | null) => patch({ favoriteLeagueId: id }),
    [patch],
  )
  const setFavoriteClubId = useCallback(
    (id: string | null) => patch({ favoriteClubId: id, favoriteClubIds: id ? [id] : [] }),
    [patch],
  )
  const setFavoriteClubIds = useCallback(
    (ids: string[]) =>
      patch({
        favoriteClubIds: [...new Set(ids.filter(Boolean))].slice(0, MAX_FAVORITE_CLUBS),
      }),
    [patch],
  )
  const setFavoriteNationIsos = useCallback(
    (isos: string[]) =>
      patch({
        favoriteNationIsos: isos
          .map((v) => v.toUpperCase())
          .filter((v): v is string => typeof v === 'string' && v.length > 0),
      }),
    [patch],
  )
  const toggleFavoriteNation = useCallback(
    (iso: string) => {
      const code = iso.toUpperCase()
      const current = state.favoriteNationIsos
      const exists = current.includes(code)
      const next = exists ? current.filter((c) => c !== code) : [code, ...current]
      patch({ favoriteNationIsos: next.slice(0, MAX_FAVORITE_NATIONS) })
    },
    [patch, state.favoriteNationIsos],
  )
  const isNationFavorite = useCallback(
    (iso: string) => state.favoriteNationIsos.includes(iso.toUpperCase()),
    [state.favoriteNationIsos],
  )
  const setHideRivalSalons = useCallback(
    (v: boolean) => patch({ hideRivalSalons: v }),
    [patch],
  )
  const setVirageMode = useCallback((v: boolean) => patch({ virageMode: v }), [patch])

  const completeOnboarding = useCallback(
    (leagueId: string, clubIds: string[]) => {
      const ids = [...new Set(clubIds.filter(Boolean))].slice(0, MAX_FAVORITE_CLUBS)
      patch({
        favoriteLeagueId: leagueId,
        favoriteClubIds: ids,
        favoriteClubId: ids[0] ?? null,
        preferencesComplete: true,
      })
      setOnboardingOpen(false)
    },
    [patch],
  )

  const resetPreferences = useCallback(() => {
    if (cloud) {
      cloud.patchApp((prev) => ({ ...prev, fanPreferences: {} }))
      cloud.setOnboardingComplete(false)
    } else {
      setLocalStored({})
    }
    setOnboardingOpen(true)
  }, [cloud, setLocalStored])

  const openOnboarding = useCallback(() => setOnboardingOpen(true), [])
  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      setFavoriteLeagueId,
      setFavoriteClubId,
      setFavoriteClubIds,
      setFavoriteNationIsos,
      toggleFavoriteNation,
      isNationFavorite,
      maxFavoriteNations: MAX_FAVORITE_NATIONS,
      setHideRivalSalons,
      setVirageMode,
      completeOnboarding,
      resetPreferences,
      openOnboarding,
      closeOnboarding,
      onboardingOpen,
    }),
    [
      state,
      setFavoriteLeagueId,
      setFavoriteClubId,
      setFavoriteClubIds,
      setFavoriteNationIsos,
      toggleFavoriteNation,
      isNationFavorite,
      setHideRivalSalons,
      setVirageMode,
      completeOnboarding,
      resetPreferences,
      openOnboarding,
      closeOnboarding,
      onboardingOpen,
    ],
  )

  return (
    <FanPreferencesContext.Provider value={value}>{children}</FanPreferencesContext.Provider>
  )
}

export function useFanPreferences() {
  const ctx = useContext(FanPreferencesContext)
  if (!ctx) throw new Error('useFanPreferences must be used within FanPreferencesProvider')
  return ctx
}
