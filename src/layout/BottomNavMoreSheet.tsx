import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import {
  BOTTOM_NAV_MORE_ROUTES,
  getAppSectionTheme,
  isRouteActiveForSection,
} from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

/** Sous-menu mobile — Paris, classements, boutique (au-dessus de la BottomNav). */
export function BottomNavMoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="tf-bottom-nav-more-sheet fixed inset-0 lg:hidden" data-tf-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Fermer le menu Plus"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Plus d'options"
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto w-full max-w-tf-content rounded-t-[24px] border shadow-[0_-16px_48px_rgba(0,0,0,0.35)]',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          'mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]',
          L
            ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)]'
            : 'border-white/12 bg-tf-dark',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-4 py-3',
            L ? 'border-tf-dark/10' : 'border-white/10',
          )}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-tf-app-muted">Navigation</p>
            <p className="text-sm font-black text-tf-app-fg">Plus</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              TF_FOCUS_VISIBLE,
              'grid min-h-tf-touch min-w-tf-touch place-items-center rounded-xl text-lg font-black',
              L ? 'bg-tf-dark/[0.06] text-tf-dark' : 'bg-white/10 text-white',
            )}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2" aria-label="Sections secondaires">
          {BOTTOM_NAV_MORE_ROUTES.map(({ to, section, icon, hint }) => {
            const th = getAppSectionTheme(section)
            const active = isRouteActiveForSection(section, location.pathname, location.hash)
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'tf-nav-pill flex min-h-tf-touch items-center gap-3 rounded-2xl px-3 py-2.5 outline-none transition active:scale-[0.99]',
                  th.nav.focus,
                  active
                    ? cn(
                        'ring-1 shadow-sm',
                        L
                          ? 'bg-tf-white text-tf-dark ring-tf-dark/20'
                          : 'bg-white/12 text-white ring-white/20',
                        section === 'rankings' &&
                          (L ? 'ring-tf-nav-rankings/50' : 'ring-tf-nav-rankings/55'),
                        section === 'pronostic' &&
                          (L ? 'ring-tf-cta/50' : 'ring-tf-cta/55'),
                        section === 'boutique' &&
                          (L ? 'ring-amber-400/45' : 'ring-amber-300/40'),
                      )
                    : cn(
                        L ? 'text-tf-app-muted hover:bg-tf-dark/[0.05] hover:text-tf-app-fg' : 'text-sky-200/92 hover:bg-white/10 hover:text-white',
                      ),
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/[0.06] text-xl dark:bg-white/10" aria-hidden>
                  {icon}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-black">{th.label}</span>
                  <span className="block text-[11px] font-semibold text-tf-app-muted">{hint}</span>
                </span>
                <span className="shrink-0 text-sm text-tf-app-muted" aria-hidden>
                  →
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
