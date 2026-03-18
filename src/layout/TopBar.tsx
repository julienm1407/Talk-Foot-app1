import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

export function TopBar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
          aria-label="Accueil Talk Foot"
        >
          <LogoMark />
          <div className="leading-tight">
            <div className="text-sm font-black tracking-tight text-slate-900">
              Talk Foot
            </div>
            <div className="text-[11px] font-semibold text-slate-600">
              Réseau social foot en direct
            </div>
          </div>
        </Link>

        <nav className="hidden sm:block" aria-label="Primary">
          <div className="tf-surface rounded-[22px] p-1">
            <div className="grid grid-cols-3 gap-1">
              <TopLink to="/" label="Accueil" active={isHome} />
              <TopLink to="/calendar" label="Calendrier" />
              <TopLink to="/profile" label="Profil" />
            </div>
          </div>
        </nav>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/20',
              isActive && 'border-slate-300 bg-white',
            )
          }
          aria-label="Ouvrir le profil"
        >
          <span className="text-base" aria-hidden="true">
            🧢
          </span>
          <span className="hidden sm:inline">Mon profil</span>
        </NavLink>
      </div>
    </header>
  )
}

function TopLink({
  to,
  label,
  active,
}: {
  to: string
  label: string
  active?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-[18px] px-3 py-2 text-center text-sm font-black text-slate-700 outline-none transition hover:bg-white/60 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-600/20',
          (active ?? isActive) &&
            'bg-white/80 text-slate-900 shadow-sm',
        )
      }
    >
      {label}
    </NavLink>
  )
}

