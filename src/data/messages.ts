import type { Message } from '../types/chat'

const base = Date.now() - 5 * 60_000

export const initialMessages: Message[] = [
  {
    id: 'msg-1',
    matchId: 'm-rma-fcb',
    userId: 'u-2',
    text: 'Pressing de malade… ça sent le but.',
    createdAt: base + 15_000,
  },
  {
    id: 'msg-2',
    matchId: 'm-rma-fcb',
    userId: 'u-1',
    text: 'Le stade est en feu, on entend tout même à la TV.',
    createdAt: base + 35_000,
  },
  {
    id: 'msg-3',
    matchId: 'm-rma-fcb',
    userId: 'u-3',
    text: 'Carton? Non mais sérieux…',
    createdAt: base + 58_000,
  },
  {
    id: 'msg-4',
    matchId: 'm-rma-fcb',
    userId: 'u-4',
    text: 'On a perdu le milieu là… faut calmer.',
    createdAt: base + 77_000,
  },
  {
    id: 'msg-5',
    matchId: 'm-psg-om',
    userId: 'u-5',
    text: 'Avant-match: qui marque en premier?',
    createdAt: base + 95_000,
  },
]

