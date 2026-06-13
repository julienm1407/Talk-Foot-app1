import { useMemo, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import {
  BOTTOM_NAV_MORE_ROUTES,
  BOTTOM_NAV_PRIMARY_ROUTES,
  getAppSectionTheme,
  isRouteActiveForSection,
} from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { BottomNavMoreSheet } from './BottomNavMoreSheet'
import { useIsMobileTouchViewport } from '../hooks/useIsMobileTouchViewport'
import { getBottomNavPortalRoot } from '../utils/bottomNavPortalRoot'

function navActiveRing(section: (typeof BOTTOM_NAV_PRIMARY_ROUTES)[number]['section'], L: boolean) {
  if (section === 'matches') return L ? 'ring-tf-nav-match/50' : 'ring-tf-nav-match/55'
  if (section === 'groups') return L ? 'ring-tf-nav-groups/50' : 'ring-tf-nav-groups/55'
  return L ? 'ring-tf-dark/22' : 'ring-white/20'
}

export function BottomNav() {
  const location = useLocation()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const showMobileNav = useIsMobileTouchViewport()
  const [moreOpen, setMoreOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    setPortalTarget(getBottomNavPortalRoot())
  }, [])

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname, location.hash])

  const closeMore = () => setMoreOpen(false)

  const moreActive = useMemo(
    () =>
      BOTTOM_NAV_MORE_ROUTES.some(({ section }) =>
        isRouteActiveForSection(section, location.pathname, location.hash),
      ),
    [location.pathname, location.hash],
  )

  if (!showMobileNav) return null

  const chrome = (
    <>
      <BottomNavMoreSheet open={moreOpen} onClose={closeMore} />
      <nav
        className={cn(
          'tf-app-bottomnav tf-app-bottomnav-shell border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl',
          L
            ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)] shadow-[0_-8px_32px_rgba(2,52,88,0.08)]'
            : 'border-tf-dark-alt/50 bg-tf-dark shadow-[0_-12px_40px_rgba(0,0,0,0.35)]',
        )}
        aria-label="Bottom navigation"
      >
        <div className="mx-auto grid w-full max-w-tf-content grid-cols-4 gap-1 px-2 py-2">
          {BOTTOM_NAV_PRIMARY_ROUTES.map(({ to, end, section, icon }) => {
            const th = getAppSectionTheme(section)
            const active = isRouteActiveForSection(section, location.pathname, location.hash)
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMore}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tf-nav-pill flex min-h-tf-touch flex-col items-center justify-center gap-1 rounded-tf-xl px-1.5 py-2 text-[11px] font-bold leading-tight outline-none active:scale-[0.96]',
                  th.nav.focus,
                  active
                    ? cn(
                        'ring-1 shadow-sm',
                        L ? 'bg-tf-white text-tf-dark' : 'bg-white/12 text-white',
                        navActiveRing(section, L),
                      )
                    : cn(
                        L ? 'text-tf-app-muted hover:text-tf-app-fg' : 'text-sky-200/92 hover:text-white',
                        L ? 'hover:bg-tf-dark/[0.06]' : 'hover:bg-white/12',
                      ),
                )}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {icon}
                </span>
                <span className="max-w-full truncate text-center">{th.label}</span>
              </NavLink>
            )
          })}

          <button
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="Plus — pronostic, classements, boutique"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              TF_FOCUS_VISIBLE,
              'tf-nav-pill flex min-h-tf-touch flex-col items-center justify-center gap-1 rounded-tf-xl px-1.5 py-2 text-[11px] font-bold leading-tight outline-none active:scale-[0.96]',
              moreOpen || moreActive
                ? cn(
                    'ring-1 shadow-sm',
                    L ? 'bg-tf-white text-tf-dark ring-amber-400/45' : 'bg-white/12 text-white ring-amber-300/40',
                  )
                : cn(
                    L ? 'text-tf-app-muted hover:bg-tf-dark/[0.06] hover:text-tf-app-fg' : 'text-sky-200/92 hover:bg-white/12 hover:text-white',
                  ),
            )}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              ⋯
            </span>
            <span className="max-w-full truncate text-center">Plus</span>
          </button>
        </div>
      </nav>
    </>
  )

  if (!portalTarget) return null

  return createPortal(chrome, portalTarget)
}
