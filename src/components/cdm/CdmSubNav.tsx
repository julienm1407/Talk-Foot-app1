import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const ITEMS = [
  { to: '/cdm', label: 'Hub', end: true },
  { to: '/cdm/groupes', label: 'Poules' },
  { to: '/cdm/bracket', label: 'Arbre' },
  { to: '/cdm/stats', label: 'Stats' },
  { to: '/nations', label: 'Nations' },
] as const

/**
 * Sous-navigation persistante en tête des pages CDM.
 * Mobile : grille 3 colonnes (aucun crop). sm+ : ligne flexible.
 */
export function CdmSubNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Sections Coupe du Monde 2026"
      className={cn('relative w-full min-w-0', className)}
    >
      <div
        className={cn(
          'grid grid-cols-3 gap-2',
          'sm:flex sm:flex-wrap sm:items-center sm:gap-2.5',
          'lg:flex-nowrap',
        )}
      >
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : undefined}
            className={({ isActive }) =>
              cn(
                'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border-2',
                'px-3 py-2 text-[11px] font-black uppercase tracking-wide transition whitespace-nowrap',
                'sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-xs',
                isActive
                  ? 'border-tf-cdm-gold/70 bg-tf-cdm-gold/15 text-tf-cdm-gold'
                  : 'border-tf-c30-border bg-tf-c30-surface text-tf-app-muted hover:border-tf-cdm-gold/55 hover:text-tf-app-fg',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
