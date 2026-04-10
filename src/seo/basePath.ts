/** Chemin Vite `base` sans slash final (ex. "" ou "/Talk-Foot-app1"). */
export function viteBasePath(): string {
  const b = import.meta.env.BASE_URL ?? '/'
  return b.endsWith('/') ? b.slice(0, -1) : b
}

/** Origin canonique si `VITE_PUBLIC_SITE_URL` est défini au build (ex. https://talk-foot.com). */
export function publicSiteOrigin(): string | undefined {
  const u = import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  return u || undefined
}

/** Origin pour JSON-LD / assets : domaine déclaré ou navigateur. */
export function resolvedSiteOrigin(): string {
  const fromEnv = publicSiteOrigin()
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/** Path absolu pour l’URL du site : origin + base + pathname routeur. */
export function absolutePageUrl(pathnameFromRouter: string): string {
  const base = viteBasePath()
  const p = pathnameFromRouter.startsWith('/') ? pathnameFromRouter : `/${pathnameFromRouter}`
  const path = `${base}${p}` || '/'
  const origin = publicSiteOrigin()
  if (origin) return `${origin}${path}`
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}
