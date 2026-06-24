import type { Highlight } from '../data/highlights'

export type BettingSuspension = {
  suspended: boolean
  reason?: string
}

/** Délai après un but (score ou timeline) avant réouverture des paris. */
export const GOAL_BET_LOCK_MS = 90_000

function highlightMinute(h: Pick<Highlight, 'minute'>): number {
  return typeof h.minute === 'number' ? h.minute : 0
}

function textBlob(h: Pick<Highlight, 'title' | 'detail' | 'type'>): string {
  return `${h.type ?? ''} ${h.title ?? ''} ${h.detail ?? ''}`.toLowerCase()
}

function looksLikePenaltyAwarded(text: string): boolean {
  if (!text.includes('penalty') && !text.includes('peno') && !text.includes('penalt')) return false
  if (text.includes('scored') || text.includes('goal') || text.includes('but')) return false
  if (text.includes('missed') || text.includes('saved') || text.includes('arrêt')) return false
  return true
}

function looksLikeVarReview(text: string): boolean {
  return /\bvar\b/.test(text) || text.includes('video assistant') || text.includes('revue vidéo')
}

function looksLikeDangerousMoment(text: string): boolean {
  return (
    text.includes('occasion') ||
    text.includes('chance') ||
    text.includes('shot') ||
    text.includes('tir') ||
    text.includes('dangerous') ||
    text.includes('dangereux') ||
    text.includes('corner') ||
    text.includes('coup franc') ||
    text.includes('free kick') ||
    looksLikePenaltyAwarded(text)
  )
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

/** Suspend les paris live pendant actions sensibles, buts récents, mi-temps et fin de match. */
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
    liveClockPaused,
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

  if (liveClockPaused) {
    return { suspended: true, reason: 'Paris suspendus : mi-temps.' }
  }

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

  const scan = highlights.filter((h) => isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 3))

  for (let i = scan.length - 1; i >= 0; i--) {
    const h = scan[i]
    if (h.type === 'But' && isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 2)) {
      return { suspended: true, reason: 'Paris suspendus : but récent.' }
    }
    const text = textBlob(h)
    if (looksLikeVarReview(text) && isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 2)) {
      return { suspended: true, reason: 'Paris suspendus : VAR en cours.' }
    }
    if (looksLikePenaltyAwarded(text) && isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 1)) {
      return { suspended: true, reason: 'Paris suspendus : penalty en jeu.' }
    }
    if (
      h.type === 'Carton' &&
      isHighlightLiveRelevant(h, minute, sessionAnchorMinute, 1)
    ) {
      return { suspended: true, reason: 'Paris suspendus : carton récent.' }
    }
  }

  const latest = scan[scan.length - 1]
  if (latest) {
    const text = textBlob(latest)
    if (
      looksLikeDangerousMoment(text) &&
      isHighlightLiveRelevant(latest, minute, sessionAnchorMinute, 1)
    ) {
      return { suspended: true, reason: 'Paris suspendus : action dangereuse.' }
    }
  }

  return { suspended: false }
}
