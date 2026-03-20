import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { CalendarPage } from './pages/Calendar'
import { ChannelPage } from './pages/Channel'
import { GroupPage } from './pages/Group'
import { HomePage } from './pages/Home'
import { BoutiquePage } from './pages/Boutique'
import { LoginPage } from './pages/Login'
import { ProfilePage } from './pages/Profile'
import { useAuth } from './contexts/AuthContext'
import { MatchesProvider } from './contexts/MatchesContext'
import { FanPreferencesProvider } from './contexts/FanPreferencesContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  if (!isReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-tf-grey-pastel/20">
        <div className="text-sm font-semibold text-tf-grey">Chargement…</div>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FanPreferencesProvider>
              <MatchesProvider>
                <AppShell />
              </MatchesProvider>
            </FanPreferencesProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="channel/:matchId" element={<ChannelPage />} />
        <Route path="group/:groupId" element={<GroupPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="boutique" element={<BoutiquePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
