import type { PixelJerseyPresetId } from '../data/pixelJerseyPresets'

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
    /** Grille SVG pixel — silhouette maillot + couleurs (sans sponsor / logo) */
    pixelPreset?: PixelJerseyPresetId
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

/** Ambiance du visage (bouche + sourcils) — rendu SVG */
export type FaceExpression = 'neutral' | 'happy' | 'hyped' | 'serious'

export type AvatarCharacterLook = {
  hairColor: string
  hairStyle: HairStyle
  eyeColor: string
  eyeShape: EyeShape
  beard: BeardStyle
  skinTone: string
  /** Sourire, cran tribune, concentré… */
  faceExpression: FaceExpression
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

/** Pack de médailles — achat carte bancaire (simulation), jamais confondu avec les jetons de pari */
export type MedalPack = {
  id: string
  /** Nom marketing type « bundle » */
  name: string
  tagline: string
  medals: number
  bonus?: number
  /** Prix affiché (démo) */
  priceEur: string
  popular?: boolean
  /** Texte ambiance (pas de chiffre jeton seul) */
  flavor?: string
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
  /**
   * Photo de profil (data URL JPEG), affichée à la place du pictogramme / miniature
   * sur toute l’app quand elle est définie.
   */
  profilePhotoDataUrl?: string
}
