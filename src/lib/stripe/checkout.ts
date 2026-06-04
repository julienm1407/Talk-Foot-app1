import { isStripePublishableConfigured } from '../../config/stripe'

export type StripeCheckoutKind = 'subscription' | 'medal_pack'

export async function startStripeCheckout(opts: {
  kind: StripeCheckoutKind
  productId: string
  userId: string
  email?: string | null
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isStripePublishableConfigured()) {
    return { ok: false, error: 'stripe_not_configured' }
  }

  const res = await fetch('/api/stripe-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: opts.kind,
      productId: opts.productId,
      userId: opts.userId,
      email: opts.email ?? undefined,
    }),
  })

  let data: { ok?: boolean; url?: string; error?: string }
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'invalid_response' }
  }

  if (!res.ok || !data.ok || !data.url) {
    return { ok: false, error: data.error ?? 'checkout_failed' }
  }

  return { ok: true, url: data.url }
}

export async function fulfillStripeSession(opts: {
  sessionId: string
  userId: string
}): Promise<
  | { ok: true; kind: 'subscription'; tier: string }
  | { ok: true; kind: 'medal_pack'; packId: string; medals: number }
  | { ok: false; error: string }
> {
  const res = await fetch('/api/stripe-fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })

  let data: Record<string, unknown>
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'invalid_response' }
  }

  if (!res.ok || data.ok !== true) {
    return { ok: false, error: String(data.error ?? 'fulfill_failed') }
  }

  if (data.kind === 'subscription' && typeof data.tier === 'string') {
    return { ok: true, kind: 'subscription', tier: data.tier }
  }
  if (
    data.kind === 'medal_pack' &&
    typeof data.packId === 'string' &&
    typeof data.medals === 'number'
  ) {
    return { ok: true, kind: 'medal_pack', packId: data.packId, medals: data.medals }
  }

  return { ok: false, error: 'unexpected_fulfill_payload' }
}
