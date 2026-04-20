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
  },
  {
    id: 'b2000000-0002-4000-8000-000000000002',
    username: 'MarieVirage',
    avatarSeed: 'marie-virage',
    accent: 'emerald',
    fanClubId: 'om',
    isMockFriend: true,
    tagline: 'Virage Nord · Marseille',
  },
]

/** Autres spectateurs fictifs (pas dans ta liste d’amis). */
export const mockUsers: User[] = [
  { id: 'u-1', username: 'UltraNuit', avatarSeed: 'ultra', accent: 'violet', fanClubId: 'psg' },
  { id: 'u-2', username: 'GoalMachine', avatarSeed: 'goal', accent: 'emerald', fanClubId: 'om' },
  { id: 'u-3', username: 'TifoKing', avatarSeed: 'tifo', accent: 'amber', fanClubId: 'psg' },
  { id: 'u-4', username: 'RagePress', avatarSeed: 'rage', accent: 'rose', fanClubId: 'liv' },
  { id: 'u-5', username: 'CôtéVirage', avatarSeed: 'virage', accent: 'violet', fanClubId: 'mci' },
]

/** Pool pour messages bots / résolution de pseudo (assistant + foule). */
export const chatPersonasPool: User[] = [...mockFriendUsers, ...mockUsers]

export function getUserProfileById(userId: string): User | undefined {
  return chatPersonasPool.find((u) => u.id === userId)
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Profil minimal pour `/user/<uuid>` hors démo (nom complété côté client si ami). */
export function resolveProfilePeer(userId: string): User | undefined {
  const known = getUserProfileById(userId)
  if (known) return known
  if (!UUID_RE.test(userId)) return undefined
  return {
    id: userId,
    username: 'Supporter',
    avatarSeed: userId.replace(/-/g, '').slice(0, 16),
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
