import type { Match } from '../types/match'
import type { LiveEncartSimulation } from '../types/liveSimulation'
import { createMatchRng } from '../types/liveSimulation'

function hubFansK(m: Match) {
  return 8 + (m.home.shortName.length + m.away.shortName.length) * 0.42
}

export type LiveSalonTier = 'calm' | 'warm' | 'hot' | 'fire'

export type LiveSalonPresenceSnapshot = {
  intensity: number
  tier: LiveSalonTier
  tierLabel: string
  viewers: number
  messages: number
}

/** Modèle démo : cohérent par match, évolution liée au temps de jeu, aux buts et à la simulation. */
export function getLiveSalonPresenceSnapshot(
  match: Match,
  sim: LiveEncartSimulation,
  tick: number,
): LiveSalonPresenceSnapshot {
  const t = tick * 0.35
  const rng = createMatchRng(`${match.id}:${Math.floor(tick / 6)}`)
  const goals = sim.score.home + sim.score.away
  const closeGame = Math.abs(sim.score.home - sim.score.away) <= 1 ? 1 : 0

  let intensity =
    30 +
    (sim.minute / 90) * 28 +
    goals * 6 +
    closeGame * 5 +
    (sim.burst?.kind === 'goal' ? 22 : 0) +
    (sim.burst?.kind === 'var' ? 8 : 0) +
    (sim.toast?.kind === 'chance' ? 6 : 0) +
    Math.sin(t) * 7 +
    (rng() - 0.5) * 9

  intensity = Math.round(Math.min(100, Math.max(14, intensity)))

  const fans = hubFansK(match)
  const baseViewers = Math.round(fans * 1000 + rng() * 420)
  const viewers = Math.max(
    120,
    baseViewers + Math.round(Math.sin(t * 1.2) * 48) + (sim.burst?.kind === 'goal' ? 210 : 0),
  )

  const baseMsgs = 380 + match.id.length * 17 + goals * 120
  const messages = Math.max(200, Math.round(baseMsgs + sim.minute * 22 + tick * 2.8 + rng() * 60))

  let tier: LiveSalonTier
  let tierLabel: string
  if (intensity >= 82) {
    tier = 'fire'
    tierLabel = 'Électrique'
  } else if (intensity >= 62) {
    tier = 'hot'
    tierLabel = 'Tribune en feu'
  } else if (intensity >= 42) {
    tier = 'warm'
    tierLabel = 'Ambiance montée'
  } else {
    tier = 'calm'
    tierLabel = 'Ça chauffe'
  }

  return { intensity, tier, tierLabel, viewers, messages }
}

export function liveSalonActiveSeeds(matchId: string): { seed: string; accent: 'rose' | 'violet' | 'emerald' }[] {
  const rng = createMatchRng(`${matchId}:actifs`)
  const accents: Array<'rose' | 'violet' | 'emerald'> = ['rose', 'violet', 'emerald']
  const initials = ['K', 'M', 'L', 'R', 'T', 'P', 'V', 'N']
  const start = Math.floor(rng() * initials.length)
  return [0, 1, 2].map((i) => ({
    seed: initials[(start + i * 3) % initials.length]!,
    accent: accents[i]!,
  }))
}
