import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

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
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (!onBackdropClick) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBackdropClick()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBackdropClick])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[240] flex items-center justify-center p-4 sm:p-6',
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#030912]/88 backdrop-blur-md"
        onClick={onBackdropClick}
        aria-label="Fermer"
      />
      <div className="relative z-[1] flex max-h-[min(92dvh,920px)] w-full max-w-lg flex-col">
        {children}
      </div>
    </div>,
    document.body,
  )
}
