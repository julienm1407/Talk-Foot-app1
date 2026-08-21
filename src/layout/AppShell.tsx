import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { SkipLink } from './SkipLink'
import { useSwipeNavigate } from '../hooks/useSwipeNavigate'
import { FanOnboardingModal } from '../components/fan/FanOnboardingModal'
import { OAuthProfileSetupModal } from '../components/auth/OAuthProfileSetupModal'
import { ActivityRouteLogger } from '../components/sync/ActivityRouteLogger'
import { FanSetupBanner } from '../components/fan/FanSetupBanner'
import { PageAdRails } from './PageAdRails'
import { SiteLegalFooter } from '../components/legal/SiteLegalFooter'
import { cn } from '../utils/cn'
import { BetSettlementRunner } from '../components/bet/BetSettlementRunner'
import { useIsMobileTouchViewport } from '../hooks/useIsMobileTouchViewport'
import { useRouteViewReset } from '../hooks/useRouteViewReset'

const mainBottomPadMobile =
  'max-lg:pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))] lg:pb-2'
const mainBottomPadChannel = 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]'
/** Réserve la zone tactile de la BottomNav fixe — le scroll ne doit pas s'étendre dessous. */
const mobileMainClearBottomNav =
  'max-lg:mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'
/** Accueil desktop : pas de bottom nav — éviter le grand vide gris sous le hub. */
const mainBottomPadHomeDesktop = 'lg:pb-2 xl:pb-3'

export function AppShell() {
  const location = useLocation()
  useRouteViewReset()
  const isMobileTouch = useIsMobileTouchViewport()
  const routeSurfaceKey = `${location.pathname || '/'}:${(location.state as { tfNavAt?: number } | null)?.tfNavAt ?? 0}`
  const isHome = location.pathname === '/' || location.pathname === ''
  const isChannel = location.pathname.startsWith('/channel/')
  const isChannelStadium = /^\/channel\/[^/]+\/stade$/.test(location.pathname)
  const isGroupTribune = /^\/group\/[^/]+/.test(location.pathname)
  const isDebatePage = /^\/debate\/[^/]+/.test(location.pathname)
  const isProfile = location.pathname === '/profile' || location.pathname.startsWith('/profile/')
  /** Dock Match / Compo / Paris / Tribune (portail fixe) — pas de footer légal en dessous. */
  const hideChannelLegalFooter = isChannel && !isChannelStadium && isMobileTouch

  useSwipeNavigate({
    enabled: !isChannel && !isGroupTribune,
    order: ['/', '/match', '/groups'],
  })

  /** Précharger les chunks fréquents pour éviter un PageLoader long. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      void import('../pages/Calendar')
      void import('../pages/Boutique')
    }, 800)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden tf-mobile-app-shell">
      <SkipLink />
      <ActivityRouteLogger />
      <BetSettlementRunner />
      <OAuthProfileSetupModal />
      <FanOnboardingModal />
      <TopBar />
      <FanSetupBanner />

      <main
        id="main-content"
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none',
          !isChannel && mobileMainClearBottomNav,
        )}
        tabIndex={-1}
      >
        {isChannel ? (
          <div
            data-tf-route-scroll
            className={cn(
              'tf-channel-shell mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col px-[var(--tf-page-gutter)] pt-3 sm:pt-4',
              /* Téléphone : scroll page. Tablette+ : hauteur cadrée, scroll dans les colonnes de la tribune. */
              'min-h-0 max-md:touch-pan-y max-md:overflow-y-auto max-md:overscroll-y-contain',
              'md:min-h-0 md:overflow-hidden',
              mainBottomPadChannel,
              isChannelStadium ? 'max-w-tf-channel-stadium' : 'max-w-tf-channel',
            )}
          >
            <ErrorBoundary key={routeSurfaceKey}>
              <Outlet key={routeSurfaceKey} />
            </ErrorBoundary>
            {!hideChannelLegalFooter ? (
              <div className="mt-4">
                <SiteLegalFooter compact className="rounded-t-2xl" />
              </div>
            ) : null}
          </div>
        ) : isGroupTribune || isDebatePage ? (
          <div
            data-tf-route-scroll
            className={cn(
              'mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col min-h-0 px-[var(--tf-page-gutter)]',
              'max-lg:overflow-hidden max-lg:pt-1',
              'lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:pt-7',
              /* Dock chat fixe + marge BottomNav sur <main> : pas de grand padding bas en plus. */
              'max-lg:pb-[env(safe-area-inset-bottom,0px)]',
              'lg:pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
            )}
          >
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-col',
                'max-lg:flex-1 max-lg:overflow-hidden',
                'lg:rounded-tf-3xl lg:p-tf-6 tf-panel',
              )}
            >
              <ErrorBoundary key={routeSurfaceKey}>
                <Outlet key={routeSurfaceKey} />
              </ErrorBoundary>
            </div>
            <div className="mt-5 hidden shrink-0 lg:block">
              <SiteLegalFooter className="rounded-t-2xl" />
            </div>
          </div>
        ) : isHome ? (
          <div
            data-tf-route-scroll
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]',
              !isMobileTouch && 'lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-y-contain',
              'w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] pt-3 sm:pt-4 lg:pt-6',
              isMobileTouch
                ? 'pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]'
                : 'max-lg:pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]',
              mainBottomPadHomeDesktop,
            )}
          >
            <PageAdRails variant="centerOnly" centerMax="ultra">
              <ErrorBoundary key={routeSurfaceKey}>
                <Outlet key={routeSurfaceKey} />
              </ErrorBoundary>
            </PageAdRails>
            <div className={cn('mt-6 shrink-0', isMobileTouch ? 'block' : 'lg:hidden')}>
              <SiteLegalFooter className="rounded-t-2xl" />
            </div>
          </div>
        ) : (
          <div
            data-tf-route-scroll
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y',
              isProfile && 'tf-profile-page-scroll',
              'w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] pt-5 sm:pt-7',
              mainBottomPadMobile,
            )}
          >
            <PageAdRails>
              <div className="tf-panel rounded-tf-3xl p-tf-4 sm:p-tf-6">
                <ErrorBoundary key={routeSurfaceKey}>
                  <Outlet key={routeSurfaceKey} />
                </ErrorBoundary>
              </div>
            </PageAdRails>
            <div className="mt-5">
              <SiteLegalFooter className="rounded-t-2xl" />
            </div>
          </div>
        )}
      </main>
    </div>

    {!isChannel ? <BottomNav /> : null}
    </>
  )
}
