import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { findTeamById } from '../data/teamLookup'

/**
 * Slugs d’URL → id catalogue (noms génériques, pas de licence officielle).
 * Ex. `paris-fc` en démo pointe vers le hub « Paris » type capital club.
 */
const SLUG_ALIASES: Record<string, string> = {
  'paris-fc': 'psg',
  'paris-sg': 'psg',
  'manchester-city': 'mci',
  'real-madrid': 'rma',
  'barca': 'fcb',
}

const ID_PREFERRED_SLUG: Partial<Record<string, string>> = {
  psg: 'paris-fc',
  mci: 'manchester-city',
  rma: 'real-madrid',
  fcb: 'barca',
}

export function resolveClubIdFromSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase()
  if (!s) return null
  if (ALL_CLUBS_BY_ID[s]) return s
  const viaAlias = SLUG_ALIASES[s]
  if (viaAlias && ALL_CLUBS_BY_ID[viaAlias]) return viaAlias
  return null
}

export function clubPathForId(clubId: string): string {
  const slug = ID_PREFERRED_SLUG[clubId] ?? clubId
  return `/club/${slug}`
}

export { findTeamById }
