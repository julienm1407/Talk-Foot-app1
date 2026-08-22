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
import { useLocation } from 'react-router-dom'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  defaultUserAppState,
  mergeUserAppState,
  type UserAppStateV1,
} from '../data/userAppStateDefaults'
import { coerceModularAvatarFromStored, resolveModularAvatarState } from '../features/avatar2d/modularAvatarState'
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
  saveTalkfootProfileAppStateWithChatSync,
} from '../lib/supabase/profileAppState'
import { bindTalkfootActorSession } from '../lib/supabase/bindTalkfootActorSession'
import { invalidateChatAuthorAvatars } from '../hooks/useChatAuthorModularAvatars'
import {
  coalesceAppStateWithModularBackup,
  extractStoredModularAvatar,
  mergeModularAvatarBackupIntoApp,
  isLikelyDefaultModularAvatar,
  wouldDowngradeModularAvatar,
  writeModularAvatarBackup,
} from '../utils/modularAvatarBackup'
import {
  coalesceAppStateWithWalletBackup,
  mergeWalletBackupIntoApp,
  writeWalletBackup,
} from '../utils/walletBackup'
import {
  coalesceAppStateWithBetsBackup,
  mergeBetsBackupIntoApp,
  writeBetsBackup,
} from '../utils/betsBackup'
import {
  coalesceAppStateWithOwnedItemsBackup,
  mergeOwnedItemsBackupIntoApp,
  writeOwnedItemsBackup,
} from '../utils/ownedItemsBackup'
import { reconcileBetTokenCredits } from '../utils/betTokenReconcile'
import { betTokenMultiplier, normalizeSubscription } from '../utils/subscriptionEntitlements'
import { useAuth } from './AuthContext'

function withReconciledBetTokens(app: UserAppStateV1): {
  app: UserAppStateV1
  tokenDelta: number
  reconciledBetIds: string[]
} {
  const tier = normalizeSubscription(app.subscription).tier
  return reconcileBetTokenCredits(app, betTokenMultiplier(tier))
}

function rawProfileHadCdmBeta(appState: unknown): boolean {
  if (appState === null || typeof appState !== 'object' || Array.isArray(appState)) return false
  const profile = (appState as Record<string, unknown>).profile
  if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) return false
  return (profile as Record<string, unknown>).cdmBetaParticipant === true
}

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
  const { isReady, clerkSessionId, user } = useAuth()
  const showAccountSyncBanner =
    !isReady || (isClerkAuthMode() && Boolean(user?.id) && !clerkSessionId)

  return (
    <>
      {showAccountSyncBanner ? (
        <div
          className="border-b border-sky-200/80 bg-sky-50/95 px-4 py-1.5 text-center text-[11px] font-bold text-sky-950"
          role="status"
          aria-live="polite"
        >
          Synchronisation du compte…
        </div>
      ) : null}
      <CloudUserStateLoader clerkSessionId={clerkSessionId}>
        {children}
      </CloudUserStateLoader>
    </>
  )
}

function CloudUserStateLoader({
  children,
  clerkSessionId,
}: {
  children: ReactNode
  clerkSessionId: string | null
}) {
  const { user, refreshAuthUser } = useAuth()
  const location = useLocation()
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [app, setApp] = useState<UserAppStateV1>(() => defaultUserAppState())
  const [onboardingCompleteCol, setOnboardingCompleteCol] = useState(false)
  const [oauthNeedsProfile, setOauthNeedsProfile] = useState(false)

  const appRef = useRef(app)
  const ocRef = useRef(onboardingCompleteCol)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLocalEditsRef = useRef(false)
  const pendingCloudSaveRef = useRef(false)
  const loadUserIdRef = useRef<string | null>(null)
  const readyRef = useRef(false)
  const cloudHydratedRef = useRef(false)

  useEffect(() => {
    readyRef.current = ready
  }, [ready])

  useEffect(() => {
    const flushPending = () => {
      if (hasLocalEditsRef.current || pendingCloudSaveRef.current) {
        void flushSaveRef.current()
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushPending()
    }
    window.addEventListener('pagehide', flushPending)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flushPending)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const prevPathRef = useRef(location.pathname)
  useEffect(() => {
    if (prevPathRef.current === location.pathname) return
    prevPathRef.current = location.pathname
    if (hasLocalEditsRef.current || pendingCloudSaveRef.current) {
      void flushSaveRef.current()
    }
  }, [location.pathname])

  useEffect(() => {
    appRef.current = app
  }, [app])
  useEffect(() => {
    ocRef.current = onboardingCompleteCol
  }, [onboardingCompleteCol])

  const flushSave = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const sb = getSupabaseBrowserClient()
    if (!sb || !user?.id) return { ok: false, error: 'no_session' }
    if (!cloudHydratedRef.current) return { ok: false, error: 'not_hydrated' }
    try {
      await ensureTalkFootSupabaseSession(sb)

      if (isClerkAuthMode()) {
        if (!clerkSessionId) return { ok: false, error: 'missing_clerk_session' }
        const bindResult = await bindTalkfootActorSession(sb, user.id, clerkSessionId)
        if (!bindResult.ok) return { ok: false, error: bindResult.error ?? 'bind_failed' }
      }

      let payload = coalesceAppStateWithModularBackup(user.id, appRef.current)
      payload = coalesceAppStateWithWalletBackup(user.id, payload)
      payload = coalesceAppStateWithBetsBackup(user.id, payload)
      payload = coalesceAppStateWithOwnedItemsBackup(user.id, payload)
      const betTokensReconciled = withReconciledBetTokens(payload)
      payload = betTokensReconciled.app
      if (betTokensReconciled.tokenDelta > 0 || betTokensReconciled.reconciledBetIds.length > 0) {
        hasLocalEditsRef.current = true
      }
      if (payload !== appRef.current) {
        appRef.current = payload
        setApp(payload)
      }

      await saveTalkfootProfileAppStateWithChatSync(
        sb,
        user.id,
        payload,
        ocRef.current,
        user.displayName?.trim() || 'Supporter',
      )
      writeModularAvatarBackup(
        user.id,
        resolveModularAvatarState(payload.profile.modularAvatar),
      )
      writeWalletBackup(user.id, payload.wallet)
      writeBetsBackup(user.id, payload.bets)
      writeOwnedItemsBackup(user.id, payload.profile.ownedItemIds ?? [])
      const { data: sessionWrap } = await sb.auth.getSession()
      const chatActorId = sessionWrap.session?.user?.id?.trim() ?? ''
      invalidateChatAuthorAvatars(
        [user.id, chatActorId].filter((id, index, all) => Boolean(id) && all.indexOf(id) === index),
      )
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'rpc_save_failed'
      console.error('[Talk Foot] Sauvegarde profil cloud:', message)
      return { ok: false, error: message }
    }
  }, [user?.id, clerkSessionId])

  const flushSaveRef = useRef(flushSave)
  flushSaveRef.current = flushSave

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
    if (!ready || !pendingCloudSaveRef.current) return
    pendingCloudSaveRef.current = false
    scheduleSave()
  }, [ready, scheduleSave])

  useEffect(() => {
    if (!user?.id) {
      cloudHydratedRef.current = false
      setReady(true)
      return
    }
    if (isClerkAuthMode() && !clerkSessionId) {
      if (loadUserIdRef.current === user.id && readyRef.current) return
      return
    }
    if (loadUserIdRef.current !== user.id) {
      loadUserIdRef.current = user.id
      hasLocalEditsRef.current = false
      cloudHydratedRef.current = false
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

      let resyncSessionAvatar = false

      const applySnapshot = (
        appState: unknown,
        onboardingComplete: boolean,
        oauthCompleted: boolean,
      ): boolean => {
        resyncSessionAvatar = false
        if (hasLocalEditsRef.current) {
          setReady(true)
          return false
        }
        const sessionAvatar = resolveModularAvatarState(appRef.current.profile.modularAvatar)
        const rawModularAvatar = extractStoredModularAvatar(appState)
        const hadCdmBeta = rawProfileHadCdmBeta(appState)
        let merged = mergeUserAppState(appState)
        if (!hadCdmBeta && merged.profile.cdmBetaParticipant) {
          hasLocalEditsRef.current = true
        }
        if (wouldDowngradeModularAvatar(rawModularAvatar, merged.profile.modularAvatar)) {
          const coerced = coerceModularAvatarFromStored(rawModularAvatar)
          if (coerced) {
            merged = {
              ...merged,
              profile: { ...merged.profile, modularAvatar: coerced },
            }
          }
        }
        const restored = mergeModularAvatarBackupIntoApp(user.id, merged)
        merged = restored.app
        const walletRestored = mergeWalletBackupIntoApp(user.id, merged)
        merged = walletRestored.app
        const betsRestored = mergeBetsBackupIntoApp(user.id, merged)
        merged = betsRestored.app
        const ownedRestored = mergeOwnedItemsBackupIntoApp(user.id, merged)
        merged = ownedRestored.app
        const betTokensReconciled = withReconciledBetTokens(merged)
        merged = betTokensReconciled.app
        if (betTokensReconciled.tokenDelta > 0 || betTokensReconciled.reconciledBetIds.length > 0) {
          hasLocalEditsRef.current = true
        }
        if (
          readyRef.current &&
          !isLikelyDefaultModularAvatar(sessionAvatar) &&
          wouldDowngradeModularAvatar(sessionAvatar, merged.profile.modularAvatar)
        ) {
          merged = {
            ...merged,
            profile: { ...merged.profile, modularAvatar: sessionAvatar },
          }
          resyncSessionAvatar = true
        }
        setApp(merged)
        appRef.current = merged
        writeWalletBackup(user.id, merged.wallet)
        writeBetsBackup(user.id, merged.bets)
        writeOwnedItemsBackup(user.id, merged.profile.ownedItemIds ?? [])
        setOnboardingCompleteCol(onboardingComplete)
        setOauthNeedsProfile(!oauthCompleted)
        cloudHydratedRef.current = true
        setReady(true)
        return (
          restored.restoredFromBackup ||
          walletRestored.restoredFromBackup ||
          betsRestored.restoredFromBackup ||
          ownedRestored.restoredFromBackup
        )
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
              setLoadError(`Liaison session cloud échouée (${bindResult.error}). Recharge la page.`)
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
          const restoredFromBackup = applySnapshot(
            snapshot.appState,
            snapshot.onboardingComplete,
            snapshot.oauthProfileCompleted,
          )

          if (restoredFromBackup && !cancelled) {
            try {
              await flushSaveRef.current()
            } catch (syncErr) {
              console.warn('[Talk Foot] Reprise avatar local → cloud:', syncErr)
            }
          } else if (resyncSessionAvatar && !cancelled) {
            try {
              await flushSaveRef.current()
            } catch (syncErr) {
              console.warn('[Talk Foot] Resync avatar session → cloud:', syncErr)
            }
          } else if (!hasLocalEditsRef.current && !cancelled && !resyncSessionAvatar) {
            try {
              const merged = mergeUserAppState(snapshot.appState)
              const rawModularAvatar = extractStoredModularAvatar(snapshot.appState)
              const { data: sessionWrap } = await sb.auth.getSession()
              const chatActorId = sessionWrap.session?.user?.id?.trim() ?? ''
              if (
                chatActorId &&
                chatActorId !== user.id &&
                !wouldDowngradeModularAvatar(rawModularAvatar, merged.profile.modularAvatar)
              ) {
                try {
                  await ensureTalkfootProfile(
                    sb,
                    chatActorId,
                    displayName.trim() || 'Supporter',
                    true,
                  )
                } catch {
                  /* déjà provisionné */
                }
                await saveTalkfootProfileAppState(
                  sb,
                  chatActorId,
                  merged,
                  snapshot.onboardingComplete,
                )
              }
            } catch (syncErr) {
              console.warn('[Talk Foot] Sync profil chat actor au chargement:', syncErr)
            }
          }

          if (!hasLocalEditsRef.current && !restoredFromBackup && !resyncSessionAvatar) {
            try {
              const mergedApp = mergeUserAppState(snapshot.appState)
              const rawModularAvatar = extractStoredModularAvatar(snapshot.appState)
              const rawHadModular = rawModularAvatar != null
              const mergedModularOk =
                !rawHadModular || coerceModularAvatarFromStored(rawModularAvatar) != null
              const rawBets =
                snapshot.appState !== null &&
                typeof snapshot.appState === 'object' &&
                !Array.isArray(snapshot.appState)
                  ? (snapshot.appState as Record<string, unknown>).bets
                  : undefined
              const mergedLostBets =
                Array.isArray(rawBets) && rawBets.length > 0 && mergedApp.bets.length === 0
              const mergedWouldDowngradeAvatar =
                wouldDowngradeModularAvatar(rawModularAvatar, mergedApp.profile.modularAvatar) ||
                wouldDowngradeModularAvatar(
                  appRef.current.profile.modularAvatar,
                  mergedApp.profile.modularAvatar,
                )
              const rawJson = JSON.stringify(snapshot.appState ?? {})
              const mergedJson = JSON.stringify(mergedApp)
              if (
                mergedModularOk &&
                !mergedLostBets &&
                !mergedWouldDowngradeAvatar &&
                rawJson !== mergedJson
              ) {
                await saveTalkfootProfileAppStateWithChatSync(
                  sb,
                  user.id,
                  mergedApp,
                  snapshot.onboardingComplete,
                  displayName.trim() || 'Supporter',
                )
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
      if (user?.id) {
        const walletRestored = mergeWalletBackupIntoApp(user.id, appRef.current)
        if (walletRestored.restoredFromBackup) {
          setApp(walletRestored.app)
          appRef.current = walletRestored.app
        }
        const betsRestored = mergeBetsBackupIntoApp(user.id, appRef.current)
        if (betsRestored.restoredFromBackup) {
          setApp(betsRestored.app)
          appRef.current = betsRestored.app
        }
        if (walletRestored.restoredFromBackup || betsRestored.restoredFromBackup) {
          cloudHydratedRef.current = true
        }
      }
      if (isTransientAuthLockError(friendly)) {
        setLoadError(friendly)
        setReady(true)
        return
      }
      setLoadError(friendly)
      setOnboardingCompleteCol(false)
      setOauthNeedsProfile(false)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, clerkSessionId])

  const patchApp = useCallback(
    (fn: (prev: UserAppStateV1) => UserAppStateV1) => {
      setApp((prev) => {
        const next = fn(prev)
        appRef.current = next
        if (user?.id) {
          const prevWallet = normalizeWallet(prev.wallet)
          const nextWallet = normalizeWallet(next.wallet)
          const walletChanged =
            prevWallet.tokens !== nextWallet.tokens ||
            prevWallet.medals !== nextWallet.medals ||
            prevWallet.lastDailyTokenGrant !== nextWallet.lastDailyTokenGrant
          const betsChanged =
            prev.bets.length !== next.bets.length ||
            prev.bets.some((b, i) => b.id !== next.bets[i]?.id || b.status !== next.bets[i]?.status)
          if (walletChanged) {
            writeWalletBackup(user.id, next.wallet)
          }
          if (betsChanged) {
            writeBetsBackup(user.id, next.bets)
          }
          const prevOwned = prev.profile.ownedItemIds ?? []
          const nextOwned = next.profile.ownedItemIds ?? []
          const ownedChanged =
            prevOwned.length !== nextOwned.length ||
            prevOwned.some((id, i) => id !== nextOwned[i])
          if (ownedChanged) {
            writeOwnedItemsBackup(user.id, nextOwned)
          }
          if (walletChanged || betsChanged || ownedChanged) {
            hasLocalEditsRef.current = true
          }
        }
        return next
      })
      if (ready) {
        hasLocalEditsRef.current = true
        scheduleSave()
      } else {
        pendingCloudSaveRef.current = true
      }
    },
    [scheduleSave, ready, user?.id],
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
