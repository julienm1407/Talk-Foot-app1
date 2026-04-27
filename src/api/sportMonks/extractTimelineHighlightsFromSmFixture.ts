import type { Highlight } from '../../data/highlights'
import { translateSportMonksLiveTextToFr } from '../../utils/translateSportMonksLiveEnToFr'
import type { SmFixture, SmFixtureEventRow } from './types'

const MAX_ROWS = 150

function displayMinute(row: { minute?: number | null; extra_minute?: number | null }): number {
  const m = typeof row.minute === 'number' ? row.minute : 0
  const x = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  if (m <= 0 && x <= 0) return 0
  return m + x
}

function highlightTypeFromEventDev(dev: string): Highlight['type'] {
  const u = dev.toUpperCase()
  if (u.includes('GOAL') || u.includes('OWN') || u.includes('PENALTY')) return 'But'
  if (u.includes('YELLOW')) return 'Carton'
  if (u.includes('RED')) return 'Carton'
  if (u.includes('VAR')) return 'VAR'
  if (u.includes('SAVE') || u.includes('GREAT')) return 'Arrêt'
  if (u.includes('CHANCE') || u.includes('SHOT') || u.includes('ATTACK')) return 'Occasion'
  return 'Info'
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
    return slice.map((c) => {
      const minute = displayMinute(c)
      const order = typeof c.order === 'number' ? c.order : typeof c.id === 'number' ? c.id : 0
      const type: Highlight['type'] = c.is_goal ? 'But' : c.is_important ? 'Occasion' : 'Info'
      const detail = translateSportMonksLiveTextToFr(String(c.comment).trim())
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
  }

  const events = Array.isArray(fixture.events) ? fixture.events : []
  if (!events.length) return []

  const sortedEv = [...events].sort((a, b) => {
    const ma = displayMinute(a)
    const mb = displayMinute(b)
    if (ma !== mb) return ma - mb
    return (a.id ?? 0) - (b.id ?? 0)
  })
  const sliceEv = sortedEv.length > MAX_ROWS ? sortedEv.slice(-MAX_ROWS) : sortedEv
  return sliceEv.map((ev) => {
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
}
