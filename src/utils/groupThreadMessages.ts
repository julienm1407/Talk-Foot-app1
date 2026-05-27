import type { Debate } from '../data/debates'
import type { Message } from '../types/chat'
import type { User } from '../types/chat'

const ACCENTS: User['accent'][] = ['violet', 'emerald', 'rose', 'amber']

export type GroupSalonBotSource = {
  id: string
  name: string
  emoji: string
}

export function groupSalonBotUserId(groupId: string) {
  return `group-bot:${groupId}`
}

/** Bot de bienvenue propre au groupe (pas de faux supporter PSG/OM dans une tribune Bayern, etc.). */
export function buildGroupSalonBotUser(group: GroupSalonBotSource): User {
  return {
    id: groupSalonBotUserId(group.id),
    username: `${group.emoji} ${group.name}`,
    avatarSeed: `salon-bot-${group.id}`,
    accent: 'amber',
    isGroupSalonBot: true,
    tagline: 'Assistant de la tribune',
  }
}

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
  group: GroupSalonBotSource,
  channelId: string,
  channelName: string,
  debate: Debate | null,
): Message[] {
  const matchId = groupThreadMatchId(group.id, channelId)
  const botId = groupSalonBotUserId(group.id)
  const now = Date.now()
  const out: Message[] = []

  if (channelId === 'general') {
    out.push({
      id: `seed-welcome-${group.id}`,
      matchId,
      userId: botId,
      text: `Bienvenue sur ${group.name} ! Tu es dans « ${channelName} » — présente-toi, réagis au débat du moment ou lance un sujet.`,
      createdAt: now - 180_000,
    })
  } else {
    out.push({
      id: `seed-ch-${group.id}-${channelId}`,
      matchId,
      userId: botId,
      text: `Bienvenue dans « ${channelName} » sur ${group.name}. Mercato, compos, ambiance…`,
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
