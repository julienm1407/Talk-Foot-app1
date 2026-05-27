/** Fond de la zone de discussion des tribunes (couleur, image CSS preset, ou hériter du thème carte). */
export type GroupSalonChatBackdrop =
  | { mode: 'inherit' }
  | { mode: 'solid'; color: string }
  | { mode: 'preset'; presetId: string }

/** Bandes de l’écharpe débloquée quand tu rejoins le groupe (envoyable dans les chats). */
export type GroupScarfStyle = {
  label: string
  colorA: string
  colorB: string
  colorC: string
}

/** Média de présentation sur la fiche groupe (modération plateforme — démo). */
export type GroupPresentationMedia = {
  type: 'image' | 'video'
  url: string
  posterUrl?: string
  moderationStatus: 'pending' | 'approved' | 'rejected'
  caption?: string
}

export type GroupTheme = {
  primary: string
  secondary: string
  background: 'clean' | 'smoke' | 'stripe'
  /** Bordures / petits accents (optionnel, sinon dérivé du secondaire en UI) */
  accent?: string
  /** Contour des cartes / liste des tribunes (hex). */
  salonBoxBorder?: string
  /** Fond derrière le fil de messages de la tribune. */
  salonChatBackdrop?: GroupSalonChatBackdrop
  /** Emojis rapides dans le composer (max 8 recommandé). */
  quickEmotes?: string[]
}

export type SupporterChannel = {
  id: string
  name: string
  description: string
  emoji: string
}

/** Pour filtrage / accès : ligues (ids competitionThemes) et clubs (ids équipes) */
export type GroupFanTags = {
  leagueIds: string[]
  clubIds: string[]
  /** Libellés libres pour rattachement pays/zone (ex: France, Maghreb, Europe). */
  countryLabels?: string[]
}

/** Soutien actif sur la tribune (facepile — auteurs réels des 30 dernières minutes). */
export type GroupActivePresence = {
  userId: string
  displayName: string
  avatarSeed: string
  accent: 'violet' | 'emerald' | 'rose' | 'amber'
}

/** Communauté de supporters : on dit « groupe de supporters », pas « serveur ». */
export type SupporterGroup = {
  id: string
  name: string
  emoji: string
  location?: string
  motto: string
  theme: GroupTheme
  members: number
  intensity: number // 0..100
  channels: SupporterChannel[]
  createdBy: 'system' | 'me'
  createdAt: string
  /** Tribunes rattachées à des clubs / ligues (personnalisation & restrictions) */
  fanTags?: GroupFanTags
  onlineNow?: number
  messagesToday?: number
  /** Avatars réels des supporters actifs (RPC get_group_active_presence). */
  activePresence?: GroupActivePresence[]
  /** public = ouvert, private = sur invitation, club = rattaché tribune */
  groupKind?: 'public' | 'private' | 'club'
  /**
   * Centres d’intérêt (sans #, minuscules). Obligatoires pour une tribune publique
   * afin que d’autres utilisateurs le retrouvent par recherche.
   */
  hashtags?: string[]
  lastMessagePreview?: string
  /** Écharpe du groupe (partage dans live, général, etc.). */
  scarf?: GroupScarfStyle
  /** Photo ou vidéo supporters sur l’encart (après validation). */
  presentationMedia?: GroupPresentationMedia
}

