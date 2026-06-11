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
import { useSession } from '@clerk/clerk-react'
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
import { isClerkAuthMode } from '../lib/supabase/talkfootSession'
import { ensureTalkFootSupabaseSession } from '../lib/supabase/talkfootSession'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR } from '../utils/bannedWords'
import { changeDisplayNameCloud, checkDisplayNameAvailabilityCloud } from '../lib/supabase/displayName'
import {
  ensureTalkfootProfile,
  fetchTalkfootProfileSnapshot,
  saveTalkfootProfileAppState,
} from '../lib/supabase/profileAppState'
import { bindTalkfootActorSession } from '../lib/supabase/bindTalkfootActorSession'
import { useAuth } from './AuthContext'

type CloudUserStateValue = {
  /** Profil cloud chargé (évite d’écraser le serveur avant hydratation). */
  syncReady: boolean
  app: UserAppStateV1
  /** True tant que le compte Google/Apple n’a pas validé pseudo + infos perso. */
  oauthNeedsProfile: boolean
  /** Mise à jour fonctionnelle de tout le blob synchronisé */
  patchApp: (fn: (prev: UserAppStateV1) => UserAppStateV1) => void
  patchFanPreferences: (p: Partial<FanPreferencesStoredShape>) => void
  setOnboardingComplete: (v: boolean) => void
  completeOauthProfile: (displayName: string, aboutLine?: string) => Promise<void>
  /** Force l’écriture cloud immédiate (ex. achat boutique). */
  flushAppSave: () => Promise<{ ok: boolean; error?: string }>
  /** Annule une sauvegarde différée en attente (évite d’écraser un RPC serveur). */
  cancelScheduledSave: () => void
}

const CloudUserStateContext = createContext<CloudUserStateValue | undefined>(undefined)

export function useOptionalCloudUserState(): CloudUserStateValue | undefined {
  return useContext(CloudUserStateContext)
}

const SAVE_DEBOUNCE_MS = 650
const CLOUD_LOAD_RETRIES = 3
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isTransientAuthLockError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('lock broken') || m.includes("'steal'") || m.includes('navigator lock')
}

function cloudErrorMessageFr(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'cloud_load_failed')
  if (isTransientAuthLockError(raw)) {
    return 'Synchronisation interrompue (onglet ou connexion). Recharge la page si ça persiste.'
  }
  return raw
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function isUuid(value: string | undefined | null): boolean {
  if (!value) return false
  return UUID_RE.test(value)
}

function profileScopeUpdate(sb: ReturnType<typeof getSupabaseBrowserClient>, userId: string) {
  if (!sb) return null
  const query = sb.from('profiles').update({ oauth_profile_completed: true })
  return isUuid(userId) ? query.eq('id', userId) : query.eq('clerk_id', userId)
}

export function CloudUserStateGate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) return <>{children}</>
  if (isClerkAuthMode()) {
    return <CloudUserStateLoaderClerk>{children}</CloudUserStateLoaderClerk>
  }
  return <CloudUserStateLoader clerkSessionId={null}>{children}</CloudUserStateLoader>
}

function CloudUserStateLoaderClerk({ children }: { children: ReactNode }) {
  const { session } = useSession()
  return <CloudUserStateLoader clerkSessionId={session?.id ?? null}>{children}</CloudUserStateLoader>
}

function CloudUserStateLoader({
  children,
  clerkSessionId,
}: {
  children: ReactNode
  clerkSessionId: string | null
}) {
  const { user, refreshAuthUser } = useAuth()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [app, setApp] = useState<UserAppStateV1>(() => defaultUserAppState())
  const [onboardingCompleteCol, setOnboardingCompleteCol] = useState(false)
  const [oauthNeedsProfile, setOauthNeedsProfile] = useState(false)

  const appRef = useRef(app)
  const ocRef = useRef(onboardingCompleteCol)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLocalEditsRef = useRef(false)
  const loadUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    appRef.current = app
  }, [app])
  useEffect(() => {
    ocRef.current = onboardingCompleteCol
  }, [onboardingCompleteCol])

  const flushSave = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const sb = getSupabaseBrowserClient()
    if (!sb || !user?.id) return { ok: false, error: 'no_session' }
    try {
      await saveTalkfootProfileAppState(sb, user.id, appRef.current, ocRef.current)
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'rpc_save_failed'
      console.error('[Talk Foot] Sauvegarde profil cloud:', message)
      return { ok: false, error: message }
    }
  }, [user?.id])

  const cancelScheduledSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [])

  const scheduleSave = useCallback(() => {
    cancelScheduledSave()
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void flushSave()
    }, SAVE_DEBOUNCE_MS)
  }, [flushSave, cancelScheduledSave])

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
    if (loadUserIdRef.current !== user.id) {
      loadUserIdRef.current = user.id
      hasLocalEditsRef.current = false
      setReady(false)
    }
    let cancelled = false
    ;(async () => {
      const sb = getSupabaseBrowserClient()
      if (!sb) {
        setReady(true)
        return
      }
      setLoadError(null)
      const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Supporter'

      const applySnapshot = (appState: unknown, onboardingComplete: boolean, oauthCompleted: boolean) => {
        if (!hasLocalEditsRef.current) {
          setApp(mergeUserAppState(appState))
          setOnboardingCompleteCol(onboardingComplete)
          setOauthNeedsProfile(!oauthCompleted)
        }
        setReady(true)
      }

      let lastErr: unknown = null
      for (let attempt = 0; attempt < CLOUD_LOAD_RETRIES; attempt += 1) {
        try {
          if (attempt > 0) await sleep(400 * attempt)
          if (cancelled) return

          await ensureTalkFootSupabaseSession(sb)
          if (cancelled) return

          if (isClerkAuthMode()) {
            const bindResult = await bindTalkfootActorSession(sb, user.id, clerkSessionId)
            if (cancelled) return
            if (!bindResult.ok) {
              setApp(defaultUserAppState())
              setLoadError(`Liaison session cloud échouée (${bindResult.error}). Recharge la page.`)
              setOnboardingCompleteCol(false)
              setOauthNeedsProfile(false)
              setReady(true)
              return
            }
          }

          let snapshot = await fetchTalkfootProfileSnapshot(sb, user.id)
          if (cancelled) return

          if (!snapshot) {
            const { data: authPayload } = await sb.auth.getUser()
            const prov = authPayload.user?.app_metadata?.provider
            const oauthIncomplete = Boolean(prov && isTalkFootOAuthProvider(prov))
            snapshot = await ensureTalkfootProfile(sb, user.id, displayName, !oauthIncomplete)
          }

          if (cancelled) return
          const mergedApp = mergeUserAppState(snapshot.appState)
          applySnapshot(snapshot.appState, snapshot.onboardingComplete, snapshot.oauthProfileCompleted)

          if (!hasLocalEditsRef.current) {
            try {
              const rawJson = JSON.stringify(snapshot.appState ?? {})
              const mergedJson = JSON.stringify(mergedApp)
              if (rawJson !== mergedJson) {
                await saveTalkfootProfileAppState(sb, user.id, mergedApp, snapshot.onboardingComplete)
              }
            } catch (err) {
              console.warn('[Talk Foot] Migration app_state cloud:', err)
            }
          }
          return
        } catch (err) {
          lastErr = err
          const message = err instanceof Error ? err.message : String(err ?? '')
          if (isTransientAuthLockError(message) && attempt < CLOUD_LOAD_RETRIES - 1) {
            continue
          }
          break
        }
      }

      if (cancelled) return
      const friendly = cloudErrorMessageFr(lastErr)
      if (isTransientAuthLockError(friendly)) {
        setLoadError(friendly)
        setReady(true)
        return
      }
      setApp(defaultUserAppState())
      setLoadError(friendly)
      setOnboardingCompleteCol(false)
      setOauthNeedsProfile(false)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.displayName, user?.email, clerkSessionId])

  const patchApp = useCallback(
    (fn: (prev: UserAppStateV1) => UserAppStateV1) => {
      hasLocalEditsRef.current = true
      setApp((prev) => {
        const next = fn(prev)
        appRef.current = next
        if (ready) scheduleSave()
        return next
      })
    },
    [scheduleSave, ready],
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
      if (ready) scheduleSave()
    },
    [scheduleSave, ready],
  )

  const completeOauthProfile = useCallback(
    async (displayName: string, aboutLine?: string) => {
      const sb = getSupabaseBrowserClient()
      if (!sb || !user?.id) {
        throw new Error('Connexion cloud indisponible. Recharge la page puis réessaie.')
      }
      const name = displayName.trim() || 'Supporteur'
      const about = aboutLine?.trim().slice(0, 160) ?? ''
      if (containsBannedWord(name) || (about && containsBannedWord(about))) {
        throw new Error(MODERATION_REFUSED_MESSAGE_FR)
      }
      const availability = await checkDisplayNameAvailabilityCloud(sb, name, user.id)
      if (!availability.available) {
        const hint =
          availability.error === 'taken' && availability.suggestions?.length
            ? ` Suggestions : ${availability.suggestions.join(', ')}`
            : ''
        throw new Error(`${availability.message}${hint}`)
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
      const scopedUpdate = profileScopeUpdate(sb, user.id)
      const { error } = scopedUpdate ? await scopedUpdate : { error: null }
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
      syncReady: ready,
      oauthNeedsProfile,
      app: {
        ...app,
        wallet: normalizeWallet(app.wallet),
      },
      patchApp,
      patchFanPreferences,
      setOnboardingComplete,
      completeOauthProfile,
      flushAppSave: flushSave,
      cancelScheduledSave,
    }),
    [
      ready,
      app,
      oauthNeedsProfile,
      patchApp,
      patchFanPreferences,
      setOnboardingComplete,
      completeOauthProfile,
      flushSave,
      cancelScheduledSave,
    ],
  )

  if (!user?.id) {
    return <>{children}</>
  }

  return (
    <CloudUserStateContext.Provider value={value}>
      {!ready ? (
        <div
          className="border-b border-sky-200/80 bg-sky-50/95 px-4 py-1.5 text-center text-[11px] font-bold text-sky-950"
          role="status"
          aria-live="polite"
        >
          Synchronisation du compte…
        </div>
      ) : null}
      {loadError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-950">
          Cloud partiellement indisponible — {loadError}
        </div>
      ) : null}
      {children}
    </CloudUserStateContext.Provider>
  )
}
