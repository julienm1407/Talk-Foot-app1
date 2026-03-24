import type { Match } from './match'

export type LiveEncartBurst =
  | { kind: 'goal'; side: 'home' | 'away'; teamName: string }
  | { kind: 'var'; line: string }
  | null

export type LiveEncartToast = {
  id: string
  kind: 'yellow' | 'red' | 'var_line' | 'chance'
  text: string
  side?: 'home' | 'away'
} | null

export type LiveEncartRim = 'yellow' | 'red' | 'goal' | 'var' | null

export type LiveEncartSimulation = {
  active: boolean
  minute: number
  score: { home: number; away: number }
  bumpSide: 'home' | 'away' | null
  burst: LiveEncartBurst
  toast: LiveEncartToast
  rim: LiveEncartRim
}

/** Même match que le hero : score, minute et effets synchronisés sur la carte « À l’affiche ». */
export type LiveMirrorForCard = Pick<
  LiveEncartSimulation,
  'minute' | 'score' | 'bumpSide' | 'rim' | 'burst' | 'toast' | 'active'
>

function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** PRNG déterministe par match pour des séquences stables au refresh. */
export function createMatchRng(matchId: string) {
  let seed = hashId(matchId) + 1
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export function initialScoreFromMatch(match: Match): { home: number; away: number } {
  return match.score ? { ...match.score } : { home: 0, away: 0 }
}
