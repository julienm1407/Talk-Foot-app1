/**
 * Politique AdSense — conformité « contenu d’éditeur » (programme Google).
 * @see https://support.google.com/adsense/answer/1346295
 */

function normalizePath(pathname: string): string {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || ''
  let p = pathname || '/'
  if (base && base !== '/' && p.startsWith(base)) {
    p = p.slice(base.length) || '/'
  }
  if (!p.startsWith('/')) p = `/${p}`
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

export type EditorialRouteKind = 'home' | 'article' | 'debate' | 'club' | null

/** Préfixes de pages à contenu éditorial suffisant (pas les listes / navigation seule). */
const EDITORIAL_DETAIL_PREFIXES = ['/article', '/debate', '/club'] as const

/** Listes / hubs navigationnels : pas de pubs Google (contenu trop mince ou utilitaire). */
const THIN_LIST_ROUTES = new Set([
  '/debates',
  '/match',
  '/calendar',
  '/agenda',
  '/groups',
  '/videos',
  '/rankings',
  '/boutique',
  '/profile',
  '/mes-paris',
])

export function getEditorialRouteKind(pathname: string): EditorialRouteKind {
  const p = normalizePath(pathname)
  if (p === '/' || p === '') return 'home'
  for (const prefix of EDITORIAL_DETAIL_PREFIXES) {
    if (p === prefix) return null
    if (p.startsWith(`${prefix}/`) && p.length > prefix.length + 1) {
      if (prefix === '/article') return 'article'
      if (prefix === '/debate') return 'debate'
      if (prefix === '/club') return 'club'
    }
  }
  return null
}

export function isEditorialAdsRoute(pathname: string): boolean {
  return getEditorialRouteKind(pathname) != null
}

/** Routes où aucune unité AdSense ne doit être initialisée. */
export function isAdsenseBlockedRoute(pathname: string): boolean {
  const p = normalizePath(pathname)
  if (p.startsWith('/channel')) return true
  if (p.startsWith('/group/')) return true
  if (p.startsWith('/login')) return true
  if (p === '/privacy' || p === '/terms') return true
  if (p.startsWith('/admin')) return true
  if (p.startsWith('/settings')) return true
  if (p.startsWith('/user/')) return true
  if (THIN_LIST_ROUTES.has(p)) return true
  return false
}

export function shouldServeLiveAdsense(pathname: string, opts?: { contentReady?: boolean }): boolean {
  if (opts?.contentReady === false) return false
  if (isAdsenseBlockedRoute(pathname)) return false
  return isEditorialAdsRoute(pathname)
}

export function shouldLoadAdsenseScript(pathname: string): boolean {
  return shouldServeLiveAdsense(pathname)
}

/** Accueil : max 3 unités live (densité raisonnable). */
const HOME_LIVE_PLACEMENTS = new Set([
  'home-under-hero-desktop',
  'home-under-hero',
  'home-carousel-feed',
])

export function shouldShowLiveAdPlacement(placementKey: string, pathname: string): boolean {
  if (!shouldServeLiveAdsense(pathname)) return false
  const kind = getEditorialRouteKind(pathname)
  if (kind === 'home') return HOME_LIVE_PLACEMENTS.has(placementKey)
  if (kind === 'article') {
    return placementKey === 'article-inline' || placementKey === 'article-mid'
  }
  if (kind === 'debate') return placementKey === 'debate-inline'
  if (kind === 'club') return placementKey === 'club-inline'
  return false
}

/** Emplacements autorisés à utiliser le slot par défaut (sans env dédié). */
export function placementMayUseDefaultSlot(placementKey: string): boolean {
  if (placementKey.startsWith('tf-rail-')) return false
  return (
    placementKey.startsWith('home-') ||
    placementKey.startsWith('ad-') ||
    placementKey.startsWith('article-') ||
    placementKey.startsWith('debate-') ||
    placementKey.startsWith('club-')
  )
}
