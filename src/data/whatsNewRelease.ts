/**
 * Pop-up « fais la mise à jour » — uniquement l’app native, et seulement
 * si le build installé est plus vieux que le store.
 * Web / WebView à jour : jamais de pop-up.
 * Après un nouvel AAB/IPA : augmenter requiredAndroidVersionCode / requiredIosBuild.
 */
export type WhatsNewRelease = {
  id: string
  versionLabel: string
  requiredAndroidVersionCode: number
  requiredIosBuild: number
  eyebrow: string
  title: string
  subtitle: string
  highlights: string[]
  cta: string
}

export const WHATS_NEW_RELEASE: WhatsNewRelease = {
  id: '1.0.19-share-tifo-chat',
  versionLabel: '1.0.19',
  requiredAndroidVersionCode: 20,
  requiredIosBuild: 20,
  eyebrow: 'Mise à jour dispo',
  title: 'Fais la mise à jour',
  subtitle: 'Une nouvelle version de l’appli t’attend sur le store. Sans ça, tu rates le partage et le reste.',
  highlights: [
    'Partage de prono façon story, avec QR pour installer l’app',
    'Tchat avant-match en plein écran',
    'Tifos aux couleurs du match',
  ],
  cta: 'Plus tard',
}

export function nativeBuildIsBehind(opts: {
  platform: string
  build: number
  requiredAndroidVersionCode: number
  requiredIosBuild: number
}): boolean {
  if (opts.platform === 'android') return opts.build < opts.requiredAndroidVersionCode
  if (opts.platform === 'ios') return opts.build < opts.requiredIosBuild
  return false
}

export function shouldShowWhatsNew(opts: {
  force: boolean
  native: boolean
  updateNeeded: boolean
  snoozed: boolean
  onboardingOpen: boolean
  isHome: boolean
  firstVisitHomePending: boolean
}): boolean {
  if (opts.force) return true
  if (!opts.native) return false
  if (!opts.updateNeeded) return false
  if (opts.snoozed) return false
  if (!opts.isHome) return false
  if (opts.onboardingOpen) return false
  if (opts.firstVisitHomePending) return false
  return true
}
