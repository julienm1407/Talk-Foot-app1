import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { MEDAL_PACK_GRANTS, SUBSCRIPTION_TIER_BY_KEY } from './stripeCatalog.mjs'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function defaultAppState() {
  return {
    fanPreferences: {},
    profile: {
      level: 1,
      xp: 0,
      equippedItems: {
        scarf: null,
        hat: null,
        jersey: null,
        accessory: null,
        pants: 'pants-kit',
        shoes: 'shoes-studs',
      },
      ownedItemIds: [],
      portraitBackdrop: 'tribune',
      portraitBackdropClubId: null,
    },
    wallet: { medals: 0, tokens: 0 },
    bets: [],
    subscription: { tier: 'freemium', activeUntil: null, usage: {} },
  }
}

function mergeAppState(raw) {
  const base = defaultAppState()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const o = raw
  return {
    ...base,
    ...o,
    wallet: { ...base.wallet, ...(o.wallet && typeof o.wallet === 'object' ? o.wallet : {}) },
    subscription: {
      ...base.subscription,
      ...(o.subscription && typeof o.subscription === 'object' ? o.subscription : {}),
      usage: {
        ...(base.subscription.usage ?? {}),
        ...(o.subscription?.usage && typeof o.subscription.usage === 'object' ? o.subscription.usage : {}),
      },
    },
  }
}

async function loadAndPatchAppState(sb, actorKey, patchFn) {
  const { data: snap, error: snapErr } = await sb.rpc('get_talkfoot_user_snapshot', {
    p_actor_key: actorKey,
  })
  if (snapErr) throw new Error(snapErr.message)
  if (!snap?.ok) throw new Error(String(snap?.error ?? 'profile_not_found'))

  const merged = patchFn(mergeAppState(snap.app_state))
  const { data: saved, error: saveErr } = await sb.rpc('save_talkfoot_user_app_state', {
    p_actor_key: actorKey,
    p_app_state: merged,
    p_onboarding_complete: Boolean(snap.onboarding_complete),
  })
  if (saveErr) throw new Error(saveErr.message)
  if (!saved?.ok) throw new Error(String(saved?.error ?? 'save_failed'))
  return merged
}

export async function fulfillCheckoutSession(session) {
  const actorKey =
    session.metadata?.clerk_user_id || session.client_reference_id || session.metadata?.user_id
  if (!actorKey) return { ok: false, error: 'missing_actor' }

  const paid =
    session.payment_status === 'paid' ||
    session.status === 'complete' ||
    session.status === 'paid'
  if (!paid) return { ok: false, error: 'not_paid' }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) {
    return { ok: false, error: 'supabase_service_not_configured', actorKey }
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } })
  const kind = session.metadata?.kind

  if (kind === 'subscription' || session.mode === 'subscription') {
    const tierKey = session.metadata?.tier
    const tier = SUBSCRIPTION_TIER_BY_KEY[tierKey]
    if (!tier) return { ok: false, error: 'unknown_tier' }

    const activeUntil = new Date(Date.now() + 32 * 86400000).toISOString()
    await loadAndPatchAppState(sb, actorKey, (app) => ({
      ...app,
      subscription: {
        ...app.subscription,
        tier,
        activeUntil,
      },
    }))
    return { ok: true, kind: 'subscription', tier, actorKey }
  }

  if (kind === 'medal_pack' || session.mode === 'payment') {
    const packId = session.metadata?.medal_pack_id
    const grant = MEDAL_PACK_GRANTS[packId]
    if (!grant) return { ok: false, error: 'unknown_pack' }

    await loadAndPatchAppState(sb, actorKey, (app) => ({
      ...app,
      wallet: {
        ...app.wallet,
        medals: Math.max(0, Number(app.wallet?.medals ?? 0)) + grant,
      },
    }))
    return { ok: true, kind: 'medal_pack', packId, medals: grant, actorKey }
  }

  return { ok: false, error: 'unknown_kind' }
}

/** POST { sessionId, userId } — applique les avantages après retour Checkout (utilisateur connecté). */
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

  const sessionId = String(body.sessionId ?? '').trim()
  const userId = String(body.userId ?? '').trim()
  if (!sessionId || !userId) {
    json(res, 400, { ok: false, error: 'missing_params' })
    return
  }

  const stripe = new Stripe(secret)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const owner =
      session.metadata?.clerk_user_id || session.client_reference_id || ''
    if (owner !== userId) {
      json(res, 403, { ok: false, error: 'session_user_mismatch' })
      return
    }

    const result = await fulfillCheckoutSession(session)
    json(res, result.ok ? 200 : 500, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fulfill_failed'
    json(res, 500, { ok: false, error: message })
  }
}
