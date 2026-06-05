import type { SupabaseClient } from '@supabase/supabase-js'
import type { Wallet } from '../../types/bet'
import { normalizeWallet } from '../../utils/walletNormalize'

export type ClaimDailyTokenBonusResult =
  | { ok: true; amount: number; claimDayKey: string; wallet: Wallet }
  | { ok: false; reason: string; claimDayKey?: string; wallet?: Wallet }

export async function claimDailyTokenBonusCloud(
  sb: SupabaseClient,
  actorKey: string,
): Promise<ClaimDailyTokenBonusResult> {
  const { data, error } = await sb.rpc('claim_daily_token_bonus', { p_actor_key: actorKey })
  if (error) {
    return { ok: false, reason: error.code ? `${error.code}:${error.message}` : error.message }
  }
  if (!data || data.ok !== true) {
    return {
      ok: false,
      reason: String(data?.reason ?? data?.error ?? 'claim_failed'),
      claimDayKey: typeof data?.claim_day_key === 'string' ? data.claim_day_key : undefined,
      wallet: data?.wallet ? normalizeWallet(data.wallet) : undefined,
    }
  }
  return {
    ok: true,
    amount: Number(data.amount ?? 0),
    claimDayKey: String(data.claim_day_key ?? ''),
    wallet: normalizeWallet(data.wallet),
  }
}

/** RPC absent ou indisponible — retomber sur la réclamation locale + sauvegarde app_state. */
export function isDailyClaimRpcUnavailable(reason: string): boolean {
  const r = reason.toLowerCase()
  if (r === 'already_claimed' || r === 'not_open_yet' || r === 'profile_not_found') return false
  return (
    r.includes('claim_daily_token_bonus') ||
    r.includes('could not find') ||
    r.includes('does not exist') ||
    r.includes('pgrst202') ||
    r.includes('42883') ||
    r.includes('network') ||
    r.includes('fetch failed') ||
    r === 'claim_failed'
  )
}
