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

export function resolveModularAvatarState(
  stored: ModularAvatarState | undefined,
): ModularAvatarState {
  if (!stored?.data) return createDefaultModularAvatarState()
  const defaults = createDefaultAvatarData()
  const d = stored.data
  return {
    data: {
      skinTone: d.skinTone || defaults.skinTone,
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
      skinTone: d.skinTone || defaults.skinTone,
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
