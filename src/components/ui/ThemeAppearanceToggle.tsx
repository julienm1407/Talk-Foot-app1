import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

type Variant = 'bar' | 'floating' | 'headerMinimal' | 'headerIcon'

/**
 * Bascule Jour / Nuit — `headerIcon` : une icône (action inverse, ex. lune en mode jour).
 */
export function ThemeAppearanceToggle({
  className,
  variant = 'bar',
}: {
  className?: string
  variant?: Variant
}) {
  const { appearance, setAppearance } = useAppearance()
  const L = appearance === 'light'
  const minimal = variant === 'headerMinimal'
  const iconOnly = variant === 'headerIcon'

  if (iconOnly) {
    const next = L ? 'dark' : 'light'
    return (
      <button
        type="button"
        onClick={() => setAppearance(next)}
        title={L ? 'Passer en nuit stade' : 'Passer en mode jour'}
        aria-label={L ? 'Passer en nuit stade' : 'Passer en mode jour'}
        className={cn(
          TF_FOCUS_VISIBLE,
          'tf-nav-pill grid size-9 shrink-0 place-items-center rounded-xl border text-lg leading-none transition active:scale-[0.96] sm:size-10',
          L
            ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
            : 'border-white/15 bg-white/[0.08] text-white hover:border-white/25 hover:bg-white/[0.12]',
          className,
        )}
      >
        <span aria-hidden>{L ? '🌙' : '☀️'}</span>
      </button>
    )
  }

  const track =
    variant === 'floating'
      ? L
        ? 'border-tf-dark/12 bg-tf-grey-pastel/35'
        : 'border-white/15 bg-black/35'
      : minimal
        ? L
          ? 'border-tf-dark/10 bg-tf-dark/[0.04]'
          : 'border-white/10 bg-black/20'
        : L
          ? 'border-tf-dark/14 bg-tf-dark/[0.06]'
          : 'border-white/15 bg-black/30'

  const segBase = minimal
    ? 'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[15px] leading-none outline-none transition focus-visible:ring-2 focus-visible:ring-sky-400/50 sm:size-8 sm:text-base'
    : 'inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] outline-none transition focus-visible:ring-2 focus-visible:ring-sky-400/50'

  const segBar =
    'min-h-9 px-2 text-[10px] font-black uppercase tracking-wide sm:min-h-10 sm:px-2.5 sm:text-[11px]'

  return (
    <div
      role="group"
      aria-label="Ambiance d’affichage : jour ou nuit stade"
      className={cn(
        'inline-flex shrink-0 border p-0.5',
        minimal ? 'rounded-xl' : 'rounded-2xl',
        track,
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={L}
        onClick={() => setAppearance('light')}
        title="Mode jour"
        className={cn(
          segBase,
          !minimal && segBar,
          L
            ? minimal
              ? 'bg-tf-white/95 text-tf-dark shadow-none ring-1 ring-tf-dark/10'
              : 'bg-tf-white text-tf-dark shadow-sm ring-1 ring-sky-400/35'
            : minimal
              ? 'text-sky-200/80 hover:bg-white/12 hover:text-white'
              : 'text-sky-100/78 hover:bg-white/10 hover:text-white',
        )}
      >
        <span aria-hidden>☀️</span>
        <span className={minimal ? 'sr-only' : 'max-[380px]:sr-only'}>Jour</span>
      </button>
      <button
        type="button"
        aria-pressed={!L}
        onClick={() => setAppearance('dark')}
        title="Nuit stade"
        className={cn(
          segBase,
          !minimal && segBar,
          !L
            ? minimal
              ? 'bg-white/12 text-white ring-1 ring-white/15'
              : 'bg-[#0a1628] text-white shadow-md ring-1 ring-orange-400/35'
            : minimal
              ? 'text-tf-grey hover:bg-tf-dark/[0.07] hover:text-tf-dark'
              : 'text-tf-dark/65 hover:bg-white/70 hover:text-tf-dark',
        )}
      >
        <span aria-hidden>🌙</span>
        <span className={minimal ? 'sr-only' : 'max-[380px]:sr-only'}>Nuit</span>
      </button>
    </div>
  )
}
