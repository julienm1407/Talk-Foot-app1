import type { Match } from '../types/match'

const MIN_DELAY_MS = 2_000
/** Regroupe les déclenchements proches (plusieurs matchs au même créneau) en un seul appel API. */
const MERGE_GAP_MS = 30_000
const MAX_TIMERS = 120
/** Ne pas planifier au-delà (évite des centaines de timers). */
const MAX_HORIZON_MS = 72 * 3600 * 1000

/**
 * Instants absolus (ms epoch) pour rafraîchir le calendrier autour des coups d’envoi **à venir**.
 * `kickoffAt` est déjà l’instant réel du match (SM en UTC) — cohérent avec l’affichage Europe/Paris.
 *
 * Pour chaque match : **T − 1 min** (pré-live / chat), **T** (coup d’envoi), **T + 2 min** (prise en compte live SM).
 */
export function computeKickoffRefreshFireTimes(
  matches: readonly Match[],
  nowMs: number = Date.now(),
): number[] {
  const horizon = nowMs + MAX_HORIZON_MS
  const raw: number[] = []
  for (const m of matches) {
    if (m.status !== 'upcoming') continue
    const ko = new Date(m.kickoffAt).getTime()
    if (!Number.isFinite(ko) || ko < nowMs - 3_600_000 || ko > horizon) continue
    raw.push(ko - 60_000, ko, ko + 120_000)
  }
  raw.sort((a, b) => a - b)
  const out: number[] = []
  for (const t of raw) {
    if (t < nowMs + MIN_DELAY_MS) continue
    if (out.length && t - out[out.length - 1] < MERGE_GAP_MS) continue
    out.push(t)
    if (out.length >= MAX_TIMERS) break
  }
  return out
}
