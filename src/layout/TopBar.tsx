import { Link, NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'

const NAV_ITEMS = [
  { to: '/', label: 'Accueil' },
  { to: '/matches', label: 'Matchs' },
  { to: '/groups', label: 'Groupes' },
  { to: '/rankings', label: 'Classements' },
] as const

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-tf-grey-pastel/60 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1240px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          to="/"
          className="group inline-flex min-w-0 shrink-0 items-center gap-2.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 sm:gap-3"
          aria-label="Accueil Talk Foot"
        >
          <LogoMark variant="header" />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-[11px] font-semibold text-tf-grey">Foot live & salons</p>
          </div>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-center min-[700px]:flex"
          aria-label="Primary"
        >
          <div className="tf-surface max-w-full rounded-[22px] p-1">
            <div className="flex max-w-full gap-0.5 overflow-x-auto px-0.5 py-0.5 [-webkit-overflow-scrolling:touch]">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'shrink-0 rounded-[18px] px-2.5 py-2 text-center text-[13px] font-black text-tf-grey outline-none transition hover:bg-white/80 hover:text-tf-dark focus-visible:ring-2 focus-visible:ring-tf-electric/35 sm:px-3',
                      isActive && 'bg-white text-tf-dark shadow-sm ring-1 ring-tf-electric/25',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'ml-auto inline-flex shrink-0 items-center gap-2 rounded-2xl border border-tf-grey-pastel/55 bg-white/95 px-3 py-2 text-sm font-semibold text-tf-dark shadow-sm outline-none transition hover:border-tf-electric/30 focus-visible:ring-2 focus-visible:ring-tf-electric/35',
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
