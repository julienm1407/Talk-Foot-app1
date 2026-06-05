import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getShopModalRoot } from '../../lib/shopModalRoot'

const BACKDROP_GUARD_MS = 380

/**
 * Modale boutique : portail plein écran (#tf-shop-modal-root) + flou sur toute la page.
 */
export function ShopModalPortal({
  children,
  onBackdropClick,
  ariaLabelledBy,
}: {
  children: ReactNode
  onBackdropClick?: () => void
  ariaLabelledBy?: string
}) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const backdropReadyAt = useRef(0)

  useLayoutEffect(() => {
    setPortalTarget(getShopModalRoot())
  }, [])

  useEffect(() => {
    if (!portalTarget) return
    backdropReadyAt.current = Date.now() + BACKDROP_GUARD_MS
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [portalTarget])

  useEffect(() => {
    if (!onBackdropClick) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (Date.now() < backdropReadyAt.current) return
        onBackdropClick()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBackdropClick])

  const handleBackdrop = () => {
    if (!onBackdropClick) return
    if (Date.now() < backdropReadyAt.current) return
    onBackdropClick()
  }

  if (!portalTarget) return null

  return createPortal(
    <div
      className="absolute inset-0 size-full min-h-[100dvh] min-w-full overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      {onBackdropClick ? (
        <button
          type="button"
          className="tf-shop-modal-backdrop z-0 cursor-default"
          onClick={handleBackdrop}
          aria-label="Fermer"
        />
      ) : (
        <div className="tf-shop-modal-backdrop z-0" aria-hidden />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[1] flex items-start justify-center overflow-y-auto overscroll-contain px-[max(0.75rem,env(safe-area-inset-left,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] [-webkit-overflow-scrolling:touch] sm:items-center sm:overflow-hidden sm:overscroll-none sm:p-6"
      >
        <div className="pointer-events-auto my-auto w-full max-w-lg shrink-0 sm:my-0">{children}</div>
      </div>
    </div>,
    portalTarget,
  )
}
