import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HAIR_STYLE_OPTIONS } from '../../data/characterCustomizerCatalog'
import { HEAD_ANCHOR_MAP, anchorInFaceSafeZone } from './avatarHeadAnchorMap'
import {
  beardAreaClipPathD,
  eyeShapeProbePoints,
  hairAreaClipPathD,
  hairBackAreaClipPathD,
  hairStyleProbePoints,
  isInBeardArea,
  isInFaceSafeZone,
  isInHairAreaRing,
} from './avatarHeadZones'
import type { BeardStyle } from '../../types/profile'

const BEARD_STYLES: BeardStyle[] = ['none', 'light', 'stubble', 'moustache', 'goatee', 'vanDyke', 'full']
const EYE_SHAPES = ['round', 'almond', 'narrow', 'wide'] as const

describe('avatarHeadZones', () => {
  it('exports non-empty SVG clip paths', () => {
    assert.ok(hairAreaClipPathD().includes('A'))
    assert.ok(beardAreaClipPathD().includes('M'))
    assert.ok(hairBackAreaClipPathD().includes('L'))
  })

  it('head anchors stay outside face safe zone', () => {
    for (const p of Object.values(HEAD_ANCHOR_MAP)) {
      assert.equal(anchorInFaceSafeZone(p), false)
    }
    assert.equal(isInFaceSafeZone(50, 52), true)
  })

  it('ponytail tail anchor is behind head', () => {
    assert.ok(HEAD_ANCHOR_MAP.backHead.x > 50)
    assert.ok(HEAD_ANCHOR_MAP.neckBack.y > HEAD_ANCHOR_MAP.backHead.y)
  })

  it('face center is protected; temple band accepts hair', () => {
    assert.equal(isInFaceSafeZone(50, 52), true)
    assert.equal(isInHairAreaRing(50, 52), false)
    assert.equal(isInFaceSafeZone(26, 42), false)
    assert.equal(isInHairAreaRing(26, 42), true)
  })

  for (const { id: hair } of HAIR_STYLE_OPTIONS) {
    it(`crown probes for ${hair} avoid face center`, () => {
      for (const p of hairStyleProbePoints(hair)) {
        if (p.x === 50 && p.y < 40) continue
        assert.equal(isInFaceSafeZone(50, 52), true, 'sanity: face center protected')
        if (Math.abs(p.x - 50) < 4 && p.y > 40) {
          assert.equal(isInFaceSafeZone(p.x, p.y), false, `hair ${hair} side probe must avoid face`)
        }
      }
    })
  }

  for (const shape of EYE_SHAPES) {
    it(`eye probes for ${shape} stay in face safe zone`, () => {
      for (const p of eyeShapeProbePoints(shape)) {
        assert.equal(isInFaceSafeZone(p.x, p.y), true)
      }
    })
  }

  it('beard chin probes stay in beard area', () => {
    for (const p of [
      { x: 50, y: 58 },
      { x: 42, y: 55 },
      { x: 58, y: 55 },
    ]) {
      assert.equal(isInBeardArea(p.x, p.y), true)
    }
  })

  it('beard styles with chin hair use beard area', () => {
    for (const beard of BEARD_STYLES) {
      if (beard === 'none' || beard === 'moustache') continue
      const y = beard === 'goatee' || beard === 'vanDyke' ? 58 : 55
      assert.equal(isInBeardArea(50, y), true, `beard ${beard}`)
    }
  })
})
