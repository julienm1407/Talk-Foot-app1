import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useSwipeNavigate } from '../hooks/useSwipeNavigate'
import { FanOnboardingModal } from '../components/fan/FanOnboardingModal'
import { FanSetupBanner } from '../components/fan/FanSetupBanner'
import { PageAdRails } from './PageAdRails'
import { cn } from '../utils/cn'

export function AppShell() {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === ''
  const isChannel = location.pathname.startsWith('/channel/')
  const isChannelStadium = /^\/channel\/[^/]+\/stade$/.test(location.pathname)

  useSwipeNavigate({
    enabled: !isChannel,
    order: ['/', '/matches', '/groups', '/rankings'],
  })

  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden">
      <FanOnboardingModal />
      <TopBar />
      <FanSetupBanner />
      {isChannel ? (
        <div
          className={
            isChannelStadium
              ? 'mx-auto w-full max-w-[min(100%,960px)] px-2 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom,0px)))] pt-3 sm:px-4 sm:pt-4'
              : 'mx-auto w-full max-w-[1400px] px-3 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:px-5 sm:pt-6'
          }
        >
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      ) : isHome ? (
        <>
          {/* Accueil tablette / mobile : même logique que desktop (fond body + hub), rails pub */}
          <div className="w-full px-3 pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:px-5 sm:pt-6 xl:hidden">
            <PageAdRails>
              <main className="mx-auto min-w-0 w-full max-w-[1680px]">
                <Outlet />
              </main>
            </PageAdRails>
          </div>
          {/* Accueil desktop : hub sombre pleine largeur (sans rails — 3 colonnes dans la page) */}
          <div
            className={cn(
              'hidden w-full pt-6 xl:block pb-[max(2.5rem,calc(2.5rem+env(safe-area-inset-bottom,0px)))]',
            )}
          >
            <main className="mx-auto min-w-0 max-w-[1680px] px-5">
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <div className="w-full px-2 pb-[max(6rem,calc(6rem+env(safe-area-inset-bottom,0px)))] pt-5 sm:px-4 sm:pt-7">
          <PageAdRails>
            <main className="min-w-0">
              <div className="tf-panel rounded-[28px] p-4 sm:p-6">
                <Outlet />
              </div>
            </main>
          </PageAdRails>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

