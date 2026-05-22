/** Informations éditeur — utilisées pages légales, footer, AdSense. */
export const LEGAL_PUBLISHER_NAME = 'Talk Foot'

export const LEGAL_PUBLIC_SITE =
  (typeof import.meta.env.VITE_PUBLIC_SITE_URL === 'string' &&
    import.meta.env.VITE_PUBLIC_SITE_URL.trim().replace(/\/$/, '')) ||
  'https://talk-foot.com'

export const LEGAL_CONTACT_EMAIL =
  (typeof import.meta.env.VITE_LEGAL_CONTACT_EMAIL === 'string' &&
    import.meta.env.VITE_LEGAL_CONTACT_EMAIL.trim()) ||
  'support@talkfoot.app'

export const LEGAL_LAST_UPDATED_LABEL = '22 mai 2026'

export function legalContactMailto(subject?: string, body?: string): string {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const q = params.toString()
  return `mailto:${LEGAL_CONTACT_EMAIL}${q ? `?${q}` : ''}`
}
