import type { TribuneId } from './tribune'
import type { AvatarCharacterLook } from './profile'
import type { ModularAvatarState } from '../features/avatar2d/modularAvatarState'
import type { SubscriptionTierId } from './subscription'

/** Zone tribune du canal live (métadonnée `match_tribune` / `matchTribune`). */
export type MatchTribuneZone = 'home-ultras' | 'away-ultras' | 'analystes' | 'neutres'

export type ReactionType = 'flare' | 'confetti' | 'goal' | 'rage'

/** Couleur du fumigène (diffusée en broadcast, pas en base). */
export type FlareColor = 'red' | 'blue' | 'green' | 'yellow'

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
  /** Bot de bienvenue de la tribune groupe (style Discord), lié au groupe ouvert */
  isGroupSalonBot?: boolean
  /** Club de cœur simulé (mode Virage / filtrage live) */
  fanClubId?: string
  /** Phrase courte sur la page profil vitrine */
  tagline?: string
  /** Même schéma que l’éditeur profil — sinon couleurs dérivées du seed (buste 3D chat). */
  characterLook?: Partial<AvatarCharacterLook>
  /** Avatar modulaire (studio) — chargé depuis le profil cloud pour les vrais comptes. */
  modularAvatar?: ModularAvatarState
  /** Photo profil (data URL) — chargée depuis le profil cloud pour les vrais comptes. */
  profilePhotoDataUrl?: string
  /** Formule effective (cloud) — cadre Ultra en chat. */
  subscriptionTier?: SubscriptionTierId
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
  /** Tribune live canal (domicile / parcage / analyse / neutre). Absent = fil « neutre » (analystes + neutres). */
  matchTribune?: MatchTribuneZone
  /** Tribune supporter (tribune groupe) — filtré sur le live quand une tribune groupe est active. */
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
  /** Tifo géant : camp choisi (diffusé en broadcast, pas en base). */
  tifoSide?: 'home' | 'away'
  /** Fumigène : couleur choisie (diffusée en broadcast, pas en base). */
  flareColor?: FlareColor
}

