import type { SupporterChannel } from '../types/group'

/** Salons par défaut d’un groupe créé via l’app (Général, Transferts, Pronos). */
export const DEFAULT_SUPPORTER_GROUP_CHANNELS: SupporterChannel[] = [
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
]

export function channelsForSupporterGroup(channels: SupporterChannel[] | undefined): SupporterChannel[] {
  return channels?.length ? channels : DEFAULT_SUPPORTER_GROUP_CHANNELS
}
