/**
 * Google AdMob — pubs natives (pas AdSense du site).
 * iOS : IDs dédiés si tu crées une app iOS dans AdMob (`VITE_ADMOB_IOS_*`).
 * @see https://developers.google.com/admob/ios/quick-start
 */

import { Capacitor } from '@capacitor/core'

const GOOGLE_TEST_PUB = '3940256099942544'

/** Application AdMob « Talk Foot » (Android). */
const LIVE_APP = 'ca-app-pub-3053581713947053~6380726341'
/** Bloc « Talk Foot — Interstitiel match ». */
const LIVE_INTERSTITIAL = 'ca-app-pub-3053581713947053/4984930370'
/** Bloc « Talk Foot — Recompense match » (+10 jetons). */
const LIVE_REWARDED = 'ca-app-pub-3053581713947053/9275529170'

function envId(name: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)[name]
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.startsWith('ca-app-pub-') ? t : undefined
}

function pickId(iosEnv: string, androidEnv: string, fallback: string): string {
  if (Capacitor.getPlatform() === 'ios') {
    return envId(iosEnv) ?? envId(androidEnv) ?? fallback
  }
  return envId(androidEnv) ?? fallback
}

export const ADMOB_APP_ID = pickId('VITE_ADMOB_IOS_APP_ID', 'VITE_ADMOB_APP_ID', LIVE_APP)
export const ADMOB_INTERSTITIAL_UNIT = pickId(
  'VITE_ADMOB_IOS_INTERSTITIAL_UNIT',
  'VITE_ADMOB_INTERSTITIAL_UNIT',
  LIVE_INTERSTITIAL,
)
export const ADMOB_REWARDED_UNIT = pickId(
  'VITE_ADMOB_IOS_REWARDED_UNIT',
  'VITE_ADMOB_REWARDED_UNIT',
  LIVE_REWARDED,
)

export function isAdMobTestUnit(adUnitId: string): boolean {
  return adUnitId.includes(GOOGLE_TEST_PUB)
}

export const ADMOB_USING_GOOGLE_TEST_APP = ADMOB_APP_ID.includes(GOOGLE_TEST_PUB)

export const REWARDED_AD_TOKEN_AMOUNT = 10
export const REWARDED_AD_DAILY_CAP = 8
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60 * 1000
export const INTERSTITIAL_SESSION_GRACE_MS = 25 * 1000
