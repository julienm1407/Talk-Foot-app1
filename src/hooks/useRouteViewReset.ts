import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * iOS Safari / PWA : après une longue page scrollable (profil), l’URL peut changer
 * sans que la couche GPU précédente soit retirée. On remet le scroll à zéro,
 * on libère body.overflow et on force un repaint.
 */
export function useRouteViewReset() {
  const location = useLocation()

  useEffect(() => {
    document.body.style.overflow = ''

    const main = document.getElementById('main-content')
    if (main) {
      for (const el of main.querySelectorAll<HTMLElement>('[data-tf-route-scroll]')) {
        el.scrollTop = 0
      }
    }

    for (const id of ['tf-shop-modal-root', 'tf-app-modal-root'] as const) {
      const root = document.getElementById(id)
      if (root?.childElementCount) root.replaceChildren()
    }

    requestAnimationFrame(() => {
      void document.body.offsetHeight
      requestAnimationFrame(() => {
        void document.body.offsetHeight
      })
    })
  }, [location.pathname, location.search, location.hash, location.key])
}
