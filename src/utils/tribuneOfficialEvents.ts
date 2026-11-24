import type { Highlight } from '../data/highlights'

function highlightRaw(h: Highlight): string {
  return `${h.title ?? ''} ${h.detail ?? ''} ${h.type ?? ''}`
}

export function isPenaltyShootoutContext(raw: string, minute: number | null): boolean {
  if (typeof minute === 'number' && minute >= 120) return true
  return /shootout|tirs au but|penalty shoot/i.test(raw)
}

export function isPenaltyMissedText(raw: string): boolean {
  if (!/penalty|pénalty|penalti|peno/i.test(raw)) return false
  return /missed|saved|rat[ée]|arr[eê]t|saved by|hits the (bar|post)|off the (bar|post)|PENALTY_MISSED|PENALTY_SAVED/i.test(
    raw,
  )
}

export function isPenaltyScoredText(raw: string): boolean {
  if (!/penalty|pénalty|penalti/i.test(raw)) return false
  return /scored|converti|transform[ée]|PENALTY_SCORED|penalty.?goal/i.test(raw)
}

export function isPenaltyAwardText(raw: string): boolean {
  if (/\bbut it\b/i.test(raw)) return false
  if (/penalty (area|box)|surface de r[ée]paration|dans la surface/i.test(raw)) return false
  if (!/penalty|pénalty|penalti|\bpeno\b/i.test(raw)) return false
  if (isPenaltyMissedText(raw) || isPenaltyScoredText(raw)) return false
  return true
}

export function isRedCardHighlight(h: Highlight): boolean {
  const raw = highlightRaw(h)
  return h.type === 'Carton' && /rouge|red card/i.test(raw)
}

export function penaltyIncidentKey(matchId: string, minute: number | null, kind: 'award' | 'miss'): string {
  return `pen:${kind}:${matchId}:${minute ?? 'x'}`
}

export function decisionPollKey(matchId: string, kind: 'pen' | 'red', minute: number | null): string {
  return `dec:${kind}:${matchId}:${minute ?? 'x'}`
}

/** Fusionne les messages officiels déjà en base (même penalty / sondage répété). */
export function officialPostCollapseKey(body: string, minute: number | null): string {
  const b = body.toLowerCase().replace(/\s+/g, ' ').trim()
  const min = minute ?? '?'
  if (/d[ée]cision juste/.test(b)) return `dec:${min}`
  if (/penalty rat[ée]|penalty missed|penalty saved|p[ée]nalty rat/.test(b)) return `penmiss:${min}`
  if (/\bpenalty\b|\bp[ée]nalty\b|\bpeno\b/.test(b)) return `pen:${min}`
  if (/\bbut\b/.test(b)) return `goal:${min}|${b.slice(0, 48)}`
  return `${min}|${b}`
}
