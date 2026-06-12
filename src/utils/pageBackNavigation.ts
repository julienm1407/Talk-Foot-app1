export type PageBackTarget = {
  to: string
  label: string
}

/** Cible « Retour » pour les pages profondes (hors menu principal). */
export function resolvePageBackTarget(pathname: string): PageBackTarget | null {
  const p = pathname.replace(/\/+$/, '') || '/'

  const stadeMatch = p.match(/^\/channel\/([^/]+)\/stade$/)
  if (stadeMatch) {
    return { to: `/channel/${stadeMatch[1]}`, label: 'Tribune' }
  }

  if (/^\/channel\/[^/]+$/.test(p)) {
    return { to: '/match', label: 'Matchs' }
  }

  if (/^\/debate\/[^/]+$/.test(p)) {
    return { to: '/debates', label: 'Débats' }
  }

  if (/^\/group\/[^/]+$/.test(p)) {
    return { to: '/groups', label: 'Groupes' }
  }

  if (/^\/nation\/[^/]+$/.test(p)) {
    return { to: '/nations', label: 'Nations' }
  }

  if (/^\/club\/[^/]+$/.test(p)) {
    return { to: '/match', label: 'Matchs' }
  }

  if (/^\/user\/[^/]+$/.test(p)) {
    return { to: '/groups', label: 'Groupes' }
  }

  if (p.startsWith('/cdm/') && p !== '/cdm') {
    return { to: '/cdm', label: 'CDM 2026' }
  }

  if (p === '/boutique/medailles' || p === '/boutique/achat-reussi') {
    return { to: '/boutique', label: 'Boutique' }
  }

  return null
}
