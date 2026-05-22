import type { Match } from '../types/match'
import type { NewsItem } from './news'
import type { SupporterGroup } from '../types/group'
import { starterGroups } from './groups'
import { teams } from './teams'

/** Id fictif réservé aux encarts article (pas un salon réel — les CTA pointent vers un vrai live si dispo). */
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

export type TopLikedMessage = {
  id: string
  author: string
  text: string
  likes: number
}

export type GroupDiscussPreview = {
  groupId: string
  name: string
  emoji: string
  themePrimary: string
  messages: TopLikedMessage[]
}

const GROUP_MESSAGES: Record<string, TopLikedMessage[]> = {
  'g-virage-nord': [
    {
      id: 'm1',
      author: 'KOP13',
      text: 'Ce choc avant le Vélodrome, on le sent déjà. L’OM doit prendre les points ici.',
      likes: 428,
    },
    {
      id: 'm2',
      author: 'SashaMarseille',
      text: 'Le milieu rival est fatigué — si on accélère à la 70e ça joue.',
      likes: 312,
    },
    {
      id: 'm3',
      author: 'VeloVoice',
      text: 'Ambiance Talk Foot insane ce soir, ça chante dans le salon L1 🔥',
      likes: 267,
    },
  ],
  'g-ultras-nuit': [
    {
      id: 'm1',
      author: 'ParisSud',
      text: 'Pressing haut + transitions : la recette qu’on a vue en EPL, on la veut en L1.',
      likes: 511,
    },
    {
      id: 'm2',
      author: 'Lucas_75',
      text: 'Dembélé sur le côté gauche = danger permanent. Les stats live le confirment.',
      likes: 402,
    },
    {
      id: 'm3',
      author: 'AuteuilRouge',
      text: 'Le salon live est à 12 msg/s au dernier corner, jamais vu ça sur une amical.',
      likes: 355,
    },
  ],
  'g-kop-bleu': [
    {
      id: 'm1',
      author: 'Cityzen',
      text: 'Le pressing haut en EPL ça se joue sur 5 mètres — regardez la séquence à la 22e.',
      likes: 389,
    },
    {
      id: 'm2',
      author: 'HaalandFan',
      text: 'Les xG du live encart collent au réel, City domine les secondes 45.',
      likes: 276,
    },
    {
      id: 'm3',
      author: 'PepThoughts',
      text: 'Kop virtuel qui hurle à chaque récup haute, j’adore cette synchro.',
      likes: 198,
    },
  ],
  'g-tribune-rouge': [
    {
      id: 'm1',
      author: 'AnfieldFR',
      text: 'YNWA en tribune Talk Foot + stats pressing = soirée parfaite.',
      likes: 334,
    },
    {
      id: 'm2',
      author: 'SalahSZN',
      text: 'Le débrief auto sur les 3 actions clés, c’est exactement ce qu’il fallait.',
      likes: 245,
    },
    {
      id: 'm3',
      author: 'KopEnd',
      text: 'Plus de 400 réactions / 10 min sur le live, le dashboard suit la courbe.',
      likes: 189,
    },
  ],
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

export function getGroupDiscussPreviewsForArticle(article: NewsItem, max = 3): GroupDiscussPreview[] {
  const ranked = [...starterGroups]
    .map((g) => ({ g, score: affinityScore(g, article) + g.intensity / 200 }))
    .sort((a, b) => b.score - a.score)

  const picked: SupporterGroup[] = []
  for (const { g } of ranked) {
    if (picked.length >= max) break
    if (GROUP_MESSAGES[g.id]) picked.push(g)
  }
  if (picked.length < max) {
    for (const g of starterGroups) {
      if (picked.length >= max) break
      if (!picked.includes(g) && GROUP_MESSAGES[g.id]) picked.push(g)
    }
  }

  return picked.map((g) => ({
    groupId: g.id,
    name: g.name,
    emoji: g.emoji,
    themePrimary: g.theme.primary,
    messages: GROUP_MESSAGES[g.id] ?? [],
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
  debates: { id: string; title: string; messagesCount: number; trending?: boolean }[] = [],
): DebateSnippet[] {
  if (!debates.length) return []
  return debates.slice(0, 2).map((d) => ({
    id: d.id,
    title: d.title,
    likes: d.messagesCount,
    hot: d.trending,
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
