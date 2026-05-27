/**
 * TalkFoot Mascot — proportions fixes, vue de face stricte.
 * Positionnement cheveux/barbe : voir `anchors/headAnchors.ts`.
 */
export const MASCOT_VIEW = { w: 100, h: 140 } as const

export const MASCOT = {
  cx: 50,
  head: { cx: 50, cy: 38, rx: 28, ry: 26 },
  faceY: 38,
  headTop: 14,
  faceSafe: { cx: 50, cy: 40, rx: 17, ry: 15 },
  neck: { topY: 60, bottomY: 71 },
  jersey: { x: 28, y: 70, w: 44, h: 46 },
  shoulderPad: 4.8,
  shorts: { x: 30, y: 114, w: 40, h: 8 },
  leg: { w: 12, h: 18, gap: 6 },
  legY: 120,
  shoeH: 5,
} as const
