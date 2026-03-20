import type { User } from '../types/chat'

export const mockUsers: User[] = [
  { id: 'u-1', username: 'UltraNuit', avatarSeed: 'ultra', accent: 'violet', fanClubId: 'psg' },
  { id: 'u-2', username: 'GoalMachine', avatarSeed: 'goal', accent: 'emerald', fanClubId: 'om' },
  { id: 'u-3', username: 'TifoKing', avatarSeed: 'tifo', accent: 'amber', fanClubId: 'psg' },
  { id: 'u-4', username: 'RagePress', avatarSeed: 'rage', accent: 'rose', fanClubId: 'liv' },
  { id: 'u-5', username: 'CôtéVirage', avatarSeed: 'virage', accent: 'violet', fanClubId: 'mci' },
]

export const currentUser: User = {
  id: 'me',
  username: 'You',
  avatarSeed: 'you',
  accent: 'emerald',
  isAdmin: true,
}

