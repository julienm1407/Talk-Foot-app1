import { isStripePublishableConfigured } from '../../config/stripe'

export type StripeCheckoutKind = 'subscription' | 'medal_pack'

export type StripeClientGrant = {
  kind: 'medal_pack'
  packId: string
  medals: number
}

export async function startStripeCheckout(opts: {
  kind: StripeCheckoutKind
  productId: string
  userId: string
  supabaseUserId?: string | null
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
      supabaseUserId: opts.supabaseUserId ?? undefined,
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
  supabaseUserId?: string | null
}): Promise<
  | { ok: true; kind: 'subscription'; tier: string; alreadyFulfilled?: boolean }
  | {
      ok: true
      kind: 'medal_pack'
      packId: string
      medals: number
      alreadyFulfilled?: boolean
      appliedVia?: 'server' | 'client'
    }
  | { ok: false; error: string; clientGrant?: StripeClientGrant }
> {
  const res = await fetch('/api/stripe-fulfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: opts.sessionId,
      userId: opts.userId,
      supabaseUserId: opts.supabaseUserId ?? undefined,
    }),
  })

  let data: Record<string, unknown>
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'invalid_response' }
  }

  const clientGrantRaw = data.clientGrant
  const clientGrant =
    clientGrantRaw &&
    typeof clientGrantRaw === 'object' &&
    !Array.isArray(clientGrantRaw) &&
    (clientGrantRaw as { kind?: string }).kind === 'medal_pack' &&
    typeof (clientGrantRaw as { packId?: unknown }).packId === 'string' &&
    typeof (clientGrantRaw as { medals?: unknown }).medals === 'number'
      ? {
          kind: 'medal_pack' as const,
          packId: String((clientGrantRaw as { packId: string }).packId),
          medals: Number((clientGrantRaw as { medals: number }).medals),
        }
      : undefined

  if (data.ok === true) {
    const alreadyFulfilled = data.alreadyFulfilled === true
    if (data.kind === 'subscription' && typeof data.tier === 'string') {
      return { ok: true, kind: 'subscription', tier: data.tier, alreadyFulfilled }
    }
    if (
      data.kind === 'medal_pack' &&
      typeof data.packId === 'string' &&
      typeof data.medals === 'number'
    ) {
      return {
        ok: true,
        kind: 'medal_pack',
        packId: data.packId,
        medals: data.medals,
        alreadyFulfilled,
        appliedVia: 'server',
      }
    }
  }

  // Serveur n’a pas pu écrire le cloud, mais le paiement est validé → crédit client.
  if (clientGrant && clientGrant.medals > 0) {
    return {
      ok: true,
      kind: 'medal_pack',
      packId: clientGrant.packId,
      medals: clientGrant.medals,
      appliedVia: 'client',
    }
  }

  if (!res.ok || data.ok !== true) {
    return { ok: false, error: String(data.error ?? 'fulfill_failed'), clientGrant }
  }

  return { ok: false, error: 'unexpected_fulfill_payload', clientGrant }
}
