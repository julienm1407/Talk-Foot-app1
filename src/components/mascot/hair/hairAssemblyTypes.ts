import type { HairStyle } from '../../../types/profile'

export type HairPartKind = 'TOP' | 'FRONT' | 'SIDE' | 'BACK'

/** BACK_HAIR → tête → visage → barbe → FRONT_HAIR */
export type HairStack = 'back' | 'front'

export type HairPartClip = 'headMask' | 'headMaskRing' | 'behindOnly'

export type HairPartDef = {
  kind: HairPartKind
  stack: HairStack
  clip: HairPartClip
  pathD: string
  /** Points monde (viewBox) pour tests collision */
  probes: ReadonlyArray<readonly [number, number]>
}

export type HairAssembly = {
  style: HairStyle
  parts: HairPartDef[]
}
