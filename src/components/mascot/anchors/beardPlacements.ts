import type { BeardStyle } from '../../../types/profile'
import type { BeardStyleDefinition } from './placementTypes'
import { fullBeardPath, goateePath, jawLinePath, moustachePath } from './localPaths'

export const BEARD_STYLE_DEFINITIONS: Partial<Record<BeardStyle, BeardStyleDefinition>> = {
  moustache: {
    placement: { anchor: 'MOUTH_LINE', offsetY: -3, scale: 1, width: 26, height: 10 },
    clip: 'beardMouth',
    probes: [
      [-10, 2],
      [10, 2],
      [0, 4],
      [-6, 5],
      [6, 5],
    ],
    buildPaths: (w, h) => [moustachePath(w, h)],
  },
  stubble: {
    placement: { anchor: 'JAW', offsetY: 0, scale: 1, width: 32, height: 16 },
    clip: 'beardJaw',
    probes: [
      [-12, 4],
      [-6, 8],
      [0, 10],
      [6, 8],
      [12, 4],
      [-8, 2],
      [8, 2],
    ],
    dots: [
      [-11, 2, 0.7],
      [-7, 4, 0.7],
      [-3, 5, 0.7],
      [0, 6, 0.7],
      [3, 5, 0.7],
      [7, 4, 0.7],
      [11, 2, 0.7],
      [-9, 8, 0.65],
      [-4, 10, 0.65],
      [4, 10, 0.65],
      [9, 8, 0.65],
    ],
    buildPaths: () => [],
  },
  light: {
    placement: { anchor: 'JAW', offsetY: 2, scale: 1, width: 30, height: 12 },
    clip: 'beardJaw',
    probes: [
      [-12, 4],
      [0, 8],
      [12, 4],
    ],
    buildPaths: (w, h) => [jawLinePath(w, h)],
  },
  goatee: {
    placement: { anchor: 'CHIN', offsetY: -2, scale: 1, width: 14, height: 14 },
    clip: 'beardChin',
    probes: [
      [0, 4],
      [-5, 6],
      [5, 6],
      [0, 10],
    ],
    buildPaths: (w, h) => [goateePath(w, h)],
  },
  vanDyke: {
    placement: { anchor: 'CHIN', offsetY: -2, scale: 1, width: 12, height: 12 },
    clip: 'beardChin',
    probes: [
      [0, 6],
      [-4, 8],
      [4, 8],
    ],
    buildPaths: (w, h) => [goateePath(w, h)],
    secondaryPlacement: { anchor: 'MOUTH_LINE', offsetY: -4, scale: 1, width: 20, height: 8 },
    secondaryProbes: [
      [-7, 3],
      [7, 3],
      [0, 4],
    ],
    secondaryPaths: (w, h) => [moustachePath(w, h)],
  },
  full: {
    placement: { anchor: 'JAW', offsetY: -4, scale: 1, width: 36, height: 22 },
    clip: 'beardJaw',
    probes: [
      [-14, 6],
      [-10, 14],
      [0, 18],
      [10, 14],
      [14, 6],
      [0, 10],
    ],
    buildPaths: (w, h) => [fullBeardPath(w, h)],
  },
}

export function getBeardDefinition(beard: BeardStyle): BeardStyleDefinition | null {
  if (beard === 'none') return null
  return BEARD_STYLE_DEFINITIONS[beard] ?? null
}
