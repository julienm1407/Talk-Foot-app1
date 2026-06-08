import { createPortal } from 'react-dom'
import { Button } from '../ui/Button'
import { useIsMobileTouchViewport } from '../../hooks/useIsMobileTouchViewport'
import { cn } from '../../utils/cn'

const MOBILE_JOIN_DOCK_HEIGHT =
  'calc(7.25rem + env(safe-area-inset-bottom, 0px))'

export function GroupJoinWriteFooter({
  message,
  joinOtherError,
  onJoin,
  className,
}: {
  message: string
  joinOtherError?: string | null
  onJoin: () => void
  className?: string
}) {
  const mobileTouch = useIsMobileTouchViewport()

  const shellClass = cn(
    'border-t border-tf-grey-pastel/50 bg-gradient-to-b from-slate-50/95 to-tf-ice/90 px-4 py-4 sm:px-5',
    mobileTouch && 'rounded-t-2xl shadow-[0_-12px_40px_rgba(15,40,70,0.14)]',
    className,
  )

  const panel = (
    <div className={shellClass}>
      <p className="text-center text-sm font-bold text-tf-dark">{message}</p>
      <Button
        type="button"
        variant="primary"
        className="mx-auto mt-3 block min-h-12 w-full max-w-sm touch-manipulation rounded-2xl text-sm font-black"
        onClick={onJoin}
      >
        Rejoindre pour écrire
      </Button>
      {joinOtherError ? (
        <p className="mx-auto mt-2 max-w-sm text-center text-xs font-semibold text-amber-800">
          {joinOtherError}
        </p>
      ) : null}
    </div>
  )

  if (mobileTouch && typeof document !== 'undefined') {
    return (
      <>
        <div
          className="max-lg:row-start-3 shrink-0 lg:hidden"
          style={{ height: MOBILE_JOIN_DOCK_HEIGHT }}
          aria-hidden
        />
        {createPortal(
          <div
            className="tf-group-join-mobile-shell pointer-events-auto touch-manipulation"
            role="region"
            aria-label="Rejoindre la tribune pour écrire"
          >
            {panel}
          </div>,
          document.body,
        )}
      </>
    )
  }

  return <div className="relative z-30 shrink-0 max-lg:row-start-3">{panel}</div>
}
