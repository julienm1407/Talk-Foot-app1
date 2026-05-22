import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdsenseScriptLoader } from './components/ads/AdsenseScriptLoader'
import { AppShell } from './layout/AppShell'
import { CalendarPage } from './pages/Calendar'
import { PronosticHubPage } from './pages/PronosticHub'
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
import { UserProfilePage } from './pages/UserProfile'
import { ArticlePage } from './pages/ArticlePage'
import { ClubPage } from './pages/ClubPage'
import { AdminPage } from './pages/AdminPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AboutPage } from './pages/AboutPage'
import { DataSourcesSettingsPage } from './pages/DataSourcesSettings'
import { useAuth } from './contexts/AuthContext'
import { MatchesProvider } from './contexts/MatchesContext'
import { FanPreferencesProvider } from './contexts/FanPreferencesContext'
import { CloudUserStateGate } from './contexts/CloudUserStateContext'
import { MonEspaceDrawerProvider } from './contexts/MonEspaceDrawerContext'
import { ArticlesProvider } from './contexts/ArticlesContext'
import { DebatesProvider } from './contexts/DebatesContext'

function RequireAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth()
  const location = useLocation()
  if (!isReady) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="tf-page-backdrop" aria-hidden />
        <div className="relative text-sm font-semibold text-tf-grey">Chargement…</div>
      </div>
    )
  }
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)
    return <Navigate to={`/login?next=${next}&gate=shared`} replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
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
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }
  if (!user.isAdmin) {
    return <Navigate to="/profile" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <AdsenseScriptLoader />
      <ArticlesProvider>
      <DebatesProvider>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
      <Route
        path="/"
        element={
          <CloudUserStateGate>
            <FanPreferencesProvider>
              <MatchesProvider>
                <MonEspaceDrawerProvider>
                  <AppShell />
                </MonEspaceDrawerProvider>
              </MatchesProvider>
            </FanPreferencesProvider>
          </CloudUserStateGate>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="matches" element={<Navigate to="/match" replace />} />
        <Route path="debates" element={<DebatesPage />} />
        <Route
          path="debate/:debateId"
          element={
            <RequireAuthRoute>
              <DebateDetailPage />
            </RequireAuthRoute>
          }
        />
        <Route path="groups" element={<GroupsHubPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="rankings" element={<RankingsPage />} />
        <Route
          path="channel/:matchId/stade"
          element={
            <RequireAuthRoute>
              <ChannelStadiumPage />
            </RequireAuthRoute>
          }
        />
        <Route
          path="channel/:matchId"
          element={
            <RequireAuthRoute>
              <ChannelPage />
            </RequireAuthRoute>
          }
        />
        <Route
          path="group/:groupId"
          element={
            <RequireAuthRoute>
              <GroupPage />
            </RequireAuthRoute>
          }
        />
        <Route path="match" element={<CalendarPage />} />
        <Route
          path="pronostic"
          element={
            <RequireAuthRoute>
              <PronosticHubPage />
            </RequireAuthRoute>
          }
        />
        <Route path="agenda" element={<Navigate to="/match" replace />} />
        <Route path="calendar" element={<Navigate to="/match" replace />} />
        <Route path="boutique" element={<BoutiquePage />} />
        <Route
          path="profile"
          element={
            <RequireAuthRoute>
              <ProfilePage />
            </RequireAuthRoute>
          }
        />
        <Route path="mes-paris" element={<Navigate to="/pronostic" replace />} />
        <Route
          path="settings/donnees"
          element={
            <RequireAuthRoute>
              <DataSourcesSettingsPage />
            </RequireAuthRoute>
          }
        />
        <Route path="user/:userId" element={<UserProfilePage />} />
        <Route path="club/:clubSlug" element={<ClubPage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
      </DebatesProvider>
      </ArticlesProvider>
    </>
  )
}
