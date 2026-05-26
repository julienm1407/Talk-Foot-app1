import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFavoriteNationsMatches } from './useFavoriteNationsMatches'
import { getNationByIso } from '../data/nations'

const NOTIFIED_KEY = 'talkfoot.favoriteNations.notified.v1'
/** Anticipation des notifications kickoff (en minutes). */
const ALERT_OFFSETS_MIN = [60, 5]
/** Ne pas notifier les matchs trop éloignés (économie batterie + spam). */
const LOOK_AHEAD_MS = 36 * 3_600_000
const TICK_INTERVAL_MS = 30_000

type NotifiedSet = Record<string, true>

function readNotified(): NotifiedSet {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeNotified(map: NotifiedSet) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map))
  } catch {
    /* quota / mode privé : silencieux */
  }
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

/**
 * Retourne l'état courant des permissions Notification + un helper pour les
 * demander explicitement (sur action utilisateur — sinon Safari refuse).
 */
export function useNotificationPermission() {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [state, setState] = useState<NotificationPermissionState>(() =>
    supported ? (Notification.permission as NotificationPermissionState) : 'unsupported',
  )

  const request = useCallback(async () => {
    if (!supported) return 'unsupported' as const
    try {
      const res = await Notification.requestPermission()
      setState(res as NotificationPermissionState)
      return res
    } catch {
      return Notification.permission as NotificationPermissionState
    }
  }, [supported])

  return { state, supported, request }
}

/**
 * Active les alertes des nations favorites :
 * - Notification navigateur (si permission granted) à H-60 min et H-5 min ;
 * - Marque les matchs « déjà notifiés » dans localStorage pour éviter les doublons ;
 * - Expose la liste des matchs imminents (< 24h) à utiliser dans la barre in-app.
 */
export function useFavoriteNationsAlerts() {
  const upcoming = useFavoriteNationsMatches({ limit: 25, includeFinished: false })
  const { state: permission, supported, request } = useNotificationPermission()
  const [now, setNow] = useState(() => Date.now())
  const notifiedRef = useRef<NotifiedSet>(readNotified())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  /** Effet réactif : à chaque tick, on regarde si une alerte doit être tirée. */
  useEffect(() => {
    if (permission !== 'granted' || !supported) return
    const notified = notifiedRef.current
    let changed = false

    for (const item of upcoming) {
      const ko = Date.parse(item.match.kickoffAt)
      if (Number.isNaN(ko)) continue
      const diff = ko - now
      if (diff > LOOK_AHEAD_MS || diff < -2 * 60_000) continue
      for (const offsetMin of ALERT_OFFSETS_MIN) {
        const targetWindowMs = offsetMin * 60_000
        if (diff > targetWindowMs) continue
        const key = `${item.match.id}::${offsetMin}`
        if (notified[key]) continue
        const nation = getNationByIso(item.primaryIso)
        const nationLabel = nation?.nameFr ?? 'Ta sélection'
        const title =
          offsetMin <= 5
            ? `⚽ Coup d'envoi imminent — ${nationLabel}`
            : `★ ${nationLabel} joue dans ${offsetMin} min`
        const body = `${item.match.home.name} vs ${item.match.away.name} · Salon Talk Foot ouvert.`
        try {
          const n = new Notification(title, {
            body,
            tag: `tf-fav-${item.match.id}-${offsetMin}`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            silent: false,
          })
          n.onclick = () => {
            try {
              window.focus()
              window.location.assign(`/channel/${encodeURIComponent(item.match.id)}`)
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* Sur certains navigateurs il faut un Service Worker — on tombe en silence. */
        }
        notified[key] = true
        changed = true
      }
    }

    if (changed) writeNotified(notified)
  }, [now, permission, supported, upcoming])

  const imminent = useMemo(
    () =>
      upcoming.filter((u) => {
        const diff = Date.parse(u.match.kickoffAt) - now
        return diff > -90 * 60_000 && diff < 24 * 3_600_000
      }),
    [upcoming, now],
  )

  return { permission, supported, requestPermission: request, imminent, now }
}
