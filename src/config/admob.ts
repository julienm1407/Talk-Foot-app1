/**
 * Google AdMob — pubs natives Play Store (pas AdSense du site).
 * @see https://developers.google.com/admob/android/test-ads
 */

const GOOGLE_TEST_PUB = '3940256099942544'

/** Application AdMob « Talk Foot ». */
const LIVE_APP = 'ca-app-pub-3053581713947053~6824472724'
/** Bloc « Talk Foot — Interstitiel match ». */
const LIVE_INTERSTITIAL = 'ca-app-pub-3053581713947053/2560784920'
/** Bloc « Talk Foot — Recompense match » (+10 jetons). */
const LIVE_REWARDED = 'ca-app-pub-3053581713947053/8658842304'

function envId(name: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)[name]
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.startsWith('ca-app-pub-') ? t : undefined
}

export const ADMOB_APP_ID = envId('VITE_ADMOB_APP_ID') ?? LIVE_APP
export const ADMOB_INTERSTITIAL_UNIT = envId('VITE_ADMOB_INTERSTITIAL_UNIT') ?? LIVE_INTERSTITIAL
export const ADMOB_REWARDED_UNIT = envId('VITE_ADMOB_REWARDED_UNIT') ?? LIVE_REWARDED

export function isAdMobTestUnit(adUnitId: string): boolean {
  return adUnitId.includes(GOOGLE_TEST_PUB)
}

export const ADMOB_USING_GOOGLE_TEST_APP = ADMOB_APP_ID.includes(GOOGLE_TEST_PUB)

export const REWARDED_AD_TOKEN_AMOUNT = 10
export const REWARDED_AD_DAILY_CAP = 8
export const INTERSTITIAL_MIN_GAP_MS = 4 * 60 * 1000
export const INTERSTITIAL_SESSION_GRACE_MS = 25 * 1000
