import { TALKFOOT_LOGO_URL } from '../layout/LogoMark'
import { resolvedSiteOrigin } from './basePath'

/** Fichier dans `public/` — logo marque fond blanc (Google Search, JSON-LD, favicon). */
export const BRAND_LOGO_FILE = 'logo-talk-foot.png'

/** URL absolue du logo éditeur (schema.org / Google). */
export function absoluteBrandLogoUrl(): string {
  const origin = resolvedSiteOrigin().replace(/\/$/, '')
  const path = TALKFOOT_LOGO_URL.startsWith('http')
    ? TALKFOOT_LOGO_URL
    : `${origin}${TALKFOOT_LOGO_URL.startsWith('/') ? TALKFOOT_LOGO_URL : `/${TALKFOOT_LOGO_URL}`}`
  return path
}
