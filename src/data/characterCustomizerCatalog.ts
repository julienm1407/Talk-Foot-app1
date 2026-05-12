import type { BeardStyle, EyeShape, FaceExpression, GlassesStyle, HairStyle, HeadwearBase } from '../types/profile'

export type CustomizerCategoryId =
  | 'hair'
  | 'beard'
  | 'face'
  | 'tops'
  | 'bottoms'
  | 'shoes'
  | 'accessories'

export const CUSTOMIZER_CATEGORIES: {
  id: CustomizerCategoryId
  label: string
  hint: string
  emoji: string
}[] = [
  { id: 'hair', label: 'Cheveux', hint: 'Coupe & couleur', emoji: '💇' },
  { id: 'beard', label: 'Barbe', hint: 'Style & teinte', emoji: '🧔' },
  { id: 'face', label: 'Visage', hint: 'Peau, yeux, expression', emoji: '😀' },
  { id: 'tops', label: 'Hauts', hint: 'Maillots & tops boutique', emoji: '👕' },
  { id: 'bottoms', label: 'Bas', hint: 'Short, jean, cargo…', emoji: '🩳' },
  { id: 'shoes', label: 'Chaussures', hint: 'Stade & street', emoji: '👟' },
  { id: 'accessories', label: 'Accessoires', hint: 'Objets boutique', emoji: '🎧' },
]

export const HAIR_STYLE_OPTIONS: { id: HairStyle; label: string }[] = [
  { id: 'buzz', label: 'Très court' },
  { id: 'faded', label: 'Dégradé' },
  { id: 'short', label: 'Court' },
  { id: 'sidepart', label: 'Raie' },
  { id: 'undercut', label: 'Undercut' },
  { id: 'wavy', label: 'Ondulé' },
  { id: 'curly', label: 'Bouclé' },
  { id: 'long', label: 'Long' },
  { id: 'ponytail', label: 'Queue' },
  { id: 'afro', label: 'Volume' },
  { id: 'mohawk', label: 'Crête' },
]

export const BEARD_STYLE_OPTIONS: { id: BeardStyle; label: string }[] = [
  { id: 'none', label: 'Aucune' },
  { id: 'stubble', label: '3 jours' },
  { id: 'light', label: 'Légère' },
  { id: 'moustache', label: 'Moustache' },
  { id: 'goatee', label: 'Bouc' },
  { id: 'vanDyke', label: 'Van Dyke' },
  { id: 'full', label: 'Complète' },
]

export const EYE_SHAPE_OPTIONS: { id: EyeShape; label: string }[] = [
  { id: 'round', label: 'Ronds' },
  { id: 'wide', label: 'Grands' },
  { id: 'almond', label: 'Amande' },
  { id: 'narrow', label: 'Fins' },
]

export const FACE_EXPR_OPTIONS: { id: FaceExpression; label: string }[] = [
  { id: 'neutral', label: 'Neutre' },
  { id: 'happy', label: 'Sourire' },
  { id: 'hyped', label: 'Hype' },
  { id: 'serious', label: 'Sérieux' },
]

export const GLASSES_OPTIONS: { id: GlassesStyle; label: string }[] = [
  { id: 'none', label: 'Sans' },
  { id: 'round', label: 'Rondes' },
  { id: 'sport', label: 'Sport' },
]

export const HEADWEAR_OPTIONS: { id: HeadwearBase; label: string }[] = [
  { id: 'none', label: 'Sans' },
  { id: 'beanie', label: 'Bonnet' },
  { id: 'cap', label: 'Casquette' },
]
