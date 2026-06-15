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
    stripeFulfillmentBySessionId: {},
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
    stripeFulfillmentBySessionId: {
      ...(base.stripeFulfillmentBySessionId ?? {}),
      ...(o.stripeFulfillmentBySessionId && typeof o.stripeFulfillmentBySessionId === 'object'
        ? o.stripeFulfillmentBySessionId
        : {}),
    },
  }
}

/** Toutes les clés possibles pour retrouver le profil Supabase (Clerk + UUID). */
export function actorKeysFromSession(session) {
  const keys = []
  for (const k of [
    session.metadata?.clerk_user_id,
    session.client_reference_id,
    session.metadata?.supabase_user_id,
    session.metadata?.user_id,
  ]) {
    const trimmed = k != null ? String(k).trim() : ''
    if (trimmed && !keys.includes(trimmed)) keys.push(trimmed)
  }
  return keys
}

function sessionPaid(session) {
  return (
    session.payment_status === 'paid' ||
    session.status === 'complete' ||
    session.status === 'paid'
  )
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

async function loadSnapshot(sb, actorKey) {
  const { data: snap, error: snapErr } = await sb.rpc('get_talkfoot_user_snapshot', {
    p_actor_key: actorKey,
  })
  if (snapErr) throw new Error(snapErr.message)
  if (!snap?.ok) return null
  return snap
}

async function saveAppState(sb, actorKey, merged, onboardingComplete) {
  const { data: saved, error: saveErr } = await sb.rpc('save_talkfoot_user_app_state', {
    p_actor_key: actorKey,
    p_app_state: merged,
    p_onboarding_complete: Boolean(onboardingComplete),
  })
  if (saveErr) throw new Error(saveErr.message)
  if (!saved?.ok) throw new Error(String(saved?.error ?? 'save_failed'))
}

async function fulfillForActor(sb, actorKey, session) {
  const snap = await loadSnapshot(sb, actorKey)
  if (!snap) return { ok: false, error: 'profile_not_found', actorKey }

  const sessionId = session.id
  const app = mergeAppState(snap.app_state)
  const prior = app.stripeFulfillmentBySessionId?.[sessionId]
  if (prior) {
    return { ok: true, alreadyFulfilled: true, actorKey, prior }
  }

  const kind = session.metadata?.kind
  const stamp = { at: new Date().toISOString() }

  if (kind === 'subscription' || session.mode === 'subscription') {
    const tierKey = session.metadata?.tier
    const tier = SUBSCRIPTION_TIER_BY_KEY[tierKey]
    if (!tier) return { ok: false, error: 'unknown_tier', actorKey }

    const activeUntil = new Date(Date.now() + 32 * 86400000).toISOString()
    const prevSub = app.subscription ?? {}
    const merged = {
      ...app,
      subscription: {
        ...prevSub,
        tier,
        activeUntil,
        subscribedSince: prevSub.subscribedSince ?? stamp.at,
      },
      stripeFulfillmentBySessionId: {
        ...app.stripeFulfillmentBySessionId,
        [sessionId]: { ...stamp, kind: 'subscription', tier },
      },
    }
    await saveAppState(sb, actorKey, merged, snap.onboarding_complete)
    return { ok: true, kind: 'subscription', tier, actorKey }
  }

  if (kind === 'medal_pack' || session.mode === 'payment') {
    const packId = session.metadata?.medal_pack_id
    const grant = MEDAL_PACK_GRANTS[packId]
    if (!grant) return { ok: false, error: 'unknown_pack', actorKey }

    const merged = {
      ...app,
      wallet: {
        ...app.wallet,
        medals: Math.max(0, Number(app.wallet?.medals ?? 0)) + grant,
      },
      stripeFulfillmentBySessionId: {
        ...app.stripeFulfillmentBySessionId,
        [sessionId]: { ...stamp, kind: 'medal_pack', packId, medals: grant },
      },
    }
    await saveAppState(sb, actorKey, merged, snap.onboarding_complete)
    return { ok: true, kind: 'medal_pack', packId, medals: grant, actorKey }
  }

  return { ok: false, error: 'unknown_kind', actorKey }
}

export async function fulfillCheckoutSession(session) {
  if (!sessionPaid(session)) return { ok: false, error: 'not_paid' }

  const keys = actorKeysFromSession(session)
  if (!keys.length) return { ok: false, error: 'missing_actor' }

  const sb = getSupabaseAdmin()
  if (!sb) {
    return { ok: false, error: 'supabase_service_not_configured', actorKeys: keys }
  }

  let lastErr = 'profile_not_found'
  for (const actorKey of keys) {
    try {
      const result = await fulfillForActor(sb, actorKey, session)
      if (result.ok) return result
      lastErr = result.error ?? lastErr
      if (result.error !== 'profile_not_found') return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fulfill_failed'
      return { ok: false, error: message, actorKey }
    }
  }

  return { ok: false, error: lastErr, actorKeys: keys }
}

/** Part du montant remboursé (0–1) pour ajuster le retrait de médailles. */
export function refundFractionFromCharge(charge) {
  const amount = Number(charge?.amount ?? 0)
  const refunded = Number(charge?.amount_refunded ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) return 1
  if (!Number.isFinite(refunded) || refunded <= 0) return 0
  return Math.min(1, refunded / amount)
}

export async function resolveCheckoutSessionId(stripe, charge) {
  const meta = charge?.metadata?.checkout_session_id
  if (meta && String(meta).trim()) return String(meta).trim()

  const pi = charge?.payment_intent
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id
  if (!paymentIntentId) return null

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  })
  return sessions.data[0]?.id ?? null
}

async function revokeForActor(sb, actorKey, sessionId, session, refundFraction) {
  const snap = await loadSnapshot(sb, actorKey)
  if (!snap) return { ok: false, error: 'profile_not_found', actorKey }

  const app = mergeAppState(snap.app_state)
  let prior = app.stripeFulfillmentBySessionId?.[sessionId]
  if (!prior && session && (session.metadata?.kind === 'medal_pack' || session.mode === 'payment')) {
    const packId = session.metadata?.medal_pack_id
    const grant = MEDAL_PACK_GRANTS[packId]
    if (grant) prior = { kind: 'medal_pack', packId, medals: grant }
  }
  if (!prior && session && (session.metadata?.kind === 'subscription' || session.mode === 'subscription')) {
    const tierKey = session.metadata?.tier
    const tier = SUBSCRIPTION_TIER_BY_KEY[tierKey]
    if (tier) prior = { kind: 'subscription', tier }
  }
  if (!prior) return { ok: false, error: 'fulfillment_not_found', actorKey }
  if (prior.refundedAt) {
    return { ok: true, alreadyRevoked: true, actorKey, medalsRevoked: prior.medalsRevoked ?? 0 }
  }

  const stamp = new Date().toISOString()
  const fraction = Math.min(1, Math.max(0, Number(refundFraction) || 0))
  if (fraction <= 0) return { ok: false, error: 'no_refund_fraction', actorKey }

  if (prior.kind === 'medal_pack') {
    const grant = Number(prior.medals) || MEDAL_PACK_GRANTS[prior.packId] || 0
    const toRevoke = Math.max(0, Math.floor(grant * fraction))
    const current = Math.max(0, Number(app.wallet?.medals ?? 0))
    const newMedals = Math.max(0, current - toRevoke)
    const merged = {
      ...app,
      wallet: { ...app.wallet, medals: newMedals },
      stripeFulfillmentBySessionId: {
        ...app.stripeFulfillmentBySessionId,
        [sessionId]: {
          ...prior,
          refundedAt: stamp,
          medalsRevoked: toRevoke,
          medalsAfterRefund: newMedals,
        },
      },
    }
    await saveAppState(sb, actorKey, merged, snap.onboarding_complete)
    return {
      ok: true,
      kind: 'medal_pack',
      actorKey,
      medalsRevoked: toRevoke,
      medalsAfter: newMedals,
      packId: prior.packId,
    }
  }

  if (prior.kind === 'subscription') {
    const merged = {
      ...app,
      subscription: {
        ...app.subscription,
        tier: 'freemium',
        activeUntil: null,
      },
      stripeFulfillmentBySessionId: {
        ...app.stripeFulfillmentBySessionId,
        [sessionId]: { ...prior, refundedAt: stamp, tierRevoked: prior.tier },
      },
    }
    await saveAppState(sb, actorKey, merged, snap.onboarding_complete)
    return { ok: true, kind: 'subscription', actorKey, tierRevoked: prior.tier }
  }

  return { ok: false, error: 'unknown_kind', actorKey }
}

/**
 * Retire médailles (ou abonnement) liés à une session Checkout après remboursement Stripe.
 */
export async function revokeCheckoutSessionFulfillment(session, refundFraction = 1) {
  const sessionId = typeof session === 'string' ? session : session?.id
  if (!sessionId) return { ok: false, error: 'missing_session' }

  const keys =
    typeof session === 'object' && session !== null
      ? actorKeysFromSession(session)
      : []

  const sb = getSupabaseAdmin()
  if (!sb) return { ok: false, error: 'supabase_service_not_configured' }

  let resolvedSession = typeof session === 'object' && session !== null ? session : null
  if (!keys.length && !resolvedSession) {
    return { ok: false, error: 'missing_actor' }
  }

  const actorList = keys.length ? keys : actorKeysFromSession(resolvedSession)
  if (!actorList.length) return { ok: false, error: 'missing_actor' }

  let lastErr = 'profile_not_found'
  for (const actorKey of actorList) {
    try {
      const result = await revokeForActor(sb, actorKey, sessionId, resolvedSession, refundFraction)
      if (result.ok) return { ...result, sessionId }
      lastErr = result.error ?? lastErr
      if (result.error !== 'profile_not_found' && result.error !== 'fulfillment_not_found') {
        return { ...result, sessionId }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'revoke_failed'
      return { ok: false, error: message, sessionId, actorKey }
    }
  }

  return { ok: false, error: lastErr, sessionId, actorKeys: actorList }
}

/** Webhook `charge.refunded` — retrouve la session Checkout et révoque le crédit. */
export async function revokeFulfillmentForCharge(stripe, charge) {
  const sessionId = await resolveCheckoutSessionId(stripe, charge)
  if (!sessionId) {
    console.warn('[stripe-refund] session introuvable pour charge', charge.id)
    return { ok: false, error: 'session_not_found', chargeId: charge.id }
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const fraction = refundFractionFromCharge(charge)
  if (fraction <= 0) return { ok: false, error: 'no_refund_amount', chargeId: charge.id }

  const result = await revokeCheckoutSessionFulfillment(session, fraction)
  return { ...result, chargeId: charge.id, refundFraction: fraction }
}

function sessionOwnedByUser(session, userId, supabaseUserId) {
  const allowed = actorKeysFromSession(session)
  if (allowed.includes(userId)) return true
  if (supabaseUserId && allowed.includes(supabaseUserId)) return true
  return false
}

/** POST { sessionId, userId, supabaseUserId? } — crédite après retour Checkout. */
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
  const supabaseUserId = String(body.supabaseUserId ?? '').trim()
  if (!sessionId || !userId) {
    json(res, 400, { ok: false, error: 'missing_params' })
    return
  }

  const stripe = new Stripe(secret)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!sessionOwnedByUser(session, userId, supabaseUserId)) {
      json(res, 403, { ok: false, error: 'session_user_mismatch' })
      return
    }

    const result = await fulfillCheckoutSession(session)
    json(res, result.ok ? 200 : 500, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fulfill_failed'
    console.error('[stripe-fulfill]', message)
    json(res, 500, { ok: false, error: message })
  }
}
