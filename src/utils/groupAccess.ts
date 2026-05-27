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

export function sortGroupsByFanAffinity(
  groups: SupporterGroup[],
  prefs: FanPrefsForAccess,
): SupporterGroup[] {
  const league = prefs.favoriteLeagueId
  const clubs = prefs.favoriteClubIds

  return [...groups].sort((a, b) => {
    const score = (g: SupporterGroup) => {
      const t = g.fanTags
      if (!t) return 0
      let s = 0
      for (const cid of clubs) {
        if (t.clubIds.includes(cid)) s += 100
      }
      if (league && t.leagueIds.includes(league)) s += 40
      return s
    }
    const da = getGroupAccess(a, prefs)
    const db = getGroupAccess(b, prefs)
    if (da === 'hidden' && db !== 'hidden') return 1
    if (db === 'hidden' && da !== 'hidden') return -1
    if (da === 'readonly' && db === 'full') return 1
    if (db === 'readonly' && da === 'full') return -1
    return score(b) - score(a) || b.intensity - a.intensity
  })
}
