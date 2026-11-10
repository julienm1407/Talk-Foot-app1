import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import {
  consumeOAuthCallbackInApp,
  handoffOAuthToNativeApp,
  hasAuthCallbackInLocation,
  hasPkceVerifierInStorage,
  isExternalMobileBrowser,
} from '../../lib/supabase/oauthCallback'

/**
 * Filet si Google renvoie sur `/?code=` (Site URL) au lieu de `/login/native-oauth`.
 */
export function OAuthCallbackCatch() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/login/native-oauth')) return
    if (!hasAuthCallbackInLocation()) return

    if (isExternalMobileBrowser() && !hasPkceVerifierInStorage()) {
      handoffOAuthToNativeApp()
      return
    }

    if (Capacitor.isNativePlatform() || hasPkceVerifierInStorage()) {
      void consumeOAuthCallbackInApp()
    }
  }, [location.pathname, location.search, location.hash])

  return null
}
