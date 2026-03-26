import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoMark } from './LogoMark'
import { useProfile } from '../hooks/useProfile'
import {
  TOP_NAV_ROUTES,
  getAppSectionFromPath,
  getAppSectionTheme,
} from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'

export function TopBar() {
  const { profile } = useProfile()
  const { appearance, toggleAppearance } = useAppearance()
  const L = appearance === 'light'
  const navPillBase = cn(
    'tf-nav-pill shrink-0 rounded-[18px] px-2.5 py-2 text-center text-[13px] font-black outline-none transition sm:px-3',
    'text-tf-app-muted hover:text-tf-app-fg',
  )
  const location = useLocation()
  const routeSection = getAppSectionFromPath(location.pathname)
  const stripeTheme = getAppSectionTheme(routeSection)
  const profileTheme = getAppSectionTheme('profile')
  const profileActive = location.pathname.startsWith('/profile')

  const hideOnHomeDesktop = location.pathname === '/' || location.pathname === ''

  return (
    <header
      className={cn(
        'tf-app-topbar relative sticky top-0 z-40 border-b backdrop-blur-xl',
        L
          ? 'border-tf-dark/12 bg-gradient-to-b from-white via-tf-ice/90 to-[#e2eef6] shadow-[0_12px_40px_rgba(1,30,51,0.08)]'
          : 'border-white/10 bg-gradient-to-b from-tf-void via-tf-night to-[#071422] shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]',
        hideOnHomeDesktop && 'xl:hidden',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b via-transparent to-transparent',
          L ? 'from-orange-500/[0.05]' : 'from-orange-500/[0.07]',
        )}
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-[1240px] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6">
        <Link
          to="/"
          className={cn(
            'group tf-nav-pill inline-flex min-w-0 shrink-0 items-center gap-2.5 rounded-2xl border outline-none transition focus-visible:ring-2 focus-visible:ring-sky-400/40 sm:gap-3 active:opacity-90',
            L
              ? 'border-tf-dark/12 bg-white/95 shadow-[0_6px_24px_rgba(1,30,51,0.08)] hover:border-tf-dark/18 hover:bg-white'
              : 'border-white/12 bg-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.28)] hover:border-white/20 hover:bg-white/[0.11]',
          )}
          aria-label="Accueil Talk Foot"
        >
          <LogoMark
            variant="header"
            className={cn(L ? 'drop-shadow-none' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]')}
          />
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-[11px] font-bold text-tf-app-muted">Foot live & salons</p>
          </div>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 justify-center min-[700px]:flex"
          aria-label="Primary"
        >
          <div
            className={cn(
              'max-w-full rounded-[22px] border p-1 backdrop-blur-md',
              L
                ? 'border-tf-dark/10 bg-white/80 shadow-sm ring-1 ring-tf-dark/[0.04]'
                : 'border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5',
            )}
          >
            <div className="flex max-w-full gap-0.5 overflow-x-auto px-0.5 py-0.5 [-webkit-overflow-scrolling:touch]">
              {TOP_NAV_ROUTES.map(({ to, end, section }) => {
                const th = getAppSectionTheme(section)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        navPillBase,
                        th.nav.focus,
                        isActive
                          ? th.nav.active
                          : cn(
                              th.nav.inactiveHover,
                              L ? 'hover:bg-tf-dark/[0.06] hover:text-tf-app-fg' : 'hover:bg-white/12 hover:text-tf-app-fg',
                            ),
                      )
                    }
                  >
                    {th.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={toggleAppearance}
          className={cn(
            'tf-nav-pill ml-auto inline-flex shrink-0 items-center justify-center rounded-2xl border p-2 text-lg outline-none transition min-[700px]:ml-0 sm:p-2.5',
            L
              ? 'border-tf-dark/12 bg-white/90 text-tf-app-fg hover:bg-white'
              : 'border-white/15 bg-white/[0.06] text-tf-app-fg hover:bg-white/10',
          )}
          aria-label={L ? 'Passer en mode nuit stade' : 'Passer en mode jour'}
        >
          {L ? '🌙' : '☀️'}
        </button>

        <NavLink
          to="/profile"
          className={cn(
            'tf-nav-pill inline-flex shrink-0 items-center gap-2 rounded-2xl border px-2.5 py-2 text-sm font-semibold outline-none sm:gap-2.5 sm:px-3',
            profileTheme.nav.focus,
            profileActive
              ? cn(
                  profileTheme.nav.active,
                  'border-amber-400/55 bg-gradient-to-br from-white to-amber-50/60 text-tf-dark shadow-md',
                )
              : cn(
                  L
                    ? 'border-tf-dark/12 bg-white/90 text-tf-dark shadow-sm hover:border-sky-400/40 hover:bg-white'
                    : 'border-white/15 bg-white/[0.06] text-tf-app-fg shadow-[0_6px_24px_rgba(0,0,0,0.2)] hover:border-sky-400/35 hover:bg-white/10',
                  profileTheme.nav.inactiveHover,
                ),
          )}
          aria-label={`Profil — niveau ${profile.level}`}
        >
          {profile.profilePhotoDataUrl ? (
            <img
              src={profile.profilePhotoDataUrl}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover ring-2 ring-white/25"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="text-base" aria-hidden="true">
              🧢
            </span>
          )}
          <span
            className="shrink-0 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 px-2 py-1 text-[11px] font-black tabular-nums text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] sm:px-2.5 sm:text-xs"
            title={`Niveau ${profile.level}`}
          >
            Niv. {profile.level}
          </span>
          <span className="hidden sm:inline">{profileTheme.label}</span>
        </NavLink>
      </div>
      <div
        className={cn('h-1 w-full opacity-95', stripeTheme.shellStripe)}
        aria-hidden
        title={stripeTheme.label}
      />
    </header>
  )
}
