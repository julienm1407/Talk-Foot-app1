#!/usr/bin/env node
/**
 * Ajoute des jetons au wallet d’un profil Talk Foot (UUID profiles.id ou clerk_id).
 *
 * Usage :
 *   node --env-file=.env.local scripts/credit-user-tokens.mjs <actorOrProfileId> [amount]
 *
 * Env :
 *   SUPABASE_URL ou VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const actorKey = process.argv[2]?.trim()
const amount = Number.parseInt(process.argv[3] ?? '100000', 10)

const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!actorKey || !Number.isFinite(amount) || amount === 0) {
  console.error('Usage: node --env-file=.env.local scripts/credit-user-tokens.mjs <id> [amount]')
  process.exit(1)
}

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: rows, error: findErr } = await sb
  .from('profiles')
  .select('id, clerk_id, display_name, app_state')
  .or(`id.eq.${actorKey},clerk_id.eq.${actorKey}`)
  .limit(5)

if (findErr) {
  console.error('Lookup error:', findErr.message)
  process.exit(1)
}

if (!rows?.length) {
  console.error('No profile found for', actorKey)
  process.exit(1)
}

if (rows.length > 1) {
  console.error(
    'Ambiguous match:',
    rows.map((r) => ({ id: r.id, clerk_id: r.clerk_id, display_name: r.display_name })),
  )
  process.exit(1)
}

const profile = rows[0]
const appState =
  profile.app_state && typeof profile.app_state === 'object' && !Array.isArray(profile.app_state)
    ? { ...profile.app_state }
    : {}
const wallet =
  appState.wallet && typeof appState.wallet === 'object' && !Array.isArray(appState.wallet)
    ? { ...appState.wallet }
    : {}
const before = Math.max(0, Number.parseInt(String(wallet.tokens ?? 0), 10) || 0)
const after = before + amount
const nextAppState = {
  ...appState,
  wallet: {
    ...wallet,
    tokens: after,
  },
}

const { error: updErr } = await sb
  .from('profiles')
  .update({ app_state: nextAppState, updated_at: new Date().toISOString() })
  .eq('id', profile.id)

if (updErr) {
  console.error('Update error:', updErr.message)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      id: profile.id,
      clerk_id: profile.clerk_id ?? null,
      display_name: profile.display_name ?? null,
      tokensBefore: before,
      tokensAdded: amount,
      tokensAfter: after,
    },
    null,
    2,
  ),
)
