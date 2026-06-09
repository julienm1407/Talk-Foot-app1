/** Montants XP par type d’action. */
export const XP_REWARDS = {
  betPlaced: 5,
  betWon: 35,
  chatMessage: 4,
  liveTick: 2,
  debateCreated: 25,
  dailyBonus: 15,
} as const

/** Plafonds anti-farm (XP max par fenêtre). */
export const XP_CAPS = {
  chatPerDay: 80,
  livePerHour: 48,
} as const

export type XpSource = keyof typeof XP_REWARDS
