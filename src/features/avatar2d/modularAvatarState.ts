import type { AvatarData } from './types'
import { avatarAssetMap, createDefaultAvatarData } from './catalog'

export type ModularColorVariantKey =
  | 'default'
  | 'black'
  | 'brown'
  | 'blond'
  | 'auburn'
  | 'red'
  | 'blue'
  | 'green'
  | 'white'

export type ModularColorizableSlot = 'hair' | 'beard' | 'jersey' | 'shorts' | 'shoes'

export type ModularSlotColors = Record<ModularColorizableSlot, ModularColorVariantKey>

export type ModularAvatarState = {
  data: AvatarData
  slotColors: ModularSlotColors
}

export const DEFAULT_MODULAR_SLOT_COLORS: ModularSlotColors = {
  hair: 'default',
  beard: 'default',
  jersey: 'default',
  shorts: 'default',
  shoes: 'default',
}

export function createDefaultModularAvatarState(): ModularAvatarState {
  return {
    data: createDefaultAvatarData(),
    slotColors: { ...DEFAULT_MODULAR_SLOT_COLORS },
  }
}

/** Garde une teinte de peau valide (#RRGGBB) — évite reset visuel du picker à #000000. */
export function normalizeModularSkinTone(value: string | undefined | null): string {
  const defaults = createDefaultAvatarData()
  const raw = String(value ?? '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
  return defaults.skinTone
}

export function resolveModularAvatarState(
  stored: ModularAvatarState | undefined,
): ModularAvatarState {
  if (!stored?.data) return createDefaultModularAvatarState()
  const defaults = createDefaultAvatarData()
  const d = stored.data
  return {
    data: {
      skinTone: normalizeModularSkinTone(d.skinTone),
      body: d.body ?? defaults.body,
      hair: d.hair ?? defaults.hair,
      eyes: d.eyes ?? defaults.eyes,
      eyebrows: null,
      nose: d.nose ?? defaults.nose,
      mouth: d.mouth ?? defaults.mouth,
      beard: d.beard ?? defaults.beard,
      jersey: d.jersey ?? defaults.jersey,
      shorts: d.shorts ?? defaults.shorts,
      socks: null,
      shoes: d.shoes ?? defaults.shoes,
      accessory: null,
    },
    slotColors: { ...DEFAULT_MODULAR_SLOT_COLORS, ...stored.slotColors },
  }
}

/** Valide un état lu depuis localStorage / cloud. */
export function isModularAvatarState(value: unknown): value is ModularAvatarState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const o = value as Record<string, unknown>
  if (o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) return false
  const d = o.data as Record<string, unknown>
  if (typeof d.skinTone !== 'string') return false
  const slots = [
    'body',
    'hair',
    'eyes',
    'eyebrows',
    'nose',
    'mouth',
    'beard',
    'jersey',
    'shorts',
    'socks',
    'shoes',
    'accessory',
  ] as const
  for (const key of slots) {
    const v = d[key]
    if (v !== null && typeof v !== 'string') return false
  }
  return true
}

function coerceNullableAssetId(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'string') return value.trim() || null
  return null
}

/** Reprend un avatar cloud même si le JSON est légèrement hors spec (évite reset par défaut). */
export function coerceModularAvatarFromStored(value: unknown): ModularAvatarState | null {
  if (isModularAvatarState(value)) {
    return sanitizeModularAvatarState(resolveModularAvatarState(value))
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const o = value as Record<string, unknown>
  if (o.data === null || typeof o.data !== 'object' || Array.isArray(o.data)) return null
  const d = o.data as Record<string, unknown>
  const defaults = createDefaultAvatarData()
  const slotColorsRaw = o.slotColors
  const slotColors =
    slotColorsRaw !== null && typeof slotColorsRaw === 'object' && !Array.isArray(slotColorsRaw)
      ? { ...DEFAULT_MODULAR_SLOT_COLORS, ...(slotColorsRaw as Partial<ModularSlotColors>) }
      : { ...DEFAULT_MODULAR_SLOT_COLORS }
  const partial: ModularAvatarState = {
    data: {
      skinTone: normalizeModularSkinTone(typeof d.skinTone === 'string' ? d.skinTone : defaults.skinTone),
      body: coerceNullableAssetId(d.body) ?? defaults.body,
      hair: coerceNullableAssetId(d.hair) ?? defaults.hair,
      eyes: coerceNullableAssetId(d.eyes) ?? defaults.eyes,
      eyebrows: coerceNullableAssetId(d.eyebrows),
      nose: coerceNullableAssetId(d.nose) ?? defaults.nose,
      mouth: coerceNullableAssetId(d.mouth) ?? defaults.mouth,
      beard: coerceNullableAssetId(d.beard),
      jersey: coerceNullableAssetId(d.jersey) ?? defaults.jersey,
      shorts: coerceNullableAssetId(d.shorts) ?? defaults.shorts,
      socks: coerceNullableAssetId(d.socks),
      shoes: coerceNullableAssetId(d.shoes) ?? defaults.shoes,
      accessory: coerceNullableAssetId(d.accessory),
    },
    slotColors,
  }
  return sanitizeModularAvatarState(resolveModularAvatarState(partial))
}

/** Vérifie que les ids d’assets existent encore (après import PNG). */
export function sanitizeModularAvatarState(state: ModularAvatarState): ModularAvatarState {
  const defaults = createDefaultAvatarData()
  const pick = (category: keyof typeof avatarAssetMap, id: string | null) => {
    if (!id) return null
    return avatarAssetMap[category].some((a) => a.id === id) ? id : null
  }
  const withFallback = <K extends keyof AvatarData>(
    category: keyof typeof avatarAssetMap,
    id: string | null,
    fallbackKey: K,
  ) => pick(category, id) ?? defaults[fallbackKey]

  const d = state.data
  return {
    data: {
      skinTone: normalizeModularSkinTone(d.skinTone),
      body: withFallback('body', d.body, 'body'),
      hair: withFallback('hair', d.hair, 'hair'),
      eyes: withFallback('eyes', d.eyes, 'eyes'),
      eyebrows: null,
      nose: withFallback('nose', d.nose, 'nose'),
      mouth: withFallback('mouth', d.mouth, 'mouth'),
      beard: pick('beard', d.beard),
      jersey: withFallback('jerseys', d.jersey, 'jersey'),
      shorts: withFallback('shorts', d.shorts, 'shorts'),
      socks: null,
      shoes: withFallback('shoes', d.shoes, 'shoes'),
      accessory: null,
    },
    slotColors: { ...DEFAULT_MODULAR_SLOT_COLORS, ...state.slotColors },
  }
}
