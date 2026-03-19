export type AvatarSlot = 'scarf' | 'hat' | 'jersey' | 'accessory'

export type AvatarItem = {
  id: string
  name: string
  slot: AvatarSlot
  emoji: string
  cost: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description?: string
}

export type TokenPack = {
  id: string
  name: string
  tokens: number
  priceDisplay: string // ex: "Gratuit", "Offre limitée"
  bonus?: number // tokens bonus
  popular?: boolean
  description?: string
  free?: boolean // true = pas de paiement (ex: pack gratuit)
}

export type LevelTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export type UserProfile = {
  level: number
  xp: number
  equippedItems: Record<AvatarSlot, string | null> // itemId par slot
  ownedItemIds: string[]
  creditedBetIds?: string[] // paris déjà crédités en XP
}
