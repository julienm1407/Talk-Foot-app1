import { createClient } from '@supabase/supabase-js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

async function verifyClerkSession(clerkSessionId, expectedUserId) {
  const secret = process.env.CLERK_SECRET_KEY?.trim()
  if (!secret) return { ok: false, error: 'clerk_not_configured' }

  const sessionId = String(clerkSessionId ?? '').trim()
  const actorKey = String(expectedUserId ?? '').trim()
  if (!sessionId || !actorKey) return { ok: false, error: 'missing_clerk_params' }

  const res = await fetch(`https://api.clerk.com/v1/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })

  if (!res.ok) {
    return { ok: false, error: 'invalid_clerk_session' }
  }

  const session = await res.json()
  if (session.status !== 'active') {
    return { ok: false, error: 'clerk_session_inactive' }
  }
  if (String(session.user_id ?? '') !== actorKey) {
    return { ok: false, error: 'clerk_user_mismatch' }
  }

  return { ok: true }
}

async function verifySupabaseAccessToken(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return { ok: false, error: 'supabase_not_configured' }

  const token = String(accessToken ?? '').trim()
  if (!token) return { ok: false, error: 'missing_supabase_token' }

  const sb = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user?.id) {
    return { ok: false, error: 'invalid_supabase_token' }
  }

  return { ok: true, supabaseUserId: data.user.id }
}

/**
 * POST { actorKey, clerkSessionId, supabaseAccessToken }
 * Lie auth.uid() (session Supabase) à l'identifiant Clerk après vérification serveur.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end('Method Not Allowed')
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    json(res, 400, { ok: false, error: 'invalid_json' })
    return
  }

  const actorKey = String(body.actorKey ?? '').trim()
  const clerkSessionId = String(body.clerkSessionId ?? '').trim()
  const supabaseAccessToken = String(body.supabaseAccessToken ?? '').trim()

  if (!actorKey || !clerkSessionId || !supabaseAccessToken) {
    json(res, 400, { ok: false, error: 'missing_params' })
    return
  }

  const clerkCheck = await verifyClerkSession(clerkSessionId, actorKey)
  if (!clerkCheck.ok) {
    json(res, 401, clerkCheck)
    return
  }

  const supabaseCheck = await verifySupabaseAccessToken(supabaseAccessToken)
  if (!supabaseCheck.ok) {
    json(res, 401, supabaseCheck)
    return
  }

  const adminSb = getSupabaseAdmin()
  if (!adminSb) {
    json(res, 503, { ok: false, error: 'supabase_service_not_configured' })
    return
  }

  const { error } = await adminSb.from('talkfoot_actor_sessions').upsert(
    {
      supabase_user_id: supabaseCheck.supabaseUserId,
      actor_key: actorKey,
      bound_at: new Date().toISOString(),
    },
    { onConflict: 'supabase_user_id' },
  )

  if (error) {
    console.error('[bind-talkfoot-actor]', error.message)
    json(res, 500, { ok: false, error: 'bind_failed' })
    return
  }

  json(res, 200, { ok: true })
}
