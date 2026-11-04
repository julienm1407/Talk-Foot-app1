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
import {
  buildCloudFavoriteMatchWatches,
  buildKickoffWatches,
} from '../../utils/favoriteKickoffWatches'
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
 * App native : permission + jeton FCM + rappels locaux 1 h / coup d’envoi.
 * Les buts et cartons partent en FCM tant que le match suivi reste en base.
 */
export function KickoffAlertsHost() {
  const navigate = useNavigate()
  const { matches } = useMatches()
  const { favoriteClubIds, favoriteMatchIds, favoritePlayers, kickoffAlertsEnabled } =
    useFanPreferences()
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
        const followOpts = {
          favoriteClubIds,
          favoriteMatchIds,
          favoritePlayerTeamIds: favoritePlayers.map((p) => p.teamId),
        }
        const localWatches = kickoffAlertsEnabled ? buildKickoffWatches(matches, followOpts) : []
        const cloudWatches = kickoffAlertsEnabled
          ? buildCloudFavoriteMatchWatches(matches, followOpts)
          : []

        if (isNativePushRuntime()) {
          await syncLocalKickoffNotifications(localWatches).catch(() => undefined)
        }

        const session = await ensureCloudSession()
        const sb = getSupabaseBrowserClient()
        const uid = session?.user?.id
        if (!sb || !uid) return
        await replaceKickoffWatches(sb, uid, cloudWatches).catch(() => undefined)

        if (!kickoffAlertsEnabled && tokenRef.current) {
          await deletePushDeviceToken(sb, tokenRef.current).catch(() => undefined)
        }
      })()
    }, 700)
    return () => window.clearTimeout(t)
  }, [
    matches,
    favoriteClubIds,
    favoriteMatchIds,
    favoritePlayers,
    kickoffAlertsEnabled,
    ensureCloudSession,
  ])

  return null
}
