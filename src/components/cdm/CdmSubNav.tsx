import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const ITEMS = [
  { to: '/cdm', label: 'Hub', end: true },
  { to: '/cdm/groupes', label: 'Poules' },
  { to: '/cdm/bracket', label: 'Arbre' },
  { to: '/cdm/stats', label: 'Stats' },
  { to: '/nations', label: 'Nations' },
]

/**
 * Sous-navigation horizontale persistante en tête de toutes les pages CDM.
 */
export function CdmSubNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Sections Coupe du Monde 2026"
      className={cn(
        '-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 sm:[scrollbar-width:thin]',
        className,
      )}
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'snap-start rounded-full border-2 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide transition whitespace-nowrap',
              isActive
                ? 'border-tf-cdm-gold/70 bg-tf-cdm-gold/15 text-tf-cdm-gold'
                : 'border-tf-c30-border bg-tf-c30-surface text-tf-app-muted hover:border-tf-cdm-gold/55 hover:text-tf-app-fg',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
