import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️' },
  { to: '/calendar', label: 'Calendrier', icon: '🗓️' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/70 bg-white/80 backdrop-blur sm:hidden"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-3 gap-1 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold outline-none transition',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                'focus-visible:ring-2 focus-visible:ring-blue-600/20',
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

