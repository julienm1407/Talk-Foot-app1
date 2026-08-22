export type LiveSalonTier = 'calm' | 'warm' | 'hot' | 'fire'

export type LiveSalonPresenceSnapshot = {
  intensity: number
  tier: LiveSalonTier
  tierLabel: string
  viewers: number
  messages: number
}

/** Intensité tribune dérivée des messages réels (0 si tribune vide). */
export function getLiveSalonPresenceFromStats(
  messagesCount: number,
  participantsCount: number,
): LiveSalonPresenceSnapshot {
  const messages = Math.max(0, messagesCount)
  const viewers = Math.max(0, participantsCount)

  if (messages === 0) {
    return {
      intensity: 0,
      tier: 'calm',
      tierLabel: 'Tribune calme',
      viewers,
      messages: 0,
    }
  }

  const msgBoost = Math.log10(messages + 1) * 32
  const participantBoost = Math.min(viewers, 12) * 3.5
  const intensity = Math.round(Math.min(100, Math.max(6, 10 + msgBoost + participantBoost)))

  let tier: LiveSalonTier
  let tierLabel: string
  if (intensity >= 82) {
    tier = 'fire'
    tierLabel = 'Électrique'
  } else if (intensity >= 58) {
    tier = 'hot'
    tierLabel = 'Tribune en feu'
  } else if (intensity >= 32) {
    tier = 'warm'
    tierLabel = 'Ambiance montée'
  } else {
    tier = 'calm'
    tierLabel = 'Ça démarre'
  }

  return { intensity, tier, tierLabel, viewers, messages }
}
