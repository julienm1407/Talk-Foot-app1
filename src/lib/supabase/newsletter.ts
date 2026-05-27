import type { SupabaseClient } from '@supabase/supabase-js'

export type NewsletterCampaign = {
  id: string
  title: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduledAt?: string
  sentAt?: string
}

export async function subscribeNewsletter(
  sb: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { error } = await sb
    .from('newsletter_subscribers')
    .upsert({ email: email.trim().toLowerCase(), status: 'active' }, { onConflict: 'email' })
  return !error
}

export async function fetchNewsletterCampaigns(
  sb: SupabaseClient,
): Promise<NewsletterCampaign[]> {
  const { data, error } = await sb
    .from('newsletter_campaigns')
    .select('id,title,subject,status,scheduled_at,sent_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error || !data) return []
  return (data as Array<Record<string, unknown>>).map((x) => ({
    id: String(x.id),
    title: String(x.title),
    subject: String(x.subject),
    status: (x.status as NewsletterCampaign['status']) ?? 'draft',
    scheduledAt: (x.scheduled_at as string | null) ?? undefined,
    sentAt: (x.sent_at as string | null) ?? undefined,
  }))
}

export async function createNewsletterCampaign(
  sb: SupabaseClient,
  input: { title: string; subject: string; contentMarkdown: string; createdBy?: string },
): Promise<boolean> {
  const { error } = await sb.from('newsletter_campaigns').insert({
    title: input.title.trim(),
    subject: input.subject.trim(),
    content_markdown: input.contentMarkdown,
    created_by: input.createdBy ?? null,
    status: 'draft',
  })
  return !error
}
