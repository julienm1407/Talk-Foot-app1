import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useAppearance } from '../../contexts/AppearanceContext'

/** Complète la BottomNav (Match / Groupes dans la barre ; reste ici en raccourcis). */
const ACTIONS = [
  { to: '/pronostic', label: 'Paris', icon: '🎯' },
  { to: '/rankings', label: 'Classements', icon: '🏆' },
  { to: '/boutique', label: 'Boutique', icon: '🛍️' },
] as const

/** Bandeau horizontal — défile en pleine largeur, puces une ligne (évite le crop vertical). */
export function MobileQuickActionsBar({
  onCreateGroup,
  className,
}: {
  onCreateGroup: () => void
  className?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  const chip = (extra: string) =>
    cn(
      TF_FOCUS_VISIBLE,
      'tf-interactive-press snap-start shrink-0',
      'inline-flex min-h-tf-touch items-center gap-2 rounded-full border px-3.5 py-2',
      extra,
    )

  return (
    <nav
      className={cn(
        'relative min-w-0',
        '-mx-[var(--tf-page-gutter)] w-[calc(100%+2*var(--tf-page-gutter))] max-w-[100vw]',
        className,
      )}
      aria-label="Actions rapides"
    >
      <div
        className={cn(
          'flex items-stretch gap-2 overflow-x-auto overscroll-x-contain',
          'px-[var(--tf-page-gutter)] py-1',
          'scroll-px-[var(--tf-page-gutter)]',
          '[-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'snap-x snap-mandatory',
        )}
      >
        <button
          type="button"
          onClick={onCreateGroup}
          className={chip(
            'border-tf-cta-hover/40 bg-tf-cta text-white shadow-tf-cta active:scale-[0.98]',
          )}
        >
          <span className="text-base leading-none" aria-hidden>
            ➕
          </span>
          <span className="whitespace-nowrap text-xs font-black">Créer tribune</span>
        </button>

        {ACTIONS.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={chip(
              L
                ? 'border-tf-dark/12 bg-white/95 text-tf-dark shadow-sm active:bg-tf-ice'
                : 'border-white/12 bg-white/[0.06] text-white active:bg-white/10',
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {icon}
            </span>
            <span className="whitespace-nowrap text-xs font-black">{label}</span>
          </Link>
        ))}

        {/* Marge de fin — dernière puce jamais collée / coupée au bord */}
        <div className="w-[max(0.5rem,env(safe-area-inset-right,0px))] shrink-0 snap-none" aria-hidden />
      </div>
    </nav>
  )
}
