import type { AvatarItem } from '../types/profile'
import { resolveKitPreviewPair } from '../components/profile/Avatar2DKitPreview'
import {
  createDefaultModularAvatarState,
  type ModularAvatarState,
} from '../features/avatar2d/modularAvatarState'

export type BoutiqueGarmentShow = 'both' | 'jersey' | 'shorts' | 'shoes'

export function resolveBoutiqueGarmentShow(item: AvatarItem): BoutiqueGarmentShow {
  if (item.slot === 'shoes') return 'shoes'
  if (item.bundleIncludes?.length) return 'both'
  if (item.slot === 'pants') return 'shorts'
  if (item.slot === 'jersey') return 'jersey'
  return 'both'
}

/** IDs assets modulaires (`assets/jerseys/jersey_fra.png` → `jerseys-jersey-fra`). */
function modularJerseyId(item: AvatarItem): string | null {
  if (item.nationIso) return `jerseys-jersey-${item.nationIso.toLowerCase()}`
  const base = item.id.match(/^kit-base-(.+)$/)?.[1]
  if (base) return `jerseys-jersey-base-${base}`
  const cdm = item.id.match(/^cdm2026-(?!short-|pack-)([a-z]+)$/)?.[1]
  if (cdm) return `jerseys-jersey-${cdm}`
  return null
}

function modularShortsId(item: AvatarItem): string | null {
  if (item.id === 'pants-kit') return null
  if (item.nationIso) return `shorts-short-${item.nationIso.toLowerCase()}`
  const base = item.id.match(/^pants-base-(.+)$/)?.[1]
  if (base) return `shorts-short-base-${base}`
  const cdm = item.id.match(/^cdm2026-short-([a-z]+)$/)?.[1]
  if (cdm) return `shorts-short-${cdm}`
  return null
}

function modularShoesId(item: AvatarItem): string | null {
  const fromUrl = item.shoesVisual?.imageUrl?.match(/\/shoes\/shoes_([a-z]+)\.png/i)?.[1]
  if (fromUrl) return `shoes-shoes-${fromUrl === 'base' ? 'base' : fromUrl}`
  const legacy: Record<string, string> = {
    'shoes-sneaker-white': 'shoes-shoes-base',
    'shoes-sneaker-neon': 'shoes-shoes-bleu',
    'shoes-retro-gum': 'shoes-shoes-rouge',
    'shoes-sneaker-jaune': 'shoes-shoes-jaune',
    'shoes-sneaker-vert': 'shoes-shoes-vert',
  }
  return legacy[item.id] ?? null
}

/** État modulaire boutique (sans corps / visage). */
export function boutiqueItemToModularState(item: AvatarItem): ModularAvatarState {
  const base = createDefaultModularAvatarState()
  const show = resolveBoutiqueGarmentShow(item)

  if (show === 'shoes') {
    const shoesId = modularShoesId(item)
    return {
      data: {
        skinTone: base.data.skinTone,
        body: null,
        hair: null,
        eyes: null,
        eyebrows: null,
        nose: null,
        mouth: null,
        beard: null,
        jersey: null,
        shorts: null,
        socks: null,
        shoes: shoesId,
        accessory: null,
      },
      slotColors: base.slotColors,
    }
  }

  const { kit, pants } = resolveKitPreviewPair(item)

  return {
    data: {
      skinTone: base.data.skinTone,
      body: null,
      hair: null,
      eyes: null,
      eyebrows: null,
      nose: null,
      mouth: null,
      beard: null,
      jersey: show === 'both' || show === 'jersey' ? modularJerseyId(kit) : null,
      shorts: show === 'both' || show === 'shorts' ? modularShortsId(pants) : null,
      socks: null,
      shoes: null,
      accessory: null,
    },
    slotColors: base.slotColors,
  }
}
