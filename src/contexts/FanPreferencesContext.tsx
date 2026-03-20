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
import { PENDING_FAN_ONBOARDING_KEY } from '../constants/fanSession'

const STORAGE_KEY = 'talkfoot.fanPreferences.v1'

export type FanPreferencesState = {
  favoriteLeagueId: string | null
  favoriteClubId: string | null
  /** Onboarding terminé (club + ligue choisis) */
  preferencesComplete: boolean
  /** Masquer totalement les salons des clubs rivaux (sinon lecture seule) */
  hideRivalSalons: boolean
  /** Mode Virage : live / commentaires filtrés sur ton club uniquement */
  virageMode: boolean
}

type FanPreferencesContextValue = FanPreferencesState & {
  setFavoriteLeagueId: (id: string | null) => void
  setFavoriteClubId: (id: string | null) => void
  setHideRivalSalons: (v: boolean) => void
  setVirageMode: (v: boolean) => void
  completeOnboarding: (leagueId: string, clubId: string) => void
  resetPreferences: () => void
  openOnboarding: () => void
  onboardingOpen: boolean
  closeOnboarding: () => void
}

const FanPreferencesContext = createContext<FanPreferencesContextValue | null>(null)

export function FanPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useLocalStorageState<Partial<FanPreferencesState>>(
    STORAGE_KEY,
    {},
    (p) => p !== null && typeof p === 'object' && !Array.isArray(p),
  )
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const consumedPostLoginFlag = useRef(false)

  const state: FanPreferencesState = useMemo(
    () => ({
      favoriteLeagueId: stored.favoriteLeagueId ?? null,
      favoriteClubId: stored.favoriteClubId ?? null,
      preferencesComplete: stored.preferencesComplete ?? false,
      hideRivalSalons: stored.hideRivalSalons ?? false,
      virageMode: stored.virageMode ?? false,
    }),
    [stored],
  )

  /** Modal config : uniquement juste après la connexion (flag session), pas à chaque visite */
  useEffect(() => {
    if (consumedPostLoginFlag.current) return
    try {
      if (sessionStorage.getItem(PENDING_FAN_ONBOARDING_KEY) === '1') {
        consumedPostLoginFlag.current = true
        sessionStorage.removeItem(PENDING_FAN_ONBOARDING_KEY)
        if (!state.preferencesComplete) {
          setOnboardingOpen(true)
        }
      }
    } catch {
      /* ignore */
    }
  }, [state.preferencesComplete])

  const patch = useCallback(
    (p: Partial<FanPreferencesState>) => {
      setStored((prev) => ({ ...prev, ...p }))
    },
    [setStored],
  )

  const setFavoriteLeagueId = useCallback(
    (id: string | null) => patch({ favoriteLeagueId: id }),
    [patch],
  )
  const setFavoriteClubId = useCallback(
    (id: string | null) => patch({ favoriteClubId: id }),
    [patch],
  )
  const setHideRivalSalons = useCallback(
    (v: boolean) => patch({ hideRivalSalons: v }),
    [patch],
  )
  const setVirageMode = useCallback((v: boolean) => patch({ virageMode: v }), [patch])

  const completeOnboarding = useCallback(
    (leagueId: string, clubId: string) => {
      patch({
        favoriteLeagueId: leagueId,
        favoriteClubId: clubId,
        preferencesComplete: true,
      })
      setOnboardingOpen(false)
    },
    [patch],
  )

  const resetPreferences = useCallback(() => {
    setStored({})
    setOnboardingOpen(true)
  }, [setStored])

  const openOnboarding = useCallback(() => setOnboardingOpen(true), [])
  const closeOnboarding = useCallback(() => {
    if (state.preferencesComplete) setOnboardingOpen(false)
  }, [state.preferencesComplete])

  const value = useMemo(
    () => ({
      ...state,
      setFavoriteLeagueId,
      setFavoriteClubId,
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
