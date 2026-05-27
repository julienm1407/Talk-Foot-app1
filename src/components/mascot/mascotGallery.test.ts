import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { MascotAvatar } from './MascotAvatar'
import { MASCOT_JERSEY_GALLERY, MASCOT_LOOK_VARIANTS } from './mascotTestFixtures'
import { MASCOT, MASCOT_VIEW } from './mascotGeometry'
import { validateCharacterLook } from './anchors/anchorCollision'
import { getHairAssembly } from './hair/hairAssemblies'
import { HAIR_STYLE_OPTIONS } from '../../data/characterCustomizerCatalog'

describe('TalkFoot Mascot — galerie maillots', () => {
  for (const jersey of MASCOT_JERSEY_GALLERY) {
    it(`rend ${jersey.label} sans erreur`, () => {
      const look = MASCOT_LOOK_VARIANTS[0]
      const html = renderToStaticMarkup(
        React.createElement(MascotAvatar, {
          look,
          jerseyOverride: jersey.colors,
          supporterColors: null,
          variant: 'front',
        }),
      )
      assert.ok(html.includes('<svg'), `SVG manquant pour ${jersey.label}`)
      assert.ok(html.includes('maillot'), `calque maillot manquant pour ${jersey.label}`)
      assert.ok(html.includes('visage'), `calque visage manquant pour ${jersey.label}`)
      assert.ok(!html.includes('NaN'), `NaN dans le rendu ${jersey.label}`)
    })
  }
})

describe('TalkFoot Mascot — diversité avatars', () => {
  it('rend 10 looks distincts avec maillot PSG', () => {
    const psg = MASCOT_JERSEY_GALLERY.find((j) => j.id === 'psg')!.colors
    const hashes = new Set<string>()
    for (const look of MASCOT_LOOK_VARIANTS) {
      const html = renderToStaticMarkup(
        React.createElement(MascotAvatar, {
          look,
          jerseyOverride: psg,
          supporterColors: null,
          variant: 'front',
        }),
      )
      hashes.add(html.length.toString() + look.hairStyle + look.beard)
      assert.ok(html.includes('cheveux') && html.includes('corps'), 'structure modulaire')
    }
    assert.ok(hashes.size >= 8, 'les variantes doivent produire des rendus distincts')
  })

  for (const { id: hair } of HAIR_STYLE_OPTIONS) {
    it(`coiffure ${hair} : ancrage + zéro collision`, () => {
      const def = getHairAssembly(hair)
      assert.ok(def.parts.length > 0, `${hair}: assemblage vide`)
      assert.ok(def.parts.some((p) => p.kind === 'TOP'), `${hair}: TOP_HAIR manquant`)
      const issues = validateCharacterLook({ hairStyle: hair, beard: 'none' })
      assert.equal(issues.length, 0, `${hair}: ${issues[0]?.reason}`)
    })
  }
})

describe('TalkFoot Mascot — géométrie fixe', () => {
  it('viewBox et tête centrés', () => {
    assert.equal(MASCOT.cx, MASCOT_VIEW.w / 2)
    assert.equal(MASCOT.head.cx, MASCOT.cx)
    assert.ok(MASCOT.head.ry > MASCOT.jersey.h * 0.4, 'grosse tête disproportionnée')
  })

  it('maillot dans le viewBox', () => {
    const j = MASCOT.jersey
    assert.ok(j.x >= 0 && j.x + j.w <= MASCOT_VIEW.w)
    assert.ok(j.y + j.h <= MASCOT_VIEW.h)
  })
})
