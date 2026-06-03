import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getShopModalRoot } from '../../lib/shopModalRoot'

const BACKDROP_GUARD_MS = 380

/**
 * Modale boutique : portail vers #tf-shop-modal-root (position fixed en CSS global),
 * centré viewport + flou, sans participer au flux de la page catalogue.
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
      className="relative flex h-full min-h-0 w-full items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      {onBackdropClick ? (
        <button
          type="button"
          className="absolute inset-0 bg-[#030912]/88 backdrop-blur-md"
          onClick={handleBackdrop}
          aria-label="Fermer"
        />
      ) : (
        <div className="absolute inset-0 bg-[#030912]/88 backdrop-blur-md" aria-hidden />
      )}
      <div className="relative z-[1] w-full max-w-lg shrink-0">{children}</div>
    </div>,
    portalTarget,
  )
}
