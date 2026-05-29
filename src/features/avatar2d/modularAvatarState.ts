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

export type ModularColorizableSlot =
  | 'hair'
  | 'beard'
  | 'jersey'
  | 'shorts'
  | 'socks'
  | 'shoes'
  | 'accessory'

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
  socks: 'default',
  shoes: 'default',
  accessory: 'default',
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
  return {
    data: stored.data,
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
  const pick = (category: keyof typeof avatarAssetMap, id: string | null) => {
    if (!id) return null
    return avatarAssetMap[category].some((a) => a.id === id) ? id : null
  }
  const d = state.data
  return {
    data: {
      skinTone: d.skinTone,
      body: pick('body', d.body),
      hair: pick('hair', d.hair),
      eyes: pick('eyes', d.eyes),
      eyebrows: pick('eyebrows', d.eyebrows),
      nose: pick('nose', d.nose),
      mouth: pick('mouth', d.mouth),
      beard: pick('beard', d.beard),
      jersey: pick('jerseys', d.jersey),
      shorts: pick('shorts', d.shorts),
      socks: pick('socks', d.socks),
      shoes: pick('shoes', d.shoes),
      accessory: pick('accessories', d.accessory),
    },
    slotColors: { ...DEFAULT_MODULAR_SLOT_COLORS, ...state.slotColors },
  }
}
