import type { NewsItem } from '../data/news'

export function filterNewsForFan(
  items: NewsItem[],
  favoriteLeagueId: string | null,
  favoriteClubId: string | null,
): NewsItem[] {
  const boosted: { item: NewsItem; score: number }[] = items.map((n) => {
    let score = 0
    const leagues = n.leagueIds
    const clubs = n.clubIds
    if (!leagues?.length && !clubs?.length) {
      score = 50
    } else {
      if (favoriteLeagueId && leagues?.includes(favoriteLeagueId)) score += 40
      if (favoriteClubId && clubs?.includes(favoriteClubId)) score += 60
      if (leagues?.length && !favoriteLeagueId) score += 5
    }
    return { item: n, score }
  })

  boosted.sort((a, b) => b.score - a.score || a.item.minutesAgo - b.item.minutesAgo)
  return boosted.map((x) => x.item)
}
