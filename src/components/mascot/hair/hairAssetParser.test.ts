import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HAIR_ASSET_LIBRARY, HAIR_ASSEMBLIES } from './hairAssetRegistry'
import { HAIR_STYLE_OPTIONS } from '../../../data/characterCustomizerCatalog'
import { validateCharacterLook } from '../anchors/anchorCollision'

describe('Bibliothèque SVG cheveux (manuelle)', () => {
  for (const { id } of HAIR_STYLE_OPTIONS) {
    it(`${id} : charge les calques SVG et TOP_HAIR présent`, () => {
      const lib = HAIR_ASSET_LIBRARY[id]
      assert.ok(lib.top.length > 0, `${id}: top vide`)
      const asm = HAIR_ASSEMBLIES[id]
      assert.ok(asm.parts.some((p) => p.kind === 'TOP'))
      const issues = validateCharacterLook({ hairStyle: id, beard: 'none' })
      assert.equal(issues.length, 0, issues.map((i) => i.reason).join(', '))
    })
  }

  it('ponytail : chignon + queue en BACK_HAIR (derrière la tête)', () => {
    const asm = HAIR_ASSEMBLIES.ponytail
    const back = asm.parts.filter((p) => p.stack === 'back')
    assert.equal(back.length, 1)
    assert.ok(back[0]!.pathD.includes('M 66 41'), 'chignon arrière')
    assert.ok(back[0]!.pathD.includes('M 68 48'), 'queue arrière')
    assert.ok(back.every((p) => p.clip === 'behindOnly'))
    assert.ok(asm.parts.some((p) => p.kind === 'TOP' && p.stack === 'front'))
    assert.ok(asm.parts.some((p) => p.kind === 'SIDE' && p.stack === 'front'))
  })
})
