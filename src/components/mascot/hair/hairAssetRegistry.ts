import type { HairStyle } from '../../../types/profile'
import type { HairAssembly, HairPartClip, HairPartDef, HairPartKind } from './hairAssemblyTypes'
import { parseHairAssetSvg, type HairAssetLayerId, type ParsedHairAsset } from './hairAssetParser'
import { HAIR_ASSET_PROBES } from './hairAssetProbes'

import buzzSvg from './assets/buzz.svg?raw'
import fadeSvg from './assets/fade.svg?raw'
import shortSvg from './assets/short.svg?raw'
import partSvg from './assets/part.svg?raw'
import undercutSvg from './assets/undercut.svg?raw'
import wavySvg from './assets/wavy.svg?raw'
import curlySvg from './assets/curly.svg?raw'
import longSvg from './assets/long.svg?raw'
import ponytailSvg from './assets/ponytail.svg?raw'
import volumeSvg from './assets/volume.svg?raw'
import mohawkSvg from './assets/mohawk.svg?raw'

/** Fichiers SVG dessinés à la main — source unique, jamais générés. */
const ASSET_FILE_BY_STYLE: Record<HairStyle, string> = {
  buzz: buzzSvg,
  faded: fadeSvg,
  short: shortSvg,
  sidepart: partSvg,
  undercut: undercutSvg,
  wavy: wavySvg,
  curly: curlySvg,
  long: longSvg,
  ponytail: ponytailSvg,
  afro: volumeSvg,
  mohawk: mohawkSvg,
}

const LAYER_TO_KIND: Record<HairAssetLayerId, HairPartKind> = {
  back: 'BACK',
  side: 'SIDE',
  top: 'TOP',
  front: 'FRONT',
}

function clipForLayer(layer: HairAssetLayerId, style: HairStyle): HairPartClip {
  if (layer === 'back') return 'behindOnly'
  if (layer === 'top' && style === 'afro') return 'headMask'
  return 'headMaskRing'
}

function stackForLayer(layer: HairAssetLayerId): HairPartDef['stack'] {
  return layer === 'back' ? 'back' : 'front'
}

function buildParts(style: HairStyle, asset: ParsedHairAsset): HairPartDef[] {
  const probesByLayer = HAIR_ASSET_PROBES[style]
  const order: HairAssetLayerId[] = ['back', 'top', 'side', 'front']
  const parts: HairPartDef[] = []

  for (const layer of order) {
    const pathD = asset[layer]
    if (!pathD) continue

    parts.push({
      kind: LAYER_TO_KIND[layer],
      stack: stackForLayer(layer),
      clip: clipForLayer(layer, style),
      pathD,
      probes: probesByLayer?.[layer] ?? [],
    })
  }

  return parts
}

function buildAssembly(style: HairStyle): HairAssembly {
  const raw = ASSET_FILE_BY_STYLE[style]
  const asset = parseHairAssetSvg(raw)
  const parts = buildParts(style, asset)

  if (!parts.some((p) => p.kind === 'TOP')) {
    throw new Error(`Asset cheveux "${style}" : calque TOP_HAIR manquant ou vide`)
  }

  return { style, parts }
}

export const HAIR_ASSET_LIBRARY: Record<HairStyle, ParsedHairAsset> = Object.fromEntries(
  (Object.keys(ASSET_FILE_BY_STYLE) as HairStyle[]).map((style) => [
    style,
    parseHairAssetSvg(ASSET_FILE_BY_STYLE[style]),
  ]),
) as Record<HairStyle, ParsedHairAsset>

export const HAIR_ASSEMBLIES: Record<HairStyle, HairAssembly> = Object.fromEntries(
  (Object.keys(ASSET_FILE_BY_STYLE) as HairStyle[]).map((style) => [style, buildAssembly(style)]),
) as Record<HairStyle, HairAssembly>

export function getHairAssembly(style: HairStyle): HairAssembly {
  return HAIR_ASSEMBLIES[style] ?? HAIR_ASSEMBLIES.short
}

export function hairStyleUsesBackLayer(style: HairStyle): boolean {
  return getHairAssembly(style).parts.some((p) => p.stack === 'back')
}
