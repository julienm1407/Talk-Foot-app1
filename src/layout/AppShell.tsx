import { Outlet, useLocation } from 'react-router-dom'
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
import { cn } from '../utils/cn'

const mainBottomPadMobile = 'pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]'
const mainBottomPadChannel = 'pb-[max(1rem,env(safe-area-inset-bottom,0px))]'
/** Accueil desktop : pas de bottom nav — éviter le grand vide gris sous le hub. */
const mainBottomPadHomeDesktop = 'md:pb-2 lg:pb-3'

export function AppShell() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const isChannel = location.pathname.startsWith('/channel/')
  const isChannelStadium = /^\/channel\/[^/]+\/stade$/.test(location.pathname)

  useSwipeNavigate({
    enabled: !isChannel,
    order: ['/', '/match', '/groups', '/rankings'],
  })

  return (
    <DirectMessagesProvider>
    <PrivateMessagesUiProvider>
    <div className="flex h-dvh max-h-dvh min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden overflow-x-hidden [scrollbar-gutter:stable]">
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
              /* Téléphone : scroll page. Tablette+ : hauteur cadrée, scroll dans les colonnes du salon. */
              'min-h-0 max-md:touch-pan-y max-md:overflow-y-auto max-md:overscroll-y-contain max-md:[-webkit-overflow-scrolling:touch]',
              'md:min-h-0 md:overflow-hidden',
              mainBottomPadChannel,
              isChannelStadium ? 'max-w-tf-channel-stadium' : 'max-w-tf-channel',
            )}
          >
            <Outlet />
          </div>
        ) : isHome ? (
          <div
            className={cn(
              'min-h-0 flex-1 overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch]',
              /* Desktop : une seule zone scrollable (colonne centrale du hub), pas le conteneur page — sinon la grille ne borne pas la hauteur et le centre reste « coupé ». */
              'md:flex md:min-h-0 md:flex-col md:overflow-hidden md:overscroll-none',
              'w-full min-w-0 max-w-full px-[var(--tf-page-gutter)] pt-4 sm:pt-6',
              'max-md:pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]',
              mainBottomPadHomeDesktop,
            )}
          >
            <PageAdRails variant="centerOnly" centerMax="ultra">
              <Outlet />
            </PageAdRails>
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
                <Outlet />
              </div>
            </PageAdRails>
          </div>
        )}
      </main>

      {!isChannel ? <BottomNav /> : null}
    </div>
    </PrivateMessagesUiProvider>
    </DirectMessagesProvider>
  )
}
