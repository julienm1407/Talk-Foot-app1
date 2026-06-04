import type { Match } from '../types/match'
import type { NewsItem } from './news'
import type { SupporterGroup } from '../types/group'
import { starterGroups } from './groups'
import { teams } from './teams'

/** Id fictif réservé aux encarts article (pas une tribune réel — les CTA pointent vers un vrai live si dispo). */
export const ARTICLE_PREVIEW_MATCH_ID = 'article-encart-preview'

/** Données visuelles pour la démo d’encart dans les articles (hors calendrier live). */
export const articlePreviewLiveMatch: Match = {
  id: ARTICLE_PREVIEW_MATCH_ID,
  competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
  home: teams['ligue-1'].find((t) => t.id === 'rennes') ?? teams['ligue-1'][0],
  away: teams['ligue-1'].find((t) => t.id === 'psg') ?? teams['ligue-1'][0],
  kickoffAt: '2025-03-08T17:00:00+01:00',
  status: 'live',
  minute: 73,
  score: { home: 1, away: 2 },
}

export type GroupDiscussPreview = {
  groupId: string
  name: string
  emoji: string
  themePrimary: string
  motto?: string
  /** Dernier message cloud (`lastMessagePreview`) — jamais de texte inventé. */
  previewText?: string
  members?: number
  onlineNow?: number
  messagesToday?: number
}

function affinityScore(g: SupporterGroup, article: NewsItem): number {
  let s = 0
  const leagueIds = article.leagueIds ?? []
  const clubIds = article.clubIds ?? []
  const gLeagues = g.fanTags?.leagueIds ?? []
  const gClubs = g.fanTags?.clubIds ?? []
  for (const l of leagueIds) {
    if (gLeagues.includes(l)) s += 2
  }
  for (const c of clubIds) {
    if (gClubs.includes(c)) s += 4
  }
  if (leagueIds.length === 0 && clubIds.length === 0) s += 0.5
  return s
}

export function getGroupDiscussPreviewsForArticle(
  article: NewsItem,
  groups: SupporterGroup[] = [],
  max = 3,
): GroupDiscussPreview[] {
  const pool = groups.length > 0 ? groups : starterGroups
  return [...pool]
    .map((g) => ({
      g,
      score: affinityScore(g, article) + (g.intensity ?? 0) / 200,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ g }) => ({
      groupId: g.id,
      name: g.name,
      emoji: g.emoji,
      themePrimary: g.theme.primary,
      motto: g.motto?.trim() || undefined,
      previewText: g.lastMessagePreview?.trim() || undefined,
      members: g.members,
      onlineNow: g.onlineNow,
      messagesToday: g.messagesToday,
    }))
}

/** Série momentum (0–100) pour sparkline — varie légèrement selon l’article. */
export function stadeMomentumSeries(articleId: string): number[] {
  const seed = articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const base = [22, 28, 31, 35, 42, 48, 55, 52, 61, 58, 67, 72, 78, 74, 82, 88, 85, 91, 87, 94]
  return base.map((v, i) => Math.min(100, Math.max(8, v + ((seed + i * 7) % 9) - 4)))
}

export type ReactionSplit = { label: string; home: number; away: number }

export function stadeReactionSplits(articleId: string): ReactionSplit[] {
  const seed = articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const h1 = 42 + (seed % 12)
  const h2 = 55 + (seed % 8)
  const h3 = 38 + (seed % 15)
  return [
    { label: '🔥 Réactions / min', home: h1, away: 100 - h1 },
    { label: '📣 Chants & vibes', home: Math.min(72, h2), away: 100 - Math.min(72, h2) },
    { label: '⚡ Pics d’activité', home: h3, away: 100 - h3 },
  ]
}

export type DebateSnippet = { id: string; title: string; likes: number; hot?: boolean }

export function debateSnippetsForArticle(
  _article: NewsItem,
  debates: { id: string; title: string; messagesCount: number; trending?: boolean; featured?: boolean }[] = [],
): DebateSnippet[] {
  if (!debates.length) return []
  const sorted = [...debates].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    if (a.trending && !b.trending) return -1
    if (!a.trending && b.trending) return 1
    return (b.messagesCount ?? 0) - (a.messagesCount ?? 0)
  })
  return sorted.slice(0, 2).map((d) => ({
    id: d.id,
    title: d.title,
    likes: d.messagesCount,
    hot: d.trending || d.featured,
  }))
}

export type BetVolumeSlice = { label: string; pct: number; color: string }

export function betVolumePreview(articleId: string): BetVolumeSlice[] {
  const seed = articleId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  let a = 36 + (seed % 14)
  let b = 28 + (seed % 12)
  let c = 100 - a - b
  if (c < 18) {
    a = Math.max(30, a - 6)
    c = 100 - a - b
  }
  if (c < 18) {
    b = Math.max(24, b - 4)
    c = 100 - a - b
  }
  return [
    { label: '1', pct: a, color: '#0ea5e9' },
    { label: 'N', pct: b, color: '#94a3b8' },
    { label: '2', pct: c, color: '#0d9488' },
  ]
}
