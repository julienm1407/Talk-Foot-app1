import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../utils/cn'
import { LogoEncartLink } from './LogoMark'
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
import { PrivateMessagesPanel } from '../components/messages/PrivateMessagesPanel'
import { coachDirectThread } from '../data/directMessagesMock'
import { useDirectMessagesOptional } from '../contexts/DirectMessagesContext'
import { useInbox } from '../hooks/useInbox'
import { useIsBelowXl } from '../hooks/useIsBelowXl'
import { useMonEspaceDrawerOptional } from '../contexts/MonEspaceDrawerContext'
import { useAuth } from '../contexts/AuthContext'
import { usePrivateMessagesUi } from '../contexts/PrivateMessagesUiContext'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../components/profile/ProfileCharacterThumb'
import { NavWalletBalances } from './NavWalletBalances'
import { useOptionalSeasonMode } from '../contexts/SeasonModeContext'

export function TopBar() {
  const { user: authUser } = useAuth()
  const { profile } = useProfile()
  const { appearance } = useAppearance()
  const location = useLocation()
  const L = appearance === 'light'
  const navPillBase = cn(
    'tf-nav-pill inline-flex h-8 shrink-0 items-center justify-center rounded-[16px] px-2 text-center text-[10px] font-black leading-none outline-none transition active:scale-[0.97]',
    'min-[900px]:px-2.5 min-[900px]:text-[11px] xl:px-3 xl:text-[12px] min-[1400px]:text-[13px]',
    'text-tf-app-muted hover:text-tf-app-fg',
  )

  /** Rappel couleur section (hover) — aligné sur l’esprit BottomNav / bandeau header */
  function navInactiveHoverTint(section: (typeof TOP_NAV_ROUTES)[number]['section']) {
    if (section === 'matches')
      return L ? 'hover:bg-tf-nav-match/[0.11]' : 'hover:bg-tf-nav-match/18'
    if (section === 'groups')
      return L ? 'hover:bg-tf-nav-groups/[0.09]' : 'hover:bg-tf-nav-groups/18'
    if (section === 'rankings')
      return L ? 'hover:bg-tf-nav-rankings/[0.1]' : 'hover:bg-tf-nav-rankings/18'
    if (section === 'pronostic')
      return L ? 'hover:bg-tf-cta/[0.1]' : 'hover:bg-tf-cta/18'
    if (section === 'boutique')
      return L ? 'hover:bg-amber-500/[0.1]' : 'hover:bg-amber-400/18'
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
      section === 'pronostic' && (L ? 'ring-tf-cta/45' : 'ring-tf-cta/55'),
      section === 'boutique' && (L ? 'ring-amber-400/45' : 'ring-amber-300/40'),
      section === 'home' && (L ? 'ring-tf-dark/28' : 'ring-sky-300/35'),
    )
  }

  const routeSection = getAppSectionFromPath(location.pathname)
  const stripeTheme = getAppSectionTheme(routeSection)
  const season = useOptionalSeasonMode()
  const isCdm = season?.isCdm2026 ?? false
  const profileTheme = getAppSectionTheme('profile')
  const profileActive = location.pathname.startsWith('/profile')
  const inbox = useInbox()
  const [inboxOpen, setInboxOpen] = useState(false)
  const pm = usePrivateMessagesUi()
  const inboxWrapRef = useRef<HTMLDivElement>(null)
  const dmWrapRef = useRef<HTMLDivElement>(null)
  const dmOpt = useDirectMessagesOptional()
  const dmThreads = dmOpt?.directThreads ?? [coachDirectThread]
  const dmUnread = useMemo(
    () => dmThreads.filter((t) => t.unread).length,
    [dmThreads],
  )
  const belowXl = useIsBelowXl()
  const isHomePath = location.pathname === '/' || location.pathname === ''
  const monEspace = useMonEspaceDrawerOptional()

  useEffect(() => {
    if (!inboxOpen && !pm.isOpen) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (inboxWrapRef.current?.contains(t) || dmWrapRef.current?.contains(t)) return
      setInboxOpen(false)
      pm.close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInboxOpen(false)
        pm.close()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [inboxOpen, pm])

  return (
    <header
      className={cn(
        'tf-app-topbar relative sticky top-0 z-40 w-full min-w-0 shrink-0 overflow-visible border-b backdrop-blur-md',
        'pt-[env(safe-area-inset-top,0px)]',
        L
          ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)] shadow-tf-elev-nav-light'
          : 'border-tf-dark-alt/40 bg-tf-dark shadow-tf-elev-nav-dark',
      )}
    >
      <div
        className="relative mx-auto w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] py-2 sm:py-2.5 md:py-3"
      >
        <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-4">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2 md:gap-3">
          <LogoEncartLink
            to="/"
            isLight={L}
            onClick={(e) => {
              if (belowXl && isHomePath && monEspace) {
                e.preventDefault()
                monEspace.toggleMonEspaceDrawer()
              }
            }}
            className={cn(
              'group shrink-0 outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 active:opacity-95',
              L
                ? 'focus-visible:ring-tf-dark/40 focus-visible:ring-offset-[color:var(--tf-page-bg-light)]'
                : 'focus-visible:ring-sky-400/50 focus-visible:ring-offset-tf-dark',
            )}
            aria-label={
              belowXl && isHomePath ? 'Talk Foot — ouvrir Mon espace' : 'Talk Foot — Accueil'
            }
          />

          <ThemeAppearanceToggle variant="headerIcon" className="hidden shrink-0 lg:grid" />

          {isCdm ? (
            <Link
              to="/cdm"
              title="Mode Coupe du Monde 2026 — accueil saison"
              className="hidden items-center gap-1.5 rounded-full border px-2 py-1 font-display text-[10px] font-black uppercase tracking-[0.18em] shadow-sm transition hover:scale-[1.02] sm:inline-flex sm:text-[11px]"
              style={{
                background: 'linear-gradient(135deg, #06214a 0%, #0a2f5e 100%)',
                color: '#f4c542',
                borderColor: 'rgba(244,197,66,0.55)',
                boxShadow: '0 0 0 1px rgba(244,197,66,0.25), 0 4px 12px rgba(6,33,74,0.35)',
              }}
            >
              <span aria-hidden>★</span>
              CDM 2026
            </Link>
          ) : null}
        </div>

        <nav
          className="hidden min-w-0 xl:flex xl:items-center xl:justify-center"
          aria-label="Primary"
        >
          <div
            className={cn(
              'flex h-10 max-w-full min-h-10 min-w-0 items-center overflow-hidden rounded-[22px] border p-1 backdrop-blur-md',
              L
                ? 'border-tf-dark/12 bg-tf-white shadow-sm ring-1 ring-tf-dark/[0.04]'
                : 'border-white/12 bg-black/25 shadow-sm ring-1 ring-white/10',
            )}
          >
            <div className="h-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex h-full w-max min-w-full items-center justify-center gap-0.5 px-1">
                {TOP_NAV_ROUTES.map(({ to, end, section }) => {
                  const th = getAppSectionTheme(section)
                  const active = isRouteActiveForSection(
                    section,
                    location.pathname,
                    location.hash,
                  )
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
          </div>
        </nav>

        <div
          className={cn(
            'col-start-2 row-start-1 flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2 xl:col-start-3 xl:pl-3 xl:gap-2.5',
            L ? 'xl:border-l xl:border-tf-dark/10' : 'xl:border-l xl:border-white/10',
          )}
        >
          <NavWalletBalances className="relative z-[1]" compact />
          <div className="relative z-[1] flex items-center gap-1 sm:gap-1.5">
          <div ref={dmWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (pm.isOpen) pm.close()
                else {
                  void dmOpt?.refreshFriends()
                  pm.open()
                  setInboxOpen(false)
                }
              }}
              aria-expanded={pm.isOpen}
              aria-haspopup="dialog"
              className={cn(
                'relative grid min-h-tf-touch min-w-tf-touch shrink-0 place-items-center rounded-xl border text-[15px] transition lg:size-10 lg:min-h-10 lg:min-w-10 min-[700px]:size-11 lg:text-base',
                pm.isOpen && (L ? 'ring-2 ring-violet-500/40' : 'ring-2 ring-violet-400/35'),
                L
                  ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
                  : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
              )}
              aria-label={
                dmUnread > 0
                  ? `Messages privés, ${dmUnread} conversation${dmUnread > 1 ? 's' : ''} non lue${dmUnread > 1 ? 's' : ''}`
                  : 'Messages privés'
              }
            >
              <span aria-hidden>💬</span>
              {dmUnread > 0 ? (
                <span
                  className={cn(
                    'pointer-events-none absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-violet-500 px-1 py-0.5 text-[10px] font-black leading-none tabular-nums text-white shadow-[0_0_10px_rgba(139,92,246,0.75)] ring-2',
                    L ? 'ring-[color:var(--tf-page-bg-light)]' : 'ring-tf-dark',
                  )}
                  aria-hidden
                >
                  {dmUnread > 9 ? '9+' : dmUnread}
                </span>
              ) : null}
            </button>
            <PrivateMessagesPanel visible={pm.isOpen} onClose={() => pm.close()} />
          </div>
          <div ref={inboxWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setInboxOpen((prev) => {
                  const next = !prev
                  if (next) pm.close()
                  return next
                })
              }}
              aria-expanded={inboxOpen}
              aria-haspopup="dialog"
              className={cn(
                'relative grid min-h-tf-touch min-w-tf-touch shrink-0 place-items-center rounded-xl border text-[15px] transition lg:size-10 lg:min-h-10 lg:min-w-10 min-[700px]:size-11 lg:text-base',
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
          {authUser?.isAdmin ? (
            <NavLink
              to="/admin"
              title="Administration"
              className={cn(
                'tf-nav-pill hidden shrink-0 items-center rounded-2xl border px-2 py-1.5 text-[11px] font-black uppercase tracking-wide outline-none min-[480px]:inline-flex sm:px-2.5 sm:py-2 sm:text-[12px]',
                L
                  ? 'border-amber-400/50 bg-amber-50 text-amber-950 hover:bg-amber-100'
                  : 'border-amber-300/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25',
              )}
            >
              Admin
            </NavLink>
          ) : null}
          <ThemeAppearanceToggle variant="headerIcon" className="shrink-0 lg:hidden" />
          <NavLink
            to="/profile"
            className={cn(
              'tf-nav-pill hidden shrink-0 items-center gap-1 rounded-2xl border px-1.5 py-1 text-xs font-semibold outline-none lg:inline-flex',
              'min-[480px]:gap-1.5 min-[480px]:px-2 min-[480px]:py-1.5 sm:gap-2 sm:px-2.5 sm:py-2',
              profileTheme.nav.focus,
              profileActive
                ? cn(
                    profileTheme.nav.active,
                    'border-tf-dark/30 bg-tf-white text-tf-dark shadow-md ring-2 ring-tf-dark/15',
                  )
                : cn(
                    L
                      ? 'border-tf-dark/14 bg-tf-white text-tf-dark shadow-sm hover:border-tf-dark/30 hover:bg-tf-electric-soft'
                      : 'border-white/22 bg-[color:var(--tf-c30-surface-soft)] text-white shadow-sm hover:border-white/32 hover:bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_88%,white)]',
                    profileTheme.nav.inactiveHover,
                  ),
            )}
            aria-label={`Profil — niveau ${profile.level}`}
          >
            <ProfileCharacterThumb
              profile={profile}
              size="sm"
              {...MODULAR_PP_NAV_FRAMING}
              className="!h-6 !w-6 !min-h-6 !min-w-6 shrink-0 rounded-full border-0 p-0 ring-2 ring-white/25 min-[420px]:!h-7 min-[420px]:!w-7 min-[420px]:!min-h-7 min-[420px]:!min-w-7 sm:!h-8 sm:!w-8 sm:!min-h-8 sm:!min-w-8"
              aria-label="Mon avatar in-app"
            />
            <span
              className="hidden shrink-0 rounded-lg bg-tf-cta px-1 py-0.5 text-[9px] font-black tabular-nums text-white shadow-tf-cta min-[1280px]:inline-flex min-[1280px]:px-1.5 min-[1280px]:text-[10px]"
              title={`Niveau ${profile.level}`}
            >
              Niv. {profile.level}
            </span>
            <span className="hidden max-w-[3.5rem] truncate min-[1280px]:inline-block md:max-w-[7rem] lg:max-w-none">
              {profileTheme.label}
            </span>
          </NavLink>
          </div>
        </div>
        </div>
      </div>
      <div
        className={cn(
          'block h-1 w-full min-w-full opacity-95',
          isCdm
            ? 'shadow-[inset_0_-2px_0_0_rgba(230,57,70,0.88)]'
            : stripeTheme.shellStripe,
        )}
        style={
          isCdm
            ? { background: 'linear-gradient(90deg, #f4c542 0%, #ff7a45 55%, #e63946 100%)' }
            : undefined
        }
        aria-hidden
        title={isCdm ? 'Coupe du Monde 2026' : stripeTheme.label}
      />
    </header>
  )
}
