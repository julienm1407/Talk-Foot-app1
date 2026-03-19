import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

export function TopBar() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className="sticky top-0 z-40 border-b border-tf-grey-pastel/60 bg-tf-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-tf-grey/30"
          aria-label="Accueil Talk Foot"
        >
          <LogoMark />
          <div className="min-w-0 leading-tight">
            <div className="font-display text-sm font-black tracking-tight text-tf-dark">
              Talk Foot
            </div>
            <div className="hidden truncate text-[11px] font-semibold text-tf-grey sm:block">
              Réseau social foot en direct
            </div>
          </div>
        </Link>

        <nav className="hidden sm:block" aria-label="Primary">
          <div className="tf-surface rounded-[22px] p-1">
            <div className="grid grid-cols-4 gap-1">
              <TopLink to="/" label="Accueil" active={isHome} />
              <TopLink to="/calendar" label="Calendrier" />
              <TopLink to="/boutique" label="Boutique" />
              <TopLink to="/profile" label="Profil" />
            </div>
          </div>
        </nav>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 px-3 py-2 text-sm font-semibold text-tf-dark shadow-sm outline-none transition hover:bg-tf-white focus-visible:ring-2 focus-visible:ring-tf-grey/30',
              isActive && 'border-tf-grey/40 bg-tf-white',
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
          'rounded-[18px] px-3 py-2 text-center text-sm font-black text-tf-grey outline-none transition hover:bg-tf-white/80 hover:text-tf-dark focus-visible:ring-2 focus-visible:ring-tf-grey/30',
          (active ?? isActive) &&
            'bg-tf-white/90 text-tf-dark shadow-sm',
        )
      }
    >
      {label}
    </NavLink>
  )
}

