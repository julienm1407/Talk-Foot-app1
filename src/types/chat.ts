export type ReactionType = 'flare' | 'confetti' | 'goal' | 'rage'

export type User = {
  id: string
  username: string
  avatarSeed: string
  accent: 'violet' | 'emerald' | 'rose' | 'amber'
}

export type Message = {
  id: string
  matchId: string
  userId: string
  text: string
  createdAt: number
}

export type ReactionEvent = {
  id: string
  matchId: string
  userId: string
  type: ReactionType
  createdAt: number
}

