import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { INTERSTITIAL_MIN_GAP_MS, INTERSTITIAL_SESSION_GRACE_MS } from '../../config/admob'
import { initializeAdMob, nativeAdsAvailable, showInterstitialAd } from '../../lib/ads/admobNative'
import { useSubscription } from '../../hooks/useSubscription'

function isLiveMatchPath(path: string): boolean {
  return path.startsWith('/channel/')
}

function isNoAutoInterstitialPath(path: string): boolean {
  return (
    isLiveMatchPath(path) ||
    path.startsWith('/debate/') ||
    path.startsWith('/login')
  )
}

/** Interstitiel AdMob uniquement hors match, pour les comptes avec pubs (Supporter). */
export function InterstitialAdsHost() {
  const { pathname } = useLocation()
  const { showAds } = useSubscription()
  const prevPath = useRef(pathname)
  const lastShown = useRef(0)
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    if (!nativeAdsAvailable() || !showAds) return
    void initializeAdMob()
  }, [showAds])

  useEffect(() => {
    const prev = prevPath.current
    prevPath.current = pathname
    if (!nativeAdsAvailable() || !showAds) return
    if (Date.now() - sessionStart.current < INTERSTITIAL_SESSION_GRACE_MS) return
    if (Date.now() - lastShown.current < INTERSTITIAL_MIN_GAP_MS) return
    if (isNoAutoInterstitialPath(prev) || isNoAutoInterstitialPath(pathname)) return
    if (prev === pathname) return
    lastShown.current = Date.now()
    void showInterstitialAd()
  }, [pathname, showAds])

  return null
}
