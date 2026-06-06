/** Racine portail pour modales (évite l’attente d’un useLayoutEffect avant le 1er affichage). */
export function getModalPortalRoot(): HTMLElement | null {
  return typeof document !== 'undefined' ? document.body : null
}
