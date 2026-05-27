/** Points d’attache fixes sur le crâne — seule source de positionnement cheveux/barbe. */
export type HeadAnchorId =
  | 'HEAD_CENTER'
  | 'HEAD_TOP'
  | 'FOREHEAD'
  | 'EYE_LINE'
  | 'NOSE_LINE'
  | 'MOUTH_LINE'
  | 'CHIN'
  | 'JAW'
  | 'LEFT_TEMPLE'
  | 'RIGHT_TEMPLE'
  | 'HEAD_BACK'

export type AnchorPlacement = {
  anchor: HeadAnchorId
  offsetX?: number
  offsetY?: number
  scale?: number
  width?: number
  height?: number
}

export type AnchorPoint = { x: number; y: number }

export type ResolvedPlacement = {
  x: number
  y: number
  scale: number
  width: number
  height: number
}

export type HairClipZone = 'hairRing' | 'hairSides' | 'hairBack' | 'hairCrown'

export type HairStyleDefinition = {
  placement: AnchorPlacement
  clip: HairClipZone
  /** Points locaux (origine = ancre) pour tests collision */
  probes: ReadonlyArray<readonly [number, number]>
  buildPath: (width: number, height: number) => string
  backLayer?: {
    placement: AnchorPlacement
    clip: HairClipZone
    probes: ReadonlyArray<readonly [number, number]>
    buildPath: (width: number, height: number) => string
  }
}

export type BeardClipZone = 'beardJaw' | 'beardMouth' | 'beardChin'

export type BeardStyleDefinition = {
  placement: AnchorPlacement
  clip: BeardClipZone
  probes: ReadonlyArray<readonly [number, number]>
  /** Path(s) locaux ; plusieurs paths séparés par | si besoin */
  buildPaths: (width: number, height: number) => string[]
  secondaryPlacement?: AnchorPlacement
  secondaryPaths?: (width: number, height: number) => string[]
  secondaryProbes?: ReadonlyArray<readonly [number, number]>
  dots?: ReadonlyArray<readonly [number, number, number]>
}
