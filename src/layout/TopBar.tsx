import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

export function TopBar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-40 border-b border-tf-grey-pastel/60 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="group inline-flex min-w-0 items-center gap-2.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 sm:gap-3"
          aria-label="Accueil Talk Foot"
        >
          <LogoMark variant="header" />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-[11px] font-semibold text-tf-grey">Foot live & salons</p>
          </div>
        </Link>

        <nav className="hidden sm:block" aria-label="Primary">
          <div className="tf-surface rounded-[22px] p-1">
            <div className="grid grid-cols-4 gap-1">
              <TopLink to="/" label="Accueil" active={isHome} />
              <TopLink to="/calendar" label="Agenda" />
              <TopLink to="/boutique" label="Boutique" />
              <TopLink to="/profile" label="Profil" />
            </div>
          </div>
        </nav>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 rounded-2xl border border-tf-grey-pastel/55 bg-white/95 px-3 py-2 text-sm font-semibold text-tf-dark shadow-sm outline-none transition hover:border-tf-electric/30 focus-visible:ring-2 focus-visible:ring-tf-electric/35',
              isActive && 'border-tf-electric/35 bg-tf-electric-soft',
            )
          }
          aria-label="Ouvrir le profil"
        >
          <span className="text-base" aria-hidden="true">
            🧢
          </span>
          <span className="hidden sm:inline">Profil</span>
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
          'rounded-[18px] px-3 py-2 text-center text-sm font-black text-tf-grey outline-none transition hover:bg-white/80 hover:text-tf-dark focus-visible:ring-2 focus-visible:ring-tf-electric/35',
          (active ?? isActive) &&
            'bg-white text-tf-dark shadow-sm ring-1 ring-tf-electric/25',
        )
      }
    >
      {label}
    </NavLink>
  )
}
