import type { Match } from '../types/match'
import type { WcMatch } from '../types/wc2026'

/** Début de la fenêtre d’attention (avant le coup d’envoi). */
export const MATCH_ATTENTION_PRE_KO_MS = 5 * 60_000
/** Fin de la fenêtre (prolongations + séance de TAB). */
export const MATCH_ATTENTION_POST_KO_MS = 3 * 60 * 60_000

export type MatchAttentionStatus = 'upcoming' | 'live' | 'finished'

function kickoffMs(kickoffAt: string): number | null {
  const ko = Date.parse(kickoffAt)
  return Number.isFinite(ko) ? ko : null
}

/** Coup d’envoi ± fenêtre : scores, statut et TAB peuvent encore bouger. */
export function isKickoffInLiveAttentionWindow(
  kickoffAt: string,
  nowMs: number = Date.now(),
): boolean {
  const ko = kickoffMs(kickoffAt)
  if (ko == null) return false
  const delta = nowMs - ko
  return delta >= -MATCH_ATTENTION_PRE_KO_MS && delta <= MATCH_ATTENTION_POST_KO_MS
}

/**
 * Statut « effectif » pour le polling live : si SM n’a pas encore basculé `live`
 * mais que le match a commencé, on traite comme live pour remonter score / minute sans F5.
 */
export function resolveEffectiveMatchStatus(
  match: { status: string; kickoffAt: string } | null | undefined,
  nowMs: number = Date.now(),
): MatchAttentionStatus {
  if (!match) return 'upcoming'
  const sm = match.status
  if (sm === 'finished' || sm === 'cancelled' || sm === 'postponed') return 'finished'
  if (sm === 'live') return 'live'
  const ko = kickoffMs(match.kickoffAt)
  if (ko != null && nowMs >= ko && isKickoffInLiveAttentionWindow(match.kickoffAt, nowMs)) {
    return 'live'
  }
  return 'upcoming'
}

export function matchNeedsLiveAttention(
  match: Pick<Match, 'status' | 'kickoffAt'>,
  nowMs: number = Date.now(),
): boolean {
  if (match.status === 'live') return true
  return isKickoffInLiveAttentionWindow(match.kickoffAt, nowMs)
}

export function wcMatchNeedsLiveAttention(
  match: Pick<WcMatch, 'status' | 'kickoffAt'>,
  nowMs: number = Date.now(),
): boolean {
  if (match.status === 'live') return true
  return isKickoffInLiveAttentionWindow(match.kickoffAt, nowMs)
}
