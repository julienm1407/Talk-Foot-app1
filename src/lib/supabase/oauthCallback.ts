import { Capacitor } from '@capacitor/core'
import { NATIVE_APP_OAUTH_SCHEME, NATIVE_OAUTH_HTTPS_BRIDGE_PATH } from './oauthRedirect'
import { getSupabaseBrowserClient } from './client'
import { hasAuthCallbackInLocation } from './oauthCallbackLocation'

export { hasAuthCallbackInLocation } from './oauthCallbackLocation'

export function isAndroidSystemWebView(ua = navigator.userAgent): boolean {
  return /\bwv\b/.test(ua) || /; wv\)/i.test(ua)
}

/** Chrome / Snap / Custom Tabs — pas la WebView Capacitor. */
export function isExternalMobileBrowser(ua = navigator.userAgent): boolean {
  if (Capacitor.isNativePlatform() || isAndroidSystemWebView(ua)) return false
  return /Android|iPhone|iPad/i.test(ua)
}

export function nativeOAuthIntentUrl(search: string, hash: string): string {
  const q = search.startsWith('?') ? search : search ? `?${search}` : ''
  const h = hash.startsWith('#') ? hash : hash ? `#${hash}` : ''
  const fallback = `https://talk-foot.com/${NATIVE_OAUTH_HTTPS_BRIDGE_PATH.replace(/^\//, '')}${q}${h}`
  return `intent://app/${q}${h}#Intent;scheme=talkfoot;package=com.talkfoot.app;S.browser_fallback_url=${encodeURIComponent(fallback)};end`
}

export function nativeOAuthSchemeUrl(search: string, hash: string): string {
  const q = search.startsWith('?') ? search : search ? `?${search}` : ''
  const h = hash.startsWith('#') ? hash : hash ? `#${hash}` : ''
  return `${NATIVE_APP_OAUTH_SCHEME}/${q}${h}`
}

export function hasPkceVerifierInStorage(): boolean {
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && /code-verifier/i.test(key) && window.localStorage.getItem(key)) return true
    }
  } catch {
    /* private mode */
  }
  return false
}

/** Custom Tabs / Snap : renvoyer le `code` PKCE dans l’app (le vérifieur est dans la WebView). */
export function handoffOAuthToNativeApp(): void {
  const { search, hash } = window.location
  if (/Android/i.test(navigator.userAgent)) {
    window.location.replace(nativeOAuthIntentUrl(search, hash))
    return
  }
  window.location.replace(nativeOAuthSchemeUrl(search, hash))
}

function stripAuthParamsFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  url.hash = ''
  const next = `${url.pathname}${url.search}`
  window.history.replaceState(null, '', next || '/')
}

/**
 * Échange PKCE uniquement dans la WebView / le navigateur qui a lancé Google.
 * Ne jamais le faire dans Custom Tabs : ça brûle le code sans code_verifier.
 */
export async function consumeOAuthCallbackInApp(): Promise<boolean> {
  if (typeof window === 'undefined' || !hasAuthCallbackInLocation()) return false
  if (isExternalMobileBrowser() && !hasPkceVerifierInStorage()) return false

  const sb = getSupabaseBrowserClient()
  if (!sb) return false

  const code = new URLSearchParams(window.location.search).get('code')
  if (!code) return false

  try {
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) return false
    stripAuthParamsFromUrl()
    return true
  } catch {
    return false
  }
}
