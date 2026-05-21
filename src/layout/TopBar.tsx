import { useEffect, useMemo, useRef, useState } from 'react'
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
import { PrivateMessagesPanel } from '../components/messages/PrivateMessagesPanel'
import { mockDirectThreads } from '../data/directMessagesMock'
import { useDirectMessagesOptional } from '../contexts/DirectMessagesContext'
import { useInbox } from '../hooks/useInbox'
import { useIsBelowXl } from '../hooks/useIsBelowXl'
import { useMonEspaceDrawerOptional } from '../contexts/MonEspaceDrawerContext'
import { useAuth } from '../contexts/AuthContext'
import { usePrivateMessagesUi } from '../contexts/PrivateMessagesUiContext'
import { ProfileCharacterThumb } from '../components/profile/ProfileCharacterThumb'
import { NavWalletBalances } from './NavWalletBalances'

export function TopBar() {
  const { user: authUser } = useAuth()
  const { profile } = useProfile()
  const { appearance } = useAppearance()
  const location = useLocation()
  const L = appearance === 'light'
  const navPillBase = cn(
    'tf-nav-pill shrink-0 rounded-[18px] px-2 py-1.5 text-center text-[12px] font-black outline-none transition active:scale-[0.97] sm:px-2.5 sm:py-2 min-[860px]:text-[13px]',
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
  const pm = usePrivateMessagesUi()
  const inboxWrapRef = useRef<HTMLDivElement>(null)
  const dmWrapRef = useRef<HTMLDivElement>(null)
  const dmOpt = useDirectMessagesOptional()
  const dmThreads = dmOpt?.directThreads ?? mockDirectThreads
  const dmUnread = useMemo(
    () => dmThreads.filter((t) => t.unread && !dmOpt?.visitedIds.includes(t.id)).length,
    [dmOpt?.visitedIds, dmThreads],
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
        'tf-app-topbar relative sticky top-0 z-40 shrink-0 overflow-visible border-b backdrop-blur-md',
        L
          ? 'border-tf-dark/12 bg-[color:var(--tf-page-bg-light)] shadow-tf-elev-nav-light'
          : 'border-tf-dark-alt/40 bg-tf-dark shadow-tf-elev-nav-dark',
      )}
    >
      <div
        className={cn(
          'relative mx-auto grid w-full min-w-0 max-w-tf-content items-center gap-x-2 gap-y-1.5 px-2 py-2 sm:gap-x-3 sm:gap-y-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3',
          /* <700px : logo + actions ; ≥700px : 3 colonnes symétriques pour centrer vraiment la nav */
          'grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] min-[700px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[700px]:grid-rows-1',
        )}
      >
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-1 sm:gap-2 md:gap-3">
          <Link
            to="/"
            onClick={(e) => {
              if (belowXl && isHomePath && monEspace) {
                e.preventDefault()
                monEspace.openMonEspaceDrawer()
              }
            }}
            className={cn(
              'group shrink-0 outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl active:opacity-95',
              L ? 'focus-visible:ring-tf-dark/40 focus-visible:ring-offset-[color:var(--tf-page-bg-light)]' : 'focus-visible:ring-sky-400/50 focus-visible:ring-offset-tf-dark',
            )}
            aria-label={
              belowXl && isHomePath ? 'Talk Foot — ouvrir Mon espace' : 'Talk Foot — Accueil'
            }
          >
            <div
              className={cn(
                'relative size-10 overflow-hidden rounded-xl border-2 shadow-sm transition group-hover:opacity-95 sm:size-11 md:size-12',
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
              'hidden min-w-0 whitespace-nowrap font-sans text-[10px] font-bold leading-none tracking-wide min-[900px]:block sm:text-[11px]',
              L ? 'text-tf-dark/90' : 'text-white/92',
            )}
            title="Talk Foot — le réseau foot en continu"
          >
            Foot live, sans fin.
          </p>
        </div>

        <nav
          className="hidden min-w-0 justify-self-stretch min-[700px]:col-start-2 min-[700px]:row-start-1 min-[700px]:block min-[700px]:justify-self-center"
          aria-label="Primary"
        >
          <div
            className={cn(
              'mx-auto w-full max-w-full rounded-[22px] border p-1 backdrop-blur-md min-[700px]:max-w-[min(100%,32rem)]',
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

        <div
          className={cn(
            'relative col-start-2 row-start-1 flex min-w-0 max-w-full flex-nowrap items-center justify-end gap-1 overflow-x-auto overscroll-x-contain sm:gap-1.5',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'min-[700px]:col-start-3 min-[700px]:max-w-none md:gap-2',
          )}
        >
          <ThemeAppearanceToggle variant="headerMinimal" className="shrink-0" />
          <NavWalletBalances className="hidden min-[700px]:inline-flex" />
          <div ref={dmWrapRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (pm.isOpen) pm.close()
                else {
                  pm.open()
                  setInboxOpen(false)
                }
              }}
              aria-expanded={pm.isOpen}
              aria-haspopup="dialog"
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-xl border text-[14px] transition max-[380px]:size-[1.875rem] sm:size-10 min-[700px]:size-11 sm:text-base',
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
                    'absolute -right-0.5 -top-0.5 flex min-w-5 justify-center rounded-full bg-violet-600 px-1 text-[10px] font-black tabular-nums text-white ring-2',
                    L ? 'ring-[color:var(--tf-page-bg-light)]' : 'ring-tf-dark',
                  )}
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
                'relative grid size-8 shrink-0 place-items-center rounded-xl border text-[14px] transition max-[380px]:size-[1.875rem] sm:size-10 min-[700px]:size-11 sm:text-base',
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
          <NavLink
            to="/profile"
            className={cn(
              'tf-nav-pill inline-flex max-w-full min-w-0 shrink-0 items-center gap-1 overflow-hidden rounded-2xl border px-1.5 py-1 text-xs font-semibold outline-none',
              'min-[420px]:gap-1.5 min-[420px]:px-2 min-[420px]:py-1.5 min-[420px]:text-sm sm:gap-2 sm:px-2.5 sm:py-2 md:px-3 min-[700px]:gap-2 min-[700px]:px-2.5 min-[700px]:py-2',
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
            <ProfileCharacterThumb
              profile={profile}
              size="sm"
              className="!h-6 !w-6 !min-h-6 !min-w-6 shrink-0 rounded-full border-0 p-0 ring-2 ring-white/25 min-[420px]:!h-7 min-[420px]:!w-7 min-[420px]:!min-h-7 min-[420px]:!min-w-7 sm:!h-8 sm:!w-8 sm:!min-h-8 sm:!min-w-8"
              aria-label="Mon avatar in-app"
            />
            <span
              className="hidden shrink-0 rounded-lg bg-tf-cta px-1 py-0.5 text-[9px] font-black tabular-nums text-white shadow-tf-cta min-[860px]:inline-flex min-[860px]:px-1.5 min-[860px]:text-[10px]"
              title={`Niveau ${profile.level}`}
            >
              Niv. {profile.level}
            </span>
            <span className="hidden max-w-[3.5rem] truncate min-[900px]:inline-block md:max-w-[7rem] lg:max-w-none">
              {profileTheme.label}
            </span>
          </NavLink>
        </div>

        <div className="col-span-2 row-start-2 flex justify-end pt-0.5 min-[700px]:hidden">
          <NavWalletBalances />
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
