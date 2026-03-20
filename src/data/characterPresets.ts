import type { AvatarCharacterLook } from '../types/profile'

/** Palettes rapides (hex) — pas de logos, uniquement des couleurs */
export const PRESET_SKIN = [
  '#f6d4c4',
  '#e8b89a',
  '#c6865c',
  '#8d5524',
  '#5c3a1e',
  '#3d2314',
]

export const PRESET_HAIR = [
  '#1a1209',
  '#3d2314',
  '#6b4423',
  '#c4a574',
  '#e8d5a8',
  '#f5e6d3',
  '#b91c1c',
  '#1e3a8a',
  '#0f766e',
]

export const PRESET_EYES = [
  '#1e293b',
  '#0ea5e9',
  '#16a34a',
  '#a16207',
  '#7c3aed',
]

export const DEFAULT_CHARACTER_LOOK: AvatarCharacterLook = {
  hairColor: '#3d2314',
  hairStyle: 'short',
  eyeColor: '#1e293b',
  eyeShape: 'round',
  beard: 'none',
  skinTone: '#e8b89a',
  headwear: 'none',
  glasses: 'none',
  outfitPrimary: '#0f2744',
  outfitSecondary: '#c8102e',
  outfitPattern: 'hechter',
  supporterTint: false,
}

export function mergeCharacterLook(raw: unknown): AvatarCharacterLook {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CHARACTER_LOOK }
  return { ...DEFAULT_CHARACTER_LOOK, ...(raw as Partial<AvatarCharacterLook>) }
}
