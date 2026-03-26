import { NavLink } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'
import { OVERLAY_NAV_ROUTES, getAppSectionTheme } from '../theme/appSectionThemes'

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
          {OVERLAY_NAV_ROUTES.map(({ to, end, section, icon, hint }) => {
            const th = getAppSectionTheme(section)
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 outline-none transition',
                    th.nav.focus,
                    isActive
                      ? cn(th.nav.active, 'ring-1 ring-inset ring-black/5')
                      : cn('text-tf-dark/80 hover:text-tf-dark', th.nav.inactiveHover),
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none" aria-hidden="true">
                    {icon}
                  </span>
                  <div>
                    <div className="text-sm font-black">{th.label}</div>
                    <div className="text-[11px] font-semibold text-tf-grey">{hint}</div>
                  </div>
                </div>
                <span
                  className={cn('text-sm text-tf-grey/50 transition', th.nav.arrowHover)}
                >
                  →
                </span>
              </NavLink>
            )
          })}
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
