import type { User } from '../types/chat'
import { findCustomDebateById } from '../utils/customGroupDebatesStorage'

/** Ligne de chat affichée en aperçu (le club reste en données mock, non affiché — débat indépendant). */
export type DebatePreviewMessage = {
  username: string
  fanClubId: string
  text: string
}

export type DebateParticipantAvatar = {
  avatarSeed: string
  accent: User['accent']
}

export type Debate = {
  id: string
  title: string
  excerpt: string
  groupId: string
  accent: string
  messagesCount: number
  participantsCount: number
  trending?: boolean
  /**
   * Écriture dans le salon « Général » quand ce débat est ouvert (`?debate=`).
   * `public` (défaut) : comme sur l’accueil — tout le monde peut participer.
   * `members` : le groupe restreint l’écriture aux membres (débat interne).
   */
  salonAccess?: 'public' | 'members'
  /** Image hero (débat du jour). */
  heroImageUrl?: string
  /** 2–3 visuels “en ligne” sur la carte principale. */
  activeParticipants?: DebateParticipantAvatar[]
  /** Fil d’aperçu : accueil montre les 2 premiers ; page débat = tout. */
  previewMessages: DebatePreviewMessage[]
  /** Débat du jour (featured_rank = 1 en base). */
  featured?: boolean
  /** Messages sur les dernières 24 h (classement « top débats »). */
  messages24h?: number
  /** ISO — tie-break quand peu ou pas de messages. */
  createdAt?: string
  /** Position au classement global (1 = tête du top). */
  leaderboardRank?: number
}

export { rankDebatesByActivity, applyDebateLeaderboardRanks } from '../utils/debateRanking'

/** @deprecated Utiliser `useDebates()` — catalogue vide côté mock. */
export function getAllDebates(): Debate[] {
  return []
}

/** @deprecated Utiliser `useDebates().getDebateById`. */
export function getDebateById(id: string, extras: Debate[] = []): Debate | undefined {
  const fromExtras = extras.find((d) => d.id === id)
  if (fromExtras) return fromExtras
  return findCustomDebateById(id)
}

/** @deprecated Utiliser `Debate` via `useDebates()`. */
export type DebateTopic = Debate

/** @deprecated */
export const mockDebates: Debate[] = []
