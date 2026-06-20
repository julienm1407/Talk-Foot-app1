#!/usr/bin/env node
/**
 * Ajuste le score classement d’un parieur (payout des paris gagnés).
 *
 * Usage :
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/fix-bettor-leaderboard-score.mjs Jojoanna 1000
 */
import { createClient } from '@supabase/supabase-js'

const displayName = process.argv[2]?.trim()
const targetScore = Number.parseInt(process.argv[3] ?? '', 10)

const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!displayName || !Number.isFinite(targetScore)) {
  console.error('Usage: node scripts/fix-bettor-leaderboard-score.mjs <DisplayName> <targetScore>')
  process.exit(1)
}

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const { data, error } = await sb.rpc('talkfoot_admin_set_bettor_leaderboard_score', {
  p_display_name: displayName,
  p_target_score: targetScore,
})

if (error) {
  console.error('RPC error:', error.message)
  process.exit(1)
}

console.log(JSON.stringify(data, null, 2))
