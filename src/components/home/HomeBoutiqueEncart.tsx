import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type Layout = 'banner' | 'narrow'

/**
 * Accès boutique / monétisation depuis l’accueil (hors menu).
 * `banner` : bandeau large (ex. mobile). `narrow` : colonne type rail « Mon espace ».
 */
export function HomeBoutiqueEncart({
  className,
  layout = 'banner',
  onNavigate,
}: {
  className?: string
  layout?: Layout
  onNavigate?: () => void
}) {
  const narrow = layout === 'narrow'
  const go = onNavigate ? () => onNavigate() : undefined

  return (
    <div
      className={cn(
        'tf-interactive-press relative isolate flex w-full min-w-0 overflow-hidden border-2 border-amber-400/75 text-white shadow-lg',
        'bg-gradient-to-br from-violet-800 via-fuchsia-700 to-orange-600',
        'shadow-[0_16px_48px_-8px_rgba(147,51,234,0.45),0_0_0_1px_rgba(255,255,255,0.08)_inset]',
        narrow
          ? 'flex-col gap-2.5 rounded-xl px-3 py-3'
          : 'flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-4',
        className,
      )}
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
        🏅
      </span>

      <div className="relative min-w-0 flex-1 text-left">
        <span className="mb-1 inline-flex items-center rounded-md border border-white/35 bg-black/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/95 shadow-sm backdrop-blur-sm sm:mb-1.5 sm:px-2 sm:text-[9px]">
          Boutique & formules
        </span>
        <p
          className={cn(
            'font-display font-black leading-tight tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]',
            narrow ? 'text-sm' : 'text-lg sm:text-xl',
          )}
        >
          {narrow ? 'Soutiens Talk Foot' : 'Médailles & formules supporters'}
        </p>
        <p
          className={cn(
            'mt-0.5 text-pretty font-semibold leading-snug text-white/90',
            narrow ? 'text-[10px] leading-snug' : 'mt-1 text-xs sm:text-sm',
          )}
        >
          Packs de médailles, Ultra et Ambassadeur.
        </p>
      </div>

      <div
        className={cn(
          'relative flex w-full shrink-0 flex-col gap-2',
          !narrow && 'sm:w-auto sm:min-w-[11rem]',
        )}
      >
        <Link
          to="/boutique/medailles"
          onClick={go}
          className={cn(
            TF_FOCUS_VISIBLE,
            'flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-amber-950 shadow-md transition hover:bg-amber-300 sm:px-4 sm:text-xs',
          )}
        >
          Acheter des médailles
        </Link>
        <Link
          to="/formules"
          onClick={go}
          className={cn(
            TF_FOCUS_VISIBLE,
            'flex min-h-11 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-violet-900 shadow-md transition hover:bg-violet-50 sm:px-4 sm:text-xs',
          )}
        >
          Formules supporters
        </Link>
      </div>
    </div>
  )
}
