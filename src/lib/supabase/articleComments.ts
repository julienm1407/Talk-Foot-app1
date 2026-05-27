import type { SupabaseClient } from '@supabase/supabase-js'

export type ArticleComment = {
  id: string
  articleId: string
  authorName: string
  body: string
  status: 'published' | 'hidden' | 'pending'
  reportedCount: number
  createdAt: string
}

export async function fetchPublishedComments(
  sb: SupabaseClient,
  articleId: string,
): Promise<ArticleComment[]> {
  const { data, error } = await sb
    .from('article_comments')
    .select('id,article_id,author_name,body,status,reported_count,created_at')
    .eq('article_id', articleId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    articleId: String(r.article_id),
    authorName: String(r.author_name),
    body: String(r.body),
    status: (r.status as ArticleComment['status']) ?? 'published',
    reportedCount: Number(r.reported_count ?? 0),
    createdAt: String(r.created_at),
  }))
}

export async function createArticleComment(
  sb: SupabaseClient,
  input: { articleId: string; authorName: string; body: string; userId?: string },
): Promise<boolean> {
  const { error } = await sb.from('article_comments').insert({
    article_id: input.articleId,
    author_name: input.authorName.trim(),
    body: input.body.trim(),
    user_id: input.userId ?? null,
    status: 'published',
  })
  return !error
}

export async function reportArticleComment(
  sb: SupabaseClient,
  input: { commentId: string; reason: string; reporterId?: string },
): Promise<boolean> {
  const { error } = await sb.from('article_comment_reports').insert({
    comment_id: input.commentId,
    reason: input.reason.trim(),
    reporter_id: input.reporterId ?? null,
  })
  if (error) return false
  const { data: current } = await sb
    .from('article_comments')
    .select('reported_count')
    .eq('id', input.commentId)
    .maybeSingle()
  const nextCount = Number((current as { reported_count?: number } | null)?.reported_count ?? 0) + 1
  await sb.from('article_comments').update({ reported_count: nextCount }).eq('id', input.commentId)
  return true
}

export async function fetchCommentsForModeration(
  sb: SupabaseClient,
): Promise<ArticleComment[]> {
  const { data, error } = await sb
    .from('article_comments')
    .select('id,article_id,author_name,body,status,reported_count,created_at')
    .order('reported_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(300)
  if (error || !data) return []
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    articleId: String(r.article_id),
    authorName: String(r.author_name),
    body: String(r.body),
    status: (r.status as ArticleComment['status']) ?? 'published',
    reportedCount: Number(r.reported_count ?? 0),
    createdAt: String(r.created_at),
  }))
}

export async function moderateComment(
  sb: SupabaseClient,
  input: { commentId: string; status: 'published' | 'hidden'; reason?: string },
): Promise<boolean> {
  const { error } = await sb
    .from('article_comments')
    .update({ status: input.status, moderation_reason: input.reason ?? null })
    .eq('id', input.commentId)
  return !error
}
