import { Capacitor } from '@capacitor/core'

const CAPACITOR_LOCAL_ORIGIN = /^https?:\/\/localhost(?::\d+)?$/i

/** URL publique du site (ex. https://talk-foot.com), sans slash final. */
export function getPublicSiteOrigin(): string | undefined {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  return raw || undefined
}

/**
 * Origin de base pour les routes backend TalkFoot (`/api/sm`, `/api/live-bundle`).
 * - Web prod Vercel : same-origin (`location.origin`).
 * - Capacitor prod : `VITE_PUBLIC_SITE_URL` (relais distant sécurisé).
 */
export function getTalkFootApiOrigin(): string {
  const locationOrigin =
    typeof globalThis !== 'undefined' && 'location' in globalThis
      ? (globalThis as { location?: { origin?: string } }).location?.origin
      : undefined

  const publicSite = getPublicSiteOrigin()

  if (Capacitor.isNativePlatform()) {
    if (!publicSite) {
      throw new Error('Relais SportMonks mobile : VITE_PUBLIC_SITE_URL manquant au build')
    }
    return publicSite
  }

  if (import.meta.env.PROD && locationOrigin && CAPACITOR_LOCAL_ORIGIN.test(locationOrigin) && publicSite) {
    return publicSite
  }

  if (!locationOrigin) {
    throw new Error('Relais SportMonks : origine du site indisponible')
  }
  return locationOrigin
}
