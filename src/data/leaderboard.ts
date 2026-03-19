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

const NAMES = [
  'UltraNuit', 'GoalMachine', 'TifoKing', 'RagePress', 'CôtéVirage',
  'FootAddict', 'ButOrRien', 'PronoKing', 'ParieurPro', 'LiveMaster',
  'TifoFou', 'StadeLife', 'BallonDOr', 'Maracana', 'VirageNord',
  'SupportRouge', 'AwayDays', 'MatchDay', 'CanalPlus', 'Ligue1Fan',
  'PremierPro', 'LigaWatcher', 'SerieAce', 'BundesFan', 'EuroFoot',
]

function seed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}

export function generateLeaderboard(count = 250): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []
  const accents: LeaderboardEntry['accent'][] = ['violet', 'emerald', 'rose', 'amber']

  for (let i = 0; i < count; i++) {
    const nameIdx = i % NAMES.length
    const suffix = i >= NAMES.length ? `${Math.floor(i / NAMES.length)}` : ''
    const username = NAMES[nameIdx] + suffix
    const baseScore = 5000 - i * 12 + (seed(username) % 80)
    const score = Math.max(50, baseScore)
    const totalBets = 8 + (i % 25) + Math.floor(seed(username + 'b') % 15)
    const wins = Math.floor(totalBets * (0.4 + (seed(username + 'w') % 40) / 100))

    entries.push({
      rank: i + 1,
      userId: `lb-${i}`,
      username,
      avatarSeed: username.toLowerCase(),
      accent: accents[i % 4],
      score,
      wins,
      totalBets,
    })
  }

  return entries.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }))
}

export const mockLeaderboard = generateLeaderboard(250)
