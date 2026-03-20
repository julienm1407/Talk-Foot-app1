import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️', hint: 'Matchs & salons' },
  { to: '/calendar', label: 'Agenda', icon: '🗓️', hint: 'Matchs à venir' },
  { to: '/profile', label: 'Profil', icon: '👤', hint: 'Ton compte' },
]

export function SidebarNav() {
  return (
    <aside className="hidden sm:block">
      <div className="sticky top-[76px] space-y-3">
        <div className="tf-surface rounded-3xl p-5 shadow-tf-card">
          <div className="flex items-center gap-3">
            <LogoMark variant="compact" />
            <div className="leading-tight">
              <span className="sr-only">Talk Foot</span>
              <div className="text-[11px] font-semibold text-tf-grey">deuxième écran live</div>
            </div>
          </div>
        </div>

        <nav
          className="tf-surface rounded-3xl p-2 shadow-tf-card"
          aria-label="Sidebar"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 outline-none transition',
                  isActive
                    ? 'bg-tf-electric-soft text-tf-dark ring-1 ring-tf-electric/25'
                    : 'text-tf-dark/80 hover:bg-white/60 hover:text-tf-dark',
                  'focus-visible:ring-2 focus-visible:ring-tf-electric/35',
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <div className="text-sm font-black">{item.label}</div>
                  <div className="text-[11px] font-semibold text-tf-grey">
                    {item.hint}
                  </div>
                </div>
              </div>
              <span className="text-sm text-tf-grey/50 transition group-hover:text-tf-electric-deep">
                →
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="tf-surface rounded-3xl p-5 shadow-tf-card">
          <div className="text-sm font-black text-tf-dark">
            Conseil du jour
          </div>
          <div className="mt-1 text-xs font-semibold text-tf-grey">
            Ouvre un match et balance des réactions quand le rythme change.
          </div>
        </div>
      </div>
    </aside>
  )
}

