/** SportMonks football event type_id (core types). */
const GOAL_TYPE_IDS = new Set([14, 15, 16])
const CARD_TYPE_IDS = new Set([19, 20, 21])

export type LiveMatchAlert = {
  kind: string
  body: string
}

export function sportMonksFixtureIdFromMatch(match: {
  id: string
  sportMonksFixtureId?: number
}): number | null {
  if (typeof match.sportMonksFixtureId === 'number' && match.sportMonksFixtureId > 0) {
    return match.sportMonksFixtureId
  }
  const m = /^m-sm-(\d+)$/.exec(match.id)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

function listEvents(fx: { events?: unknown }): unknown[] {
  const e = fx.events as { data?: unknown[] } | unknown[] | undefined
  if (Array.isArray(e)) return e
  if (e && typeof e === 'object' && Array.isArray((e as { data?: unknown[] }).data)) {
    return (e as { data: unknown[] }).data
  }
  return []
}

function eventPlayerName(ev: Record<string, unknown>): string {
  const p = ev.player
  const row = Array.isArray(p)
    ? p[0]
    : p && typeof p === 'object' && p !== null && 'data' in p && !Array.isArray((p as { data: unknown }).data)
      ? (p as { data: Record<string, unknown> }).data
      : p
  const obj = row && typeof row === 'object' ? (row as Record<string, unknown>) : null
  return String(obj?.display_name ?? obj?.name ?? ev.player_name ?? '').trim()
}

function typeIdOf(ev: Record<string, unknown>): number {
  const nested = ev.type && typeof ev.type === 'object' ? (ev.type as { id?: unknown }).id : undefined
  const n = Number(ev.type_id ?? nested)
  return Number.isFinite(n) ? n : 0
}

export function classifyLiveMatchEvent(ev: unknown): LiveMatchAlert | null {
  if (!ev || typeof ev !== 'object') return null
  const row = ev as Record<string, unknown>
  const type = row.type && typeof row.type === 'object' ? (row.type as Record<string, unknown>) : {}
  const typeName = typeof row.type === 'string' ? row.type : ''
  const dev = String(type.developer_name ?? type.name ?? typeName ?? row.info ?? '').toUpperCase()
  const typeId = typeIdOf(row)

  if (dev.includes('SUBSTITUTION') || dev.includes('SUBS')) return null
  if (dev.includes('GOALKICK') || dev.includes('GOAL KICK') || dev.includes('GOALKEEPER')) return null
  if (
    dev.includes('DISALLOWED') ||
    dev.includes('CANCELLED') ||
    dev.includes('CANCELED') ||
    dev.includes('NO GOAL')
  ) {
    return null
  }

  const own = /OWN.?GOAL/.test(dev) || /OWNGOAL/.test(dev) || typeId === 15
  const isGoal =
    own ||
    GOAL_TYPE_IDS.has(typeId) ||
    ((/\bGOAL\b/.test(dev) || /\bGOL\b/.test(dev)) && !dev.includes('CARD') && !dev.includes('KICK'))
  const isCard =
    CARD_TYPE_IDS.has(typeId) ||
    /YELLOW/.test(dev) ||
    /REDCARD/.test(dev) ||
    /RED_CARD/.test(dev) ||
    (dev.includes('RED') && dev.includes('CARD'))
  if (!isGoal && !isCard) return null

  const player = eventPlayerName(row)
  const minute = typeof row.minute === 'number' ? row.minute : 0
  const extra = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  const minLabel = extra > 0 ? `${minute}+${extra}` : String(minute || '')
  const eventId =
    typeof row.id === 'number' && row.id > 0 ? String(row.id) : `${dev || typeId}:${minute}:${player}`

  if (isGoal) {
    return {
      kind: `g:${eventId}`.slice(0, 80),
      body: own
        ? `${minLabel ? `${minLabel}’ · ` : ''}CSC${player ? ` — ${player}` : ''}`
        : `${minLabel ? `${minLabel}’ · ` : ''}BUT${player ? ` — ${player}` : ''}`,
    }
  }
  const red = typeId === 20 || typeId === 21 || (/RED/.test(dev) && !/YELLOW/.test(dev))
  const second = typeId === 21 || /SECOND/.test(dev)
  return {
    kind: `c:${eventId}`.slice(0, 80),
    body: `${minLabel ? `${minLabel}’ · ` : ''}${second || red ? 'Carton rouge' : 'Carton jaune'}${
      player ? ` — ${player}` : ''
    }`,
  }
}

export function liveAlertsFromFixture(fx: { events?: unknown } | null | undefined): LiveMatchAlert[] {
  if (!fx) return []
  const out: LiveMatchAlert[] = []
  const seen = new Set<string>()
  for (const ev of listEvents(fx)) {
    const classified = classifyLiveMatchEvent(ev)
    if (!classified || seen.has(classified.kind)) continue
    seen.add(classified.kind)
    out.push(classified)
  }
  return out
}
