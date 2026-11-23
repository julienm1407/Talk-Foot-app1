import type { SupporterGroup } from '../types/group'
import { groupHasRivalForFanClubs } from '../data/fanRivals'

export type GroupAccessLevel = 'full' | 'readonly' | 'hidden'

export type FanPrefsForAccess = {
  /** Jusqu’à 3 clubs ; accès / rivaux évalués sur l’ensemble */
  favoriteClubIds: string[]
  favoriteLeagueId: string | null
  hideRivalSalons: boolean
}

export function getGroupAccess(
  group: SupporterGroup,
  prefs: FanPrefsForAccess,
): GroupAccessLevel {
  const tags = group.fanTags
  if (!tags || (tags.clubIds.length === 0 && tags.leagueIds.length === 0)) {
    return 'full'
  }

  const fanClubs = prefs.favoriteClubIds
  const groupClubs = tags.clubIds

  /** Même tribune qu’un de tes clubs → accès complet (évite PSG+OM → tribune PSG en lecture seule). */
  const sharesClubAffinity =
    fanClubs.length > 0 && groupClubs.some((gid) => fanClubs.includes(gid))
  if (sharesClubAffinity) {
    return 'full'
  }

  if (prefs.hideRivalSalons && groupHasRivalForFanClubs(fanClubs, groupClubs)) {
    return 'hidden'
  }

  if (groupHasRivalForFanClubs(fanClubs, groupClubs)) {
    return 'readonly'
  }

  return 'full'
}

const DISCOVER_MIN_MEMBERS = 3

function affinityScore(g: SupporterGroup, prefs: FanPrefsForAccess): number {
  const t = g.fanTags
  if (!t) return 0
  let s = 0
  for (const cid of prefs.favoriteClubIds) {
    if (t.clubIds.includes(cid)) s += 100
  }
  if (prefs.favoriteLeagueId && t.leagueIds.includes(prefs.favoriteLeagueId)) s += 40
  return s
}

function activityScore(g: SupporterGroup): number {
  return (g.messagesToday ?? 0) * 12 + (g.reactionsToday ?? 0) * 2 + (g.members ?? 0)
}

/** Tribunes vides hors découverte, sauf celles déjà rejointes / créées. */
export function isDiscoverableGroup(
  group: SupporterGroup,
  prefs: FanPrefsForAccess,
  keepIds: ReadonlySet<string>,
): boolean {
  if (getGroupAccess(group, prefs) === 'hidden') return false
  if (keepIds.has(group.id) || group.createdBy === 'me') return true
  return (group.members ?? 0) >= DISCOVER_MIN_MEMBERS
}

export function filterDiscoverableGroups(
  groups: SupporterGroup[],
  prefs: FanPrefsForAccess,
  keepIds: ReadonlySet<string>,
): SupporterGroup[] {
  return groups.filter((g) => isDiscoverableGroup(g, prefs, keepIds))
}

export function sortGroupsByFanAffinity(
  groups: SupporterGroup[],
  prefs: FanPrefsForAccess,
): SupporterGroup[] {
  return [...groups].sort((a, b) => {
    const da = getGroupAccess(a, prefs)
    const db = getGroupAccess(b, prefs)
    if (da === 'hidden' && db !== 'hidden') return 1
    if (db === 'hidden' && da !== 'hidden') return -1
    if (da === 'readonly' && db === 'full') return 1
    if (db === 'readonly' && da === 'full') return -1
    const act = activityScore(b) - activityScore(a)
    if (act !== 0) return act
    return affinityScore(b, prefs) - affinityScore(a, prefs) || b.intensity - a.intensity
  })
}
