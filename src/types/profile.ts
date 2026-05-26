import type { PixelJerseyPresetId } from '../data/pixelJerseyPresets'

export type AvatarSlot = 'scarf' | 'hat' | 'jersey' | 'accessory' | 'pants' | 'shoes'
export type AvatarIdentitySlot = 'base' | 'eyes' | 'beard' | 'hair'
export type AvatarStyleCategory = 'kit' | 'accessory'
export type AvatarLoadoutSlot = AvatarIdentitySlot | AvatarStyleCategory

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
    /** Rendu image (PNG livré) : remplace le SVG vectoriel quand fourni. */
    imageUrl?: string
  }
  /** Texte neutre du type d’inspiration (sans marque) */
  inspirationNote?: string
  /** Collection — utilisée pour filtrer la boutique (mode CDM 2026, etc.) */
  collection?: 'standard' | 'cdm2026'
  /** Code nation ISO (alpha-3) si l’item est rattaché à une sélection nationale. */
  nationIso?: string
}

export type AvatarIdentityItem = {
  id: string
  name: string
  slot: AvatarIdentitySlot
}

export type AvatarStyleItem = {
  id: string
  name: string
  image: string
  price: number
  category: AvatarStyleCategory
  linkedAvatarItemId?: string
}

/** Personnage SVG (corps + tête) — indépendant des logos clubs */
export type HairStyle =
  | 'buzz'
  | 'short'
  | 'wavy'
  | 'long'
  | 'curly'
  | 'sidepart'
  | 'undercut'
  | 'ponytail'
  | 'mohawk'
  | 'afro'
  | 'faded'
export type EyeShape = 'round' | 'almond' | 'narrow' | 'wide'
export type BeardStyle = 'none' | 'light' | 'stubble' | 'full' | 'goatee' | 'moustache' | 'vanDyke'
/** Cils / intensité du regard (rendu SVG portrait). */
export type EyelashStyle = 'none' | 'natural' | 'dramatic'
export type HeadwearBase = 'none' | 'cap' | 'beanie'
export type GlassesStyle = 'none' | 'round' | 'sport'

/** Ambiance du visage (bouche + sourcils) — rendu SVG */
export type FaceExpression = 'neutral' | 'happy' | 'hyped' | 'serious'

export type AvatarCharacterLook = {
  hairColor: string
  /** Si absent, la barbe réutilise `hairColor`. */
  beardColor?: string
  hairStyle: HairStyle
  eyeColor: string
  eyeShape: EyeShape
  eyelashStyle: EyelashStyle
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

/** Fond derrière le personnage (portrait profil) — simple et lisible. */
export type PortraitBackdropId =
  | 'tribune'
  | 'club_sunburst'
  | 'club_stripes'
  | 'bubbles'
  | 'confetti'
  | 'calm'

export type UserProfile = {
  level: number
  xp: number
  equippedItems: Record<AvatarSlot, string | null> // itemId par slot
  ownedItemIds: string[]
  creditedBetIds?: string[] // paris déjà crédités en XP
  /** Apparence du personnage (SVG) */
  characterLook?: AvatarCharacterLook
  /** Style de fond du portrait (derrière le SVG / photo). */
  portraitBackdrop?: PortraitBackdropId
  /** Club dont on prend les couleurs pour les fonds « club » ; si absent → 1er favori. */
  portraitBackdropClubId?: string | null
  /** Flocage / taille par maillot inspiré possédé */
  jerseyCustomizations?: Record<string, JerseyCustomization>
  /**
   * Photo personnelle optionnelle (data URL), gérée dans l’onglet profil.
   * Distincte de l’avatar 3D : n’alimente pas `ProfileCharacterThumb` ni l’identité in-app.
   */
  profilePhotoDataUrl?: string
  /** Phrase courte « à propos de toi » (optionnel), saisie à la création compte OAuth. */
  aboutLine?: string
  avatarLoadout?: {
    base: string
    eyes: string
    beard: string
    hair: string
    kit: string
    accessory: string
    skinColor: string
    eyeColor: string
    hairColor: string
  }
  premiumInventory?: {
    ownedItemIds: string[]
    equippedByCategory: { kit?: string; accessory?: string }
  }
}
