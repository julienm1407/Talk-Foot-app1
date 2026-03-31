import type { Match } from '../types/match'
import type { SupporterGroup } from '../types/group'
import type { Debate } from '../data/debates'
import type { NewsItem } from '../data/news'

export type SiteSearchResultKind = 'match' | 'group' | 'debate' | 'article' | 'page'

export type SiteSearchResult = {
  kind: SiteSearchResultKind
  id: string
  title: string
  subtitle?: string
  href: string
  score: number
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreBlob(blob: string, queryNorm: string, words: string[]): number {
  if (!queryNorm || words.length === 0) return 0
  let s = 0
  if (blob.includes(queryNorm)) s += 12
  for (const w of words) {
    if (w.length >= 2 && blob.includes(w)) s += 4
  }
  return s
}

const STATIC_PAGES: { title: string; subtitle: string; href: string; kw: string }[] = [
  { title: 'Match', subtitle: 'Live, planning & salons', href: '/match', kw: 'match agenda matchs live direct programme ligue coupe calendrier' },
  { title: 'Match', subtitle: 'Matchs par jour et par ligue', href: '/match', kw: 'match calendrier planning date programme agenda' },
  { title: 'Groupes & tribunes', subtitle: 'Salons de supporters', href: '/groups', kw: 'groupe tribune salon communauté' },
  { title: 'Débats', subtitle: 'Discussions tendance', href: '/debates', kw: 'débat discussion topic' },
  { title: 'Classements', subtitle: 'Paris & ligues', href: '/rankings', kw: 'classement ranking ligue paris' },
  { title: 'Profil', subtitle: 'Favoris & réglages', href: '/profile', kw: 'profil compte favoris paramètres' },
  { title: 'Boutique', subtitle: 'Maillots & goodies', href: '/boutique', kw: 'boutique shop maillot' },
  { title: 'Vidéos', subtitle: 'Extraits & replays', href: '/videos', kw: 'vidéo video replay highlight' },
]

/**
 * Recherche locale sur matchs, groupes, débats, actus (articles avec slug) et pages clés.
 * Seuil minimal : 2 caractères (après trim).
 */
export function runSiteSearch(
  rawQuery: string,
  ctx: {
    matches: Match[]
    groups: SupporterGroup[]
    debates: Debate[]
    news: NewsItem[]
  },
  limit = 14,
): SiteSearchResult[] {
  const q = rawQuery.trim()
  if (q.length < 2) return []

  const queryNorm = normalize(q)
  const words = queryNorm.split(/\s+/).filter((w) => w.length > 0)
  const out: SiteSearchResult[] = []

  for (const p of STATIC_PAGES) {
    const blob = normalize(`${p.title} ${p.subtitle} ${p.kw}`)
    const sc = scoreBlob(blob, queryNorm, words)
    if (sc > 0) {
      out.push({
        kind: 'page',
        id: `page:${p.href}`,
        title: p.title,
        subtitle: p.subtitle,
        href: p.href,
        score: sc,
      })
    }
  }

  for (const m of ctx.matches) {
    const blob = normalize(
      [
        m.home.name,
        m.home.shortName,
        m.away.name,
        m.away.shortName,
        m.competition.name,
        m.competition.shortName,
        m.status === 'live' ? 'direct live' : '',
        m.status === 'upcoming' ? 'à venir prochain' : '',
      ].join(' '),
    )
    const sc = scoreBlob(blob, queryNorm, words)
    if (sc > 0) {
      const subtitle = `${m.home.shortName} – ${m.away.shortName} · ${m.competition.shortName}`
      out.push({
        kind: 'match',
        id: m.id,
        title:
          m.status === 'live'
            ? `En direct : ${m.home.shortName} – ${m.away.shortName}`
            : `${m.home.shortName} – ${m.away.shortName}`,
        subtitle,
        href: `/channel/${m.id}`,
        score: sc + (m.status === 'live' ? 2 : 0),
      })
    }
  }

  for (const g of ctx.groups) {
    const blob = normalize(
      [g.name, g.motto, g.emoji, g.location, ...(g.hashtags ?? []), g.lastMessagePreview ?? ''].join(' '),
    )
    const sc = scoreBlob(blob, queryNorm, words)
    if (sc > 0) {
      out.push({
        kind: 'group',
        id: g.id,
        title: `${g.emoji} ${g.name}`,
        subtitle: g.motto,
        href: `/group/${g.id}`,
        score: sc,
      })
    }
  }

  for (const d of ctx.debates) {
    const blob = normalize([d.title, d.excerpt].join(' '))
    const sc = scoreBlob(blob, queryNorm, words)
    if (sc > 0) {
      out.push({
        kind: 'debate',
        id: d.id,
        title: d.title,
        subtitle: d.excerpt,
        href: `/debate/${d.id}`,
        score: sc,
      })
    }
  }

  for (const n of ctx.news) {
    if (!n.slug) continue
    const blob = normalize([n.title, n.excerpt, n.tag].join(' '))
    const sc = scoreBlob(blob, queryNorm, words)
    if (sc > 0) {
      out.push({
        kind: 'article',
        id: n.id,
        title: n.title,
        subtitle: n.excerpt,
        href: `/article/${n.slug}`,
        score: sc,
      })
    }
  }

  out.sort((a, b) => b.score - a.score)
  return out.slice(0, limit)
}

export function kindLabel(kind: SiteSearchResultKind): string {
  switch (kind) {
    case 'match':
      return 'Match'
    case 'group':
      return 'Groupe'
    case 'debate':
      return 'Débat'
    case 'article':
      return 'Actu'
    case 'page':
      return 'Page'
    default:
      return ''
  }
}
