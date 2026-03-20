import type { SupporterGroup } from '../types/group'
import { groupHasRivalClub } from '../data/fanRivals'

export type GroupAccessLevel = 'full' | 'readonly' | 'hidden'

export type FanPrefsForAccess = {
  favoriteClubId: string | null
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

  if (prefs.hideRivalSalons && groupHasRivalClub(prefs.favoriteClubId, tags.clubIds)) {
    return 'hidden'
  }

  if (groupHasRivalClub(prefs.favoriteClubId, tags.clubIds)) {
    return 'readonly'
  }

  return 'full'
}

export function sortGroupsByFanAffinity(
  groups: SupporterGroup[],
  prefs: FanPrefsForAccess,
): SupporterGroup[] {
  const league = prefs.favoriteLeagueId
  const club = prefs.favoriteClubId

  return [...groups].sort((a, b) => {
    const score = (g: SupporterGroup) => {
      const t = g.fanTags
      if (!t) return 0
      let s = 0
      if (club && t.clubIds.includes(club)) s += 100
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
