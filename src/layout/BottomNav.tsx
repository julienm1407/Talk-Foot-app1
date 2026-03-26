import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { BOTTOM_NAV_ROUTES, getAppSectionTheme } from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'

export function BottomNav() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <nav
      className={cn(
        'tf-app-bottomnav fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden',
        L
          ? 'border-tf-dark/12 bg-gradient-to-t from-white/98 via-tf-ice/95 to-white/92 shadow-[0_-10px_36px_rgba(1,30,51,0.08)]'
          : 'border-white/10 bg-gradient-to-t from-black/85 via-tf-night/98 to-tf-dark/95 shadow-[0_-14px_44px_rgba(0,0,0,0.4)]',
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-[1100px] grid-cols-4 gap-0.5 px-1 py-1.5">
        {BOTTOM_NAV_ROUTES.map(({ to, end, section, icon }) => {
          const th = getAppSectionTheme(section)
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'tf-nav-pill flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold leading-tight outline-none active:scale-[0.96]',
                  th.nav.focus,
                  isActive
                    ? cn(
                        'text-tf-dark ring-1 shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
                        section === 'home' && 'bg-sky-100 ring-sky-400/50',
                        section === 'matches' && 'bg-tf-electric-soft ring-tf-electric/40',
                        section === 'groups' && 'bg-tf-vibe-soft ring-violet-400/45',
                        section === 'rankings' && 'bg-amber-100 ring-amber-400/50',
                      )
                    : cn(
                        'text-tf-app-muted hover:text-tf-app-fg',
                        L ? 'hover:bg-tf-dark/[0.06]' : 'hover:bg-white/12',
                      ),
                )
              }
            >
              <span className="text-base leading-none" aria-hidden="true">
                {icon}
              </span>
              <span className="max-w-full truncate text-center">{th.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
