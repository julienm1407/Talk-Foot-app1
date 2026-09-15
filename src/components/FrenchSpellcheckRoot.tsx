import { useEffect } from 'react'
import { applyNativeFrenchSpellcheck } from '../utils/frAutoCorrect'

/** Active le correcteur du clavier / navigateur sur tous les champs texte (sauf mots de passe). */
export function FrenchSpellcheckRoot() {
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const t = event.target
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
        applyNativeFrenchSpellcheck(t)
        return
      }
      if (t instanceof HTMLElement && t.isContentEditable) {
        if (!t.lang) t.lang = 'fr'
        if (t.getAttribute('spellcheck') !== 'false') t.spellcheck = true
      }
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])
  return null
}
