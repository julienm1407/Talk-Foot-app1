import type { Bet } from '../types/bet'
import type { LeaderboardEntry } from '../data/leaderboard'

const ACCENTS: LeaderboardEntry['accent'][] = ['violet', 'emerald', 'rose', 'amber']

export function accentForBettorId(userId: string): LeaderboardEntry['accent'] {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h + userId.charCodeAt(i)) % ACCENTS.length
  return ACCENTS[h]!
}

export function avatarSeedFromUsername(username: string, userId: string): string {
  const base = username.trim().replace(/\s+/g, '-').slice(0, 24)
  return base || userId.slice(0, 12) || 'parieur'
}

/** Stats à partir des paris réels (cloud ou local). */
export function statsFromBets(bets: Bet[]): {
  score: number
  wins: number
  totalBets: number
  isActive: boolean
} {
  const active = bets.filter((b) => b.status === 'won' || b.status === 'lost' || b.status === 'open')
  if (!active.length) {
    return { score: 0, wins: 0, totalBets: 0, isActive: false }
  }
  const wins = active.filter((b) => b.status === 'won').length
  const score = active
    .filter((b) => b.status === 'won')
    .reduce((s, b) => s + Math.round(b.payout ?? b.stake * b.odds), 0)
  const totalBets = active.filter((b) => b.status === 'won' || b.status === 'lost').length
  return { score, wins, totalBets: totalBets || active.length, isActive: true }
}

export function buildLeaderboardEntry(
  rank: number,
  userId: string,
  username: string,
  score: number,
  wins: number,
  totalBets: number,
): LeaderboardEntry {
  return {
    rank,
    userId,
    username,
    avatarSeed: avatarSeedFromUsername(username, userId),
    accent: accentForBettorId(userId),
    score,
    wins,
    totalBets,
  }
}

export function rankLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.score - a.score || b.wins - a.wins || b.totalBets - a.totalBets,
  )
  return sorted.map((e, i) => ({ ...e, rank: i + 1 }))
}
