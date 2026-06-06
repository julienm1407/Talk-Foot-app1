const APP_MODAL_ROOT_ID = 'tf-app-modal-root'

/** Racine portail pour modales (hors #root, z-index dédié, compatible mobile). */
export function getModalPortalRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  let root = document.getElementById(APP_MODAL_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = APP_MODAL_ROOT_ID
    root.setAttribute('aria-hidden', 'true')
    document.body.appendChild(root)
  }
  return root
}
