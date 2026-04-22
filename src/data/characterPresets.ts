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
  faceExpression: 'happy',
  headwear: 'none',
  glasses: 'none',
  outfitPrimary: '#0f2744',
  outfitSecondary: '#c8102e',
  outfitPattern: 'hechter',
  supporterTint: false,
}

const HAIR_STYLES: ReadonlySet<AvatarCharacterLook['hairStyle']> = new Set([
  'buzz',
  'short',
  'wavy',
  'long',
  'curly',
])

const BEARD_STYLES: ReadonlySet<AvatarCharacterLook['beard']> = new Set(['none', 'light', 'full', 'goatee'])

function sanitizeLook(p: Partial<AvatarCharacterLook>): Partial<AvatarCharacterLook> {
  const out = { ...p }
  if (p.hairStyle != null && !HAIR_STYLES.has(p.hairStyle as AvatarCharacterLook['hairStyle'])) {
    delete (out as { hairStyle?: unknown }).hairStyle
  }
  if (p.beard != null && !BEARD_STYLES.has(p.beard as AvatarCharacterLook['beard'])) {
    delete (out as { beard?: unknown }).beard
  }
  return out
}

export function mergeCharacterLook(raw: unknown): AvatarCharacterLook {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CHARACTER_LOOK }
  return { ...DEFAULT_CHARACTER_LOOK, ...sanitizeLook(raw as Partial<AvatarCharacterLook>) }
}
