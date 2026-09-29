import type { Match } from '../types/match'
import type { WcMatch } from '../types/wc2026'

/** Début de la fenêtre d’attention (avant le coup d’envoi). */
export const MATCH_ATTENTION_PRE_KO_MS = 5 * 60_000
/** Fin de la fenêtre (prolongations + séance de TAB) — polling seulement. */
export const MATCH_ATTENTION_POST_KO_MS = 3 * 60 * 60_000
/** Au-delà, un match encore « live » côté API est traité comme terminé (90 + MT + arrêts). */
export const STALE_LIVE_REGULATION_MS = 125 * 60_000
/** Prolongations / TAB. */
export const STALE_LIVE_EXTRA_MS = 170 * 60_000

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

export function coerceElapsedLiveStatus(
  match: {
    status: string
    kickoffAt: string
    extraTime?: boolean
    periodTicking?: boolean
    minute?: number
  },
  nowMs: number = Date.now(),
): MatchAttentionStatus {
  const sm = match.status
  if (sm === 'finished' || sm === 'cancelled' || sm === 'postponed') return 'finished'
  const ko = kickoffMs(match.kickoffAt)
  const elapsed = ko != null ? nowMs - ko : 0
  const extra = Boolean(match.extraTime)
  const staleLimit = extra ? STALE_LIVE_EXTRA_MS : STALE_LIVE_REGULATION_MS

  if (sm === 'live') {
    if (ko != null && elapsed > staleLimit) return 'finished'
    const minute = Math.round(Number(match.minute) || 0)
    if (!extra && match.periodTicking === false) {
      if (minute >= 90 && elapsed > 110 * 60_000) return 'finished'
      const expectedMs = (Math.max(minute, 1) + 20) * 60_000
      if (elapsed > expectedMs + 12 * 60_000) return 'finished'
    }
    return 'live'
  }

  if (ko != null && elapsed > staleLimit) return 'finished'
  if (ko != null && nowMs >= ko && isKickoffInLiveAttentionWindow(match.kickoffAt, nowMs)) {
    return 'live'
  }
  return 'upcoming'
}

/**
 * Statut « effectif » pour le polling live : si SM n’a pas encore basculé `live`
 * mais que le match a commencé, on traite comme live pour remonter score / minute sans F5.
 * Après la durée max, on ne reste pas collé en live.
 */
export function resolveEffectiveMatchStatus(
  match: { status: string; kickoffAt: string; minute?: number } | null | undefined,
  nowMs: number = Date.now(),
): MatchAttentionStatus {
  if (!match) return 'upcoming'
  return coerceElapsedLiveStatus(match, nowMs)
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
