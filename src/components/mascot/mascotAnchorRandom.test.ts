import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import type { AvatarCharacterLook, BeardStyle, HairStyle } from '../../types/profile'
import { HAIR_STYLE_OPTIONS, BEARD_STYLE_OPTIONS } from '../../data/characterCustomizerCatalog'
import { MascotAvatar } from './MascotAvatar'
import { validateCharacterLook } from './anchors/anchorCollision'

const HAIR_STYLES = HAIR_STYLE_OPTIONS.map((o) => o.id as HairStyle)
const BEARD_STYLES = BEARD_STYLE_OPTIONS.map((o) => o.id as BeardStyle)

const SKINS = ['#f5d0a9', '#d4a574', '#c68642', '#8d5524', '#5c3d2e', '#6b4423']
const HAIRS = ['#1c1917', '#78350f', '#92400e', '#1e1b4b', '#dc2626', '#57534e', '#0f172a']
const EYES = ['#422006', '#1e3a5f', '#14532d', '#312e81', '#0c4a6e']

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

function randomLook(seed: number): AvatarCharacterLook {
  const rng = mulberry32(seed)
  return {
    hairColor: pick(rng, HAIRS),
    hairStyle: pick(rng, HAIR_STYLES),
    eyeColor: pick(rng, EYES),
    eyeShape: pick(rng, ['round', 'almond', 'narrow', 'wide'] as const),
    eyelashStyle: 'none',
    beard: pick(rng, BEARD_STYLES),
    skinTone: pick(rng, SKINS),
    faceExpression: pick(rng, ['neutral', 'happy', 'hyped', 'serious'] as const),
    headwear: pick(rng, ['none', 'none', 'cap', 'beanie'] as const),
    glasses: pick(rng, ['none', 'none', 'round', 'sport'] as const),
    outfitPrimary: '#1e293b',
    outfitSecondary: '#64748b',
    outfitPattern: 'solid',
    supporterTint: false,
  }
}

describe('TalkFoot Mascot — assemblages & 50 avatars aléatoires', () => {
  it('chaque coiffure seule respecte HEAD_SAFE_AREA', () => {
    for (const hair of HAIR_STYLES) {
      const issues = validateCharacterLook({ hairStyle: hair, beard: 'none' })
      assert.equal(issues.length, 0, `${hair}: ${issues.map((i) => i.reason).join(', ')}`)
    }
  })

  it('chaque barbe seule respecte yeux / bouche', () => {
    for (const beard of BEARD_STYLES) {
      if (beard === 'none') continue
      const issues = validateCharacterLook({ hairStyle: 'buzz', beard })
      assert.equal(issues.length, 0, `${beard}: ${issues.map((i) => i.reason).join(', ')}`)
    }
  })

  for (let seed = 1; seed <= 50; seed++) {
    it(`avatar aléatoire #${seed} — pas de collision visage`, () => {
      const look = randomLook(seed * 7919)
      const issues = validateCharacterLook(look)
      assert.equal(
        issues.length,
        0,
        `#${seed} ${look.hairStyle}/${look.beard}: ${issues.map((i) => `${i.reason}@(${i.point.x.toFixed(1)},${i.point.y.toFixed(1)})`).join('; ')}`,
      )
    })
  }
})
