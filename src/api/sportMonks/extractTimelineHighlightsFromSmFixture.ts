import type { Highlight } from '../../data/highlights'
import { translateSportMonksLiveTextToFr } from '../../utils/translateSportMonksLiveEnToFr'
import type { SmFixture, SmFixtureEventRow } from './types'

const MAX_ROWS = 150

/** SM n’alimente pas toujours `is_goal` sur les `comments` — évite de classer un vrai but en « Info ». */
function commentLooksLikeGoal(text: string): boolean {
  const u = text.toUpperCase()
  if (u.includes('GOAL') || u.includes('OWN GOAL') || u.includes('OWNGOAL')) return true
  if (u.includes('PENALTY') && (u.includes('SCORE') || u.includes('GOAL'))) return true
  if (/\bBUT\b/.test(u) || u.includes('BUT!') || u.includes('BUT !')) return true
  if (/\bGOL\b/.test(u) || u.includes('¡GOL') || u.includes('GOL!')) return true
  return false
}

function displayMinute(row: { minute?: number | null; extra_minute?: number | null }): number {
  const m = typeof row.minute === 'number' ? row.minute : 0
  const x = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  if (m <= 0 && x <= 0) return 0
  return m + x
}

function highlightTypeFromEventDev(dev: string): Highlight['type'] {
  const u = dev.toUpperCase()
  if (u.includes('GOAL') || u.includes('OWN') || u.includes('PENALTY') || /\bGOL\b/.test(u)) return 'But'
  if (u.includes('YELLOW')) return 'Carton'
  if (u.includes('RED')) return 'Carton'
  if (u.includes('VAR')) return 'VAR'
  if (u.includes('SAVE') || u.includes('GREAT')) return 'Arrêt'
  if (u.includes('CHANCE') || u.includes('SHOT') || u.includes('ATTACK')) return 'Occasion'
  return 'Info'
}

function highlightTypeFromComment(rawComment: string, isImportant: boolean): Highlight['type'] {
  const u = rawComment.toUpperCase()
  if (commentLooksLikeGoal(rawComment)) return 'But'
  if (u.includes('YELLOW') || u.includes('JAUNE') || u.includes('RED') || u.includes('ROUGE')) {
    return 'Carton'
  }
  if (u.includes('VAR')) return 'VAR'
  if (u.includes('SAVE') || u.includes('ARRÊT') || u.includes('ARRET')) return 'Arrêt'
  if (
    u.includes('CHANCE') ||
    u.includes('OCCASION') ||
    u.includes('SHOT') ||
    u.includes('TIR') ||
    u.includes('PENALTY')
  ) {
    return 'Occasion'
  }
  if (isImportant) return 'Occasion'
  return 'Info'
}

function highlightDedupeKey(h: Highlight): string {
  const text = String(h.detail || h.title || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  return `${h.minute}|${h.type}|${text}`
}

function eventTitle(ev: SmFixtureEventRow, type: Highlight['type']): string {
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
  const player = String(ev.player?.display_name ?? ev.player?.name ?? '').trim()
  if (player) return `${dev || type} · ${player}`
  return dev || ''
}

/**
 * Timeline « Moments forts » : d’abord les **comments** texte (include `comments` sur la fixture),
 * sinon les **events** structurés.
 */
export function extractTimelineHighlightsFromSmFixture(
  fixture: SmFixture | null | undefined,
  matchId: string,
): Highlight[] {
  if (!fixture) return []

  const out: Highlight[] = []
  const comments = Array.isArray(fixture.comments) ? fixture.comments : []
  const withText = comments.filter((c) => String(c.comment ?? '').trim())
  if (withText.length) {
    const sorted = [...withText].sort((a, b) => {
      const oa = a.order ?? a.id ?? 0
      const ob = b.order ?? b.id ?? 0
      if (typeof oa === 'number' && typeof ob === 'number' && oa !== ob) return oa - ob
      return String(a.id ?? '').localeCompare(String(b.id ?? ''))
    })
    const slice = sorted.length > MAX_ROWS ? sorted.slice(-MAX_ROWS) : sorted
    const fromComments = slice.map((c) => {
      const minute = displayMinute(c)
      const order = typeof c.order === 'number' ? c.order : typeof c.id === 'number' ? c.id : 0
      const rawComment = String(c.comment ?? '').trim()
      const type = c.is_goal ? 'But' : highlightTypeFromComment(rawComment, Boolean(c.is_important))
      const detail = translateSportMonksLiveTextToFr(rawComment)
      return {
        id: `sm-comment-${c.id ?? order}-${order}`,
        matchId,
        minute,
        order,
        type,
        title: '',
        detail,
      }
    })
    out.push(...fromComments)
  }

  const events = Array.isArray(fixture.events) ? fixture.events : []
  if (events.length) {
    const sortedEv = [...events].sort((a, b) => {
      const ma = displayMinute(a)
      const mb = displayMinute(b)
      if (ma !== mb) return ma - mb
      return (a.id ?? 0) - (b.id ?? 0)
    })
    const sliceEv = sortedEv.length > MAX_ROWS ? sortedEv.slice(-MAX_ROWS) : sortedEv
    const fromEvents = sliceEv.map((ev) => {
      const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
      const type = highlightTypeFromEventDev(dev)
      const minute = displayMinute(ev)
      const title = translateSportMonksLiveTextToFr(eventTitle(ev, type).trim())
      const detail = translateSportMonksLiveTextToFr((dev || 'Événement').trim())
      return {
        id: `sm-event-${ev.id ?? `${minute}-${dev}`}`,
        matchId,
        minute,
        order: ev.id,
        type,
        title,
        detail,
      }
    })
    out.push(...fromEvents)
  }

  if (!out.length) return []

  const byKey = new Map<string, Highlight>()
  for (const h of out) {
    const k = highlightDedupeKey(h)
    if (!byKey.has(k)) byKey.set(k, h)
  }

  const merged = Array.from(byKey.values()).sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute
    return (a.order ?? 0) - (b.order ?? 0)
  })
  return merged.length > MAX_ROWS ? merged.slice(-MAX_ROWS) : merged
}
