import type { SupabaseClient } from '@supabase/supabase-js'

export const USER_REPORT_REASONS = [
  { id: 'harassment', label: 'Harcèlement ou insultes' },
  { id: 'spam', label: 'Spam / publicité' },
  { id: 'impersonation', label: 'Usurpation d’identité' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
  { id: 'other', label: 'Autre' },
] as const

export type UserReportReasonId = (typeof USER_REPORT_REASONS)[number]['id']

export type UserReportRow = {
  id: string
  reporterId: string
  reportedUserId: string
  reportedDisplayName: string | null
  reason: string
  details: string | null
  status: 'open' | 'reviewed' | 'dismissed'
  createdAt: string
}

function reasonLabel(id: UserReportReasonId): string {
  return USER_REPORT_REASONS.find((r) => r.id === id)?.label ?? id
}

export async function reportUser(
  sb: SupabaseClient,
  input: {
    reporterId: string
    reportedUserId: string
    reportedDisplayName?: string
    reasonId: UserReportReasonId
    details?: string
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reporterId = input.reporterId.trim()
  const reportedUserId = input.reportedUserId.trim()
  if (!reporterId || !reportedUserId) return { ok: false, error: 'Connexion requise.' }
  if (reporterId === reportedUserId) return { ok: false, error: 'Tu ne peux pas te signaler toi-même.' }

  const reason = reasonLabel(input.reasonId)
  const details = input.details?.trim() || null

  const { error } = await sb.from('user_reports').insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reported_display_name: input.reportedDisplayName?.trim() || null,
    reason,
    details,
    status: 'open',
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Tu as déjà signalé cette personne aujourd’hui pour ce motif.' }
    }
    return { ok: false, error: error.message || 'Signalement impossible.' }
  }
  return { ok: true }
}

export async function fetchUserReportsForModeration(
  sb: SupabaseClient,
): Promise<UserReportRow[]> {
  const { data, error } = await sb
    .from('user_reports')
    .select('id,reporter_id,reported_user_id,reported_display_name,reason,details,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    reporterId: String(r.reporter_id),
    reportedUserId: String(r.reported_user_id),
    reportedDisplayName: r.reported_display_name != null ? String(r.reported_display_name) : null,
    reason: String(r.reason),
    details: r.details != null ? String(r.details) : null,
    status: (r.status as UserReportRow['status']) ?? 'open',
    createdAt: String(r.created_at),
  }))
}

export async function updateUserReportStatus(
  sb: SupabaseClient,
  input: { reportId: string; status: UserReportRow['status'] },
): Promise<boolean> {
  const { error } = await sb
    .from('user_reports')
    .update({ status: input.status })
    .eq('id', input.reportId)
  return !error
}
