import fs from 'node:fs'

const synced = JSON.parse(fs.readFileSync('scripts/sm-team-ids-output.json', 'utf8'))
const base = {
  psg: 591, om: 44, monaco: 6789, nice: 450, lille: 690, lyon: 79, lens: 271, rennes: 598,
  brest: 266, nantes: 59, strasbourg: 686, montpellier: 581, reims: 1028, toulouse: 289,
  lorient: 9257, lehavre: 1055, metz: 3513, auxerre: 3682, angers: 47, stetienne: 108, parisfc: 4508,
  mci: 9, liv: 8, ars: 19, che: 18, mun: 14, tot: 6, new: 20, avl: 15,
  rma: 3468, fcb: 83, atleti: 7980, sevilla: 676, villarreal: 3477,
  bayern: 503, bay: 503, bvb: 68, leverkusen: 3321, leipzig: 277,
  inter: 2930, milan: 113, juve: 625, napoli: 597, roma: 37, lazio: 43, atalanta: 708, fiorentina: 109,
}
const merged = { ...base, ...synced.teamIds, bologna: 8513 }
const folders = {
  6: 6, 7: 7, 8: 8, 9: 9, 11: 11, 13: 13, 14: 14, 15: 15, 19: 19, 20: 20, 29: 29,
  37: 5, 43: 11, 44: 12, 59: 27, 68: 4, 79: 15, 83: 19, 102: 6, 108: 12, 113: 17,
  266: 10, 271: 15, 277: 21, 289: 1, 450: 2, 503: 23, 581: 5, 591: 15, 597: 21, 598: 22,
  625: 17, 676: 4, 686: 14, 690: 18, 708: 4, 776: 8, 1028: 4, 1055: 31, 2930: 18, 3321: 25,
  3468: 12, 3477: 21, 3513: 25, 3682: 2, 4508: 28, 6789: 5, 7980: 12, 9257: 9,
  ...synced.folders,
  8513: 1,
}
for (const id of Object.values(merged)) {
  const f = synced.folders[String(id)]
  if (f != null) folders[id] = f
}
folders[8513] = 1

const teamLines = Object.entries(merged)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => `  ${k}: ${v},`)
  .join('\n')
const folderLines = Object.entries(folders)
  .sort((a, b) => Number(a[0]) - Number(b[0]))
  .map(([k, v]) => `  ${k}: ${v},`)
  .join('\n')

fs.writeFileSync(
  'src/data/sportMonksKnownTeamIds.ts',
  `/**
 * Ids équipe SportMonks (participant) pour clubs du catalogue Talk Foot.
 * L1 / top5 : ids vérifiés via API + scripts/sync-sm-team-ids.mjs (mai 2026).
 */
export const SPORTMONKS_TEAM_ID_BY_CLUB_ID: Readonly<Record<string, number>> = {
${teamLines}
}

export const SPORTMONKS_TEAM_SEASON_ID_BY_CLUB_ID: Readonly<Partial<Record<string, number>>> = {}

export const SPORTMONKS_SQUAD_PLAYER_STAT_SEASON_BY_CLUB_ID: Readonly<Partial<Record<string, number>>> = {}
`,
)

fs.writeFileSync(
  'src/data/sportMonksLogoUrls.ts',
  `import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from './sportMonksKnownTeamIds'

/** Dossier CDN SportMonks (cdn.sportmonks.com/images/soccer/teams/{folder}/{id}.png). */
export const SPORTMONKS_CDN_FOLDER_BY_TEAM_ID: Readonly<Record<number, number>> = {
${folderLines}
}

export const SPORTMONKS_CDN_FOLDER_BY_LEAGUE_ID: Readonly<Record<number, number>> = {
  5: 5,
  8: 8,
  82: 18,
  301: 13,
  384: 0,
  564: 20,
  848: 16,
  1371: 27,
  2286: 14,
}

export function cdnTeamLogoFromImagePath(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) return null
  const m = pathOrUrl.trim().match(/\\/teams\\/(\\d+)\\/(\\d+)\\./i)
  if (!m) return null
  return \`https://cdn.sportmonks.com/images/soccer/teams/\${m[1]}/\${m[2]}.png\`
}

export function sportMonksTeamLogoUrl(teamId: number): string | null {
  const folder = SPORTMONKS_CDN_FOLDER_BY_TEAM_ID[teamId]
  if (folder == null) return null
  return \`https://cdn.sportmonks.com/images/soccer/teams/\${folder}/\${teamId}.png\`
}

export function sportMonksLeagueLogoUrl(leagueId: number): string | null {
  const folder = SPORTMONKS_CDN_FOLDER_BY_LEAGUE_ID[leagueId]
  if (folder == null) return null
  return \`https://cdn.sportmonks.com/images/soccer/leagues/\${folder}/\${leagueId}.png\`
}

export function sportMonksTeamLogoUrlForClubId(clubId: string): string | null {
  const smId = SPORTMONKS_TEAM_ID_BY_CLUB_ID[clubId]
  if (smId == null) return null
  return sportMonksTeamLogoUrl(smId)
}
`,
)

console.log('OK', Object.keys(merged).length, 'teams', Object.keys(folders).length, 'folders')
