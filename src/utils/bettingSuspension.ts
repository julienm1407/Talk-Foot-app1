import type { Highlight } from '../data/highlights'

export type BettingSuspension = {
  suspended: boolean
  reason?: string
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

/** Suspend les paris live pendant actions sensibles, mi-temps et fin de match. */
export function deriveBettingSuspension(opts: {
  status: 'upcoming' | 'live' | 'finished'
  liveClockPaused?: boolean
  minute: number
  periodTicking?: boolean
  highlights: Highlight[]
}): BettingSuspension {
  const { status, liveClockPaused, minute, periodTicking, highlights } = opts

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

  const recent = highlights.filter((h) => {
    const hm = typeof h.minute === 'number' ? h.minute : 0
    return hm >= minute - 3 && hm <= minute + 1
  })
  const scan = recent.length ? recent : highlights.slice(-6)

  for (let i = scan.length - 1; i >= 0; i--) {
    const h = scan[i]
    const text = textBlob(h)
    if (looksLikeVarReview(text)) {
      return { suspended: true, reason: 'Paris suspendus : VAR en cours.' }
    }
    if (looksLikePenaltyAwarded(text)) {
      return { suspended: true, reason: 'Paris suspendus : penalty en jeu.' }
    }
  }

  const latest = scan[scan.length - 1]
  if (latest) {
    const text = textBlob(latest)
    if (looksLikeDangerousMoment(text)) {
      return { suspended: true, reason: 'Paris suspendus : action dangereuse.' }
    }
  }

  return { suspended: false }
}
