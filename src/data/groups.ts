import type { SupporterGroup } from '../types/group'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60_000).toISOString()

const baseChannels = [
  {
    id: 'general',
    name: 'Général',
    description: 'Débats, ambiance, vie du groupe.',
    emoji: '💬',
  },
  {
    id: 'transferts',
    name: 'Transferts',
    description: 'Rumeurs, mercato, compos.',
    emoji: '🧾',
  },
  {
    id: 'pronos',
    name: 'Pronos',
    description: 'Paris entre supporters, scores.',
    emoji: '🎯',
  },
  {
    id: 'memes',
    name: 'Memes',
    description: 'Images, vannes, réactions.',
    emoji: '😂',
  },
] as const

export const starterGroups: SupporterGroup[] = [
  {
    id: 'g-virage-nord',
    name: 'Virage Nord',
    emoji: '🧢',
    location: 'Marseille',
    motto: 'Bruit, fumée, et cœur — tous ensemble.',
    theme: { primary: '#0ea5e9', secondary: '#ffffff', background: 'stripe' },
    members: 1240,
    intensity: 78,
    channels: [...baseChannels],
    createdBy: 'system',
    createdAt: daysAgo(14),
    fanTags: { leagueIds: ['ligue-1'], clubIds: ['om'] },
  },
  {
    id: 'g-ultras-nuit',
    name: 'Ultras de la Nuit',
    emoji: '🌙',
    location: 'Paris',
    motto: 'On vit le match comme un concert.',
    theme: { primary: '#0b1b3a', secondary: '#e11d48', background: 'smoke' },
    members: 980,
    intensity: 84,
    channels: [...baseChannels],
    createdBy: 'system',
    createdAt: daysAgo(21),
    fanTags: { leagueIds: ['ligue-1'], clubIds: ['psg'] },
  },
  {
    id: 'g-kop-bleu',
    name: 'Kop Bleu',
    emoji: '🔵',
    location: 'Manchester',
    motto: 'Pressing, chants, et ironie.',
    theme: { primary: '#60a5fa', secondary: '#111827', background: 'clean' },
    members: 1520,
    intensity: 67,
    channels: [...baseChannels],
    createdBy: 'system',
    createdAt: daysAgo(10),
    fanTags: { leagueIds: ['epl'], clubIds: ['mci'] },
  },
  {
    id: 'g-tribune-rouge',
    name: 'Tribune Rouge',
    emoji: '🔴',
    location: 'Liverpool',
    motto: 'Anfield dans la poche, même à distance.',
    theme: { primary: '#ef4444', secondary: '#111827', background: 'stripe' },
    members: 1780,
    intensity: 73,
    channels: [...baseChannels],
    createdBy: 'system',
    createdAt: daysAgo(18),
    fanTags: { leagueIds: ['epl'], clubIds: ['liv'] },
  },
]

