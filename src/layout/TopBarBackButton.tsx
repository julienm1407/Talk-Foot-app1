import { Link } from 'react-router-dom'
import { useAppearance } from '../contexts/AppearanceContext'
import { resolvePageBackTarget } from '../utils/pageBackNavigation'
import { cn } from '../utils/cn'
import { useIsMobileTouchViewport } from '../hooks/useIsMobileTouchViewport'
import { hardNavigateTo } from '../utils/hardNavigate'

export function TopBarBackButton({
  pathname,
  compact = false,
}: {
  pathname: string
  compact?: boolean
}) {
  const back = resolvePageBackTarget(pathname)
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const mobileTouch = useIsMobileTouchViewport()
  const useHardNav =
    mobileTouch && (pathname === '/profile' || pathname.startsWith('/profile/'))

  if (!back) return null

  const className = cn(
        'tf-nav-pill inline-flex shrink-0 items-center justify-center rounded-xl border font-black uppercase tracking-wide outline-none transition active:scale-[0.97]',
        compact
          ? 'size-9 gap-0 p-0 text-base min-[420px]:h-9 min-[420px]:w-auto min-[420px]:gap-1 min-[420px]:px-2.5 min-[420px]:text-[11px] sm:px-3 sm:text-xs'
          : 'h-9 gap-1 px-2.5 text-[11px] sm:px-3 sm:text-xs',
        L
          ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
          : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
      )

  const label = (
    <>
      <span aria-hidden>←</span>
      {compact ? (
        <span className="hidden min-[420px]:inline">{back.label}</span>
      ) : (
        <>
          <span className="hidden min-[420px]:inline">{back.label}</span>
          <span className="min-[420px]:hidden">Retour</span>
        </>
      )}
    </>
  )

  if (useHardNav) {
    return (
      <button
        type="button"
        onClick={() => hardNavigateTo(back.to)}
        className={className}
        aria-label={`Retour — ${back.label}`}
      >
        {label}
      </button>
    )
  }

  return (
    <Link to={back.to} className={className} aria-label={`Retour — ${back.label}`}>
      {label}
    </Link>
  )
}
