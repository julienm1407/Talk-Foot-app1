import { Outlet, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { DirectMessagesProvider } from '../contexts/DirectMessagesContext'
import { PrivateMessagesUiProvider } from '../contexts/PrivateMessagesUiContext'
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

const mainBottomPadMobile = 'pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]'
const mainBottomPadChannel = 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]'
/** Espace au-dessus de la BottomNav fixe (sm:hidden → téléphone uniquement). */
const mainBottomPadAboveBottomNav =
  'max-sm:pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]'
/** Accueil desktop : pas de bottom nav — éviter le grand vide gris sous le hub. */
const mainBottomPadHomeDesktop = 'md:pb-2 lg:pb-3'

export function AppShell() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const isChannel = location.pathname.startsWith('/channel/')
  const isChannelStadium = /^\/channel\/[^/]+\/stade$/.test(location.pathname)
  const isGroupTribune = /^\/group\/[^/]+/.test(location.pathname)
  const homeScrollRef = useRef<HTMLDivElement | null>(null)
  const [homeFooterVisible, setHomeFooterVisible] = useState(false)

  useEffect(() => {
    if (isHome) setHomeFooterVisible(false)
  }, [isHome, location.pathname])

  const onHomeScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    setHomeFooterVisible(atBottom)
  }, [])

  useSwipeNavigate({
    enabled: !isChannel && !isGroupTribune,
    order: ['/', '/match', '/groups', '/rankings'],
  })

  return (
    <DirectMessagesProvider>
    <PrivateMessagesUiProvider>
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden">
      <SkipLink />
      <ActivityRouteLogger />
      <OAuthProfileSetupModal />
      <FanOnboardingModal />
      <TopBar />
      <FanSetupBanner />

      <main
        id="main-content"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none"
        tabIndex={-1}
      >
        {isChannel ? (
          <div
            className={cn(
              'tf-channel-shell mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col px-[var(--tf-page-gutter)] pt-3 sm:pt-4',
              /* Téléphone : scroll page. Tablette+ : hauteur cadrée, scroll dans les colonnes de la tribune. */
              'min-h-0 max-md:touch-pan-y max-md:overflow-y-auto max-md:overscroll-y-contain max-md:[-webkit-overflow-scrolling:touch]',
              'md:min-h-0 md:overflow-hidden',
              mainBottomPadChannel,
              isChannelStadium ? 'max-w-tf-channel-stadium' : 'max-w-tf-channel',
            )}
          >
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
            <div className="mt-4">
              <SiteLegalFooter compact className="rounded-t-2xl" />
            </div>
          </div>
        ) : isGroupTribune ? (
          <div
            className={cn(
              'mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col min-h-0 px-[var(--tf-page-gutter)]',
              'max-lg:overflow-hidden max-lg:pt-2',
              'lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain lg:pt-7 lg:[-webkit-overflow-scrolling:touch]',
              mainBottomPadAboveBottomNav,
              'sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]',
            )}
          >
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-col',
                'max-lg:flex-1 max-lg:overflow-hidden',
                'lg:rounded-tf-3xl lg:p-tf-6 tf-panel',
              )}
            >
              <ErrorBoundary key={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </div>
            <div className="mt-5 hidden shrink-0 lg:block">
              <SiteLegalFooter className="rounded-t-2xl" />
            </div>
          </div>
        ) : isHome ? (
          <div
            ref={homeScrollRef}
            onScroll={onHomeScroll}
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch]',
              'md:flex md:min-h-0 md:flex-col md:overflow-y-auto md:overscroll-y-contain',
              'w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] pt-4 sm:pt-6',
              'max-md:pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]',
              mainBottomPadHomeDesktop,
            )}
          >
            <PageAdRails variant="centerOnly" centerMax="ultra">
              <ErrorBoundary key={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </PageAdRails>
            {homeFooterVisible ? (
              <div className="mt-6">
                <SiteLegalFooter className="md:hidden rounded-t-2xl" />
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch]',
              'w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] pt-5 sm:pt-7',
              mainBottomPadMobile,
            )}
          >
            <PageAdRails>
              <div className="tf-panel rounded-tf-3xl p-tf-4 sm:p-tf-6">
                <ErrorBoundary key={location.pathname}>
                  <Outlet />
                </ErrorBoundary>
              </div>
            </PageAdRails>
            <div className="mt-5">
              <SiteLegalFooter className="rounded-t-2xl" />
            </div>
          </div>
        )}
      </main>

      {!isChannel ? <BottomNav /> : null}
    </div>
    </PrivateMessagesUiProvider>
    </DirectMessagesProvider>
  )
}
