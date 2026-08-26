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

function isUuid(key) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)
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

/**
 * Lecture directe `profiles` (service role) — plus fiable que le RPC snapshot
 * qui peut renvoyer forbidden / profile_not_found selon le JWT.
 */
async function loadProfileRow(sb, actorKey) {
  const key = String(actorKey ?? '').trim()
  if (!key) return null

  if (isUuid(key)) {
    const byId = await sb.from('profiles').select('*').eq('id', key).maybeSingle()
    if (byId.error) throw new Error(byId.error.message)
    if (byId.data) return byId.data
  }

  const byClerk = await sb.from('profiles').select('*').eq('clerk_id', key).maybeSingle()
  if (byClerk.error) throw new Error(byClerk.error.message)
  if (byClerk.data) return byClerk.data

  return null
}

async function ensureProfileRow(sb, actorKey, displayName = 'Supporter') {
  const existing = await loadProfileRow(sb, actorKey)
  if (existing) return existing

  const name = String(displayName || 'Supporter').trim() || 'Supporter'
  const key = String(actorKey).trim()

  if (isUuid(key)) {
    const { data, error } = await sb
      .from('profiles')
      .insert({
        id: key,
        clerk_id: key,
        display_name: name,
        onboarding_complete: false,
        oauth_profile_completed: true,
        app_state: {},
      })
      .select('*')
      .maybeSingle()
    if (error) {
      // Course : déjà créé → relire
      const again = await loadProfileRow(sb, key)
      if (again) return again
      throw new Error(error.message)
    }
    return data
  }

  const { data, error } = await sb
    .from('profiles')
    .insert({
      clerk_id: key,
      display_name: name,
      onboarding_complete: false,
      oauth_profile_completed: true,
      app_state: {},
    })
    .select('*')
    .maybeSingle()
  if (error) {
    const again = await loadProfileRow(sb, key)
    if (again) return again
    throw new Error(error.message)
  }
  return data
}

async function saveProfileAppState(sb, profileId, actorKey, merged, onboardingComplete) {
  // 1) RPC dédié service (bypass trigger + assert)
  const { data: serviceSaved, error: serviceErr } = await sb.rpc('talkfoot_service_write_app_state', {
    p_profile_id: profileId,
    p_app_state: merged,
    p_onboarding_complete:
      typeof onboardingComplete === 'boolean' ? onboardingComplete : null,
  })
  if (!serviceErr && serviceSaved?.ok === true) return

  // 2) RPC historique (si migration pas encore appliquée)
  const { data: saved, error: saveErr } = await sb.rpc('save_talkfoot_user_app_state', {
    p_actor_key: actorKey,
    p_app_state: merged,
    p_onboarding_complete: Boolean(onboardingComplete),
  })
  if (!saveErr && saved?.ok === true) return

  const detail =
    (serviceSaved && serviceSaved.error) ||
    (saved && saved.error) ||
    serviceErr?.message ||
    saveErr?.message ||
    'save_failed'
  throw new Error(String(detail))
}

async function fulfillForActor(sb, actorKey, session, displayName) {
  const row = await ensureProfileRow(sb, actorKey, displayName)
  if (!row?.id) return { ok: false, error: 'profile_not_found', actorKey }

  const sessionId = session.id
  const app = mergeAppState(row.app_state)
  const prior = app.stripeFulfillmentBySessionId?.[sessionId]
  if (prior) {
    return { ok: true, alreadyFulfilled: true, actorKey, profileId: row.id, prior }
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
    await saveProfileAppState(sb, row.id, actorKey, merged, row.onboarding_complete)
    return { ok: true, kind: 'subscription', tier, actorKey, profileId: row.id }
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
    await saveProfileAppState(sb, row.id, actorKey, merged, row.onboarding_complete)
    return { ok: true, kind: 'medal_pack', packId, medals: grant, actorKey, profileId: row.id }
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

  const displayName =
    session.customer_details?.name ||
    session.customer_email ||
    session.customer_details?.email ||
    'Supporter'

  let lastErr = 'profile_not_found'
  const attempts = []
  for (const actorKey of keys) {
    try {
      const result = await fulfillForActor(sb, actorKey, session, displayName)
      attempts.push({ actorKey, ...result })
      if (result.ok) return result
      lastErr = result.error ?? lastErr
      if (result.error !== 'profile_not_found') return { ...result, attempts }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fulfill_failed'
      attempts.push({ actorKey, ok: false, error: message })
      lastErr = message
      // Essayer la clé suivante (Clerk vs UUID) avant d’abandonner.
    }
  }

  return { ok: false, error: lastErr, actorKeys: keys, attempts }
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
  const row = await loadProfileRow(sb, actorKey)
  if (!row?.id) return { ok: false, error: 'profile_not_found', actorKey }

  const app = mergeAppState(row.app_state)
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
    await saveProfileAppState(sb, row.id, actorKey, merged, row.onboarding_complete)
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
    await saveProfileAppState(sb, row.id, actorKey, merged, row.onboarding_complete)
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
  if (!allowed.length) {
    // Ancienne session sans metadata : on accepte uniquement si on va forcer le compte connecté.
    return Boolean(userId)
  }
  if (allowed.includes(userId)) return true
  if (supabaseUserId && allowed.includes(supabaseUserId)) return true
  return false
}

/**
 * POST { sessionId, userId, supabaseUserId? }
 * Crédite après retour Checkout. Si les clés session sont vides / incomplètes,
 * on ajoute aussi le userId / supabaseUserId du client connecté.
 */
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

    // Enrichir les clés si metadata manquante (anciennes sessions / bugs).
    const meta = { ...(session.metadata ?? {}) }
    if (!meta.clerk_user_id && userId) meta.clerk_user_id = userId
    if (!meta.supabase_user_id && supabaseUserId) meta.supabase_user_id = supabaseUserId
    const enriched = {
      ...session,
      metadata: meta,
      client_reference_id: session.client_reference_id || userId,
    }

    if (!sessionOwnedByUser(enriched, userId, supabaseUserId)) {
      json(res, 403, { ok: false, error: 'session_user_mismatch' })
      return
    }

    // Essayer d’abord les clés session, puis forcer le compte connecté.
    let result = await fulfillCheckoutSession(enriched)
    if (!result.ok && (result.error === 'profile_not_found' || result.error === 'missing_actor')) {
      const forcedKeys = [userId, supabaseUserId].filter(Boolean)
      for (const key of forcedKeys) {
        const sb = getSupabaseAdmin()
        if (!sb) break
        try {
          result = await fulfillForActor(
            sb,
            key,
            enriched,
            enriched.customer_details?.name || enriched.customer_email || 'Supporter',
          )
          if (result.ok) break
        } catch (err) {
          result = {
            ok: false,
            error: err instanceof Error ? err.message : 'fulfill_failed',
            actorKey: key,
          }
        }
      }
    }

    json(res, result.ok ? 200 : 500, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fulfill_failed'
    console.error('[stripe-fulfill]', message)
    json(res, 500, { ok: false, error: message })
  }
}
