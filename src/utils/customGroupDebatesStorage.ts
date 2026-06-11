import type { Debate } from '../data/debates'

export const CUSTOM_GROUP_DEBATES_KEY = 'talkfoot.groupCustomDebates.v1'

export type CustomDebatesBucket = Record<string, Debate[]>

export function removeCustomDebatesForGroup(groupId: string): void {
  try {
    const bucket = readCustomDebatesBucket()
    if (!bucket[groupId]) return
    delete bucket[groupId]
    localStorage.setItem(CUSTOM_GROUP_DEBATES_KEY, JSON.stringify(bucket))
  } catch {
    /* quota / private mode */
  }
}

export function removeCustomDebateById(debateId: string): void {
  const id = debateId.trim()
  if (!id) return
  try {
    const bucket = readCustomDebatesBucket()
    let changed = false
    for (const [groupId, list] of Object.entries(bucket)) {
      const next = list.filter((d) => d.id !== id)
      if (next.length !== list.length) {
        if (next.length) bucket[groupId] = next
        else delete bucket[groupId]
        changed = true
      }
    }
    if (changed) localStorage.setItem(CUSTOM_GROUP_DEBATES_KEY, JSON.stringify(bucket))
  } catch {
    /* quota / private mode */
  }
}

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
  input: { title: string; excerpt: string; accent: string },
  username: string,
  fanClubId: string,
  linkedGroupId?: string | null,
): Debate {
  const ts = Date.now()
  const now = new Date(ts).toISOString()
  return {
    id: `d-c-${ts}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    title: input.title.trim().slice(0, 120),
    excerpt: input.excerpt.trim().slice(0, 280) || 'Débat ouvert — donne ton avis.',
    groupId: linkedGroupId?.trim() || null,
    accent: input.accent.trim().slice(0, 20) || '#6366f1',
    salonAccess: 'public',
    messagesCount: 1,
    participantsCount: 1,
    previewMessages: [
      {
        username: username.slice(0, 32) || 'Toi',
        fanClubId,
        text:
          input.excerpt.trim().slice(0, 220) ||
          'Le sujet est ouvert — donne ton avis dans le fil de la tribune.',
      },
    ],
  }
}
