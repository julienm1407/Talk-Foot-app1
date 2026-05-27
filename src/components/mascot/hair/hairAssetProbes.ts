import type { HairStyle } from '../../../types/profile'

/** Points de contrôle (monde) — définis à la main pour chaque asset, pas générés. */
export const HAIR_ASSET_PROBES: Record<
  HairStyle,
  Partial<Record<'back' | 'side' | 'top' | 'front', ReadonlyArray<readonly [number, number]>>>
> = {
  buzz: {
    top: [
      [50, 14],
      [34, 24],
      [66, 24],
    ],
  },
  faded: {
    top: [
      [50, 15],
      [33, 25],
      [67, 25],
    ],
    side: [
      [28, 40],
      [72, 40],
    ],
  },
  short: {
    top: [
      [50, 13],
      [32, 26],
      [68, 26],
    ],
  },
  sidepart: {
    top: [
      [50, 13],
      [32, 26],
      [68, 26],
    ],
    front: [
      [52, 18],
      [56, 22],
    ],
  },
  undercut: {
    top: [
      [50, 15],
      [32, 24],
      [68, 24],
    ],
    side: [
      [28, 42],
      [72, 42],
    ],
  },
  wavy: {
    top: [
      [50, 12],
      [36, 22],
      [64, 22],
    ],
  },
  curly: {
    top: [
      [50, 11],
      [38, 14],
      [62, 14],
    ],
  },
  long: {
    top: [
      [50, 13],
      [32, 26],
      [68, 26],
    ],
    side: [
      [30, 50],
      [70, 50],
    ],
    back: [[66, 46]],
  },
  ponytail: {
    top: [
      [50, 14],
      [33, 25],
      [67, 25],
    ],
    side: [
      [31, 40],
      [69, 40],
    ],
    back: [
      [70, 46],
      [80, 68],
      [78, 82],
    ],
  },
  afro: {
    top: [
      [50, 9],
      [28, 38],
      [72, 38],
    ],
  },
  mohawk: {
    top: [
      [50, 10],
      [48, 22],
      [52, 22],
    ],
  },
}
