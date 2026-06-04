import Stripe from 'stripe'
import { fulfillCheckoutSession } from './stripe-fulfill.mjs'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8')
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end('Method Not Allowed')
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret || !webhookSecret) {
    json(res, 503, { ok: false, error: 'stripe_webhook_not_configured' })
    return
  }

  const stripe = new Stripe(secret)
  const sig = req.headers['stripe-signature']
  const rawBody = await readRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid_signature'
    json(res, 400, { ok: false, error: message })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const result = await fulfillCheckoutSession(session)
      if (!result.ok && result.error === 'supabase_service_not_configured') {
        console.warn('[stripe-webhook] Fulfillment skipped — set SUPABASE_SERVICE_ROLE_KEY', result)
        json(res, 200, { ok: true, deferred: true })
        return
      }
      json(res, 200, result)
      return
    }

    json(res, 200, { ok: true, ignored: event.type })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'webhook_failed'
    console.error('[stripe-webhook]', message)
    json(res, 500, { ok: false, error: message })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
