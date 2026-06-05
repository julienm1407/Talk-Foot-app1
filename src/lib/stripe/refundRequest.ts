export type RefundPurchaseKind = 'medal_pack' | 'subscription'

export async function submitRefundRequest(input: {
  purchaseKind: RefundPurchaseKind
  reason: string
  paymentRef?: string
  userEmail?: string | null
  userId?: string | null
}): Promise<
  | { ok: true; requestId: string; emailSent: boolean }
  | { ok: false; error: string }
> {
  const res = await fetch('/api/refund-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purchaseKind: input.purchaseKind,
      reason: input.reason.trim(),
      paymentRef: input.paymentRef?.trim() || undefined,
      userEmail: input.userEmail ?? undefined,
      userId: input.userId ?? undefined,
    }),
  })

  let data: { ok?: boolean; requestId?: string; emailSent?: boolean; error?: string }
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'invalid_response' }
  }

  if (!res.ok || !data.ok || !data.requestId) {
    return { ok: false, error: data.error ?? 'submit_failed' }
  }

  return { ok: true, requestId: data.requestId, emailSent: Boolean(data.emailSent) }
}
