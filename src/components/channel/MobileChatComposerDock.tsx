import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useIsMobileTouchViewport } from '../../hooks/useIsMobileTouchViewport'
import { cn } from '../../utils/cn'

/** Hauteur réservée dans la grille pour ne pas masquer le fil sous le dock fixe. */
export const MOBILE_CHAT_COMPOSER_DOCK_HEIGHT =
  'calc(11rem + env(safe-area-inset-bottom, 0px))'

/** Live match : saisie + barre Match / Compo / Paris / Stade. */
export const CHANNEL_MOBILE_COMPOSER_STACK_HEIGHT =
  'calc(8.75rem + env(safe-area-inset-bottom, 0px))'

/**
 * Sur mobile tactile : barre de saisie fixée au-dessus de la BottomNav (portail body).
 * Sur desktop : rendu inline classique.
 */
export function MobileChatComposerDock({
  children,
  className,
  gridRowClassName,
  ariaLabel = 'Écrire un message',
  variant = 'nav',
}: {
  children: ReactNode
  className?: string
  gridRowClassName?: string
  ariaLabel?: string
  /** `channel` : au-dessus des onglets Match / Compo / Paris / Stade (pas de BottomNav). */
  variant?: 'nav' | 'channel'
}) {
  const mobileTouch = useIsMobileTouchViewport()
  const spacerHeight =
    variant === 'channel' ? CHANNEL_MOBILE_COMPOSER_STACK_HEIGHT : MOBILE_CHAT_COMPOSER_DOCK_HEIGHT

  if (mobileTouch && typeof document !== 'undefined') {
    return (
      <>
        {variant === 'channel' ? null : (
          <div
            className={cn('shrink-0 lg:hidden', gridRowClassName)}
            style={{ height: spacerHeight }}
            aria-hidden
          />
        )}
        {createPortal(
          <div
            className={cn(
              'tf-chat-compose-mobile-shell pointer-events-auto touch-manipulation',
              variant === 'channel' && 'tf-chat-compose-mobile-shell--channel',
            )}
            data-tf-chat-compose={variant}
            role="region"
            aria-label={ariaLabel}
          >
            <div className={cn('border-t px-3 py-2.5 sm:px-4 sm:py-3', className)}>{children}</div>
          </div>,
          document.body,
        )}
      </>
    )
  }

  if (variant === 'channel') {
    return <>{children}</>
  }

  return (
    <div
      className={cn(
        'relative z-20 shrink-0 border-t px-3 py-2.5 sm:px-4 sm:py-3',
        gridRowClassName,
        className,
      )}
    >
      {children}
    </div>
  )
}
