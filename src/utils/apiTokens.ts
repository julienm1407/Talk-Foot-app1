import { API_TOKENS_CHANGED_EVENT, LS_KEY_SPORTMONKS_TOKEN } from '../constants/apiKeysStorage'

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
  return 'none'
}

/** Priorité : variable d’environnement Vite, puis navigateur. */
export function getSportMonksToken(): string | undefined {
  const env = trimOrUndef(import.meta.env.VITE_SPORTMONKS_TOKEN)
  if (env) return env
  try {
    return trimOrUndef(localStorage.getItem(LS_KEY_SPORTMONKS_TOKEN))
  } catch {
    return undefined
  }
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
