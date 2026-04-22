import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import type { SupporterGroup } from '../types/group'

function pickGroupsForTeam(teamId: string, allGroups: SupporterGroup[]): SupporterGroup[] {
  const forClub = allGroups.filter((g) => g.fanTags?.clubIds?.includes(teamId))
  if (forClub.length) return forClub

  const entry = ALL_CLUBS_BY_ID[teamId]
  const leagueId = entry?.leagueId
  if (!leagueId) return allGroups

  const neutralLeague = allGroups.filter(
    (g) => g.fanTags?.leagueIds?.includes(leagueId) && (g.fanTags.clubIds?.length ?? 0) === 0,
  )
  if (neutralLeague.length) return neutralLeague

  const anyLeague = allGroups.filter((g) => g.fanTags?.leagueIds?.includes(leagueId))
  if (anyLeague.length) return anyLeague

  return allGroups
}

const sortByIntensity = (list: SupporterGroup[]) => [...list].sort((a, b) => b.intensity - a.intensity)

/**
 * Tous les groupes rattachés au club (même règles de priorité que l’encart,
 * sans limite de carte — comptage salons / liens hub).
 */
export function getAllGroupsForClub(teamId: string, allGroups: SupporterGroup[]): SupporterGroup[] {
  return sortByIntensity(pickGroupsForTeam(teamId, allGroups))
}

/** Nombre réel de salons = somme des canaux (chaque canal = un salon) sur ces groupes. */
export function countSalonChannelsForClub(teamId: string, allGroups: SupporterGroup[]): number {
  return getAllGroupsForClub(teamId, allGroups).reduce(
    (sum, g) => sum + (Array.isArray(g.channels) ? g.channels.length : 0),
    0,
  )
}

/**
 * Groupes / tribunes à montrer sur la page club : d’abord rattachés au `teamId`,
 * sinon tribunes « neutres » de la ligue, puis fallback large sur la ligue.
 */
export function getGroupsForClubPage(teamId: string, allGroups: SupporterGroup[], limit = 6): SupporterGroup[] {
  return getAllGroupsForClub(teamId, allGroups).slice(0, limit)
}
