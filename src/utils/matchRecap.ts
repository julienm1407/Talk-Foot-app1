import type { Highlight } from '../data/highlights'
import type { Match } from '../types/match'

export type MatchRecapScorer = {
  name: string
  minute?: number
  side?: 'home' | 'away'
}

export type MatchRecapTopMessage = {
  username: string
  text: string
  likes: number
}

export type MatchRecapModel = {
  match: Match
  scorers: MatchRecapScorer[]
  bestBettorName: string | null
  topMessages: MatchRecapTopMessage[]
  correctPronos: number
}

export function scorersFromHighlights(highlights: Highlight[]): MatchRecapScorer[] {
  const out: MatchRecapScorer[] = []
  for (const h of highlights) {
    if (h.type !== 'But') continue
    const name = h.scorerName?.trim()
    if (!name) continue
    out.push({ name, minute: h.minute, side: h.side })
  }
  return out
}

export function formatScorersLine(scorers: MatchRecapScorer[]): string {
  if (!scorers.length) return ''
  return scorers
    .map((s) => (s.minute != null ? `${s.name} ${s.minute}'` : s.name))
    .join(' · ')
}
