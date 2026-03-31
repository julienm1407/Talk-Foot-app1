import { mockNews, newsItemHasArticlePage } from './news'
import type { InboxItem } from '../types/inbox'

/**
 * Notifications type « boîte de réception » : top actus, invitations, demandes d’amis.
 * Les actus sont alignées sur les articles disponibles sur le site.
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

  const invites: InboxItem[] = [
    {
      kind: 'invite',
      id: 'inv-group-kop',
      subtype: 'group',
      title: 'Salon « Kop Nord 24 »',
      subtitle: 'NordKop te invite à rejoindre la tribune avant le prochain choc.',
      href: '/groups',
      createdAtLabel: 'Il y a 1 h',
    },
    {
      kind: 'invite',
      id: 'inv-event-soiree',
      subtype: 'event',
      title: 'Soirée match L1',
      subtitle: 'Rappel : rejoins le salon live samedi 21h — lien direct depuis Matchs.',
      href: '/match',
      createdAtLabel: 'Il y a 3 h',
    },
  ]

  const friends: InboxItem[] = [
    {
      kind: 'friend',
      id: 'fr-tifomarc',
      displayName: 'TifoMarc',
      mutualHint: '2 amis en commun sur Talk Foot',
      createdAtLabel: 'Hier',
    },
    {
      kind: 'friend',
      id: 'fr-lina92',
      displayName: 'Lina_92',
      mutualHint: 'Supportrice OM — même salon que toi',
      createdAtLabel: 'Il y a 2 j',
    },
  ]

  return [...topNews, ...invites, ...friends]
}
