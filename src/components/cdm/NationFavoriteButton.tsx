import { useCallback, useMemo } from 'react'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { cn } from '../../utils/cn'

/**
 * Bouton « Suivre cette sélection » — toggle persistant qui ajoute la nation
 * (code ISO-3) aux favoris du supporter. Utilisé sur les fiches pays, dans le
 * rail nations, et partout où le contexte le permet.
 *
 * Le composant gère son propre statut (cocheé / décoché), s'assure de ne pas
 * dépasser la limite et expose les variantes d'affichage utilisées dans l'app.
 */
type Size = 'sm' | 'md' | 'lg'
type Variant = 'solid' | 'ghost' | 'icon'

const SIZE_PILL: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const SIZE_ICON: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

export function NationFavoriteButton({
  iso,
  nationLabel,
  size = 'md',
  variant = 'solid',
  className,
  onChange,
}: {
  iso: string
  nationLabel: string
  size?: Size
  variant?: Variant
  className?: string
  onChange?: (next: boolean) => void
}) {
  const { favoriteNationIsos, toggleFavoriteNation, maxFavoriteNations } =
    useFanPreferences()

  const code = iso.toUpperCase()
  const isFav = favoriteNationIsos.includes(code)
  const atCapacity = !isFav && favoriteNationIsos.length >= maxFavoriteNations

  const tooltip = useMemo(() => {
    if (isFav) return `Retirer ${nationLabel} de mes sélections favorites`
    if (atCapacity)
      return `Limite atteinte (${maxFavoriteNations} sélections favorites max.). Retire-en une pour ajouter ${nationLabel}.`
    return `Suivre ${nationLabel} — alertes match imminent + mise en avant sur l'accueil`
  }, [isFav, atCapacity, nationLabel, maxFavoriteNations])

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (atCapacity) return
      toggleFavoriteNation(code)
      onChange?.(!isFav)
    },
    [atCapacity, toggleFavoriteNation, code, onChange, isFav],
  )

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        title={tooltip}
        aria-pressed={isFav}
        disabled={atCapacity}
        className={cn(
          'group/fav inline-flex shrink-0 items-center justify-center rounded-full border outline-none transition',
          'focus-visible:ring-2 focus-visible:ring-tf-cdm-gold focus-visible:ring-offset-2',
          SIZE_ICON[size],
          isFav
            ? 'border-tf-cdm-gold/70 bg-tf-cdm-gold/15 text-tf-cdm-gold shadow-[0_0_0_1px_rgba(244,196,48,0.35)]'
            : 'border-white/25 bg-black/35 text-white/85 hover:border-tf-cdm-gold/55 hover:text-tf-cdm-gold disabled:opacity-50',
          className,
        )}
      >
        <StarIcon filled={isFav} className="h-4 w-4" />
      </button>
    )
  }

  const sharedPill = cn(
    'group/fav inline-flex items-center justify-center gap-2 rounded-full border font-display font-bold uppercase tracking-wide outline-none transition',
    'focus-visible:ring-2 focus-visible:ring-tf-cdm-gold focus-visible:ring-offset-2',
    SIZE_PILL[size],
  )

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      aria-pressed={isFav}
      disabled={atCapacity}
      className={cn(
        sharedPill,
        isFav
          ? 'border-tf-cdm-gold bg-tf-cdm-gold text-tf-cdm-deep shadow-tf-elev-1 hover:bg-tf-cdm-gold/90'
          : variant === 'ghost'
            ? 'border-white/30 bg-transparent text-white hover:border-tf-cdm-gold/55 hover:text-tf-cdm-gold disabled:opacity-50'
            : 'border-white/40 bg-black/40 text-white hover:border-tf-cdm-gold/55 hover:bg-black/60 disabled:opacity-50',
        className,
      )}
    >
      <StarIcon filled={isFav} className="h-3.5 w-3.5" />
      <span>{isFav ? 'Sélection suivie' : 'Suivre cette sélection'}</span>
    </button>
  )
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.6l2.95 6.13 6.78.99-4.91 4.66 1.17 6.74L12 17.94l-5.99 3.18 1.17-6.74L2.27 9.72l6.78-.99L12 2.6z" />
    </svg>
  )
}
