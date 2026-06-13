import type { Highlight } from '../../data/highlights'
import { translateSportMonksLiveTextToFr } from '../../utils/translateSportMonksLiveEnToFr'
import {
  cardColorFromHighlightText,
  cardCoarseDedupeKey,
  compactScorerDisplayName,
  isLikelyGeographicFragment,
  isMatchTeamLabel,
  isPlausibleCardPlayerName,
  isPlausibleGoalScorerName,
  parseCardPlayerName,
  parseGoalAssistFromText,
  parseGoalScorerName,
  parseLiveCardRowsFromHighlights,
  parseLiveGoalRowsFromHighlights,
  slugScorer,
  type LiveCardDisplayRow,
  type LiveGoalDisplayRow,
  type LiveGoalTeamHints,
} from '../../utils/liveFootballOdds'
import type { SmFixture, SmFixtureEventRow } from './types'
import { smFixtureHomeAwayParticipantIds } from './smFixtureParticipantSides'

const MAX_ROWS = 150

/** SM n’alimente pas toujours `is_goal` — patterns explicites uniquement (évite les faux « BUT » ambiance). */
function commentLooksLikeGoal(text: string): boolean {
  const u = text.toUpperCase()
  if (u.includes('OWN GOAL') || u.includes('OWNGOAL')) return true
  if (/\bGOAL!\b/.test(u) || /\bGOAL !\b/.test(u)) return true
  if (u.includes('PENALTY') && (u.includes('SCORED') || u.includes('GOAL'))) return true
  if (u.includes('BUT!') || u.includes('BUT !') || u.includes('¡GOL') || u.includes('GOL!')) return true
  return false
}

function displayMinute(row: { minute?: number | null; extra_minute?: number | null }): number {
  const m = typeof row.minute === 'number' ? row.minute : 0
  const x = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  if (m <= 0 && x <= 0) return 0
  return m + x
}

function eventDevLooksLikeCard(u: string): boolean {
  if (u.includes('VAR')) return false
  if (u.includes('GOAL') && !u.includes('CARD')) return false
  if (u.includes('YELLOW')) return true
  if (u.includes('REDCARD') || u.includes('RED_CARD')) return true
  if (u.includes('RED') && u.includes('CARD')) return true
  if (/\bRED\b/.test(u) && !u.includes('SUB') && !u.includes('SAVE')) return true
  return false
}

function cardColorFromEventDev(dev: string): 'yellow' | 'red' {
  const u = dev.toUpperCase()
  if (u.includes('YELLOW') && u.includes('SECOND')) return 'red'
  if (u.includes('RED')) return 'red'
  return 'yellow'
}

function eventDevLooksLikeGoal(u: string): boolean {
  if (u.includes('GOALKICK') || u.includes('GOAL KICK') || u.includes('GOALKEEPER')) return false
  if (u.includes('DISALLOWED') || u.includes('CANCELLED')) return false
  if (u.includes('OWN GOAL') || u.includes('OWNGOAL') || u.includes('OWN-GOAL')) return true
  if (/\bGOAL\b/.test(u)) return true
  if (u.includes('PENALTY') && (u.includes('SCORED') || u.includes('GOAL') || u.includes('BUT'))) return true
  if (/\bGOL\b/.test(u)) return true
  return false
}

function commentLooksLikeCorner(text: string): boolean {
  const u = text.toUpperCase()
  return u.includes('CORNER') || u.includes('COUP FRANC') || u.includes('FREE KICK')
}

function commentMentionsVar(text: string): boolean {
  return /\bVAR\b/i.test(text)
}

function highlightTypeFromEventDev(dev: string): Highlight['type'] {
  const u = dev.toUpperCase()
  if (eventDevLooksLikeGoal(u)) return 'But'
  if (eventDevLooksLikeCard(u)) return 'Carton'
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
  if (commentMentionsVar(rawComment)) return 'VAR'
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
  const goalKey = goalSemanticKey(h)
  if (goalKey) return `but|${goalKey}`
  const cardKey = cardCoarseDedupeKey(h)
  if (cardKey) {
    const slug = h.scorerName ? slugScorer(h.scorerName) : ''
    return `carton|${cardKey}|${slug}`
  }
  const text = String(h.detail || h.title || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  return `${h.minute}|${h.type}|${h.side ?? ''}|${text}`
}

const FULLSCREEN_NOISE =
  /\b(but|goal|gol|own|penalty|penal|carton|jaune|rouge|yellow|red|card|var|min|minute|the|a|de|la|le|les|un|une|pour|scored|marque|against)\b/gi

function scorerSlugForHighlight(h: Pick<Highlight, 'scorerName' | 'title' | 'detail'>): string {
  const combined = `${String(h.title ?? '').trim()} ${String(h.detail ?? '').trim()} ${String(h.scorerName ?? '').trim()}`.trim()
  const scorer =
    h.scorerName?.trim() ||
    parseGoalScorerName(combined) ||
    parseGoalScorerName(String(h.detail ?? '')) ||
    parseGoalScorerName(String(h.title ?? ''))
  if (!scorer) return ''
  return slugScorer(compactScorerDisplayName(scorer))
}

/** Clé stable but : minute + camp + buteur (ignore le doublon event / commentaire). */
export function goalSemanticKey(h: Pick<Highlight, 'type' | 'minute' | 'side' | 'scorerName' | 'title' | 'detail'>): string | null {
  if (h.type !== 'But') return null
  const slug = scorerSlugForHighlight(h)
  if (!slug) return null
  return `${h.minute}|${h.side ?? '?'}|${slug}`
}

/** Clé stable pour n’afficher qu’une fois un même but / carton / VAR malgré doublons API (ids différents, commentaire + event). */
export function highlightFullscreenDedupeKey(h: Pick<Highlight, 'id' | 'minute' | 'type' | 'title' | 'detail' | 'side' | 'scorerName'>): string {
  const t = String(h.type || '').toLowerCase()
  const bucket = t.includes('but')
    ? 'but'
    : t.includes('carton')
      ? 'carton'
      : t.includes('var')
        ? 'var'
        : 'other'
  const sideKey = h.side ?? ''
  if (bucket === 'but') {
    const slug = scorerSlugForHighlight(h)
    if (slug) return `but|${h.minute}|${sideKey}|${slug}`
  }
  if (bucket === 'carton') {
    const slug = scorerSlugForHighlight(h)
    if (slug) return `carton|${h.minute}|${sideKey}|${slug}`
    const coarse = cardCoarseDedupeKey(h)
    if (coarse) return `carton|${coarse}`
  }
  const combined = `${String(h.title ?? '').trim()} ${String(h.detail ?? '').trim()} ${String(h.scorerName ?? '').trim()}`.trim()
  const text = combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(FULLSCREEN_NOISE, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ')
    .slice(0, 120)
  return `${bucket}|${h.minute}|${sideKey}|${text}`
}

function sideFromParticipant(
  participantId: number | null | undefined,
  homeId: number | undefined,
  awayId: number | undefined,
): 'home' | 'away' | undefined {
  if (participantId == null || !Number.isFinite(participantId)) return undefined
  if (homeId != null && participantId === homeId) return 'home'
  if (awayId != null && participantId === awayId) return 'away'
  return undefined
}

function cardPlayerFromEvent(ev: SmFixtureEventRow, dev: string): string | undefined {
  const primary = String(ev.player?.display_name ?? ev.player?.name ?? ev.player_name ?? '').trim()
  if (primary && isPlausibleCardPlayerName(primary)) return primary
  const fromMeta =
    parseCardPlayerName(String(ev.info ?? '')) ||
    parseCardPlayerName(String(ev.addition ?? '')) ||
    parseCardPlayerName(dev)
  if (fromMeta && isPlausibleCardPlayerName(fromMeta)) return fromMeta
  return undefined
}

function scorerFromEvent(ev: SmFixtureEventRow): string | undefined {
  const player = String(ev.player?.display_name ?? ev.player?.name ?? ev.player_name ?? '').trim()
  if (player && isPlausibleGoalScorerName(player)) return player
  const relatedPlayerObj = ev.relatedPlayer ?? ev.related_player
  const related = String(
    relatedPlayerObj?.display_name ?? relatedPlayerObj?.name ?? ev.related_player_name ?? '',
  ).trim()
  if (related && isPlausibleGoalScorerName(related)) return related
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
  const fromDev = parseGoalScorerName(dev)
  if (fromDev && isPlausibleGoalScorerName(fromDev)) return fromDev
  return undefined
}

function assistFromEvent(ev: SmFixtureEventRow): string | undefined {
  const rp = ev.relatedPlayer ?? ev.related_player
  const fromObj = String(rp?.display_name ?? rp?.name ?? '').trim()
  if (fromObj.length >= 2) return fromObj
  const fromName = String(ev.related_player_name ?? '').trim()
  if (fromName.length >= 2) return fromName
  return undefined
}

function mergeCardHighlights(primary: Highlight, secondary: Highlight): Highlight {
  const eventRow = primary.id.startsWith('sm-event-')
    ? primary
    : secondary.id.startsWith('sm-event-')
      ? secondary
      : primary
  const other = eventRow === primary ? secondary : primary
  const scorerName = eventRow.scorerName ?? other.scorerName
  const minute = eventRow.minute
  const color = cardColorFromHighlightText(`${eventRow.title ?? ''} ${eventRow.detail ?? ''}`)
  const player = scorerName ?? ''
  return {
    ...eventRow,
    ...(scorerName ? { scorerName } : {}),
    side: eventRow.side ?? other.side,
    title: player || eventRow.title,
    detail: player
      ? `${minute}' · ${color === 'red' ? 'Carton rouge' : 'Carton jaune'} · ${player}`
      : eventRow.detail || other.detail,
  }
}

function cardHighlightQuality(h: Highlight): number {
  let score = 0
  if (h.id.startsWith('sm-event-')) score += 20
  const name = h.scorerName?.trim() ?? ''
  if (name && isPlausibleCardPlayerName(name) && !isLikelyGeographicFragment(name)) {
    score += 10 + name.length
  }
  return score
}

function mergeGoalHighlights(primary: Highlight, secondary: Highlight): Highlight {
  const eventRow = primary.id.startsWith('sm-event-')
    ? primary
    : secondary.id.startsWith('sm-event-')
      ? secondary
      : primary
  const other = eventRow === primary ? secondary : primary
  const scorerName = eventRow.scorerName ?? other.scorerName
  const assistName = eventRow.assistName ?? other.assistName
  return {
    ...eventRow,
    ...(scorerName ? { scorerName } : {}),
    ...(assistName ? { assistName } : {}),
    side: eventRow.side ?? other.side,
    title: scorerName ?? eventRow.title,
    detail: eventRow.detail || other.detail,
  }
}

/**
 * Timeline « Moments forts » : événements structurés en priorité, commentaires texte en complément.
 */
export function extractTimelineHighlightsFromSmFixture(
  fixture: SmFixture | null | undefined,
  matchId: string,
): Highlight[] {
  if (!fixture) return []

  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  const out: Highlight[] = []

  const events = Array.isArray(fixture.events) ? fixture.events : []
  if (events.length) {
    const sortedEv = [...events].sort((a, b) => {
      const ma = displayMinute(a)
      const mb = displayMinute(b)
      if (ma !== mb) return ma - mb
      return (a.id ?? 0) - (b.id ?? 0)
    })
    const sliceEv = sortedEv.length > MAX_ROWS ? sortedEv.slice(-MAX_ROWS) : sortedEv
    for (const ev of sliceEv) {
      const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
      const type = highlightTypeFromEventDev(dev)
      const minute = displayMinute(ev)
      const side = sideFromParticipant(ev.participant_id, homeId, awayId)
      const scorerName = type === 'But' ? scorerFromEvent(ev) : undefined
      const cardPlayer = type === 'Carton' ? cardPlayerFromEvent(ev, dev) : undefined
      const assistName = type === 'But' ? assistFromEvent(ev) : undefined
      let resolvedType = type
      if (type === 'But' && !scorerName) resolvedType = 'Info'
      if (type === 'Carton' && !cardPlayer) resolvedType = 'Info'
      const title =
        resolvedType === 'But' && scorerName
          ? scorerName
          : resolvedType === 'Carton' && cardPlayer
            ? cardPlayer
            : translateSportMonksLiveTextToFr(
                scorerName ? `${dev} · ${scorerName}`.trim() : (dev || 'Événement').trim(),
              )
      const detail =
        resolvedType === 'But' && scorerName
          ? `${minute}' · ${scorerName}`
          : resolvedType === 'Carton' && cardPlayer
            ? `${minute}' · ${cardColorFromEventDev(dev) === 'red' ? 'Carton rouge' : 'Carton jaune'} · ${cardPlayer}`
            : translateSportMonksLiveTextToFr((dev || 'Événement').trim())
      out.push({
        id: `sm-event-${ev.id ?? `${minute}-${dev}`}`,
        matchId,
        minute,
        order: ev.id,
        type: resolvedType,
        title,
        detail,
        ...(side ? { side } : {}),
        ...(scorerName ? { scorerName } : {}),
        ...(cardPlayer ? { scorerName: cardPlayer } : {}),
        ...(assistName ? { assistName } : {}),
      })
    }
  }

  const comments = Array.isArray(fixture.comments) ? fixture.comments : []
  const withText = comments.filter((c) => String(c.comment ?? '').trim())
  if (withText.length) {
    const sorted = [...withText].sort((a, b) => {
      const ma = displayMinute(a)
      const mb = displayMinute(b)
      if (ma !== mb) return ma - mb
      const oa = a.order ?? a.id ?? 0
      const ob = b.order ?? b.id ?? 0
      if (typeof oa === 'number' && typeof ob === 'number' && oa !== ob) return oa - ob
      return String(a.id ?? '').localeCompare(String(b.id ?? ''))
    })
    const slice = sorted.length > MAX_ROWS ? sorted.slice(-MAX_ROWS) : sorted
    for (const c of slice) {
      const minute = displayMinute(c)
      const order = typeof c.order === 'number' ? c.order : typeof c.id === 'number' ? c.id : 0
      const rawComment = String(c.comment ?? '').trim()
      const scorerName = parseGoalScorerName(rawComment) ?? undefined
      const cardPlayer =
        (() => {
          const parsed = parseCardPlayerName(rawComment)
          return parsed && isPlausibleCardPlayerName(parsed) ? parsed : undefined
        })()
      let type =
        c.is_goal && !commentLooksLikeCorner(rawComment) && scorerName && isPlausibleGoalScorerName(scorerName)
          ? 'But'
          : highlightTypeFromComment(rawComment, Boolean(c.is_important))
      if (type === 'Carton' && !cardPlayer) type = 'Info'
      if (type === 'But' && (!scorerName || !isPlausibleGoalScorerName(scorerName))) type = 'Info'
      const detail = translateSportMonksLiveTextToFr(rawComment)
      const assistName = type === 'But' ? parseGoalAssistFromText(rawComment) ?? undefined : undefined
      out.push({
        id: `sm-comment-${c.id ?? order}-${order}`,
        matchId,
        minute,
        order,
        type,
        title: scorerName ?? cardPlayer ?? '',
        detail,
        ...(scorerName ? { scorerName } : {}),
        ...(cardPlayer ? { scorerName: cardPlayer } : {}),
        ...(assistName ? { assistName } : {}),
      })
    }
  }

  if (!out.length) return []

  const eventGoalKeys = new Set(
    out
      .filter((h) => h.type === 'But' && h.id.startsWith('sm-event-'))
      .map((h) => goalSemanticKey(h))
      .filter((k): k is string => Boolean(k)),
  )

  const eventCardKeys = new Set(
    out
      .filter((h) => h.type === 'Carton' && h.id.startsWith('sm-event-'))
      .map((h) => cardCoarseDedupeKey(h))
      .filter((k): k is string => Boolean(k)),
  )

  const withoutDupComments = out.filter((h) => {
    if (h.type === 'But' && h.id.startsWith('sm-comment-')) {
      const key = goalSemanticKey(h)
      if (key && eventGoalKeys.has(key)) return false
    }
    if (h.type === 'Carton' && h.id.startsWith('sm-comment-')) {
      const coarse = cardCoarseDedupeKey(h)
      if (coarse && eventCardKeys.has(coarse)) return false
      const name = h.scorerName?.trim() ?? ''
      if (!name || !isPlausibleCardPlayerName(name) || isLikelyGeographicFragment(name)) return false
    }
    return true
  })

  const byKey = new Map<string, Highlight>()
  for (const h of withoutDupComments) {
    const k = highlightDedupeKey(h)
    const prev = byKey.get(k)
    if (!prev) {
      byKey.set(k, h)
      continue
    }
    if (h.type === 'But' && prev.type === 'But') {
      byKey.set(k, mergeGoalHighlights(prev, h))
      continue
    }
    if (h.type === 'Carton' && prev.type === 'Carton') {
      const merged = mergeCardHighlights(prev, h)
      byKey.set(cardCoarseDedupeKey(merged) ?? k, merged)
      continue
    }
    const prevIsEvent = prev.id.startsWith('sm-event-')
    const nextIsEvent = h.id.startsWith('sm-event-')
    if (!prevIsEvent && nextIsEvent) byKey.set(k, h)
    else if (prevIsEvent && nextIsEvent && h.scorerName && !prev.scorerName) byKey.set(k, h)
    else if (cardHighlightQuality(h) > cardHighlightQuality(prev)) byKey.set(k, h)
  }

  const mergedCardsByCoarse = new Map<string, Highlight>()
  const nonCardMerged: Highlight[] = []
  for (const h of byKey.values()) {
    if (h.type !== 'Carton') {
      nonCardMerged.push(h)
      continue
    }
    const coarse = cardCoarseDedupeKey(h)
    if (!coarse) {
      nonCardMerged.push(h)
      continue
    }
    const prev = mergedCardsByCoarse.get(coarse)
    if (!prev) {
      mergedCardsByCoarse.set(coarse, h)
      continue
    }
    mergedCardsByCoarse.set(
      coarse,
      cardHighlightQuality(h) > cardHighlightQuality(prev) ? h : prev,
    )
  }

  const merged = [...nonCardMerged, ...mergedCardsByCoarse.values()].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute
    return (a.order ?? 0) - (b.order ?? 0)
  })
  return merged.length > MAX_ROWS ? merged.slice(-MAX_ROWS) : merged
}

/** Buteurs + minute directement depuis les événements SM (repli si la timeline commentaires ne suffit pas). */
export function extractLiveGoalDisplayRowsFromSmFixture(
  fixture: SmFixture | null | undefined,
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
  scoreHint?: { home: number; away: number },
): LiveGoalDisplayRow[] {
  if (!fixture) return []
  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  const rows: Highlight[] = []
  for (const ev of fixture.events ?? []) {
    const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
    if (!eventDevLooksLikeGoal(dev.toUpperCase())) continue
    const minute = displayMinute(ev)
    const side = sideFromParticipant(ev.participant_id, homeId, awayId)
    const scorerName = scorerFromEvent(ev)
    if (!scorerName) continue
    if (isMatchTeamLabel(scorerName, home, away)) continue
    rows.push({
      id: `sm-event-goal-${ev.id ?? minute}`,
      matchId: 'direct',
      minute,
      type: 'But',
      title: scorerName,
      detail: `${minute}' · ${scorerName}`,
      ...(side ? { side } : {}),
      scorerName,
    })
  }
  const fromEvents = parseLiveGoalRowsFromHighlights(rows, home, away, scoreHint)
  if (fromEvents.length > 0) return fromEvents
  const timeline = extractTimelineHighlightsFromSmFixture(fixture, 'direct')
  return parseLiveGoalRowsFromHighlights(
    timeline.filter((h) => h.type === 'But'),
    home,
    away,
    scoreHint,
  )
}

/** Cartons + minute sous le score (style Flashscore). */
export function extractLiveCardDisplayRowsFromSmFixture(
  fixture: SmFixture | null | undefined,
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): LiveCardDisplayRow[] {
  if (!fixture) return []
  const { homeId, awayId } = smFixtureHomeAwayParticipantIds(fixture)
  const rows: Highlight[] = []
  for (const ev of fixture.events ?? []) {
    const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').trim()
    const u = dev.toUpperCase()
    if (!eventDevLooksLikeCard(u)) continue
    const minute = displayMinute(ev)
    const side = sideFromParticipant(ev.participant_id, homeId, awayId)
    const playerName = cardPlayerFromEvent(ev, dev)
    if (!playerName || isMatchTeamLabel(playerName, home, away)) continue
    const color = cardColorFromEventDev(dev)
    rows.push({
      id: `sm-event-card-${ev.id ?? minute}-${color}`,
      matchId: 'direct',
      minute,
      type: 'Carton',
      title: playerName,
      detail: `${minute}' · ${color === 'red' ? 'Carton rouge' : 'Carton jaune'} · ${playerName}`,
      ...(side ? { side } : {}),
      scorerName: playerName,
    })
  }
  const fromEvents = parseLiveCardRowsFromHighlights(rows, home, away)
  if (fromEvents.length > 0) return fromEvents
  const timeline = extractTimelineHighlightsFromSmFixture(fixture, 'direct')
  return parseLiveCardRowsFromHighlights(
    timeline.filter((h) => h.type === 'Carton'),
    home,
    away,
  )
}
