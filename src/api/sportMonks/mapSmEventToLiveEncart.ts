import type { Match } from '../../types/match'
import type { LiveEncartBurst, LiveEncartToast } from '../../types/liveSimulation'
import type { SmFixtureEventRow } from './types'

export type LiveEncartToastPayload = Omit<NonNullable<LiveEncartToast>, 'id'>

export type SmLiveEncartPulse = {
  burst?: LiveEncartBurst | null
  toast?: LiveEncartToastPayload
  rim?: { tone: 'yellow' | 'red' | 'goal' | 'var'; ms: number }
  bumpSide?: 'home' | 'away'
  /** Toast affiché après la disparition du burst VAR (ms). */
  varFollowUp?: { toast: LiveEncartToastPayload; afterMs: number }
}

function displayMinute(row: { minute?: number | null; extra_minute?: number | null }): number {
  const m = typeof row.minute === 'number' ? row.minute : 0
  const x = typeof row.extra_minute === 'number' ? row.extra_minute : 0
  if (m <= 0 && x <= 0) return 0
  return m + x
}

function smEventPlayerId(ev: SmFixtureEventRow): number | '' {
  const nested = ev.player as { id?: number } | undefined
  if (typeof nested?.id === 'number') return nested.id
  const top = (ev as { player_id?: number | null }).player_id
  return typeof top === 'number' ? top : ''
}

export function smEventDedupeKey(ev: SmFixtureEventRow): string {
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
  if (dev.includes('YELLOW') || (dev.includes('RED') && dev.includes('CARD'))) {
    const minute = displayMinute(ev)
    const second = dev.includes('SECOND')
    const color = second || (dev.includes('RED') && !dev.includes('YELLOW')) ? 'red' : 'yellow'
    const playerId = smEventPlayerId(ev)
    return `card:${minute}:${ev.participant_id ?? 0}:${color}:${playerId}`
  }
  if (typeof ev.id === 'number' && ev.id > 0) return `id:${ev.id}`
  return `f:${displayMinute(ev)}:${ev.participant_id ?? 0}:${dev}`
}

function sideFromParticipant(ev: SmFixtureEventRow, match: Match): 'home' | 'away' | null {
  const pid = ev.participant_id
  if (typeof pid !== 'number') return null
  if (match.home.sportMonksTeamId === pid) return 'home'
  if (match.away.sportMonksTeamId === pid) return 'away'
  return null
}

function playerLabel(ev: SmFixtureEventRow): string {
  return String(ev.player?.display_name ?? ev.player?.name ?? '').trim()
}

/**
 * Traduit un événement structuré SportMonks en impulsions d’encart (but, carton, VAR…).
 * Retourne `null` si l’événement ne doit pas déclencher d’animation.
 */
export function encartPulseFromSmEvent(ev: SmFixtureEventRow, match: Match): SmLiveEncartPulse | null {
  const dev = String(ev.type?.developer_name ?? ev.type?.name ?? '').toUpperCase()
  if (!dev) return null

  if (dev.includes('SUBSTITUTION') || dev.includes('SUBS')) return null
  if (
    (dev.includes('CORNER') ||
      dev.includes('THROW') ||
      (dev.includes('OFFSIDE') && !dev.includes('VAR'))) &&
    !dev.includes('GOAL')
  ) {
    return null
  }

  const side = sideFromParticipant(ev, match)
  const teamShort =
    side === 'home' ? match.home.shortName : side === 'away' ? match.away.shortName : undefined
  const pn = playerLabel(ev)

  if (dev.includes('VAR')) {
    const line =
      (pn ? `${dev} · ${pn}` : String(ev.type?.name ?? '').trim()) || 'VAR — situation analysée'
    const shortLine = line.length > 96 ? `${line.slice(0, 93)}…` : line
    return {
      rim: { tone: 'var', ms: 1200 },
      burst: { kind: 'var', line: shortLine },
      varFollowUp: {
        afterMs: 2200,
        toast: { kind: 'var_line', text: 'Décision VAR enregistrée', side: side ?? undefined },
      },
    }
  }

  if (dev.includes('YELLOW')) {
    const second = dev.includes('SECOND')
    return {
      rim: { tone: second ? 'red' : 'yellow', ms: second ? 800 : 650 },
      toast: {
        kind: second ? 'red' : 'yellow',
        text: `${second ? 'Carton rouge (2e jaune)' : 'Carton jaune'}${teamShort ? ` — ${teamShort}` : ''}${pn ? ` · ${pn}` : ''}`,
        side: side ?? undefined,
      },
    }
  }

  if (dev.includes('RED') && !dev.includes('YELLOW')) {
    return {
      rim: { tone: 'red', ms: 800 },
      toast: {
        kind: 'red',
        text: `Carton rouge${teamShort ? ` — ${teamShort}` : ''}${pn ? ` · ${pn}` : ''}`,
        side: side ?? undefined,
      },
    }
  }

  const disallowed =
    dev.includes('DISALLOWED') || dev.includes('CANCELLED') || dev.includes('NO GOAL')
  if (disallowed) {
    return {
      rim: { tone: 'var', ms: 1000 },
      toast: {
        kind: 'var_line',
        text: pn ? `But annulé — ${pn}` : 'But annulé après revue',
        side: side ?? undefined,
      },
    }
  }

  const penaltyMissed = dev.includes('PENALTY') && (dev.includes('MISSED') || dev.includes('SAVED'))
  if (penaltyMissed) return null

  const isGoalish =
    (dev.includes('GOAL') && !dev.includes('DISALLOW')) ||
    dev.includes('OWNGOAL') ||
    dev.includes('OWN-GOAL') ||
    /\bGOL\b/.test(dev) ||
    (dev.includes('PENALTY') && dev.includes('SCORED')) ||
    (dev.includes('PENALTY') && dev.includes('GOAL') && !dev.includes('MISSED') && !dev.includes('SAVED'))

  if (isGoalish) {
    const s = side ?? 'home'
    const teamName = s === 'home' ? match.home.shortName : match.away.shortName
    return {
      bumpSide: s,
      rim: { tone: 'goal', ms: 900 },
      burst: { kind: 'goal', side: s, teamName },
    }
  }

  return null
}
