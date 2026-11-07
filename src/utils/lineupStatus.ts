import type { SmLineupSource } from '../api/sportMonks/extractStartingXisFromSmFixture'

/** Au-delà, une compo « confirmed » du feed est encore trop tôt pour l’officielle (~1 h avant le KO). */
export const OFFICIAL_LINEUP_LEAD_MS = 75 * 60 * 1000

export type DisplayedLineupKind = 'official' | 'probable' | 'none'

export function resolveDisplayedLineupKind(input: {
  hasLineup: boolean
  source: SmLineupSource
  status: 'upcoming' | 'live' | 'finished'
  kickoffAt?: string | number | Date | null
  nowMs?: number
}): DisplayedLineupKind {
  if (!input.hasLineup) return 'none'
  if (input.status === 'live' || input.status === 'finished') return 'official'

  if (input.source === 'probable' || input.source === 'estimated') return 'probable'

  const kickoffMs = input.kickoffAt != null ? new Date(input.kickoffAt).getTime() : NaN
  const now = input.nowMs ?? Date.now()
  if (Number.isFinite(kickoffMs) && kickoffMs - now > OFFICIAL_LINEUP_LEAD_MS) {
    return 'probable'
  }

  if (input.source === 'confirmed') return 'official'
  return 'probable'
}

export const OFFICIAL_LINEUP_HINT_FR =
  'La composition officielle est en général dévoilée environ une heure avant le coup d’envoi.'
