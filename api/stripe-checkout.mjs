import Stripe from 'stripe'
import { STRIPE_PRICE } from './stripeCatalog.mjs'

function siteOrigin(req) {
  const fromEnv = process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL
  if (fromEnv) return String(fromEnv).replace(/\/$/, '')
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host || 'localhost'
  return `${proto}://${host}`
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end('Method Not Allowed')
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    json(res, 503, { ok: false, error: 'stripe_not_configured' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    json(res, 400, { ok: false, error: 'invalid_json' })
    return
  }

  const userId = String(body.userId ?? '').trim()
  const supabaseUserId = String(body.supabaseUserId ?? '').trim()
  const email = String(body.email ?? '').trim()
  const kind = String(body.kind ?? '').trim()
  const productId = String(body.productId ?? '').trim()

  if (!userId) {
    json(res, 400, { ok: false, error: 'missing_user_id' })
    return
  }

  const metaBase = {
    clerk_user_id: userId,
    kind,
    ...(supabaseUserId ? { supabase_user_id: supabaseUserId } : {}),
  }

  const origin = siteOrigin(req)
  const stripe = new Stripe(secret)

  try {
    if (kind === 'subscription') {
      const priceId = STRIPE_PRICE.subscription[productId]
      if (!priceId) {
        json(res, 400, { ok: false, error: 'unknown_subscription' })
        return
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/formules?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/formules?checkout=cancel`,
        client_reference_id: userId,
        customer_email: email || undefined,
        metadata: {
          ...metaBase,
          tier: productId,
          kind: 'subscription',
        },
      })
      json(res, 200, { ok: true, url: session.url })
      return
    }

    if (kind === 'medal_pack') {
      const priceId = STRIPE_PRICE.medalPack[productId]
      if (!priceId) {
        json(res, 400, { ok: false, error: 'unknown_medal_pack' })
        return
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/boutique/medailles?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/boutique/medailles?checkout=cancel`,
        client_reference_id: userId,
        customer_email: email || undefined,
        metadata: {
          ...metaBase,
          medal_pack_id: productId,
          kind: 'medal_pack',
        },
      })
      json(res, 200, { ok: true, url: session.url })
      return
    }

    json(res, 400, { ok: false, error: 'invalid_kind' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'checkout_failed'
    json(res, 500, { ok: false, error: message })
  }
}
