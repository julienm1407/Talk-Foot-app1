import type { TribuneId } from './tribune'
import type { AvatarCharacterLook } from './profile'

export type ReactionType = 'flare' | 'confetti' | 'goal' | 'rage'

export type User = {
  id: string
  username: string
  avatarSeed: string
  accent: 'violet' | 'emerald' | 'rose' | 'amber'
  isAdmin?: boolean
  /** Démo : compte comme « ami » pour présence live / encarts sociaux */
  isMockFriend?: boolean
  /** Assistant Talk Foot — premier contact MP, pas un faux profil joueur */
  isTalkFootBot?: boolean
  /** Club de cœur simulé (mode Virage / filtrage live) */
  fanClubId?: string
  /** Phrase courte sur la page profil vitrine */
  tagline?: string
  /** Même schéma que l’éditeur profil — sinon couleurs dérivées du seed (buste 3D chat). */
  characterLook?: Partial<AvatarCharacterLook>
}

export type Message = {
  id: string
  matchId: string
  userId: string
  /** Pseudo affiché pour les messages synchronisés (hors usersById local). */
  authorDisplayName?: string
  text: string
  createdAt: number
  gifUrl?: string
  emoteId?: string
  /** Tribune du stade digital ; absent = visible dans toutes les tribunes (ex. messages globaux). */
  tribune?: TribuneId
  /** Salon supporter (tribune groupe) — filtré sur le live quand une tribune groupe est active. */
  supporterGroupId?: string
  /** Bloc écharpe d’un groupe (message visuel). */
  groupScarf?: {
    groupId: string
    groupName: string
    text: string
    colorA: string
    colorB: string
    colorC: string
  }
}

export type ReactionEvent = {
  id: string
  matchId: string
  userId: string
  type: ReactionType
  createdAt: number
}

