import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'
import {
  OVERLAY_NAV_ROUTES,
  getAppSectionTheme,
  isRouteActiveForSection,
} from '../theme/appSectionThemes'

export function OverlayMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const location = useLocation()
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-tf-night/35 backdrop-blur-[2px]"
        aria-label="Fermer le menu"
        onClick={onClose}
      />

      <div className="absolute left-3 top-[72px] w-[min(100%,20rem)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[28px] border border-tf-grey-pastel/55 bg-white/95 shadow-tf-card backdrop-blur-md sm:left-6">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <LogoMark variant="compact" />
            <div className="leading-tight">
              <span className="sr-only">Talk Foot</span>
              <div className="text-[11px] font-semibold text-tf-grey">Navigation</div>
            </div>
          </div>
        </div>

        <nav className="border-t border-tf-grey-pastel/50 px-2 py-2" aria-label="Menu">
          {OVERLAY_NAV_ROUTES.map(({ to, end, section, icon, hint }) => {
            const th = getAppSectionTheme(section)
            const active = isRouteActiveForSection(section, location.pathname)
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 outline-none transition',
                  th.nav.focus,
                  active
                    ? cn(th.nav.active, 'ring-1 ring-inset ring-black/5')
                    : cn('text-tf-dark/80 hover:text-tf-dark', th.nav.inactiveHover),
                )}
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
                  className={cn(
                    'text-sm text-tf-grey/50 transition',
                    th.nav.arrowHover,
                  )}
                >
                  →
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-tf-grey-pastel/50 px-4 py-3">
          <div className="text-xs font-semibold text-tf-grey">
            Astuce: glisse horizontalement pour changer de page.
          </div>
        </div>
      </div>
    </div>
  )
}

