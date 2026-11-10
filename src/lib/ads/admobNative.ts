import { Capacitor } from '@capacitor/core'
import {
  ADMOB_INTERSTITIAL_UNIT,
  ADMOB_REWARDED_UNIT,
  isAdMobTestUnit,
} from '../../config/admob'

type AdMobModule = typeof import('@capacitor-community/admob')

let admobMod: AdMobModule | null = null
let initPromise: Promise<boolean> | null = null

async function loadPlugin(): Promise<AdMobModule | null> {
  if (!Capacitor.isNativePlatform()) return null
  if (admobMod) return admobMod
  try {
    admobMod = await import('@capacitor-community/admob')
    return admobMod
  } catch {
    return null
  }
}

export function nativeAdsAvailable(): boolean {
  return Capacitor.isNativePlatform()
}

async function prepareIosTrackingAndConsent(mod: AdMobModule): Promise<void> {
  if (Capacitor.getPlatform() !== 'ios') return
  const { AdMob } = mod
  try {
    const tracking = await AdMob.trackingAuthorizationStatus()
    if (tracking.status === 'notDetermined') {
      await AdMob.requestTrackingAuthorization()
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] AdMob ATT', err)
  }
  try {
    let consent = await AdMob.requestConsentInfo()
    if (!consent.canRequestAds) {
      consent = await AdMob.showConsentForm()
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] AdMob UMP', err)
  }
}

export async function initializeAdMob(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  if (!initPromise) {
    initPromise = (async () => {
      const mod = await loadPlugin()
      if (!mod) return false
      try {
        await mod.AdMob.initialize({
          initializeForTesting: false,
        })
        await prepareIosTrackingAndConsent(mod)
        return true
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Talk Foot] AdMob init', err)
        return false
      }
    })()
  }
  return initPromise
}

export async function showInterstitialAd(): Promise<{ ok: boolean; reason?: string }> {
  const ready = await initializeAdMob()
  const mod = await loadPlugin()
  if (!ready || !mod) return { ok: false, reason: 'unavailable' }
  try {
    await mod.AdMob.prepareInterstitial({
      adId: ADMOB_INTERSTITIAL_UNIT,
      isTesting: isAdMobTestUnit(ADMOB_INTERSTITIAL_UNIT),
    })
    await mod.AdMob.showInterstitial()
    return { ok: true }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] interstitial', err)
    return { ok: false, reason: 'failed' }
  }
}

/** Affiche une vidéo récompensée. `ok` seulement si l’utilisateur a vu jusqu’à la récompense. */
export async function showRewardedAd(): Promise<{ ok: boolean; reason?: string }> {
  const ready = await initializeAdMob()
  const mod = await loadPlugin()
  if (!ready || !mod) return { ok: false, reason: 'unavailable' }

  const { AdMob, RewardAdPluginEvents } = mod
  let rewarded = false
  const handles = await Promise.all([
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true
    }),
  ])

  try {
    const timed = <T,>(p: Promise<T>, ms: number) =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), ms)
        }),
      ])
    await timed(
      AdMob.prepareRewardVideoAd({
        adId: ADMOB_REWARDED_UNIT,
        isTesting: isAdMobTestUnit(ADMOB_REWARDED_UNIT),
      }),
      12_000,
    )
    await timed(AdMob.showRewardVideoAd(), 18_000)
    await new Promise((r) => window.setTimeout(r, 400))
    return rewarded ? { ok: true } : { ok: false, reason: 'skipped' }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Talk Foot] rewarded', err)
    return { ok: false, reason: 'failed' }
  } finally {
    await Promise.all(handles.map((h) => h.remove()))
  }
}
