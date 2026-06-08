import type { Debate } from '../data/debates'
import { toParisDayKey } from './dailyTokenBonus'

/** Hash déterministe (FNV-1a) — même entrée → même index pour la journée. */
function dailySeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Débat mis en avant — rotation parmi le classement activité, renouvelé chaque jour (Paris). */
export function pickDailyDebateOfTheDay(
  ranked: Debate[],
  dayKey = toParisDayKey(),
): Debate | null {
  if (!ranked.length) return null
  const idx = dailySeed(`debate-day:${dayKey}`) % ranked.length
  return ranked[idx] ?? null
}

/** Top débats affichés sur l’accueil — fenêtre glissante décalée chaque jour. */
export function pickDailyTrendingDebates(
  ranked: Debate[],
  debateOfTheDay: Debate | null,
  topN: number,
  dayKey = toParisDayKey(),
): Debate[] {
  const pool = debateOfTheDay ? ranked.filter((d) => d.id !== debateOfTheDay.id) : [...ranked]
  if (!pool.length) return []
  const start = dailySeed(`debate-trend:${dayKey}`) % pool.length
  const limit = Math.min(topN, pool.length)
  const out: Debate[] = []
  for (let i = 0; i < limit; i++) {
    out.push(pool[(start + i) % pool.length]!)
  }
  return out
}
