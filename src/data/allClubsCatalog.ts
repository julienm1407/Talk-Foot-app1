import { competitionThemes } from './competitionThemes'
import { teams } from './teams'
import type { Team } from '../types/match'

export type ClubCatalogEntry = {
  id: string
  name: string
  shortName: string
  leagueId: string
  leagueName: string
}

const LEAGUE_KEYS = Object.keys(teams) as (keyof typeof teams)[]

function buildCatalog(): ClubCatalogEntry[] {
  const out: ClubCatalogEntry[] = []
  for (const leagueId of LEAGUE_KEYS) {
    const theme = competitionThemes[leagueId as string]
    const leagueName = theme?.name ?? String(leagueId)
    const list = teams[leagueId]
    for (const t of list) {
      out.push({
        id: t.id,
        name: t.name,
        shortName: t.shortName,
        leagueId: leagueId as string,
        leagueName,
      })
    }
  }
  return out
}

export const ALL_CLUBS_CATALOG: ClubCatalogEntry[] = buildCatalog()

export const ALL_CLUBS_BY_ID: Record<string, ClubCatalogEntry> = Object.fromEntries(
  ALL_CLUBS_CATALOG.map((c) => [c.id, c]),
)

/** Suggestions rapides (hors champ de recherche) */
export const GLOBAL_SUGGESTED_CLUB_IDS: string[] = [
  'psg',
  'om',
  'mci',
  'liv',
  'rma',
  'fcb',
  'bayern',
  'bvb',
  'inter',
  'milan',
  'ars',
  'mun',
  'atleti',
  'juve',
  'monaco',
]

function foldAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/**
 * Recherche sur nom, abréviation, id et ligue (insensible à la casse / accents).
 */
export function searchClubsCatalog(query: string, limit = 20): ClubCatalogEntry[] {
  const raw = query.trim()
  if (!raw) return []
  const q = foldAccents(raw)
  const scored: { c: ClubCatalogEntry; score: number }[] = []
  for (const c of ALL_CLUBS_CATALOG) {
    const nameF = foldAccents(c.name)
    const shortF = foldAccents(c.shortName)
    const idF = foldAccents(c.id)
    const leagueF = foldAccents(c.leagueName)
    if (!nameF.includes(q) && !shortF.includes(q) && !idF.includes(q) && !leagueF.includes(q)) {
      continue
    }
    let score = 0
    if (shortF.startsWith(q)) score += 80
    else if (nameF.startsWith(q)) score += 70
    else if (shortF.includes(q)) score += 50
    else if (nameF.includes(q)) score += 40
    else if (idF.includes(q)) score += 25
    else score += 15
    scored.push({ c, score })
  }
  scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name, 'fr'))
  return scored.slice(0, limit).map((x) => x.c)
}

export function findTeamInAnyLeague(clubId: string): Team | null {
  for (const leagueId of LEAGUE_KEYS) {
    const t = teams[leagueId].find((x) => x.id === clubId)
    if (t) return t
  }
  return null
}
