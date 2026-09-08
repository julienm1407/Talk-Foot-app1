import { Capacitor } from '@capacitor/core'

/** True si l’app tourne dans le shell natif Capacitor (Android / iOS). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** Navigateur web (desktop, PWA, mobile Safari/Chrome hors store). */
export function isWebBrowser(): boolean {
  return !Capacitor.isNativePlatform()
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  if (!Capacitor.isNativePlatform()) return 'web'
  const p = Capacitor.getPlatform()
  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  return 'web'
}

/** Sur store : paiements via RevenueCat / Play Billing / StoreKit. Sur web : Stripe. */
export function usesStoreBilling(): boolean {
  return isNativeApp()
}
