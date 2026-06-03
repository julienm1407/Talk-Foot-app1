import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

const BACKDROP_GUARD_MS = 380

/**
 * Modale boutique rendue dans document.body — centrée viewport, flou arrière-plan,
 * sans décaler le scroll de la page catalogue derrière.
 */
export function ShopModalPortal({
  children,
  onBackdropClick,
  ariaLabelledBy,
  className,
}: {
  children: ReactNode
  onBackdropClick?: () => void
  ariaLabelledBy?: string
  className?: string
}) {
  const backdropReadyAt = useRef(0)

  useEffect(() => {
    backdropReadyAt.current = Date.now() + BACKDROP_GUARD_MS
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleBackdrop = () => {
    if (!onBackdropClick) return
    if (Date.now() < backdropReadyAt.current) return
    onBackdropClick()
  }

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6', className)}
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
      <div className="relative z-[1] w-full max-w-lg">{children}</div>
    </div>,
    document.body,
  )
}
