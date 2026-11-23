import type { Match } from '../types/match'
import { teams } from '../data/teams'
import { matchCalendarDayKeyParis } from './time'

/** Poids « affiche » d’un club — les derbys européens comptent, Monza beaucoup moins. */
const CLUB_PRESTIGE: Record<string, number> = {
  psg: 100,
  om: 94,
  lyon: 80,
  monaco: 78,
  lille: 76,
  marseille: 94,
  nice: 60,
  lens: 62,
  rennes: 58,
  strasbourg: 52,
  rma: 100,
  fcb: 98,
  atleti: 84,
  mci: 96,
  liv: 96,
  ars: 90,
  mun: 88,
  che: 86,
  tot: 80,
  new: 70,
  avl: 66,
  bayern: 100,
  bvb: 90,
  dortmund: 90,
  leverkusen: 80,
  leipzig: 68,
  inter: 92,
  juve: 90,
  milan: 88,
  napoli: 84,
  roma: 74,
  lazio: 70,
  atalanta: 68,
  fiorentina: 50,
  monza: 14,
  lecce: 14,
  como: 22,
}

const STAR_FRENCH = new Set(['psg', 'om', 'lyon', 'monaco', 'lille', 'marseille'])

const FRENCH_CLUB_IDS = new Set(
  [...(teams['ligue-1'] ?? []), ...(teams['ligue-2'] ?? [])].map((t) => t.id),
)

const COMP_WEIGHT: Record<string, number> = {
  ucl: 92,
  uel: 62,
  uecl: 44,
  cdf: 52,
  'ligue-1': 44,
  'ligue-2': 22,
  epl: 34,
  laliga: 34,
  bund: 32,
  'serie-a': 32,
}

function kickoffMs(iso: string): number {
  const n = Date.parse(iso)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function prestige(clubId: string): number {
  return CLUB_PRESTIGE[clubId] ?? 24
}

function scoreMatch(match: Match, favoriteClubIds: string[], now: Date): number {
  const home = prestige(match.home.id)
  const away = prestige(match.away.id)
  let s = (COMP_WEIGHT[match.competition.id] ?? 8) + home + away

  const lo = Math.min(home, away)
  const hi = Math.max(home, away)
  if (lo >= 78 && hi >= 88) s += 52

  const ids = [match.home.id, match.away.id]
  if (ids.some((id) => STAR_FRENCH.has(id))) s += 110
  else if (ids.some((id) => FRENCH_CLUB_IDS.has(id))) s += 18
  if (match.competition.id === 'ucl' && ids.some((id) => STAR_FRENCH.has(id))) s += 24

  const today = matchCalendarDayKeyParis(now)
  const day = matchCalendarDayKeyParis(match.kickoffAt)
  if (day === today) s += 40
  else if (day > today) {
    const days = Math.max(0, Math.round((kickoffMs(match.kickoffAt) - now.getTime()) / 86_400_000))
    s += Math.max(0, 20 - days)
  }
  if (match.status === 'live') s += 10
  if (match.status === 'finished' && day === today) s += 6
  if (favoriteClubIds.includes(match.home.id) || favoriteClubIds.includes(match.away.id)) {
    s += 22
  }
  return s
}

/**
 * Un seul match épinglé : LDC et clubs français d’abord, puis les vraies affiches
 * (PL, Serie A, etc.). Un Monza–Florence ne passe pas devant un choc.
 */
export function pickTalkFootMatchOfTheDay(
  matches: Match[],
  favoriteClubIds: string[] = [],
  now: Date = new Date(),
): Match | null {
  const open = matches.filter((m) => m.status === 'live' || m.status === 'upcoming')
  const pool = open.length ? open : matches
  if (!pool.length) return null

  const ranked = pool
    .map((m) => ({ m, s: scoreMatch(m, favoriteClubIds, now) }))
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s
      return kickoffMs(a.m.kickoffAt) - kickoffMs(b.m.kickoffAt)
    })

  return ranked[0]?.m ?? null
}
