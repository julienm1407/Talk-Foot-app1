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
}

/** Tri par activité réelle : 24 h → total messages → participants. */
export function rankDebatesByActivity(a: Debate, b: Debate): number {
  const a24 = a.messages24h ?? 0
  const b24 = b.messages24h ?? 0
  if (b24 !== a24) return b24 - a24
  if (b.messagesCount !== a.messagesCount) return b.messagesCount - a.messagesCount
  return b.participantsCount - a.participantsCount
}

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
