export const APP_STORE_URL = 'https://apps.apple.com/app/id6740000000'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.talkfoot.app'

export function preferredStoreUrl(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): {
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
} {
  const ios = /iPad|iPhone|iPod/i.test(ua)
  const android = /Android/i.test(ua)
  const appStore = { href: APP_STORE_URL, label: 'Télécharger sur l’App Store' }
  const play = { href: PLAY_STORE_URL, label: 'Disponible sur Google Play' }
  if (ios) return { primary: appStore, secondary: play }
  if (android) return { primary: play, secondary: appStore }
  return { primary: play, secondary: appStore }
}
