import type { Match } from '../types/match'

export type TrendingChannel = {
  matchId: string
  label: string
  activityScore: number
  activeUsers: number
  vibe: 'Hype' | 'Tense' | 'Derby' | 'Underdog'
}

export function buildTrendingChannels(matches: Match[]): TrendingChannel[] {
  const seeded = matches.map((m, idx) => {
    const base = 70 - idx * 7
    const liveBoost = m.status === 'live' ? 28 : 0
    const activityScore = Math.max(15, Math.min(99, base + liveBoost))
    const activeUsers = Math.round(40 + activityScore * 2.2)
    const vibe: TrendingChannel['vibe'] =
      m.home.shortName === 'PSG' && m.away.shortName === 'OM'
        ? 'Derby'
        : m.status === 'live'
          ? 'Hype'
          : idx % 2 === 0
            ? 'Tense'
            : 'Underdog'

    return {
      matchId: m.id,
      label: `${m.home.shortName} × ${m.away.shortName}`,
      activityScore,
      activeUsers,
      vibe,
    }
  })

  return seeded.sort((a, b) => b.activityScore - a.activityScore).slice(0, 6)
}

