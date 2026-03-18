export type GroupTheme = {
  primary: string
  secondary: string
  background: 'clean' | 'smoke' | 'stripe'
}

export type SupporterChannel = {
  id: string
  name: string
  description: string
  emoji: string
}

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
}

