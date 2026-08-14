import { Capacitor } from '@capacitor/core'
import { API_TOKENS_CHANGED_EVENT, LS_KEY_SPORTMONKS_TOKEN } from '../constants/apiKeysStorage'

/** Valeur sentinelle : `sportMonksFetchJson` appelle `/api/sm` (Vercel) qui ajoute la clé côté serveur. */
export const TF_SM_SERVER_RELAY_PLACEHOLDER = '\0tf-sm-server-relay\0'

function trimOrUndef(s: string | undefined | null): string | undefined {
  const t = s?.trim()
  return t || undefined
}

/** APK/IPA prod : toujours le relais serveur (jamais de clé embarquée / localStorage). */
function isNativeProdRelay(): boolean {
  return Capacitor.isNativePlatform() && import.meta.env.PROD
}

/** D’où vient le jeton utilisé pour les `fetch` vers api.sportmonks.com. */
export type SportMonksTokenSource = 'env' | 'browser' | 'none'

/** `true` si le dernier `vite build` a vu une valeur non vide pour `VITE_SPORTMONKS_TOKEN` (diagnostic déploiement). */
export function buildEmbedSportMonksTokenAtViteBuild(): boolean {
  return typeof __TF_BUILD_HAS_SM_TOKEN__ !== 'undefined' && __TF_BUILD_HAS_SM_TOKEN__
}

export function getSportMonksTokenSource(): SportMonksTokenSource {
  if (typeof __TF_VERCEL_DEPLOY__ !== 'undefined' && __TF_VERCEL_DEPLOY__) return 'env'
  if (isNativeProdRelay()) return 'env'
  if (import.meta.env.VITE_SPORTMONKS_RELAY_ONLY === 'true' || import.meta.env.VITE_SPORTMONKS_RELAY_ONLY === '1')
    return 'env'
  if (
    import.meta.env.DEV &&
    (import.meta.env.VITE_USE_SM_DEV_RELAY === 'true' || import.meta.env.VITE_USE_SM_DEV_RELAY === '1')
  )
    return 'env'
  if (trimOrUndef(import.meta.env.VITE_SPORTMONKS_TOKEN)) return 'env'
  try {
    if (trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN))) return 'browser'
  } catch {
    /* private mode */
  }
  return 'none'
}

/**
 * Priorité :
 * - déploiement Vercel (`VERCEL=1` au build) → relais `/api/sm` uniquement ;
 * - `VITE_SPORTMONKS_RELAY_ONLY` → même relais (hébergement avec `api/sm.js` sans bundle de clé) ;
 * - dev + `VITE_USE_SM_DEV_RELAY` → relais `/api/sm` servi par Vite (clé `SPORTMONKS_TOKEN` dans `.env.local`, sans préfixe VITE_) ;
 * - sinon `VITE_SPORTMONKS_TOKEN` ou clé navigateur (Profil → Données).
 */
export function getSportMonksToken(): string | undefined {
  if (typeof __TF_VERCEL_DEPLOY__ !== 'undefined' && __TF_VERCEL_DEPLOY__) {
    return TF_SM_SERVER_RELAY_PLACEHOLDER
  }
  if (isNativeProdRelay()) {
    return TF_SM_SERVER_RELAY_PLACEHOLDER
  }
  const relayOnly =
    import.meta.env.VITE_SPORTMONKS_RELAY_ONLY === 'true' || import.meta.env.VITE_SPORTMONKS_RELAY_ONLY === '1'
  if (relayOnly) return TF_SM_SERVER_RELAY_PLACEHOLDER
  const devRelay =
    import.meta.env.DEV &&
    (import.meta.env.VITE_USE_SM_DEV_RELAY === 'true' || import.meta.env.VITE_USE_SM_DEV_RELAY === '1')
  if (devRelay) return TF_SM_SERVER_RELAY_PLACEHOLDER
  const env = trimOrUndef(import.meta.env.VITE_SPORTMONKS_TOKEN)
  if (env) return env
  try {
    const ls = trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN))
    if (ls) return ls
  } catch {
    /* private mode */
  }
  return undefined
}

export function hasBrowserSportMonksToken(): boolean {
  try {
    return Boolean(trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN)))
  } catch {
    return false
  }
}

export function setSportMonksTokenBrowser(token: string | null | undefined): void {
  try {
    const t = trimOrUndef(token ?? undefined)
    if (!t) localStorage.removeItem(LS_KEY_SPORTMONKS_TOKEN)
    else localStorage.setItem(LS_KEY_SPORTMONKS_TOKEN, t)
  } catch {
    /* private mode, etc. */
  }
  window.dispatchEvent(new Event(API_TOKENS_CHANGED_EVENT))
}
