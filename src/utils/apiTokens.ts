import { API_TOKENS_CHANGED_EVENT, LS_KEY_SPORTMONKS_TOKEN } from '../constants/apiKeysStorage'

/** Valeur sentinelle : `sportMonksFetchJson` appelle `/api/sm` (Vercel) qui ajoute la clé côté serveur. */
export const TF_SM_SERVER_RELAY_PLACEHOLDER = '\0tf-sm-server-relay\0'

function trimOrUndef(s: string | undefined | null): string | undefined {
  const t = s?.trim()
  return t || undefined
}

/** D’où vient le jeton utilisé pour les `fetch` vers api.sportmonks.com. */
export type SportMonksTokenSource = 'env' | 'browser' | 'none'

/** `true` si le dernier `vite build` a vu une valeur non vide pour `VITE_SPORTMONKS_TOKEN` (diagnostic déploiement). */
export function buildEmbedSportMonksTokenAtViteBuild(): boolean {
  return typeof __TF_BUILD_HAS_SM_TOKEN__ !== 'undefined' && __TF_BUILD_HAS_SM_TOKEN__
}

export function getSportMonksTokenSource(): SportMonksTokenSource {
  if (trimOrUndef(import.meta.env.VITE_SPORTMONKS_TOKEN)) return 'env'
  try {
    if (trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN))) return 'browser'
  } catch {
    /* private mode */
  }
  if (typeof __TF_VERCEL_DEPLOY__ !== 'undefined' && __TF_VERCEL_DEPLOY__) return 'env'
  return 'none'
}

/** Priorité : variable d’environnement Vite, puis navigateur, puis relais Vercel `/api/sm`. */
export function getSportMonksToken(): string | undefined {
  const env = trimOrUndef(import.meta.env.VITE_SPORTMONKS_TOKEN)
  if (env) return env
  try {
    const ls = trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN))
    if (ls) return ls
  } catch {
    /* private mode */
  }
  if (typeof __TF_VERCEL_DEPLOY__ !== 'undefined' && __TF_VERCEL_DEPLOY__) {
    return TF_SM_SERVER_RELAY_PLACEHOLDER
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
