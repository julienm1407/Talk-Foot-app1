import { formatRelativeMinutesAgo } from '../utils/formatRelativeMinutes'
import { newsItemHasArticlePage } from './news'
import type { NewsItem } from './news'
import type { InboxItem } from '../types/inbox'

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
      createdAtLabel: formatRelativeMinutesAgo(n.minutesAgo, { sentenceCase: true }),
    }))
}
