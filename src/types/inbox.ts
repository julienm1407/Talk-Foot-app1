export type InboxNewsItem = {
  kind: 'news'
  id: string
  title: string
  excerpt: string
  href: string
  createdAtLabel: string
}

export type InboxInviteItem = {
  kind: 'invite'
  id: string
  subtype: 'group' | 'event'
  title: string
  subtitle: string
  /** Lien utile après acceptation (groupe, matchs, calendrier…) */
  href: string
  createdAtLabel: string
}

export type InboxFriendItem = {
  kind: 'friend'
  id: string
  displayName: string
  mutualHint?: string
  createdAtLabel: string
}

export type InboxLikeItem = {
  kind: 'like'
  id: string
  /** Ex. « Julien a aimé votre message » */
  title: string
  /** Extrait du message liké */
  messagePreview: string
  href: string
  actorDisplayName?: string
  createdAtLabel: string
  createdAtMs: number
}

export type InboxItem = InboxNewsItem | InboxInviteItem | InboxFriendItem | InboxLikeItem
