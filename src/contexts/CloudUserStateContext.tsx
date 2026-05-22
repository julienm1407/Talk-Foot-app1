import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  defaultUserAppState,
  mergeUserAppState,
  type UserAppStateV1,
} from '../data/userAppStateDefaults'
import { normalizeWallet } from '../utils/walletNormalize'
import type { FanPreferencesStoredShape } from '../types/fanPreferences'
import { isTalkFootOAuthProvider } from '../config/oauthProviders'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../utils/bannedWords'
import { changeDisplayNameCloud } from '../lib/supabase/displayName'

type CloudUserStateValue = {
  ready: true
  app: UserAppStateV1
  /** True tant que le compte Google/Apple n’a pas validé pseudo + infos perso. */
  oauthNeedsProfile: boolean
  /** Mise à jour fonctionnelle de tout le blob synchronisé */
  patchApp: (fn: (prev: UserAppStateV1) => UserAppStateV1) => void
  patchFanPreferences: (p: Partial<FanPreferencesStoredShape>) => void
  setOnboardingComplete: (v: boolean) => void
  completeOauthProfile: (displayName: string, aboutLine?: string) => Promise<void>
}

const CloudUserStateContext = createContext<CloudUserStateValue | undefined>(undefined)

export function useOptionalCloudUserState(): CloudUserStateValue | undefined {
  return useContext(CloudUserStateContext)
}

const SAVE_DEBOUNCE_MS = 650
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string | undefined | null): boolean {
  if (!value) return false
  return UUID_RE.test(value)
}

function profileEq(query: any, userId: string) {
  return isUuid(userId) ? query.eq('id', userId) : query.eq('clerk_id', userId)
}

export function CloudUserStateGate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) return <>{children}</>
  return <CloudUserStateLoader>{children}</CloudUserStateLoader>
}

function CloudUserStateLoader({ children }: { children: ReactNode }) {
  const { user, refreshAuthUser } = useAuth()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [app, setApp] = useState<UserAppStateV1>(() => defaultUserAppState())
  const [onboardingCompleteCol, setOnboardingCompleteCol] = useState(false)
  const [oauthNeedsProfile, setOauthNeedsProfile] = useState(false)

  const appRef = useRef(app)
  const ocRef = useRef(onboardingCompleteCol)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    appRef.current = app
  }, [app])
  useEffect(() => {
    ocRef.current = onboardingCompleteCol
  }, [onboardingCompleteCol])

  const flushSave = useCallback(async () => {
    const sb = getSupabaseBrowserClient()
    if (!sb || !user?.id) return
    const { error } = await profileEq(
      sb
      .from('profiles')
      .update({
        app_state: appRef.current,
        onboarding_complete: ocRef.current,
      }),
      user.id,
    )
    if (error) console.error('[Talk Foot] Sauvegarde profil cloud:', error.message)
  }, [user?.id])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void flushSave()
    }, SAVE_DEBOUNCE_MS)
  }, [flushSave])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setReady(true)
      return
    }
    let cancelled = false
    ;(async () => {
      const sb = getSupabaseBrowserClient()
      if (!sb) {
        setReady(true)
        return
      }
      setLoadError(null)
      let { data, error } = await profileEq(sb.from('profiles').select('*'), user.id).maybeSingle()
      if (cancelled) return
      if (error) {
        await new Promise((r) => setTimeout(r, 400))
        if (cancelled) return
        ;({ data, error } = await profileEq(sb.from('profiles').select('*'), user.id).maybeSingle())
      }
      if (cancelled) return
      if (error) {
        setApp(defaultUserAppState())
        setLoadError(error.message)
        setOnboardingCompleteCol(false)
        setOauthNeedsProfile(false)
        setReady(true)
        return
      }
      if (!data) {
        const { data: authPayload } = await sb.auth.getUser()
        const prov = authPayload.user?.app_metadata?.provider
        const oauthIncomplete = Boolean(prov && isTalkFootOAuthProvider(prov))
        const insertPayload = isUuid(user.id)
          ? {
              id: user.id,
              display_name: user.email?.split('@')[0] ?? 'Supporter',
              onboarding_complete: false,
              app_state: {},
              oauth_profile_completed: !oauthIncomplete,
              clerk_id: user.id,
            }
          : {
              clerk_id: user.id,
              display_name: user.email?.split('@')[0] ?? 'Supporter',
              onboarding_complete: false,
              app_state: {},
              oauth_profile_completed: !oauthIncomplete,
            }
        const { error: insErr } = await sb.from('profiles').insert(insertPayload)
        if (insErr) {
          const { data: again } = await profileEq(sb.from('profiles').select('*'), user.id).maybeSingle()
          if (again) {
            setApp(mergeUserAppState(again.app_state))
            setOnboardingCompleteCol(Boolean(again.onboarding_complete))
            setOauthNeedsProfile(again.oauth_profile_completed === false)
          } else {
            setApp(defaultUserAppState())
            setLoadError(insErr.message)
            setOnboardingCompleteCol(false)
            setOauthNeedsProfile(false)
          }
        } else {
          setApp(defaultUserAppState())
          setOnboardingCompleteCol(false)
          setOauthNeedsProfile(oauthIncomplete)
        }
        setReady(true)
        return
      }
      setApp(mergeUserAppState(data.app_state))
      setOnboardingCompleteCol(Boolean(data.onboarding_complete))
      setOauthNeedsProfile(data.oauth_profile_completed === false)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.email])

  const patchApp = useCallback(
    (fn: (prev: UserAppStateV1) => UserAppStateV1) => {
      setApp((prev) => {
        const next = fn(prev)
        appRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave],
  )

  const patchFanPreferences = useCallback(
    (p: Partial<FanPreferencesStoredShape>) => {
      patchApp((prev) => {
        const nextFan = { ...prev.fanPreferences, ...p }
        if (p.preferencesComplete === true) {
          setOnboardingCompleteCol(true)
          ocRef.current = true
        }
        return { ...prev, fanPreferences: nextFan }
      })
    },
    [patchApp],
  )

  const setOnboardingComplete = useCallback(
    (v: boolean) => {
      setOnboardingCompleteCol(v)
      ocRef.current = v
      scheduleSave()
    },
    [scheduleSave],
  )

  const completeOauthProfile = useCallback(
    async (displayName: string, aboutLine?: string) => {
      const sb = getSupabaseBrowserClient()
      if (!sb || !user?.id) return
      const name = displayName.trim() || 'Supporteur'
      const about = aboutLine?.trim().slice(0, 160) ?? ''
      if (containsBannedWord(name) || (about && containsBannedWord(about))) {
        throw new Error(MODERATION_REFUSED_MESSAGE_FR)
      }
      const claimed = await changeDisplayNameCloud(sb, user.id, name)
      if (!claimed.ok) {
        const hint =
          claimed.error === 'taken' && claimed.suggestions?.length
            ? ` Suggestions : ${claimed.suggestions.join(', ')}`
            : ''
        throw new Error(`${claimed.message}${hint}`)
      }
      const { error: authErr } = await sb.auth.updateUser({ data: { display_name: claimed.displayName } })
      if (authErr) {
        console.error('[Talk Foot] Auth metadata:', authErr.message)
        throw new Error(authErr.message)
      }
      const scopedUpdate = profileEq(
        sb.from('profiles').update({ oauth_profile_completed: true }),
        user.id,
      )
      const { error } = await scopedUpdate
      if (error) {
        console.error('[Talk Foot] Profil OAuth:', error.message)
        throw new Error(error.message)
      }
      if (about) {
        patchApp((prev) => ({
          ...prev,
          profile: { ...prev.profile, aboutLine: about },
        }))
      }
      setOauthNeedsProfile(false)
      await refreshAuthUser()
      void flushSave()
    },
    [user?.id, refreshAuthUser, flushSave, patchApp],
  )

  const value = useMemo<CloudUserStateValue>(
    () => ({
      ready: true,
      oauthNeedsProfile,
      app: {
        ...app,
        wallet: normalizeWallet(app.wallet),
      },
      patchApp,
      patchFanPreferences,
      setOnboardingComplete,
      completeOauthProfile,
    }),
    [app, oauthNeedsProfile, patchApp, patchFanPreferences, setOnboardingComplete, completeOauthProfile],
  )

  if (!user?.id) {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
        <div className="tf-page-backdrop" aria-hidden />
        <p className="relative text-sm font-semibold text-tf-grey">Synchronisation de ton compte…</p>
      </div>
    )
  }

  return (
    <CloudUserStateContext.Provider value={value}>
      {loadError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-950">
          Cloud partiellement indisponible ({loadError}). Tes changements peuvent ne pas être enregistrés.
        </div>
      ) : null}
      {children}
    </CloudUserStateContext.Provider>
  )
}
