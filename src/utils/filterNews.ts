import type { NewsItem } from '../data/news'

const WORLD_CUP_TITLE = /mondial|coupe du monde|world cup/i

export function filterNewsForFan(
  items: NewsItem[],
  favoriteLeagueId: string | null,
  favoriteClubIds: string[],
  opts?: { demoteWorldCup?: boolean },
): NewsItem[] {
  const demoteWorldCup = opts?.demoteWorldCup ?? false
  const boosted: { item: NewsItem; score: number }[] = items.map((n) => {
    let score = 0
    const leagues = n.leagueIds
    const clubs = n.clubIds
    if (!leagues?.length && !clubs?.length) {
      score = 50
    } else {
      if (favoriteLeagueId && leagues?.includes(favoriteLeagueId)) score += 40
      if (clubs?.length && favoriteClubIds.some((id) => clubs.includes(id))) score += 60
      if (leagues?.length && !favoriteLeagueId) score += 5
    }
    if (demoteWorldCup) {
      const wc =
        leagues?.includes('wc-2026') ||
        WORLD_CUP_TITLE.test(n.title) ||
        WORLD_CUP_TITLE.test(n.excerpt ?? '')
      if (wc) score -= 80
    }
    return { item: n, score }
  })

  boosted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ta = a.item.publishedAt ? new Date(a.item.publishedAt).getTime() : 0
    const tb = b.item.publishedAt ? new Date(b.item.publishedAt).getTime() : 0
    return tb - ta
  })
  return boosted.map((x) => x.item)
}
