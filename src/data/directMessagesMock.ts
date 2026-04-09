import type { User } from '../types/chat'
import { mockFriendUsers } from './users'

export type DirectThread = {
  id: string
  peer: User
  lastPreview: string
  lastAtLabel: string
  unread: boolean
}

export const mockDirectThreads: DirectThread[] = mockFriendUsers.map((u, i) => ({
  id: `dm-${u.id}`,
  peer: u,
  lastPreview:
    i === 0
      ? 'T’es sur le live ce soir ?'
      : i === 1
        ? 'Je t’ai envoyé un repère sur le salon 👆'
        : i === 2
          ? 'But incroyable 😭'
          : 'On fait un pari tête-à-tête ?',
  lastAtLabel: i === 0 ? 'À l’instant' : i === 1 ? 'Hier' : `${i + 2} j`,
  unread: i === 0,
}))

export type DirectMessageLine = {
  id: string
  fromMe: boolean
  body: string
  atLabel: string
}

export const mockDirectMessagesByThread: Record<string, DirectMessageLine[]> = {
  'dm-u-f-1': [
    { id: 'm1', fromMe: false, body: 'Salut ! Tu viens en tribune ce soir ?', atLabel: '12:40' },
    { id: 'm2', fromMe: true, body: 'Yes je suis sur le match replay démo', atLabel: '12:42' },
    { id: 'm3', fromMe: false, body: 'T’es sur le live ce soir ?', atLabel: '12:44' },
  ],
  'dm-u-f-2': [
    { id: 'm1', fromMe: true, body: 'Regarde ce groupe', atLabel: 'Hier' },
    { id: 'm2', fromMe: false, body: 'Je t’ai envoyé un repère sur le salon 👆', atLabel: 'Hier' },
  ],
  'dm-u-f-3': [
    { id: 'm1', fromMe: false, body: 'But incroyable 😭', atLabel: 'Ven.' },
  ],
  'dm-u-f-4': [
    { id: 'm1', fromMe: true, body: 'Tu paris sur qui ?', atLabel: '4 j' },
    { id: 'm2', fromMe: false, body: 'On fait un pari tête-à-tête ?', atLabel: '4 j' },
  ],
}
