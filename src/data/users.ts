import type { User } from '../types/chat'

export const mockUsers: User[] = [
  { id: 'u-1', username: 'UltraNuit', avatarSeed: 'ultra', accent: 'violet' },
  { id: 'u-2', username: 'GoalMachine', avatarSeed: 'goal', accent: 'emerald' },
  { id: 'u-3', username: 'TifoKing', avatarSeed: 'tifo', accent: 'amber' },
  { id: 'u-4', username: 'RagePress', avatarSeed: 'rage', accent: 'rose' },
  { id: 'u-5', username: 'CôtéVirage', avatarSeed: 'virage', accent: 'violet' },
]

export const currentUser: User = {
  id: 'me',
  username: 'You',
  avatarSeed: 'you',
  accent: 'emerald',
  isAdmin: true,
}

