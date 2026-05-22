import type { Debate } from '../data/debates'

/** Top N affichés avec badge « trending » (aucun seuil de messages). */
export const DEBATE_TRENDING_BADGE_TOP = 3

/**
 * Classement : activité 24h → messages totaux → participants → date de création.
 * Même à 0 interaction, les débats récents remontent (pas de minimum requis).
 */
export function rankDebatesByActivity(a: Debate, b: Debate): number {
  const a24 = a.messages24h ?? 0
  const b24 = b.messages24h ?? 0
  if (b24 !== a24) return b24 - a24
  if (b.messagesCount !== a.messagesCount) return b.messagesCount - a.messagesCount
  if (b.participantsCount !== a.participantsCount) return b.participantsCount - a.participantsCount

  const aT = a.createdAt ? Date.parse(a.createdAt) : 0
  const bT = b.createdAt ? Date.parse(b.createdAt) : 0
  if (bT !== aT) return bT - aT

  return a.title.localeCompare(b.title, 'fr')
}

/** Trie et attribue rang + badge trending aux premiers (sans seuil d’activité). */
export function applyDebateLeaderboardRanks(debates: Debate[]): Debate[] {
  const sorted = [...debates].sort(rankDebatesByActivity)
  return sorted.map((d, index) => {
    const rank = index + 1
    return {
      ...d,
      leaderboardRank: rank,
      trending: rank <= DEBATE_TRENDING_BADGE_TOP,
    }
  })
}
