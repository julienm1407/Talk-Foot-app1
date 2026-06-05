import type { SupabaseClient } from '@supabase/supabase-js'

export type RefundRequestRow = {
  id: string
  purchaseKind: 'medal_pack' | 'subscription'
  userEmail: string | null
  userId: string | null
  paymentRef: string | null
  reason: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  createdAt: string
}

export async function fetchRefundRequests(sb: SupabaseClient): Promise<RefundRequestRow[]> {
  const { data, error } = await sb
    .from('refund_requests')
    .select('id,purchase_kind,user_email,user_id,payment_ref,reason,status,created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    purchaseKind: row.purchase_kind as RefundRequestRow['purchaseKind'],
    userEmail: (row.user_email as string | null) ?? null,
    userId: (row.user_id as string | null) ?? null,
    paymentRef: (row.payment_ref as string | null) ?? null,
    reason: String(row.reason),
    status: row.status as RefundRequestRow['status'],
    createdAt: String(row.created_at),
  }))
}
