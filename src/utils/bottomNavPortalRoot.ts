const BOTTOM_NAV_ROOT_ID = 'tf-bottom-nav-root'

/** Racine portail pour la BottomNav mobile — hors #root, au-dessus du scroll profil. */
export function getBottomNavPortalRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  let root = document.getElementById(BOTTOM_NAV_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = BOTTOM_NAV_ROOT_ID
    root.setAttribute('aria-hidden', 'true')
    document.body.appendChild(root)
  }
  return root
}
