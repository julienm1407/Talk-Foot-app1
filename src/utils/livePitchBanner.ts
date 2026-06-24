import type { Highlight } from '../data/highlights'
import { formatGoalEventMinute } from './matchEventMinute'

export type LivePitchBannerTone =
  | 'goal'
  | 'danger'
  | 'corner'
  | 'card'
  | 'var'
  | 'chance'
  | 'save'
  | 'neutral'

export type LivePitchBanner = {
  label: string
  detail?: string
  side: 'home' | 'away' | 'neutral'
  tone: LivePitchBannerTone
}

function minuteLabel(h: Pick<Highlight, 'minute' | 'inSecondHalf'>): string {
  const label = formatGoalEventMinute(h.minute, { inSecondHalf: h.inSecondHalf })
  return label || (h.minute > 0 ? `${h.minute}'` : '')
}

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((t) => text.includes(t))
}

export function resolveLivePitchBanner(params: {
  highlight: Highlight | null
  highlightText: string
  detectSide: (raw: string) => 'home' | 'away' | undefined
  dangerousLeader?: 'home' | 'away' | 'equal'
  dangerousDelta?: number
  homeLabel: string
  awayLabel: string
  liveClockPaused?: boolean
  liveInSecondHalf?: boolean
}): LivePitchBanner {
  const {
    highlight,
    highlightText,
    detectSide,
    homeLabel,
    awayLabel,
    liveClockPaused,
    liveInSecondHalf,
  } = params

  if (liveClockPaused && !liveInSecondHalf) {
    return {
      label: 'MI-TEMPS',
      side: 'neutral',
      tone: 'neutral',
    }
  }

  if (highlight) {
    const raw = `${highlight.title ?? ''} ${highlight.detail ?? ''}`.trim()
    const rawLower = raw.toLowerCase()
    const textLower = highlightText.toLowerCase()
    const side: 'home' | 'away' | 'neutral' = highlight.side ?? detectSide(raw) ?? 'neutral'
    const minute = minuteLabel(highlight)
    const team = side === 'home' ? homeLabel : side === 'away' ? awayLabel : ''
    const detailParts = [minute, team, highlight.scorerName?.trim()].filter(Boolean)
    const detail = detailParts.length ? detailParts.join(' · ') : highlightText.trim() || undefined

    if (highlight.type === 'But') {
      return {
        label: 'BUT !',
        detail: detail || undefined,
        side,
        tone: 'goal',
      }
    }

    if (highlight.type === 'Carton') {
      const red =
        includesAny(rawLower, ['rouge', 'red card', 'redcard']) ||
        includesAny(textLower, ['rouge', 'carton rouge'])
      return {
        label: red ? 'CARTON ROUGE' : 'CARTON JAUNE',
        detail: detail || undefined,
        side,
        tone: 'card',
      }
    }

    if (highlight.type === 'VAR') {
      return {
        label: 'VAR',
        detail: minute ? `${minute}${team ? ` · ${team}` : ''}` : highlightText.trim() || undefined,
        side,
        tone: 'var',
      }
    }

    if (
      includesAny(rawLower, ['corner', 'corners', 'coup de pied de coin']) ||
      includesAny(textLower, ['corner', 'coup de pied de coin'])
    ) {
      return {
        label: 'CORNER',
        detail: minute ? `${minute}${team ? ` · ${team}` : ''}` : undefined,
        side,
        tone: 'corner',
      }
    }

    if (
      includesAny(rawLower, ['dangerous', 'attaque dangereuse', 'action dangereuse']) ||
      includesAny(textLower, ['attaque dangereuse', 'action dangereuse'])
    ) {
      return {
        label: 'ACTION DANGEREUSE',
        detail: minute ? `${minute}${team ? ` · ${team}` : ''}` : undefined,
        side,
        tone: 'danger',
      }
    }

    if (highlight.type === 'Arrêt' || includesAny(rawLower, ['save', 'arrêt', 'arret'])) {
      return {
        label: 'ARRÊT',
        detail: detail || undefined,
        side,
        tone: 'save',
      }
    }

    if (
      highlight.type === 'Occasion' ||
      includesAny(rawLower, ['shot', 'tir', 'occasion', 'chance']) ||
      includesAny(textLower, ['occasion', 'tir'])
    ) {
      return {
        label: 'OCCASION',
        detail: detail || undefined,
        side,
        tone: 'chance',
      }
    }

    if (includesAny(rawLower, ['penalty', 'peno', 'penalty kick']) || includesAny(textLower, ['penalty', 'peno'])) {
      return {
        label: 'PENALTY',
        detail: minute ? `${minute}${team ? ` · ${team}` : ''}` : undefined,
        side,
        tone: 'danger',
      }
    }

    if (highlight.type !== 'Info') {
      const compact =
        highlightText.trim().length > 48 ? `${highlightText.trim().slice(0, 45)}…` : highlightText.trim()
      if (compact) {
        return {
          label: compact.toUpperCase(),
          detail: minute ? `${minute}${team ? ` · ${team}` : ''}` : undefined,
          side,
          tone: 'neutral',
        }
      }
    }
  }

  return {
    label: 'MATCH EN COURS',
    side: 'neutral',
    tone: 'neutral',
  }
}

/** Évite d’afficher une vieille action quand le chrono a avancé. */
export function pickLivePitchBannerHighlight(
  highlights: Highlight[],
  liveMinute: number,
): Highlight | null {
  if (!highlights.length) return null
  const recent = highlights.filter((h) => {
    const hm = typeof h.minute === 'number' ? h.minute : 0
    if (hm <= 0) return false
    return hm >= liveMinute - 2 && hm <= liveMinute + 1
  })
  return recent.length ? recent[recent.length - 1]! : null
}
