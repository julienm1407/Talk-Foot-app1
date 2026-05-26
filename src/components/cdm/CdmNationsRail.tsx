import { Link } from 'react-router-dom'
import { NATIONS } from '../../data/nations'
import { NationCard } from './NationCard'
import { cn } from '../../utils/cn'

/**
 * Carrousel horizontal des sélections nationales — vu sur la home en mode CDM.
 *
 * Variant `tile` affiche un format compact (drapeau pastille) ; `jersey` montre
 * le maillot PNG en grand format (plus accrocheur, plus lourd à charger).
 */
export function CdmNationsRail({
  variant = 'tile',
  className,
  title = 'Toutes les sélections',
  hint = '48 nations en lice',
}: {
  variant?: 'tile' | 'jersey'
  className?: string
  title?: string
  hint?: string
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4',
        className,
      )}
    >
      <header className="flex items-end justify-between px-1 pb-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl">
            {title}
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-wide text-tf-cdm-gold">{hint}</p>
        </div>
        <Link
          to="/nations"
          className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
        >
          Tout voir →
        </Link>
      </header>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {NATIONS.map((nation) => (
          <NationCard key={nation.iso} nation={nation} variant={variant} className="snap-start" />
        ))}
      </div>
    </section>
  )
}
