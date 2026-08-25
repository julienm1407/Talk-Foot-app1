import type { User } from '../types/chat'

/**
 * Assistant intégré : premier contact de tout le monde (MP + présence live).
 * Pas de fausses demandes d’amis — uniquement ce bot pour montrer les MP.
 */
export const talkFootBotUser: User = {
  id: 'u-tf-bot',
  username: 'Coach Talk Foot',
  avatarSeed: 'talkfoot-coach',
  accent: 'violet',
  isMockFriend: true,
  isTalkFootBot: true,
  characterLook: {
    hairStyle: 'short',
    faceExpression: 'happy',
    glasses: 'round',
    headwear: 'cap',
  },
}

/** Liste « amis » côté UI live / partage (UUID = MP cloud p2p possible avec Supabase). */
export const mockFriendUsers: User[] = [
  talkFootBotUser,
  {
    id: 'a1000000-0001-4000-8000-000000000001',
    username: 'Léo_Sud',
    avatarSeed: 'leo-sud',
    accent: 'violet',
    fanClubId: 'psg',
    isMockFriend: true,
    tagline: 'Tribune Auteuil · Paris',
    characterLook: { hairStyle: 'buzz', beard: 'light', faceExpression: 'serious', headwear: 'none' },
  },
  {
    id: 'b2000000-0002-4000-8000-000000000002',
    username: 'MarieVirage',
    avatarSeed: 'marie-virage',
    accent: 'emerald',
    fanClubId: 'om',
    isMockFriend: true,
    tagline: 'Virage Nord · Marseille',
    characterLook: { hairStyle: 'long', faceExpression: 'hyped', glasses: 'sport', headwear: 'beanie' },
  },
]

/** Autres spectateurs fictifs (pas dans ta liste d’amis). */
export const mockUsers: User[] = [
  {
    id: 'u-1',
    username: 'UltraNuit',
    avatarSeed: 'ultra',
    accent: 'violet',
    fanClubId: 'psg',
    characterLook: { hairStyle: 'curly', beard: 'full', eyeShape: 'almond', faceExpression: 'neutral' },
  },
  {
    id: 'u-2',
    username: 'GoalMachine',
    avatarSeed: 'goal',
    accent: 'emerald',
    fanClubId: 'om',
    characterLook: { hairStyle: 'wavy', glasses: 'none', headwear: 'cap' },
  },
  {
    id: 'u-3',
    username: 'TifoKing',
    avatarSeed: 'tifo',
    accent: 'amber',
    fanClubId: 'psg',
    characterLook: { hairStyle: 'short', faceExpression: 'hyped', headwear: 'none' },
  },
  {
    id: 'u-4',
    username: 'RagePress',
    avatarSeed: 'rage',
    accent: 'rose',
    fanClubId: 'liv',
    characterLook: { hairStyle: 'long', beard: 'goatee', glasses: 'round' },
  },
  { id: 'u-5', username: 'CôtéVirage', avatarSeed: 'virage', accent: 'violet', fanClubId: 'mci' },
]

/** Pool pour messages bots / résolution de pseudo (assistant + foule). */
export const chatPersonasPool: User[] = [...mockFriendUsers, ...mockUsers]

export function getUserProfileById(userId: string): User | undefined {
  return chatPersonasPool.find((u) => u.id === userId)
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Id Clerk (`user_…`) ou autre actor_key Talk Foot hors bots / démo. */
function isTalkfootPublicActorKey(userId: string): boolean {
  const id = userId.trim()
  if (!id || id === 'me') return false
  if (id.startsWith('group-bot:') || id.startsWith('u-')) return false
  if (id === 'u-tf-bot') return false
  if (UUID_RE.test(id)) return true
  // Clerk user id
  if (/^user_[a-zA-Z0-9]+$/.test(id)) return true
  // Autre clé profil cloud raisonnable
  return id.length >= 8 && !id.includes('/')
}

/** Profil minimal pour `/user/<id>` (UUID Supabase, Clerk, ou persona démo). */
export function resolveProfilePeer(userId: string): User | undefined {
  const known = getUserProfileById(userId)
  if (known) return known
  if (!isTalkfootPublicActorKey(userId)) return undefined
  return {
    id: userId.trim(),
    username: 'Supporter',
    avatarSeed: userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'supporter',
    accent: 'violet',
  }
}

export const currentUser: User = {
  id: 'me',
  username: 'You',
  avatarSeed: 'you',
  accent: 'emerald',
  isAdmin: true,
}
