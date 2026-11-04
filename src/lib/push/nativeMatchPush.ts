import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { PushNotifications } from '@capacitor/push-notifications'
import {
  localNotificationIdForMatch,
  type KickoffWatch,
} from '../../utils/favoriteKickoffWatches'

const MATCH_CHANNEL_ID = 'talkfoot-match'
let lastKickoffNotifIds: number[] = []

function hashNotifId(seed: string, salt: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0
  }
  const n = Math.abs(h + salt) % 2_000_000_000
  return n === 0 ? 1 : n
}

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
      description: '1 h avant, coup d’envoi, buts et cartons des matchs suivis',
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

  const now = Date.now()
  const notifications = watches
    .filter((w) => w.fireAtMs > now + 8_000)
    .slice(0, 48)
    .map((w) => ({
      id: localNotificationIdForMatch(w.matchId, w.kind),
      title: w.title,
      body: w.body,
      schedule: { at: new Date(w.fireAtMs), allowWhileIdle: true },
      extra: { href: w.href, matchId: w.matchId },
      channelId: MATCH_CHANNEL_ID,
    }))

  const nextIds = notifications.map((n) => n.id)
  const toCancel = [...new Set([...lastKickoffNotifIds, ...nextIds])]
  if (toCancel.length > 0) {
    try {
      await LocalNotifications.cancel({ notifications: toCancel.map((id) => ({ id })) })
    } catch {
      /* ignore */
    }
  }
  lastKickoffNotifIds = nextIds
  if (notifications.length === 0) return
  await LocalNotifications.schedule({ notifications })
}

export async function fireImmediateMatchNotification(opts: {
  idKey: string
  title: string
  body: string
  href: string
}): Promise<void> {
  if (!isNativePushRuntime()) return
  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashNotifId(opts.idKey, 7_000_019),
        title: opts.title,
        body: opts.body,
        schedule: { at: new Date(Date.now() + 400), allowWhileIdle: true },
        extra: { href: opts.href },
        channelId: MATCH_CHANNEL_ID,
      },
    ],
  })
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
