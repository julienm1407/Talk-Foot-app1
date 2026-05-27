import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewsItem } from '../../data/news'

export type ArticleRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: NewsItem['tag']
  body: unknown
  body_markdown: string | null
  league_ids: string[] | null
  club_ids: string[] | null
  cover_image_url: string | null
  author_name: string | null
  published_at: string
  status: string
  created_at: string
  updated_at: string
}

export type AdminArticleDraftInput = {
  title: string
  slug: string
  excerpt: string
  tag: NewsItem['tag']
  bodyMarkdown: string
  leagueIds?: string[]
  clubIds?: string[]
  coverImageUrl?: string | null
  authorName?: string | null
}

export type AdminArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: NewsItem['tag']
  status: 'draft' | 'published'
  bodyMarkdown: string
  bodyLegacy: string[]
  coverImageUrl?: string
  authorName: string
  leagueIds: string[]
  clubIds: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
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

function markdownFromLegacy(paragraphs: string[]): string {
  if (!paragraphs.length) return ''
  return paragraphs.join('\n\n').trim()
}

function legacyBodyFromMarkdown(markdown: string): string[] {
  return markdown
    .split(/\n{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean)
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

function toAdminArticle(row: ArticleRow): AdminArticle {
  const bodyLegacy = parseBody(row.body)
  const bodyMarkdown = row.body_markdown?.trim() || markdownFromLegacy(bodyLegacy)
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tag: row.tag,
    status: row.status === 'published' ? 'published' : 'draft',
    bodyMarkdown,
    bodyLegacy,
    coverImageUrl: row.cover_image_url ?? undefined,
    authorName: row.author_name?.trim() || 'Talk Foot',
    leagueIds: row.league_ids ?? [],
    clubIds: row.club_ids ?? [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPersistPayload(input: AdminArticleDraftInput) {
  const bodyMarkdown = input.bodyMarkdown.trim()
  const slug = sanitizeSlug(input.slug)
  return {
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    tag: input.tag,
    body_markdown: bodyMarkdown,
    body: legacyBodyFromMarkdown(bodyMarkdown),
    league_ids: input.leagueIds ?? [],
    club_ids: input.clubIds ?? [],
    cover_image_url: input.coverImageUrl?.trim() || null,
    author_name: input.authorName?.trim() || 'Talk Foot',
  }
}

export function articleRowToNewsItem(row: ArticleRow): NewsItem {
  const legacyBody = parseBody(row.body)
  const bodyMarkdown = row.body_markdown?.trim()
  const body = bodyMarkdown ? legacyBodyFromMarkdown(bodyMarkdown) : legacyBody
  const base: NewsItem = {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    tag: row.tag,
    minutesAgo: minutesAgoFromIso(row.published_at),
    leagueIds: row.league_ids?.length ? row.league_ids : undefined,
    clubIds: row.club_ids?.length ? row.club_ids : undefined,
    publishedAt: row.published_at,
    bodyMarkdown: bodyMarkdown || undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    authorName: row.author_name ?? undefined,
    updatedAt: row.updated_at,
  }
  if (body.length > 0) {
    return { ...base, slug: row.slug, body }
  }
  return base
}

export async function fetchPublishedArticles(sb: SupabaseClient): Promise<NewsItem[]> {
  const { data, error } = await sb
    .from('articles')
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
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
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return undefined
  const item = articleRowToNewsItem(data as ArticleRow)
  if (!item.slug || !item.body?.length) return undefined
  return item as NewsItem & { slug: string; body: string[] }
}

export async function listAdminArticles(sb: SupabaseClient): Promise<AdminArticle[]> {
  const { data, error } = await sb
    .from('articles')
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error || !data?.length) return []
  return (data as ArticleRow[]).map(toAdminArticle)
}

export async function createDraftArticle(
  sb: SupabaseClient,
  input: AdminArticleDraftInput,
): Promise<AdminArticle | null> {
  const payload = toPersistPayload(input)
  const { data, error } = await sb
    .from('articles')
    .insert({
      ...payload,
      status: 'draft',
      published_at: new Date().toISOString(),
    })
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .single()
  if (error || !data) return null
  return toAdminArticle(data as ArticleRow)
}

export async function updateDraftArticle(
  sb: SupabaseClient,
  id: string,
  input: AdminArticleDraftInput,
): Promise<AdminArticle | null> {
  const payload = toPersistPayload(input)
  const { data, error } = await sb
    .from('articles')
    .update(payload)
    .eq('id', id)
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .single()
  if (error || !data) return null
  return toAdminArticle(data as ArticleRow)
}

export async function publishArticle(
  sb: SupabaseClient,
  id: string,
): Promise<AdminArticle | null> {
  const { data, error } = await sb
    .from('articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .single()
  if (error || !data) return null
  return toAdminArticle(data as ArticleRow)
}

export async function unpublishArticle(
  sb: SupabaseClient,
  id: string,
): Promise<AdminArticle | null> {
  const { data, error } = await sb
    .from('articles')
    .update({ status: 'draft' })
    .eq('id', id)
    .select(
      'id, slug, title, excerpt, tag, body, body_markdown, league_ids, club_ids, cover_image_url, author_name, published_at, status, created_at, updated_at',
    )
    .single()
  if (error || !data) return null
  return toAdminArticle(data as ArticleRow)
}

export async function deleteDraftArticle(
  sb: SupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await sb.from('articles').delete().eq('id', id)
  return !error
}
