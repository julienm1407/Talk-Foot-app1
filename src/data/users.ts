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

/** Liste « amis » côté UI live / partage : pour l’instant uniquement l’assistant. */
export const mockFriendUsers: User[] = [talkFootBotUser]

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

export const currentUser: User = {
  id: 'me',
  username: 'You',
  avatarSeed: 'you',
  accent: 'emerald',
  isAdmin: true,
}
