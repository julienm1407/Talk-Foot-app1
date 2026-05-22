import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewsItem } from '../../data/news'

export type ArticleRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: NewsItem['tag']
  body: unknown
  league_ids: string[] | null
  club_ids: string[] | null
  published_at: string
  status: string
}

function minutesAgoFromIso(iso: string): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 60_000))
}

function parseBody(body: unknown): string[] {
  if (!Array.isArray(body)) return []
  return body.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
}

export function articleRowToNewsItem(row: ArticleRow): NewsItem {
  const body = parseBody(row.body)
  const base: NewsItem = {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    tag: row.tag,
    minutesAgo: minutesAgoFromIso(row.published_at),
    leagueIds: row.league_ids?.length ? row.league_ids : undefined,
    clubIds: row.club_ids?.length ? row.club_ids : undefined,
    publishedAt: row.published_at,
  }
  if (body.length > 0) {
    return { ...base, slug: row.slug, body }
  }
  return base
}

export async function fetchPublishedArticles(sb: SupabaseClient): Promise<NewsItem[]> {
  const { data, error } = await sb
    .from('articles')
    .select('id, slug, title, excerpt, tag, body, league_ids, club_ids, published_at, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)
  if (error || !data?.length) return []
  return (data as ArticleRow[]).map(articleRowToNewsItem)
}

export async function fetchPublishedArticleBySlug(
  sb: SupabaseClient,
  slug: string,
): Promise<(NewsItem & { slug: string; body: string[] }) | undefined> {
  const { data, error } = await sb
    .from('articles')
    .select('id, slug, title, excerpt, tag, body, league_ids, club_ids, published_at, status')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return undefined
  const item = articleRowToNewsItem(data as ArticleRow)
  if (!item.slug || !item.body?.length) return undefined
  return item as NewsItem & { slug: string; body: string[] }
}
