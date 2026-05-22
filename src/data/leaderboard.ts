export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarSeed: string
  accent: 'violet' | 'emerald' | 'rose' | 'amber'
  score: number
  wins: number
  totalBets: number
}

/** Ancien mock retiré — classement via RPC get_bettor_leaderboard + paris locaux. */
