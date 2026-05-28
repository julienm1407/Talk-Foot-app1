import { Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdsenseScriptLoader } from './components/ads/AdsenseScriptLoader'
import { PageLoader } from './components/ui/PageLoader'
import { AppShell } from './layout/AppShell'
import { LoginPage } from './pages/Login'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AboutPage } from './pages/AboutPage'
import {
  AdminPage,
  ArticlePage,
  BoutiquePage,
  CalendarPage,
  ChannelPage,
  ChannelStadiumPage,
  ClubPage,
  DataSourcesSettingsPage,
  DebateDetailPage,
  DebatesPage,
  GroupPage,
  GroupsHubPage,
  CdmHubPage,
  CdmGroupsPage,
  CdmBracketPage,
  CdmStatsPage,
  HomePage,
  NationPage,
  NationsHubPage,
  ProfilePage,
  PronosticHubPage,
  RankingsPage,
  UserProfilePage,
  VideosPage,
} from './routes/lazyPages'
import { useAuth } from './contexts/AuthContext'
import { MatchesProvider } from './contexts/MatchesContext'
import { FanPreferencesProvider } from './contexts/FanPreferencesContext'
import { CloudUserStateGate } from './contexts/CloudUserStateContext'
import { MonEspaceDrawerProvider } from './contexts/MonEspaceDrawerContext'
import { SeasonModeProvider } from './contexts/SeasonModeContext'
import { Cdm2026DataProvider } from './contexts/Cdm2026DataContext'
import { AppShellProviders } from './providers/AppShellProviders'

function RouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

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
  return <RouteSuspense>{children}</RouteSuspense>
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
  return <RouteSuspense>{children}</RouteSuspense>
}

export default function App() {
  return (
    <>
      <AdsenseScriptLoader />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/article/:slug"
          element={
            <AppShellProviders>
              <RouteSuspense>
                <ArticlePage />
              </RouteSuspense>
            </AppShellProviders>
          }
        />
        <Route
          path="/"
          element={
            <CloudUserStateGate>
              <SeasonModeProvider>
                <Cdm2026DataProvider>
                  <FanPreferencesProvider>
                    <MatchesProvider>
                      <AppShellProviders>
                        <MonEspaceDrawerProvider>
                          <AppShell />
                        </MonEspaceDrawerProvider>
                      </AppShellProviders>
                    </MatchesProvider>
                  </FanPreferencesProvider>
                </Cdm2026DataProvider>
              </SeasonModeProvider>
            </CloudUserStateGate>
          }
        >
          <Route
            index
            element={
              <RouteSuspense>
                <HomePage />
              </RouteSuspense>
            }
          />
          <Route path="matches" element={<Navigate to="/match" replace />} />
          <Route
            path="debates"
            element={
              <RouteSuspense>
                <DebatesPage />
              </RouteSuspense>
            }
          />
          <Route
            path="debate/:debateId"
            element={
              <RequireAuthRoute>
                <DebateDetailPage />
              </RequireAuthRoute>
            }
          />
          <Route
            path="groups"
            element={
              <RouteSuspense>
                <GroupsHubPage />
              </RouteSuspense>
            }
          />
          <Route
            path="videos"
            element={
              <RouteSuspense>
                <VideosPage />
              </RouteSuspense>
            }
          />
          <Route
            path="rankings"
            element={
              <RouteSuspense>
                <RankingsPage />
              </RouteSuspense>
            }
          />
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
          <Route
            path="match"
            element={
              <RouteSuspense>
                <CalendarPage />
              </RouteSuspense>
            }
          />
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
          <Route
            path="boutique"
            element={
              <RouteSuspense>
                <BoutiquePage />
              </RouteSuspense>
            }
          />
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
          <Route
            path="user/:userId"
            element={
              <RouteSuspense>
                <UserProfilePage />
              </RouteSuspense>
            }
          />
          <Route
            path="club/:clubSlug"
            element={
              <RouteSuspense>
                <ClubPage />
              </RouteSuspense>
            }
          />
          <Route
            path="cdm"
            element={
              <RouteSuspense>
                <CdmHubPage />
              </RouteSuspense>
            }
          />
          <Route
            path="cdm/groupes"
            element={
              <RouteSuspense>
                <CdmGroupsPage />
              </RouteSuspense>
            }
          />
          <Route
            path="cdm/bracket"
            element={
              <RouteSuspense>
                <CdmBracketPage />
              </RouteSuspense>
            }
          />
          <Route
            path="cdm/stats"
            element={
              <RouteSuspense>
                <CdmStatsPage />
              </RouteSuspense>
            }
          />
          <Route
            path="nations"
            element={
              <RouteSuspense>
                <NationsHubPage />
              </RouteSuspense>
            }
          />
          <Route
            path="nation/:iso"
            element={
              <RouteSuspense>
                <NationPage />
              </RouteSuspense>
            }
          />
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
    </>
  )
}
