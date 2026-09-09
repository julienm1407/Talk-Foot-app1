import type { Highlight } from '../data/highlights'

export type BettingSuspension = {
  suspended: boolean
  reason?: string
}

/** Délai court après un but avant réouverture des paris (jetons). */
export const GOAL_BET_LOCK_MS = 28_000

function highlightMinute(h: Pick<Highlight, 'minute'>): number {
  return typeof h.minute === 'number' ? h.minute : 0
}

function textBlob(h: Pick<Highlight, 'title' | 'detail' | 'type'>): string {
  return `${h.type ?? ''} ${h.title ?? ''} ${h.detail ?? ''}`.toLowerCase()
}

function looksLikeVarReview(text: string): boolean {
  return /\bvar\b/.test(text) || text.includes('video assistant') || text.includes('revue vidéo')
}

function isHighlightLiveRelevant(
  h: Highlight,
  liveMinute: number,
  sessionAnchorMinute: number,
  windowBefore: number,
): boolean {
  const hm = highlightMinute(h)
  if (sessionAnchorMinute >= 0 && hm > 0 && hm < sessionAnchorMinute - 1) return false
  if (hm <= 0) return false
  return hm >= liveMinute - windowBefore && hm <= liveMinute + 1
}

/**
 * Suspend les paris live surtout autour d’un but (+ fin de match).
 * Mi-temps : paris ouverts. Pas de blocage long sur occasions / cartons.
 */
export function deriveBettingSuspension(opts: {
  status: 'upcoming' | 'live' | 'finished'
  liveClockPaused?: boolean
  minute: number
  periodTicking?: boolean
  highlights: Highlight[]
  /** Minute live au chargement de la tribune — ignore l’historique avant. */
  sessionAnchorMinute?: number
  /** Verrou temporel après détection d’un but (score ou timeline). */
  goalLockUntilMs?: number
  nowMs?: number
}): BettingSuspension {
  const {
    status,
    minute,
    periodTicking,
    highlights,
    sessionAnchorMinute = -1,
    goalLockUntilMs = 0,
    nowMs = Date.now(),
  } = opts

  if (status === 'finished') {
    return { suspended: true, reason: 'Paris fermés : match terminé.' }
  }
  if (status !== 'live') return { suspended: false }

  // Mi-temps (`liveClockPaused`) : on laisse parier.

  const ticking = periodTicking !== false
  if (minute >= 90 && !ticking) {
    return { suspended: true, reason: 'Paris fermés : fin du match.' }
  }
  if (minute >= 95) {
    return { suspended: true, reason: 'Paris fermés : fin du match.' }
  }

  if (goalLockUntilMs > nowMs) {
    return {
      suspended: true,
      reason: 'Paris suspendus : but récent (mise à jour des cotes).',
    }
  }

  const scan = highlights.filter((h) => isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 2))

  for (let i = scan.length - 1; i >= 0; i--) {
    const h = scan[i]
    // Fenêtre minute étroite : le verrou temporel `goalLockUntilMs` porte le vrai délai.
    if (h.type === 'But' && isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 0)) {
      return { suspended: true, reason: 'Paris suspendus : but récent.' }
    }
    const text = textBlob(h)
    // VAR courte uniquement (risque immédiat sur le score).
    if (looksLikeVarReview(text) && isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 1)) {
      return { suspended: true, reason: 'Paris suspendus : VAR en cours.' }
    }
  }

  return { suspended: false }
}
