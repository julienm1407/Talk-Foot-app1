import { createClient } from '@supabase/supabase-js'

const REFUND_NOTIFY_EMAIL =
  process.env.REFUND_NOTIFY_EMAIL?.trim() || 'app.talkfoot@gmail.com'

const RESEND_FROM =
  process.env.RESEND_FROM_EMAIL?.trim() || 'Talk Foot <noreply@talkfoot.app>'

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

function productLabel(purchaseKind) {
  return purchaseKind === 'subscription'
    ? 'Abonnement Talk Foot (Stripe)'
    : 'Pack de médailles (Stripe)'
}

async function notifySupportByEmail(row) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }

  const lines = [
    'Nouvelle demande de remboursement Talk Foot',
    '',
    `ID : ${row.id}`,
    `Type : ${productLabel(row.purchase_kind)}`,
    row.user_email ? `E-mail : ${row.user_email}` : null,
    row.user_id ? `ID compte : ${row.user_id}` : null,
    row.payment_ref ? `Référence Stripe : ${row.payment_ref}` : 'Référence Stripe : (non fournie)',
    '',
    'Motif :',
    row.reason,
    '',
    `Reçue le : ${row.created_at}`,
  ].filter(Boolean)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [REFUND_NOTIFY_EMAIL],
      ...(row.user_email ? { reply_to: row.user_email } : {}),
      subject: `Demande de remboursement — Talk Foot (${row.id.slice(0, 8)})`,
      text: lines.join('\n'),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.warn('[refund-request] Resend failed', res.status, detail.slice(0, 200))
    return { ok: false, error: 'email_failed' }
  }

  return { ok: true }
}

/** POST — enregistre une demande de remboursement et notifie le support. */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    res.end('Method Not Allowed')
    return
  }

  const sb = getSupabaseAdmin()
  if (!sb) {
    json(res, 503, { ok: false, error: 'service_not_configured' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
  } catch {
    json(res, 400, { ok: false, error: 'invalid_json' })
    return
  }

  const purchaseKind = String(body.purchaseKind ?? '').trim()
  if (purchaseKind !== 'medal_pack' && purchaseKind !== 'subscription') {
    json(res, 400, { ok: false, error: 'invalid_purchase_kind' })
    return
  }

  const reason = String(body.reason ?? '').trim()
  if (reason.length < 8) {
    json(res, 400, { ok: false, error: 'reason_too_short' })
    return
  }

  const userEmail = String(body.userEmail ?? '').trim().slice(0, 320) || null
  const userId = String(body.userId ?? '').trim().slice(0, 128) || null
  const paymentRef = String(body.paymentRef ?? '').trim().slice(0, 200) || null

  const row = {
    purchase_kind: purchaseKind,
    user_email: userEmail,
    user_id: userId,
    payment_ref: paymentRef,
    reason: reason.slice(0, 4000),
    status: 'pending',
  }

  let requestId = null
  let createdAt = null

  const { data: rpcData, error: rpcError } = await sb.rpc('submit_refund_request', {
    p_purchase_kind: purchaseKind,
    p_user_email: userEmail,
    p_user_id: userId,
    p_payment_ref: paymentRef,
    p_reason: reason.slice(0, 4000),
  })

  if (!rpcError && rpcData && typeof rpcData === 'object' && rpcData.ok === true && rpcData.id) {
    requestId = rpcData.id
    createdAt = rpcData.created_at
  } else {
    if (rpcError) {
      console.warn('[refund-request] rpc unavailable, fallback insert', rpcError.message)
    } else if (rpcData?.ok === false) {
      console.error('[refund-request] rpc rejected', rpcData.error, rpcData.detail ?? '')
      json(res, 500, {
        ok: false,
        error: rpcData.error ?? 'save_failed',
      })
      return
    }

    const { data, error } = await sb.from('refund_requests').insert(row).select('id, created_at').single()

    if (error || !data?.id) {
      console.error('[refund-request] insert failed', error?.message)
      json(res, 500, { ok: false, error: 'save_failed' })
      return
    }
    requestId = data.id
    createdAt = data.created_at
  }

  const emailResult = await notifySupportByEmail({
    ...row,
    id: requestId,
    created_at: createdAt,
  })

  json(res, 200, {
    ok: true,
    requestId,
    emailSent: emailResult.ok === true,
  })
}
