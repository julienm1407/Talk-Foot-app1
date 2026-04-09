import type { User } from '../types/chat'

/**
 * Amis simulés (démo) — affichés en priorité dans « en direct » sur le live.
 */
export const mockFriendUsers: User[] = [
  {
    id: 'u-f-1',
    username: 'LucasVirage',
    avatarSeed: 'lucas',
    accent: 'violet',
    fanClubId: 'om',
    isMockFriend: true,
  },
  {
    id: 'u-f-2',
    username: 'Nina92',
    avatarSeed: 'nina',
    accent: 'rose',
    fanClubId: 'psg',
    isMockFriend: true,
  },
  {
    id: 'u-f-3',
    username: 'TomChant',
    avatarSeed: 'tom',
    accent: 'emerald',
    fanClubId: 'nantes',
    isMockFriend: true,
  },
  {
    id: 'u-f-4',
    username: 'SarahGoal',
    avatarSeed: 'sarah',
    accent: 'amber',
    fanClubId: 'liv',
    isMockFriend: true,
  },
]

/** Autres spectateurs fictifs (pas dans ta liste d’amis démo). */
export const mockUsers: User[] = [
  { id: 'u-1', username: 'UltraNuit', avatarSeed: 'ultra', accent: 'violet', fanClubId: 'psg' },
  { id: 'u-2', username: 'GoalMachine', avatarSeed: 'goal', accent: 'emerald', fanClubId: 'om' },
  { id: 'u-3', username: 'TifoKing', avatarSeed: 'tifo', accent: 'amber', fanClubId: 'psg' },
  { id: 'u-4', username: 'RagePress', avatarSeed: 'rage', accent: 'rose', fanClubId: 'liv' },
  { id: 'u-5', username: 'CôtéVirage', avatarSeed: 'virage', accent: 'violet', fanClubId: 'mci' },
]

/** Pool pour messages bots / résolution de pseudo (amis + foule). */
export const chatPersonasPool: User[] = [...mockFriendUsers, ...mockUsers]

export const currentUser: User = {
  id: 'me',
  username: 'You',
  avatarSeed: 'you',
  accent: 'emerald',
  isAdmin: true,
}
