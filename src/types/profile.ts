export type AvatarSlot = 'scarf' | 'hat' | 'jersey' | 'accessory'

/** Motifs maillot (géométriques — pas de logos officiels) */
export type JerseyPattern =
  | 'solid'
  | 'vertical'
  | 'horizontal'
  | 'sash'
  | 'hoops'
  /** Bande centrale contrastée + fines bandes claires (style tribune, sans logo) */
  | 'hechter'
  /** Uni avec micro-grille type mesh technique */
  | 'kit_mesh'

export type AvatarItem = {
  id: string
  name: string
  slot: AvatarSlot
  emoji: string
  cost: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  description?: string
  /** Maillots « inspirés » : rendu SVG sur l’avatar */
  jerseyVisual?: {
    primary: string
    secondary: string
    pattern: JerseyPattern
    /** Bandes claires (bordures centre, parements manches) */
    stripeLight?: string
  }
  /** Texte neutre du type d’inspiration (sans marque) */
  inspirationNote?: string
}

/** Personnage SVG (corps + tête) — indépendant des logos clubs */
export type HairStyle = 'buzz' | 'short' | 'wavy' | 'long' | 'curly'
export type EyeShape = 'round' | 'almond'
export type BeardStyle = 'none' | 'light' | 'full' | 'goatee'
export type HeadwearBase = 'none' | 'cap' | 'beanie'
export type GlassesStyle = 'none' | 'round' | 'sport'

export type AvatarCharacterLook = {
  hairColor: string
  hairStyle: HairStyle
  eyeColor: string
  eyeShape: EyeShape
  beard: BeardStyle
  skinTone: string
  headwear: HeadwearBase
  glasses: GlassesStyle
  outfitPrimary: string
  outfitSecondary: string
  outfitPattern: JerseyPattern
  /** Colore le haut avec les couleurs du club favori (préférences fan) */
  supporterTint: boolean
}

export type JerseySize = 'S' | 'M' | 'L' | 'XL'
export type JerseySleeve = 'short' | 'long'

export type JerseyCustomization = {
  displayName: string
  number: string
  size: JerseySize
  sleeve: JerseySleeve
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
  /** Apparence du personnage (SVG) */
  characterLook?: AvatarCharacterLook
  /** Flocage / taille par maillot inspiré possédé */
  jerseyCustomizations?: Record<string, JerseyCustomization>
}
