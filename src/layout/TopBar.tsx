import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { TALKFOOT_LOGO_URL } from './LogoMark'
import { useProfile } from '../hooks/useProfile'
import {
  TOP_NAV_ROUTES,
  getAppSectionFromPath,
  getAppSectionTheme,
  isRouteActiveForSection,
} from '../theme/appSectionThemes'
import { useAppearance } from '../contexts/AppearanceContext'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'
import { InboxPanel } from '../components/inbox/InboxPanel'
import { useInbox } from '../hooks/useInbox'

export function TopBar() {
  const { profile } = useProfile()
  const { appearance } = useAppearance()
  const location = useLocation()
  const L = appearance === 'light'
  const navPillBase = cn(
    'tf-nav-pill shrink-0 rounded-[18px] px-2.5 py-2 text-center text-[13px] font-black outline-none transition active:scale-[0.97] sm:px-3',
    L ? 'text-tf-app-muted hover:text-tf-app-fg' : 'text-sky-200/92 hover:text-white',
  )

  /** Rappel couleur section (hover) — aligné sur l’esprit BottomNav / bandeau header */
  function navInactiveHoverTint(section: (typeof TOP_NAV_ROUTES)[number]['section']) {
    if (section === 'matches')
      return L ? 'hover:bg-tf-nav-match/[0.11]' : 'hover:bg-tf-nav-match/18'
    if (section === 'groups')
      return L ? 'hover:bg-tf-nav-groups/[0.09]' : 'hover:bg-tf-nav-groups/18'
    if (section === 'rankings')
      return L ? 'hover:bg-tf-nav-rankings/[0.1]' : 'hover:bg-tf-nav-rankings/18'
    return L ? 'hover:bg-sky-500/[0.08]' : 'hover:bg-sky-400/14'
  }

  function navActiveClasses(section: (typeof TOP_NAV_ROUTES)[number]['section']) {
    const th = getAppSectionTheme(section)
    return cn(
      'shadow-sm ring-2',
      L
        ? cn('bg-tf-white text-tf-dark ring-tf-dark/20', th.nav.focus)
        : cn('bg-white/14 text-white ring-white/22', th.nav.focus),
      section === 'matches' && (L ? 'ring-tf-nav-match/50' : 'ring-tf-nav-match/60'),
      section === 'groups' && (L ? 'ring-tf-nav-groups/50' : 'ring-tf-nav-groups/60'),
      section === 'rankings' && (L ? 'ring-tf-nav-rankings/50' : 'ring-tf-nav-rankings/60'),
      section === 'home' && (L ? 'ring-tf-dark/28' : 'ring-sky-300/35'),
    )
  }

  const routeSection = getAppSectionFromPath(location.pathname)
  const stripeTheme = getAppSectionTheme(routeSection)
  const profileTheme = getAppSectionTheme('profile')
  const profileActive = location.pathname.startsWith('/profile')
  const inbox = useInbox()
  const [inboxOpen, setInboxOpen] = useState(false)
  const inboxWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!inboxOpen) return
    const onDoc = (e: MouseEvent) => {
      if (inboxWrapRef.current?.contains(e.target as Node)) return
      setInboxOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInboxOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [inboxOpen])

  return (
    <header
      className={cn(
        'tf-app-topbar relative sticky top-0 z-40 shrink-0 border-b backdrop-blur-md',
        L
          ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)] shadow-tf-elev-nav-light'
          : 'border-tf-dark-alt/40 bg-tf-dark shadow-tf-elev-nav-dark',
      )}
    >
      <div className="relative mx-auto grid w-full max-w-tf-content grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 px-4 py-2.5 sm:gap-x-3 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className={cn(
              'group shrink-0 outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl active:opacity-95',
              L ? 'focus-visible:ring-tf-dark/40 focus-visible:ring-offset-[color:var(--tf-page-bg-light)]' : 'focus-visible:ring-sky-400/50 focus-visible:ring-offset-tf-dark',
            )}
            aria-label="Talk Foot — Accueil"
          >
            <div
              className={cn(
                'relative size-11 overflow-hidden rounded-xl border-2 shadow-sm transition group-hover:opacity-95 sm:size-12',
                L ? 'border-tf-dark/20 bg-white ring-1 ring-tf-dark/[0.06]' : 'border-white/30 bg-white/[0.12] ring-1 ring-white/10',
              )}
            >
              <img
                src={TALKFOOT_LOGO_URL}
                alt=""
                width={320}
                height={160}
                draggable={false}
                className="pointer-events-none size-full max-w-none scale-[1.35] object-cover object-[22%_48%]"
              />
            </div>
          </Link>

          <p
            className={cn(
              'hidden min-w-0 max-w-[18ch] text-pretty font-display text-[11px] font-black leading-snug tracking-tight sm:max-w-[22ch] sm:text-xs lg:max-w-[28ch] lg:text-sm min-[700px]:block',
              L ? 'text-tf-dark/88' : 'text-white/90',
            )}
          >
            Le seul réseau où le foot ne s’arrête jamais&nbsp;!
          </p>
        </div>

        <nav
          className="hidden min-w-0 justify-self-center min-[700px]:block"
          aria-label="Primary"
        >
          <div
            className={cn(
              'max-w-[min(100%,32rem)] rounded-[22px] border p-1 backdrop-blur-md sm:max-w-none',
              L
                ? 'border-tf-dark/12 bg-tf-white shadow-sm ring-1 ring-tf-dark/[0.04]'
                : 'border-white/12 bg-black/25 shadow-sm ring-1 ring-white/10',
            )}
          >
            <div className="flex max-w-full gap-0.5 overflow-x-auto px-0.5 py-0.5 [-webkit-overflow-scrolling:touch]">
              {TOP_NAV_ROUTES.map(({ to, end, section }) => {
                const th = getAppSectionTheme(section)
                const active = isRouteActiveForSection(section, location.pathname)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      navPillBase,
                      active
                        ? navActiveClasses(section)
                        : cn(th.nav.focus, navInactiveHoverTint(section), 'hover:text-tf-app-fg'),
                    )}
                  >
                    {th.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="relative flex items-center justify-end gap-2 sm:gap-3">
          <ThemeAppearanceToggle variant="headerMinimal" className="shrink-0" />
          <div ref={inboxWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setInboxOpen((o) => !o)}
              aria-expanded={inboxOpen}
              aria-haspopup="dialog"
              className={cn(
                'relative grid size-10 shrink-0 place-items-center rounded-xl border text-base transition sm:size-11',
                inboxOpen && (L ? 'ring-2 ring-sky-500/40' : 'ring-2 ring-sky-400/35'),
                L
                  ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
                  : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
              )}
              aria-label={
                inbox.unreadCount > 0
                  ? `Notifications, ${inbox.unreadCount} non lue${inbox.unreadCount > 1 ? 's' : ''}`
                  : 'Notifications'
              }
            >
              <span aria-hidden>🔔</span>
              {inbox.unreadCount > 0 ? (
                <span
                  className={cn(
                    'absolute -right-0.5 -top-0.5 flex min-w-5 justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black tabular-nums text-white ring-2',
                    L ? 'ring-[color:var(--tf-page-bg-light)]' : 'ring-tf-dark',
                  )}
                >
                  {inbox.unreadCount > 9 ? '9+' : inbox.unreadCount}
                </span>
              ) : null}
            </button>
            {inboxOpen ? <InboxPanel onClose={() => setInboxOpen(false)} inbox={inbox} /> : null}
          </div>
          <NavLink
            to="/profile"
            className={cn(
              'tf-nav-pill inline-flex shrink-0 items-center gap-2 rounded-2xl border px-2.5 py-2 text-sm font-semibold outline-none sm:gap-2.5 sm:px-3',
              profileTheme.nav.focus,
              profileActive
                ? cn(
                    profileTheme.nav.active,
                    'border-tf-dark/30 bg-tf-white text-tf-dark shadow-md ring-2 ring-tf-dark/15',
                  )
                : cn(
                    L
                      ? 'border-tf-dark/14 bg-tf-white text-tf-dark shadow-sm hover:border-tf-dark/30 hover:bg-tf-electric-soft'
                      : 'border-white/15 bg-white/10 text-white shadow-sm hover:border-white/25 hover:bg-white/14',
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
              className="shrink-0 rounded-lg bg-tf-cta px-2 py-1 text-[11px] font-black tabular-nums text-white shadow-tf-cta sm:px-2.5 sm:text-xs"
              title={`Niveau ${profile.level}`}
            >
              Niv. {profile.level}
            </span>
            <span className="hidden sm:inline">{profileTheme.label}</span>
          </NavLink>
        </div>
      </div>
      <div
        className={cn('h-1 w-full opacity-95', stripeTheme.shellStripe)}
        aria-hidden
        title={stripeTheme.label}
      />
    </header>
  )
}
