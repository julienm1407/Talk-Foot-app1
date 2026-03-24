import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️' },
  { to: '/matches', label: 'Matchs', icon: '⚽' },
  { to: '/groups', label: 'Groupes', icon: '👥' },
  { to: '/rankings', label: 'Classement', icon: '🏆' },
] as const

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tf-grey-pastel/45 bg-tf-dark/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-4 gap-0.5 px-1 py-1.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold leading-tight outline-none transition',
                isActive
                  ? 'bg-tf-electric-soft text-tf-dark ring-1 ring-tf-electric/35'
                  : 'text-tf-grey-pastel hover:bg-white/10 hover:text-white',
                'focus-visible:ring-2 focus-visible:ring-tf-electric/45',
              )
            }
          >
            <span className="text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="max-w-full truncate text-center">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
