import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

type Layout = 'banner' | 'narrow'

/**
 * Accès boutique depuis l’accueil (hors menu).
 * `banner` : bandeau large (ex. mobile). `narrow` : colonne type rail « Mon espace ».
 */
export function HomeBoutiqueEncart({
  className,
  layout = 'banner',
}: {
  className?: string
  layout?: Layout
}) {
  const narrow = layout === 'narrow'

  return (
    <Link
      to="/boutique"
      className={cn(
        'tf-interactive-press group relative isolate flex w-full min-w-0 overflow-hidden border-2 border-amber-400/75 text-white shadow-lg outline-none transition',
        'bg-gradient-to-br from-violet-800 via-fuchsia-700 to-orange-600',
        'shadow-[0_16px_48px_-8px_rgba(147,51,234,0.45),0_0_0_1px_rgba(255,255,255,0.08)_inset]',
        'hover:border-amber-300 hover:shadow-[0_22px_56px_-8px_rgba(234,88,12,0.4),0_0_0_1px_rgba(255,255,255,0.12)_inset] hover:brightness-[1.04]',
        'focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        narrow
          ? 'flex-col gap-2.5 rounded-xl px-3 py-3'
          : 'flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-4',
        className,
      )}
      aria-label="Ouvrir la boutique — maillots, accessoires et médailles"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-amber-400/25 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-40 rounded-full bg-fuchsia-500/30 blur-3xl"
        aria-hidden
      />

      <span
        className={cn(
          'relative grid shrink-0 place-items-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25 backdrop-blur-sm',
          narrow ? 'size-12 text-xl' : 'size-14 text-2xl sm:size-16 sm:text-3xl',
        )}
        aria-hidden
      >
        🛍️
      </span>

      <div className="relative min-w-0 flex-1 text-left">
        <span className="mb-1 inline-flex items-center rounded-md border border-white/35 bg-black/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/95 shadow-sm backdrop-blur-sm sm:mb-1.5 sm:px-2 sm:text-[9px]">
          Boutique
        </span>
        <p
          className={cn(
            'font-display font-black leading-tight tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]',
            narrow ? 'text-sm' : 'text-lg sm:text-xl',
          )}
        >
          {narrow ? 'Tribune & perso' : 'Équipe-toi comme en tribune'}
        </p>
        <p
          className={cn(
            'mt-0.5 text-pretty font-semibold leading-snug text-white/90',
            narrow ? 'text-[10px] leading-snug' : 'mt-1 text-xs sm:text-sm',
          )}
        >
          Maillots, accessoires & médailles.
        </p>
      </div>

      <span
        className={cn(
          'relative flex w-full shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-violet-900 shadow-md transition sm:px-5 sm:py-3 sm:text-xs',
          !narrow && 'sm:w-auto',
          'group-hover:bg-amber-50 group-hover:text-orange-950',
        )}
      >
        Voir la boutique
        <span className="ml-1 transition group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </span>
    </Link>
  )
}
