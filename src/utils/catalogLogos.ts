import { CLUB_OFFICIAL_LOGO_BY_ID } from '../data/clubOfficialLogoUrls'
import { LEAGUE_OFFICIAL_LOGO_BY_ID, resolveLeagueLogoUrl as resolveLeagueLogoFromData } from '../data/leagueOfficialLogoUrls'
import { SM_LEAGUE_ID_BY_TALKFOOT_COMP } from '../api/footballApi'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
import {
  cdnTeamLogoFromImagePath,
  sportMonksTeamLogoUrl,
  sportMonksTeamLogoUrlForClubId,
} from '../data/sportMonksLogoUrls'

/** URL plate invalide (ancien helper — 404 sur le CDN). */
const FLAT_SM_TEAM_LOGO = /images\.sportmonks\.com\/images\/soccer\/teams\/\d+\.png$/i
function normalizeCatalogClubId(clubId: string): string {
  const id = clubId.trim().toLowerCase()
  if (CLUB_OFFICIAL_LOGO_BY_ID[id]) return id
  if (id === 'paris-sg') return 'psg'
  if (id === 'liverpool') return 'liv'
  return id
}

function isUsableRemoteLogoUrl(url: string): boolean {
  const u = url.trim()
  if (!/^https?:\/\//i.test(u)) return false
  if (FLAT_SM_TEAM_LOGO.test(u)) return false
  return true
}

function normalizeApiLogoUrl(url: string | null | undefined): string | null {
  const u = url?.trim()
  if (!u) return null
  const fromPath = cdnTeamLogoFromImagePath(u)
  if (fromPath) return fromPath
  if (!isUsableRemoteLogoUrl(u)) return null
  if (u.includes('images.sportmonks.com') && !u.includes('cdn.sportmonks.com')) {
    return u.replace('images.sportmonks.com', 'cdn.sportmonks.com')
  }
  return u
}

function isBundledOfficialLogo(url: string): boolean {
  return !/^https?:\/\//i.test(url.trim())
}

/**
 * Logo club : asset bundlé → CDN SportMonks → image API fixture → Wikimedia distant.
 */
export function resolveTeamLogoUrl(
  clubId: string,
  opts?: { apiLogoUrl?: string | null; sportMonksTeamId?: number },
): string | null {
  const id = normalizeCatalogClubId(clubId)
  const official = CLUB_OFFICIAL_LOGO_BY_ID[id]
  if (official && isBundledOfficialLogo(official)) return official

  const catalogSmId = SPORTMONKS_TEAM_ID_BY_CLUB_ID[id]
  const apiSmId = opts?.sportMonksTeamId
  const smIdsToTry = [...new Set([catalogSmId, apiSmId].filter((x): x is number => x != null))]
  for (const smId of smIdsToTry) {
    const fromCdn = sportMonksTeamLogoUrl(smId)
    if (fromCdn) return fromCdn
  }
  if (smIdsToTry.length === 0) {
    const fromCatalog = sportMonksTeamLogoUrlForClubId(id)
    if (fromCatalog) return fromCatalog
  }

  const api = normalizeApiLogoUrl(opts?.apiLogoUrl)
  if (api) return api

  if (official && /^https?:\/\//i.test(official)) return official

  return null
}

/** Alias historique (onboarding, recherche clubs). */
export function resolveClubCatalogLogoUrl(clubId: string): string | null {
  return resolveTeamLogoUrl(clubId)
}

/** Logo ligue : asset local puis CDN SportMonks. */
export function getLeagueLogoUrl(leagueId: string): string | null {
  const id = leagueId.trim().toLowerCase()
  const local = LEAGUE_OFFICIAL_LOGO_BY_ID[id]
  if (local) return local
  const smLeagueId = SM_LEAGUE_ID_BY_TALKFOOT_COMP[id]
  return resolveLeagueLogoFromData(id, smLeagueId) ?? null
}
