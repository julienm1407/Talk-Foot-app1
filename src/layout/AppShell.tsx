import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useSwipeNavigate } from '../hooks/useSwipeNavigate'
import { FanOnboardingModal } from '../components/fan/FanOnboardingModal'
import { FanSetupBanner } from '../components/fan/FanSetupBanner'

export function AppShell() {
  const location = useLocation()
  const isChannel = location.pathname.startsWith('/channel/')

  useSwipeNavigate({
    enabled: !isChannel,
    order: ['/', '/calendar', '/boutique', '/profile'],
  })

  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden">
      <FanOnboardingModal />
      <TopBar />
      <FanSetupBanner />
      {isChannel ? (
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:px-5 sm:pt-6">
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1240px] px-3 pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))] pt-5 sm:px-5 sm:pt-7">
          <main className="min-w-0">
            <div className="tf-panel rounded-[28px] p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

