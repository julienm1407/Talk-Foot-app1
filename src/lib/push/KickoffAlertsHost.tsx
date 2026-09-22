import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useMatches } from '../../contexts/MatchesContext'
import { getSupabaseBrowserClient } from '../supabase/client'
import { useTalkFootCloudSession } from '../../hooks/useTalkFootCloudSession'
import {
  deletePushDeviceToken,
  replaceKickoffWatches,
  upsertPushDeviceToken,
} from '../supabase/pushKickoff'
import { favoriteClubKickoffWatches } from '../../utils/favoriteKickoffWatches'
import {
  ensureMatchNotificationPermission,
  isNativePushRuntime,
  listenLocalNotificationTaps,
  registerNativePush,
  syncLocalKickoffNotifications,
} from './nativeMatchPush'

function pathFromOpenEvent(ev: Event): string | null {
  const href = (ev as CustomEvent<string>).detail
  return typeof href === 'string' && href.startsWith('/') ? href : null
}

/**
 * App Play : permission + jeton FCM + rappels locaux T−15 min des clubs favoris.
 */
export function KickoffAlertsHost() {
  const navigate = useNavigate()
  const { matches } = useMatches()
  const { favoriteClubIds, kickoffAlertsEnabled } = useFanPreferences()
  const { ensureCloudSession } = useTalkFootCloudSession()
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const path = pathFromOpenEvent(ev)
      if (path) navigate(path)
    }
    window.addEventListener('tf-open-path', onOpen)
    return () => window.removeEventListener('tf-open-path', onOpen)
  }, [navigate])

  useEffect(() => {
    if (!isNativePushRuntime()) return
    void listenLocalNotificationTaps()
  }, [])

  useEffect(() => {
    if (!isNativePushRuntime() || !kickoffAlertsEnabled) return
    let cancelled = false
    void (async () => {
      const ok = await ensureMatchNotificationPermission()
      if (!ok || cancelled) return
      await registerNativePush((token) => {
        tokenRef.current = token
        void (async () => {
          const session = await ensureCloudSession()
          const sb = getSupabaseBrowserClient()
          const uid = session?.user?.id
          if (!sb || !uid) return
          await upsertPushDeviceToken(sb, uid, token, Capacitor.getPlatform()).catch(() => undefined)
        })()
      })
    })()
    return () => {
      cancelled = true
    }
  }, [kickoffAlertsEnabled, ensureCloudSession])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        const watches =
          kickoffAlertsEnabled && favoriteClubIds.length > 0
            ? favoriteClubKickoffWatches(matches, favoriteClubIds)
            : []

        if (isNativePushRuntime()) {
          await syncLocalKickoffNotifications(watches).catch(() => undefined)
        }

        const session = await ensureCloudSession()
        const sb = getSupabaseBrowserClient()
        const uid = session?.user?.id
        if (!sb || !uid) return
        await replaceKickoffWatches(sb, uid, watches).catch(() => undefined)

        if (!kickoffAlertsEnabled && tokenRef.current) {
          await deletePushDeviceToken(sb, tokenRef.current).catch(() => undefined)
        }
      })()
    }, 700)
    return () => window.clearTimeout(t)
  }, [matches, favoriteClubIds, kickoffAlertsEnabled, ensureCloudSession])

  return null
}
