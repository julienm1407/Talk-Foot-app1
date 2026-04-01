import type { Debate } from '../data/debates'

export const CUSTOM_GROUP_DEBATES_KEY = 'talkfoot.groupCustomDebates.v1'

export type CustomDebatesBucket = Record<string, Debate[]>

export function readCustomDebatesBucket(): CustomDebatesBucket {
  try {
    const raw = localStorage.getItem(CUSTOM_GROUP_DEBATES_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as CustomDebatesBucket
  } catch {
    return {}
  }
}

export function findCustomDebateById(id: string): Debate | undefined {
  const bucket = readCustomDebatesBucket()
  for (const list of Object.values(bucket)) {
    const d = list.find((x) => x.id === id)
    if (d) return d
  }
  return undefined
}

export function createCustomGroupDebateRecord(
  groupId: string,
  input: { title: string; excerpt: string; accent: string },
  username: string,
  fanClubId: string,
): Debate {
  return {
    id: `d-c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: input.title.trim().slice(0, 120),
    excerpt: input.excerpt.trim().slice(0, 280) || 'Débat lancé dans le salon.',
    groupId,
    accent: input.accent.trim().slice(0, 20) || '#6366f1',
    salonAccess: 'members',
    messagesCount: 1,
    participantsCount: 1,
    previewMessages: [
      {
        username: username.slice(0, 32) || 'Toi',
        fanClubId,
        text:
          input.excerpt.trim().slice(0, 220) ||
          'Le sujet est ouvert — donne ton avis dans le fil du salon.',
      },
    ],
  }
}
