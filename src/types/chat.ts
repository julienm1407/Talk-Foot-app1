export type ReactionType = 'flare' | 'confetti' | 'goal' | 'rage'

export type User = {
  id: string
  username: string
  avatarSeed: string
  accent: 'violet' | 'emerald' | 'rose' | 'amber'
  isAdmin?: boolean
  /** Club de cœur simulé (mode Virage / filtrage live) */
  fanClubId?: string
}

export type Message = {
  id: string
  matchId: string
  userId: string
  text: string
  createdAt: number
  gifUrl?: string
  emoteId?: string
}

export type ReactionEvent = {
  id: string
  matchId: string
  userId: string
  type: ReactionType
  createdAt: number
}

