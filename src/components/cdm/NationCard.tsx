import { Link } from 'react-router-dom'
import type { Nation } from '../../data/nations'
import { NationCrest } from '../brand/NationCrest'
import { NationFavoriteButton } from './NationFavoriteButton'
import { cn } from '../../utils/cn'

/**
 * Carte d'une sélection nationale — utilisée dans le rail home, l'index /nations
 * et la grille boutique CDM.
 *
 * Note HTML : le bouton « favori » est positionné en sibling du <Link> dans un
 * wrapper relatif afin d'éviter un <button> imbriqué dans un <a> (invalide).
 */
export function NationCard({
  nation,
  variant = 'tile',
  className,
  hideFavorite = false,
}: {
  nation: Nation
  variant?: 'tile' | 'jersey'
  className?: string
  hideFavorite?: boolean
}) {
  return (
    <div
      className={cn(
        'group relative shrink-0',
        variant === 'jersey' ? 'h-56 w-44' : 'h-32 w-32',
        className,
      )}
    >
      <Link
        to={`/nation/${nation.iso.toLowerCase()}`}
        aria-label={`Fiche ${nation.nameFr}`}
        className={cn(
          'flex h-full w-full overflow-hidden rounded-tf-xl border shadow-tf-elev-1 outline-none transition',
          'hover:-translate-y-0.5 hover:shadow-tf-elev-2 focus-visible:ring-2 focus-visible:ring-offset-2',
          variant === 'jersey' ? 'flex-col' : 'flex-col',
        )}
        style={{
          background: `linear-gradient(160deg, ${nation.primary} 0%, ${nation.secondary} 75%, ${nation.accent} 100%)`,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
          style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
          aria-hidden
        />
        {variant === 'jersey' ? (
          <div className="relative z-0 flex flex-1 items-center justify-center px-2 pt-3">
            <img
              src={nation.jerseyUrl}
              alt={`Maillot ${nation.nameFr}`}
              loading="lazy"
              decoding="async"
              className="max-h-[8.5rem] w-auto select-none object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]"
              draggable={false}
            />
          </div>
        ) : (
          <div className="relative z-0 flex flex-1 items-center justify-center pt-4">
            <NationCrest nation={nation} size="lg" withRing />
          </div>
        )}
        <div className="relative z-10 bg-black/35 px-3 py-2 backdrop-blur-sm">
          <span className="block truncate text-center font-display text-sm font-black uppercase tracking-wide text-white">
            {nation.nameFr}
          </span>
        </div>
      </Link>
      {hideFavorite ? null : (
        <div className="absolute right-1.5 top-1.5 z-20">
          <NationFavoriteButton
            iso={nation.iso}
            nationLabel={nation.nameFr}
            size="sm"
            variant="icon"
          />
        </div>
      )}
    </div>
  )
}
