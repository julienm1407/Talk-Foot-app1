import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import {
  BOTTOM_NAV_ROUTES,
  getAppSectionTheme,
  isRouteActiveForSection,
} from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'

export function BottomNav() {
  const location = useLocation()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <nav
      className={cn(
        'tf-app-bottomnav fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden',
        L
          ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)] shadow-[0_-8px_32px_rgba(2,52,88,0.08)]'
          : 'border-tf-dark-alt/50 bg-tf-dark shadow-[0_-12px_40px_rgba(0,0,0,0.35)]',
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto grid w-full max-w-tf-content grid-cols-4 gap-0.5 px-1 py-1.5">
        {BOTTOM_NAV_ROUTES.map(({ to, end, section, icon }) => {
          const th = getAppSectionTheme(section)
          const active = isRouteActiveForSection(section, location.pathname)
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'tf-nav-pill flex min-h-tf-touch flex-col items-center justify-center gap-0.5 rounded-tf-xl px-1 py-1.5 text-[10px] font-semibold leading-tight outline-none active:scale-[0.96]',
                th.nav.focus,
                active
                  ? cn(
                      'ring-1 shadow-sm',
                      L
                        ? 'bg-tf-white text-tf-dark ring-tf-dark/22'
                        : 'bg-white/12 text-white ring-white/20',
                      section === 'matches' &&
                        (L ? 'ring-tf-nav-match/50' : 'ring-tf-nav-match/55'),
                      section === 'groups' &&
                        (L ? 'ring-tf-nav-groups/50' : 'ring-tf-nav-groups/55'),
                      section === 'rankings' &&
                        (L ? 'ring-tf-nav-rankings/50' : 'ring-tf-nav-rankings/55'),
                    )
                  : cn(
                      L ? 'text-tf-app-muted hover:text-tf-app-fg' : 'text-sky-200/92 hover:text-white',
                      L ? 'hover:bg-tf-dark/[0.06]' : 'hover:bg-white/12',
                    ),
              )}
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
