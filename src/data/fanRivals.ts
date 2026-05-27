/**
 * Clubs rivaux (même ville / derby) — pour lecture seule ou masquage des tribunes.
 * Clés = id équipe (teams.ts)
 */
export const FAN_RIVAL_CLUB_IDS: Record<string, string[]> = {
  psg: ['om'],
  om: ['psg', 'parisfc'],
  parisfc: ['om'],
  lyon: ['stetienne'],
  stetienne: ['lyon'],
  rma: ['fcb', 'atleti'],
  fcb: ['rma', 'espanyol'],
  mci: ['mun', 'liv'],
  mun: ['mci', 'liv'],
  liv: ['mun', 'eve'],
  inter: ['milan', 'juve'],
  milan: ['inter', 'juve'],
  juve: ['inter', 'milan', 'torino'],
  bayern: ['dortmund'],
  dortmund: ['bayern', 'schalke'],
  bvb: ['bayern'],
}

export function isRivalClub(userClubId: string | null, targetClubId: string): boolean {
  if (!userClubId) return false
  const rivals = FAN_RIVAL_CLUB_IDS[userClubId] ?? []
  return rivals.includes(targetClubId)
}

export function groupHasRivalClub(
  userClubId: string | null,
  groupClubIds: string[],
): boolean {
  if (!userClubId || groupClubIds.length === 0) return false
  return groupClubIds.some((cid) => isRivalClub(userClubId, cid))
}

/** Même logique avec plusieurs clubs favoris (jusqu’à 3). */
export function groupHasRivalForFanClubs(
  userClubIds: string[],
  groupClubIds: string[],
): boolean {
  if (userClubIds.length === 0 || groupClubIds.length === 0) return false
  return userClubIds.some((uid) => groupClubIds.some((gid) => isRivalClub(uid, gid)))
}
