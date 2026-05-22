import { newsItemHasArticlePage } from './news'
import type { NewsItem } from './news'
import type { InboxItem } from '../types/inbox'

function formatNewsAge(n: NewsItem): string {
  if (n.minutesAgo < 60) return `Il y a ${n.minutesAgo} min`
  return `Il y a ${Math.round(n.minutesAgo / 60)} h`
}

/**
 * Notifications actu : uniquement les articles publiés en base (pas de seed fictif).
 */
export function buildInboxSeed(articles: NewsItem[]): InboxItem[] {
  return articles
    .filter(newsItemHasArticlePage)
    .slice(0, 2)
    .map((n) => ({
      kind: 'news' as const,
      id: `news-${n.id}`,
      title: n.title,
      excerpt: n.excerpt,
      href: `/article/${n.slug}`,
      createdAtLabel: formatNewsAge(n),
    }))
}
