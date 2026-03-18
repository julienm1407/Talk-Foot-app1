import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

const items = [
  { to: '/', label: 'Accueil', icon: '🏟️', hint: 'Matchs + serveurs' },
  { to: '/calendar', label: 'Calendrier', icon: '🗓️', hint: 'Matchs à venir' },
  { to: '/profile', label: 'Profil', icon: '👤', hint: 'Ton compte' },
]

export function SidebarNav() {
  return (
    <aside className="hidden sm:block">
      <div className="sticky top-[76px] space-y-3">
        <div className="tf-surface rounded-3xl p-5 shadow-[0_18px_55px_rgba(11,27,58,.10)]">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight text-slate-900">
                Talk Foot
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                deuxième écran live
              </div>
            </div>
          </div>
        </div>

        <nav
          className="tf-surface rounded-3xl p-2 shadow-[0_18px_55px_rgba(11,27,58,.10)]"
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
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  'focus-visible:ring-2 focus-visible:ring-blue-600/20',
                )
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <div className="text-sm font-black">{item.label}</div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    {item.hint}
                  </div>
                </div>
              </div>
              <span className="text-sm text-slate-400 transition group-hover:text-slate-600">
                →
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="tf-surface rounded-3xl p-5 shadow-[0_18px_55px_rgba(11,27,58,.10)]">
          <div className="text-sm font-black text-slate-900">
            Conseil du jour
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-600">
            Ouvre un match et balance des réactions quand le rythme change.
          </div>
        </div>
      </div>
    </aside>
  )
}

