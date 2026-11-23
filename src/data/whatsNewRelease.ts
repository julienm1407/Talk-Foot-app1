/**
 * Pop-up « fais la mise à jour » — une fois par `id`, accueil seulement.
 * Prochaine version notable : bump `id`, `festive: true`, nouveaux highlights.
 * Correctif discret : `festive: false` (aucun pop-up).
 */
export type WhatsNewRelease = {
  id: string
  versionLabel: string
  festive: boolean
  eyebrow: string
  title: string
  subtitle: string
  highlights: string[]
  cta: string
}

export const WHATS_NEW_RELEASE: WhatsNewRelease = {
  id: '1.0.19-share-tifo-chat',
  versionLabel: '1.0.19',
  festive: true,
  eyebrow: 'Nouvelle version',
  title: 'Fais la mise à jour',
  subtitle: 'Une nouvelle version Talk Foot est en ligne. Voici ce qui change.',
  highlights: [
    'Partage de prono façon story, avec QR pour installer l’app',
    'Tchat avant-match en plein écran',
    'Tifos aux couleurs du match',
  ],
  cta: 'C’est noté',
}

export function shouldShowWhatsNew(opts: {
  festive: boolean
  onboardingOpen: boolean
  isHome: boolean
  force: boolean
  firstVisitHomePending: boolean
  alreadySeen: boolean
}): boolean {
  if (opts.force) return true
  if (!opts.festive) return false
  if (opts.alreadySeen) return false
  if (!opts.isHome) return false
  if (opts.onboardingOpen) return false
  if (opts.firstVisitHomePending) return false
  return true
}
