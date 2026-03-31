import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { SkipLink } from './SkipLink'
import { useSwipeNavigate } from '../hooks/useSwipeNavigate'
import { FanOnboardingModal } from '../components/fan/FanOnboardingModal'
import { FanSetupBanner } from '../components/fan/FanSetupBanner'
import { PageAdRails } from './PageAdRails'
import { cn } from '../utils/cn'

const mainBottomPadMobile = 'pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))]'
const mainBottomPadChannel = 'pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom,0px)))]'
const mainBottomPadHomeXl = 'xl:pb-[max(2.5rem,calc(2.5rem+env(safe-area-inset-bottom,0px)))]'

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
    <div className="flex h-dvh max-h-dvh min-h-0 min-w-0 flex-col overflow-hidden overflow-x-hidden">
      <SkipLink />
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
              'mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-[var(--tf-page-gutter)] pt-3 sm:pt-4',
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
              'w-full min-w-0 px-[var(--tf-page-gutter)] pt-4 sm:pt-6',
              mainBottomPadMobile,
              mainBottomPadHomeXl,
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
              'w-full min-w-0 px-[var(--tf-page-gutter)] pt-5 sm:pt-7',
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

      <BottomNav />
    </div>
  )
}
