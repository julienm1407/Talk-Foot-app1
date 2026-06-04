import Stripe from 'stripe'
import { revokeCheckoutSessionFulfillment } from './stripe-fulfill.mjs'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * POST { sessionId } — retire médailles / abonnement après remboursement manuel.
 * Header: Authorization: Bearer <TALKFOOT_STRIPE_REVOKE_SECRET>
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end('Method Not Allowed')
    return
  }

  const adminSecret = process.env.TALKFOOT_STRIPE_REVOKE_SECRET?.trim()
  if (!adminSecret) {
    json(res, 503, { ok: false, error: 'revoke_not_configured' })
    return
  }

  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token || token !== adminSecret) {
    json(res, 401, { ok: false, error: 'unauthorized' })
    return
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeSecret) {
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

  const sessionId = String(body.sessionId ?? '').trim()
  if (!sessionId) {
    json(res, 400, { ok: false, error: 'missing_session_id' })
    return
  }

  const stripe = new Stripe(stripeSecret)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const result = await revokeCheckoutSessionFulfillment(session, 1)
    json(res, result.ok ? 200 : 500, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'revoke_failed'
    console.error('[stripe-revoke-fulfillment]', message)
    json(res, 500, { ok: false, error: message })
  }
}
