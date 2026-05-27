import type { SupabaseClient } from '@supabase/supabase-js'

export type ArticleDashboardStats = {
  views7d: number
  views30d: number
  ctaClicks30d: number
  topArticles30d: Array<{ articleId: string; title: string; slug: string; views: number }>
}

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export async function trackArticleEvent(
  sb: SupabaseClient,
  articleId: string,
  eventType: 'view' | 'cta_click' | 'share',
  source = 'web',
): Promise<void> {
  const sessionId = (() => {
    try {
      const key = 'talkfoot.article.session.v1'
      const existing = localStorage.getItem(key)
      if (existing) return existing
      const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(key, next)
      return next
    } catch {
      return undefined
    }
  })()

  await sb.from('article_events').insert({
    article_id: articleId,
    event_type: eventType,
    source,
    session_id: sessionId,
  })
}

export async function fetchArticleDashboardStats(
  sb: SupabaseClient,
): Promise<ArticleDashboardStats> {
  const [views7, views30, cta30] = await Promise.all([
    sb
      .from('article_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view')
      .gte('created_at', sinceIso(7)),
    sb
      .from('article_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view')
      .gte('created_at', sinceIso(30)),
    sb
      .from('article_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'cta_click')
      .gte('created_at', sinceIso(30)),
  ])

  const { data: events30 } = await sb
    .from('article_events')
    .select('article_id, created_at')
    .eq('event_type', 'view')
    .gte('created_at', sinceIso(30))
    .limit(5000)

  const countByArticle = new Map<string, number>()
  for (const e of events30 ?? []) {
    const id = (e as { article_id: string }).article_id
    countByArticle.set(id, (countByArticle.get(id) ?? 0) + 1)
  }
  const topIds = [...countByArticle.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  let topArticles30d: Array<{ articleId: string; title: string; slug: string; views: number }> = []
  if (topIds.length > 0) {
    const ids = topIds.map(([id]) => id)
    const { data: arts } = await sb.from('articles').select('id,title,slug').in('id', ids)
    const byId = new Map<string, { id: string; title: string; slug: string }>()
    for (const a of arts ?? []) {
      const row = a as { id: string; title: string; slug: string }
      byId.set(row.id, row)
    }
    topArticles30d = topIds
      .map(([id, views]) => {
        const a = byId.get(id)
        if (!a) return null
        return { articleId: id, title: a.title, slug: a.slug, views }
      })
      .filter((x): x is { articleId: string; title: string; slug: string; views: number } => Boolean(x))
  }

  return {
    views7d: views7.count ?? 0,
    views30d: views30.count ?? 0,
    ctaClicks30d: cta30.count ?? 0,
    topArticles30d,
  }
}
