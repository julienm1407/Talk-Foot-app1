import type { SmFixture, SmParticipant } from './types'

/** Résout les `participant_id` SportMonks domicile / extérieur pour une fixture. */
export function smFixtureHomeAwayParticipantIds(
  fixture: Pick<SmFixture, 'participants'>,
): { homeId: number | undefined; awayId: number | undefined } {
  const parts = fixture.participants
  let homeId: number | undefined
  let awayId: number | undefined
  if (!Array.isArray(parts)) return { homeId, awayId }

  for (const p of parts) {
    const loc = String(p.meta?.location ?? '').toLowerCase()
    if (loc === 'home' && typeof p.id === 'number') homeId = p.id
    if (loc === 'away' && typeof p.id === 'number') awayId = p.id
  }
  if (homeId == null && awayId == null && parts.length >= 2) {
    const a = typeof parts[0]?.id === 'number' ? parts[0].id : undefined
    const b = typeof parts[1]?.id === 'number' ? parts[1].id : undefined
    return { homeId: a, awayId: b }
  }
  const numericIds = parts
    .map((p: SmParticipant) => p.id)
    .filter((id): id is number => typeof id === 'number')
  if (homeId != null && awayId == null) {
    const o = numericIds.find((id) => id !== homeId)
    if (o != null) return { homeId, awayId: o }
  }
  if (awayId != null && homeId == null) {
    const o = numericIds.find((id) => id !== awayId)
    if (o != null) return { homeId: o, awayId }
  }
  return { homeId, awayId }
}
