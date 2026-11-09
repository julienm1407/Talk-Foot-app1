import { describe, expect, it } from 'vitest'
import { translateSportMonksLiveTextToFr } from './translateSportMonksLiveEnToFr'

describe('translateSportMonksLiveTextToFr', () => {
  it('traduit buts, cartons, tirs et changements SportMonks', () => {
    expect(translateSportMonksLiveTextToFr('First Half begins.')).toBe('Début de la première mi-temps.')
    expect(translateSportMonksLiveTextToFr('Yellow card for Vitinha.')).toBe('Carton jaune pour Vitinha.')
    expect(
      translateSportMonksLiveTextToFr(
        'Substitution, Paris Saint Germain. Dembélé replaces Kolo Muani.',
      ),
    ).toMatch(/Changement pour Paris Saint Germain/)
    expect(translateSportMonksLiveTextToFr('Attempt blocked. Ferran Torres right footed shot from the centre of the box is blocked.')).toMatch(
      /Tir contré/,
    )
    expect(translateSportMonksLiveTextToFr('Corner, Lens. Conceded by Marquinhos.')).toMatch(/Corner pour Lens/)
    expect(translateSportMonksLiveTextToFr('Goal! Ferran Torres scores.')).toMatch(/^But !/)
  })
})
