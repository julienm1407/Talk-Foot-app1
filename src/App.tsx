import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { CalendarPage } from './pages/Calendar'
import { ChannelPage } from './pages/Channel'
import { ChannelStadiumPage } from './pages/ChannelStadium'
import { GroupPage } from './pages/Group'
import { HomePage } from './pages/Home'
import { DebatesPage } from './pages/Debates'
import { DebateDetailPage } from './pages/DebateDetail'
import { GroupsHubPage } from './pages/GroupsHub'
import { VideosPage } from './pages/Videos'
import { RankingsPage } from './pages/Rankings'
import { BoutiquePage } from './pages/Boutique'
import { LoginPage } from './pages/Login'
import { ProfilePage } from './pages/Profile'
import { ArticlePage } from './pages/ArticlePage'
import { useAuth } from './contexts/AuthContext'
import { MatchesProvider } from './contexts/MatchesContext'
import { FanPreferencesProvider } from './contexts/FanPreferencesContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  if (!isReady) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="tf-page-backdrop" aria-hidden />
        <div className="relative text-sm font-semibold text-tf-grey">Chargement…</div>
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
      <Route path="/article/:slug" element={<ArticlePage />} />
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
        <Route path="matches" element={<Navigate to="/match" replace />} />
        <Route path="debates" element={<DebatesPage />} />
        <Route path="debate/:debateId" element={<DebateDetailPage />} />
        <Route path="groups" element={<GroupsHubPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route path="channel/:matchId/stade" element={<ChannelStadiumPage />} />
        <Route path="channel/:matchId" element={<ChannelPage />} />
        <Route path="group/:groupId" element={<GroupPage />} />
        <Route path="match" element={<CalendarPage />} />
        <Route path="agenda" element={<Navigate to="/match" replace />} />
        <Route path="calendar" element={<Navigate to="/match" replace />} />
        <Route path="boutique" element={<BoutiquePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
