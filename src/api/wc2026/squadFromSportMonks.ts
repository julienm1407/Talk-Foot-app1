import { findNationByName } from '../../data/nations'
import type { WcPlayer, WcPosition, WcSquad } from '../../types/wc2026'
import { extractSquadPlayersFromSmEnvelope } from '../sportMonks/extractTeamSquadFromSm'

function smStandingsListFromEnvelope(body: unknown): unknown[] {
  const raw = body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : body
  return Array.isArray(raw) ? raw : []
}

function parseNum(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const n = Number(String(raw).trim())
  return Number.isFinite(n) ? n : null
}

/** IDs équipe SM (sélection) par ISO — depuis `standings/seasons` + `participant`. */
export function extractNationSmTeamIdsFromStandingsEnvelope(body: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  for (const raw of smStandingsListFromEnvelope(body)) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const part = row.participant
    const pname =
      part && typeof part === 'object'
        ? String((part as Record<string, unknown>).name ?? '').trim()
        : ''
    const nation = findNationByName(pname)
    if (!nation) continue
    const pidFromRow = parseNum(row.participant_id)
    const pidFromPart =
      part && typeof part === 'object' ? parseNum((part as Record<string, unknown>).id) : null
    const pid = pidFromRow ?? pidFromPart
    if (pid != null && pid > 0) out[nation.iso] = Math.floor(pid)
  }
  return out
}

function smPositionToWc(position?: string): WcPosition {
  const blob = (position ?? '').toUpperCase()
  if (blob.includes('GOAL')) return 'GK'
  if (blob.includes('DEFEND')) return 'DF'
  if (blob.includes('MID')) return 'MF'
  return 'FW'
}

function playerDisplayName(p: Record<string, unknown>): string {
  const dn = String(p.display_name ?? '').trim()
  if (dn) return dn
  const n = String(p.name ?? '').trim()
  if (n) return n
  const fn = String(p.firstname ?? '').trim()
  const ln = String(p.lastname ?? '').trim()
  return `${fn} ${ln}`.trim() || '—'
}

function positionLabelFromPlayer(p: Record<string, unknown>): string | undefined {
  const pos = p.position
  if (!pos || typeof pos !== 'object') return undefined
  const o = pos as { name?: string; developer_name?: string }
  return String(o.developer_name ?? o.name ?? '').trim() || undefined
}

/** Transforme `GET /squads/teams/{id}` en effectif CDM. */
export function wcSquadFromSportMonksEnvelope(
  envelope: { data?: unknown },
  nationIso: string,
): WcSquad {
  const data = envelope.data
  if (!Array.isArray(data)) {
    return { nationIso, players: [] }
  }

  const players: WcPlayer[] = []
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const player = row.player
    if (!player || typeof player !== 'object') continue
    const p = player as Record<string, unknown>
    const id = p.id
    if (typeof id !== 'number' || !Number.isFinite(id)) continue
    const name = playerDisplayName(p)
    if (!name || name === '—') continue

    const smRows = extractSquadPlayersFromSmEnvelope({ data: [raw] })
    const numberRaw = smRows[0]?.number
    const shirtNumber =
      numberRaw != null && numberRaw !== '?'
        ? parseInt(String(numberRaw), 10)
        : undefined

    const dob = String(p.date_of_birth ?? '').trim()
    players.push({
      id: `wc-sm-${id}`,
      name,
      nationIso,
      position: smPositionToWc(positionLabelFromPlayer(p)),
      ...(Number.isFinite(shirtNumber) ? { shirtNumber } : {}),
      ...(dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) ? { dateOfBirth: dob } : {}),
      ...(row.captain === true ? { captain: true } : {}),
    })
  }

  players.sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99))

  return { nationIso, players }
}
