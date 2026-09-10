import type { LeagueStandingRow } from '../data/leagueStandings'
import type { ClubPageMock } from '../data/clubPageMock'
import type { SupporterGroup } from '../types/group'
import { countSalonChannelsForClub, getAllGroupsForClub } from './groupsForClubPage'

export type ClubHubBarMetrics = Pick<
  ClubPageMock,
  | 'popularityLabel'
  | 'liveMsgPerMin'
  | 'activitySpike'
  | 'globalRank'
  | 'topFan'
  | 'onFire'
  | 'matchMode'
  | 'topFans'
  | 'stats'
  | 'hubPulse'
  | 'mvpTitle'
  | 'openRooms'
>

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`
  return String(n)
}

function leagueShortLabel(leagueName: string): string {
  const n = leagueName.trim()
  if (/ligue\s*1/i.test(n)) return 'L1'
  if (/premier\s*league/i.test(n)) return 'PL'
  if (/la\s*liga|liga/i.test(n)) return 'Liga'
  if (/serie\s*a/i.test(n)) return 'Serie A'
  if (/bundesliga/i.test(n)) return 'Bundes'
  if (/champions/i.test(n)) return 'C1'
  return n.length > 14 ? `${n.slice(0, 12)}…` : n || 'Championnat'
}

function findClubStanding(
  rows: LeagueStandingRow[],
  teamId: string,
  sportMonksTeamId?: number | null,
): LeagueStandingRow | null {
  const byId = rows.find((r) => r.teamId === teamId)
  if (byId) return byId
  if (sportMonksTeamId != null && sportMonksTeamId > 0) {
    return rows.find((r) => r.sportMonksParticipantId === sportMonksTeamId) ?? null
  }
  return null
}

/**
 * Remplit barre hub + stats communauté / podium / pulse à partir des tribunes club
 * + classement championnat. Top fans = présence active (30 min) sur les tribunes.
 */
export function buildClubHubBarMetrics(input: {
  teamId: string
  groups: SupporterGroup[]
  standingsRows: LeagueStandingRow[]
  leagueName: string
  sportMonksTeamId?: number | null
  matchMode?: boolean
  debatesCount?: number
}): ClubHubBarMetrics {
  const clubGroups = getAllGroupsForClub(input.teamId, input.groups)
  const openRooms = countSalonChannelsForClub(input.teamId, input.groups)
  const members = clubGroups.reduce((s, g) => s + (g.members ?? 0), 0)
  const messagesToday = clubGroups.reduce((s, g) => s + (g.messagesToday ?? 0), 0)
  const onlineNow = clubGroups.reduce((s, g) => s + (g.onlineNow ?? 0), 0)
  const reactionsToday = clubGroups.reduce((s, g) => s + (g.reactionsToday ?? 0), 0)
  const intensityPeak = clubGroups.reduce((m, g) => Math.max(m, g.intensity ?? 0), 0)
  const intensityAvg =
    clubGroups.length > 0
      ? Math.round(clubGroups.reduce((s, g) => s + (g.intensity ?? 0), 0) / clubGroups.length)
      : 0

  const standing = findClubStanding(input.standingsRows, input.teamId, input.sportMonksTeamId)
  const leagueShort = leagueShortLabel(input.leagueName)
  const globalRank = standing
    ? `${standing.rank}e · ${leagueShort} (${standing.points} pts)`
    : input.standingsRows.length
      ? `— · ${leagueShort}`
      : 'Classement à venir'

  const presenceHits = new Map<string, { name: string; seed: string; hits: number }>()
  for (const g of clubGroups) {
    for (const p of g.activePresence ?? []) {
      const cur = presenceHits.get(p.userId)
      if (cur) cur.hits += 1
      else presenceHits.set(p.userId, { name: p.displayName, seed: p.avatarSeed, hits: 1 })
    }
  }
  const rankedPresence = [...presenceHits.entries()].sort((a, b) => b[1].hits - a[1].hits)
  const topPresence = rankedPresence[0]
  const uniqueActiveFans = presenceHits.size

  const topFan = topPresence
    ? {
        name: topPresence[1].name,
        handle: `@${topPresence[1].name.replace(/\s+/g, '').slice(0, 16) || 'fan'}`,
        seed: topPresence[1].seed,
      }
    : {
        name: messagesToday > 0 || members > 0 ? 'En attente' : 'Sois le 1er',
        handle: '· tribunes club',
        seed: input.teamId,
      }

  const topFans = rankedPresence.slice(0, 5).map(([, v], i) => ({
    rank: i + 1,
    name: v.name,
    seed: v.seed,
    pts: `${v.hits} tribune${v.hits > 1 ? 's' : ''}`,
  }))

  const popularityLabel =
    members > 0
      ? `${formatCompact(members)} supporter${members > 1 ? 's' : ''} · tribunes`
      : clubGroups.length > 0
        ? `${clubGroups.length} groupe${clubGroups.length > 1 ? 's' : ''} club`
        : 'Communauté Talk Foot'

  const liveMsgPerMin =
    messagesToday > 0
      ? `${formatCompact(messagesToday)} msg / jour`
      : onlineNow > 0
        ? `${onlineNow} en ligne`
        : 'Calme pour l’instant'

  const activitySpike =
    intensityPeak >= 70
      ? `Pic ${intensityPeak}% · tribunes chaudes`
      : onlineNow > 0
        ? `${onlineNow} actif${onlineNow > 1 ? 's' : ''} · live`
        : reactionsToday > 0
          ? `${formatCompact(reactionsToday)} réactions / j`
          : '—'

  const debatesCount = input.debatesCount ?? 0

  const stats: ClubPageMock['stats'] = [
    {
      label: 'Fans tribunes',
      value: formatCompact(members),
      sub: members > 0 ? 'membres groupes club' : 'rejoins une tribune',
    },
    {
      label: 'En train de parler',
      value: formatCompact(Math.max(onlineNow, uniqueActiveFans)),
      sub: uniqueActiveFans > 0 ? `${uniqueActiveFans} vu(s) · 30 min` : 'personne actif pour l’instant',
    },
    {
      label: 'Messages (jour)',
      value: formatCompact(messagesToday),
      sub: openRooms > 0 ? `${openRooms} tribune${openRooms > 1 ? 's' : ''}` : 'salons club',
    },
    {
      label: 'Réactions (jour)',
      value: formatCompact(reactionsToday),
      sub: intensityAvg > 0 ? `Intensité moy. ${intensityAvg}%` : 'likes & réactions',
    },
  ]

  if (debatesCount > 0) {
    stats.push({
      label: 'Débats club',
      value: formatCompact(debatesCount),
      sub: 'ouverts / liés',
    })
  }
  if (standing) {
    stats.push({
      label: `Classement ${leagueShort}`,
      value: `${standing.rank}e`,
      sub: `${standing.points} pts · ${standing.played} j.`,
    })
  }

  const hubPulse: ClubPageMock['hubPulse'] = [
    {
      label: 'Messages 24h',
      value: formatCompact(messagesToday),
      sub: messagesToday > 0 ? 'tribunes club' : 'calme',
    },
    {
      label: 'Fans actifs',
      value: formatCompact(Math.max(onlineNow, uniqueActiveFans)),
      sub: onlineNow > 0 ? 'en ligne maintenant' : 'présence récente',
    },
    {
      label: 'Réactions 24h',
      value: formatCompact(reactionsToday),
      sub: reactionsToday > 0 ? 'sur les fils' : '—',
    },
    {
      label: 'Groupes / tribunes',
      value: `${clubGroups.length} / ${openRooms}`,
      sub: intensityPeak > 0 ? `pic ${intensityPeak}%` : 'intensité',
    },
  ]

  return {
    popularityLabel,
    liveMsgPerMin,
    activitySpike,
    globalRank,
    topFan,
    topFans,
    stats: stats.slice(0, 6),
    hubPulse,
    mvpTitle: topPresence
      ? `MVP tribunes · ${topPresence[1].name}`
      : 'MVP tribunes · à débloquer',
    openRooms,
    onFire: intensityPeak >= 70 || (input.matchMode === true && (messagesToday > 0 || onlineNow > 0)),
    matchMode: Boolean(input.matchMode),
  }
}
