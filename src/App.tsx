import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { CalendarPage } from './pages/Calendar'
import { ChannelPage } from './pages/Channel'
import { GroupPage } from './pages/Group'
import { HomePage } from './pages/Home'
import { ProfilePage } from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="channel/:matchId" element={<ChannelPage />} />
        <Route path="group/:groupId" element={<GroupPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
