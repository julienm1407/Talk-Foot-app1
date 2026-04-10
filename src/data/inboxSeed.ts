import { mockNews, newsItemHasArticlePage } from './news'
import type { InboxItem } from '../types/inbox'

/**
 * Notifications : uniquement des actus liées aux articles du site (pas de fausses invitations ni demandes d’amis).
 */
export function buildInboxSeed(): InboxItem[] {
  const topNews: InboxItem[] = mockNews
    .filter(newsItemHasArticlePage)
    .slice(0, 2)
    .map((n) => ({
      kind: 'news' as const,
      id: `news-${n.id}`,
      title: n.title,
      excerpt: n.excerpt,
      href: `/article/${n.slug}`,
      createdAtLabel:
        n.minutesAgo < 60
          ? `Il y a ${n.minutesAgo} min`
          : `Il y a ${Math.round(n.minutesAgo / 60)} h`,
    }))

  return topNews
}
