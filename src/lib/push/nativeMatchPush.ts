import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import {
  localNotificationIdForMatch,
  type KickoffWatch,
} from '../../utils/favoriteKickoffWatches'

const MATCH_CHANNEL_ID = 'talkfoot-match'

export function isNativePushRuntime(): boolean {
  return Capacitor.isNativePlatform()
}

export async function ensureMatchNotificationPermission(): Promise<boolean> {
  if (!isNativePushRuntime()) return false
  try {
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') return false
    const local = await LocalNotifications.requestPermissions()
    return local.display === 'granted'
  } catch {
    return false
  }
}

export async function registerNativePush(onToken: (token: string) => void): Promise<void> {
  if (!isNativePushRuntime()) return

  await PushNotifications.removeAllListeners()
  await PushNotifications.addListener('registration', (token) => {
    if (token.value) onToken(token.value)
  })
  await PushNotifications.addListener('registrationError', (err) => {
    if (import.meta.env.DEV) console.warn('[Talk Foot] Push registration', err)
  })
  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const href = String(event.notification.data?.href ?? '')
    if (href.startsWith('/')) {
      window.dispatchEvent(new CustomEvent('tf-open-path', { detail: href }))
    }
  })

  try {
    await PushNotifications.createChannel({
      id: MATCH_CHANNEL_ID,
      name: 'Matchs favoris',
      description: 'Rappel coup d’envoi des clubs suivis',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
  } catch {
    /* Android < 8 / déjà créé */
  }

  await PushNotifications.register()
}

export async function syncLocalKickoffNotifications(watches: KickoffWatch[]): Promise<void> {
  if (!isNativePushRuntime()) return
  try {
    const pending = await LocalNotifications.getPending()
    const ids = (pending.notifications ?? [])
      .map((n) => n.id)
      .filter((id) => typeof id === 'number')
    if (ids.length > 0) {
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
    }
  } catch {
    /* ignore */
  }

  const now = Date.now()
  const notifications = watches
    .filter((w) => w.fireAtMs > now + 8_000)
    .slice(0, 48)
    .map((w) => ({
      id: localNotificationIdForMatch(w.matchId),
      title: w.title,
      body: w.body,
      schedule: { at: new Date(w.fireAtMs), allowWhileIdle: true },
      extra: { href: w.href, matchId: w.matchId },
      channelId: MATCH_CHANNEL_ID,
    }))

  if (notifications.length === 0) return
  await LocalNotifications.schedule({ notifications })
}

export async function listenLocalNotificationTaps(): Promise<void> {
  if (!isNativePushRuntime()) return
  await LocalNotifications.removeAllListeners()
  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const href = String(event.notification.extra?.href ?? '')
    if (href.startsWith('/')) {
      window.dispatchEvent(new CustomEvent('tf-open-path', { detail: href }))
    }
  })
}
