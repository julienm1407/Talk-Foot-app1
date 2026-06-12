import { Link } from 'react-router-dom'
import { useAppearance } from '../contexts/AppearanceContext'
import { resolvePageBackTarget } from '../utils/pageBackNavigation'
import { cn } from '../utils/cn'

export function TopBarBackButton({ pathname }: { pathname: string }) {
  const back = resolvePageBackTarget(pathname)
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  if (!back) return null

  return (
    <Link
      to={back.to}
      className={cn(
        'tf-nav-pill inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-[11px] font-black uppercase tracking-wide outline-none transition active:scale-[0.97] sm:px-3 sm:text-xs',
        L
          ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
          : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
      )}
      aria-label={`Retour — ${back.label}`}
    >
      <span aria-hidden>←</span>
      <span className="hidden min-[420px]:inline">{back.label}</span>
      <span className="min-[420px]:hidden">Retour</span>
    </Link>
  )
}
