import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️' },
  { to: '/calendar', label: 'Calendrier', icon: '🗓️' },
  { to: '/boutique', label: 'Boutique', icon: '🛒' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tf-grey-pastel/50 bg-tf-white/90 backdrop-blur sm:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-4 gap-1 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold outline-none transition',
                isActive
                  ? 'bg-tf-grey-pastel/50 text-tf-dark'
                  : 'text-tf-grey hover:bg-tf-grey-pastel/30 hover:text-tf-dark',
                'focus-visible:ring-2 focus-visible:ring-tf-grey/30',
              )
            }
          >
            <span className="text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

