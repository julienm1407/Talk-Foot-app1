export const SHOP_MODAL_ROOT_ID = 'tf-shop-modal-root'

/** Conteneur fixe hors #root — les modales boutique s’y accrochent (évite le rendu en pied de page). */
export function getShopModalRoot(): HTMLElement {
  let root = document.getElementById(SHOP_MODAL_ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = SHOP_MODAL_ROOT_ID
    document.body.appendChild(root)
  }
  return root
}
