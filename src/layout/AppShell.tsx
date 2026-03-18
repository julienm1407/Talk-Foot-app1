import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { useSwipeNavigate } from '../hooks/useSwipeNavigate'

export function AppShell() {
  const location = useLocation()
  const isChannel = location.pathname.startsWith('/channel/')

  useSwipeNavigate({
    enabled: !isChannel,
    order: ['/', '/calendar', '/profile'],
  })

  return (
    <div className="min-h-dvh">
      <TopBar />
      {isChannel ? (
        <div className="mx-auto w-full max-w-[1400px] px-2 pb-20 pt-2 sm:px-4 sm:pt-4">
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
          <main className="min-w-0">
            <div className="tf-panel rounded-[28px] p-3 shadow-[0_18px_55px_rgba(11,27,58,.10)] sm:p-4">
              <Outlet />
            </div>
          </main>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

