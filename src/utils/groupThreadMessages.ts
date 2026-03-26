import type { Debate } from '../data/debates'
import type { Message } from '../types/chat'
import type { User } from '../types/chat'

const ACCENTS: User['accent'][] = ['violet', 'emerald', 'rose', 'amber']

export function groupThreadMatchId(groupId: string, channelId: string) {
  return `group:${groupId}:${channelId}`
}

/** Utilisateurs fictifs pour les messages issus de l’aperçu débat (mode Virage). */
export function debatePreviewUsersById(debate: Debate): Record<string, User> {
  const out: Record<string, User> = {}
  debate.previewMessages.forEach((pm, i) => {
    const id = `debate-user-${debate.id}-${i}`
    out[id] = {
      id,
      username: pm.username,
      avatarSeed: pm.username.replace(/\s/g, '').slice(0, 8) || `u${i}`,
      accent: ACCENTS[i % ACCENTS.length],
      fanClubId: pm.fanClubId,
    }
  })
  return out
}

export function buildGroupThreadSeed(
  groupId: string,
  channelId: string,
  channelName: string,
  debate: Debate | null,
): Message[] {
  const matchId = groupThreadMatchId(groupId, channelId)
  const now = Date.now()
  const out: Message[] = []

  if (channelId === 'general') {
    out.push({
      id: `seed-welcome-${groupId}`,
      matchId,
      userId: 'u-1',
      text: `Bienvenue dans « ${channelName} » — réagis au débat du moment ou lance un sujet.`,
      createdAt: now - 180_000,
    })
  } else {
    out.push({
      id: `seed-ch-${groupId}-${channelId}`,
      matchId,
      userId: 'u-3',
      text: `Fil « ${channelName} » : mercato, compos, vannes…`,
      createdAt: now - 90_000,
    })
  }

  if (debate && channelId === 'general') {
    debate.previewMessages.forEach((pm, i) => {
      out.push({
        id: `seed-debate-${debate.id}-${i}`,
        matchId,
        userId: `debate-user-${debate.id}-${i}`,
        text: pm.text,
        createdAt: now - 150_000 + i * 8000,
      })
    })
  }

  return out
}
