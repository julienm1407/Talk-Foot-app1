import { lazy } from 'react'

export const HomePage = lazy(() =>
  import('../pages/Home').then((m) => ({ default: m.HomePage })),
)
export const CalendarPage = lazy(() =>
  import('../pages/Calendar').then((m) => ({ default: m.CalendarPage })),
)
export const PronosticHubPage = lazy(() =>
  import('../pages/PronosticHub').then((m) => ({ default: m.PronosticHubPage })),
)
export const ChannelPage = lazy(() =>
  import('../pages/Channel').then((m) => ({ default: m.ChannelPage })),
)
export const ChannelStadiumPage = lazy(() =>
  import('../pages/ChannelStadium').then((m) => ({ default: m.ChannelStadiumPage })),
)
export const GroupPage = lazy(() =>
  import('../pages/Group').then((m) => ({ default: m.GroupPage })),
)
export const GroupsHubPage = lazy(() =>
  import('../pages/GroupsHub').then((m) => ({ default: m.GroupsHubPage })),
)
export const DebatesPage = lazy(() =>
  import('../pages/Debates').then((m) => ({ default: m.DebatesPage })),
)
export const DebateDetailPage = lazy(() =>
  import('../pages/DebateDetail').then((m) => ({ default: m.DebateDetailPage })),
)
export const RankingsPage = lazy(() =>
  import('../pages/Rankings').then((m) => ({ default: m.RankingsPage })),
)
export const VideosPage = lazy(() =>
  import('../pages/Videos').then((m) => ({ default: m.VideosPage })),
)
export const BoutiquePage = lazy(() =>
  import('../pages/Boutique').then((m) => ({ default: m.BoutiquePage })),
)
export const BoutiqueMedalPacksPage = lazy(() =>
  import('../pages/BoutiqueMedalPacks').then((m) => ({ default: m.BoutiqueMedalPacksPage })),
)
export const BoutiquePurchaseSuccessPage = lazy(() =>
  import('../pages/BoutiquePurchaseSuccess').then((m) => ({ default: m.BoutiquePurchaseSuccessPage })),
)
export const ProfilePage = lazy(() =>
  import('../pages/Profile').then((m) => ({ default: m.ProfilePage })),
)
export const UserProfilePage = lazy(() =>
  import('../pages/UserProfile').then((m) => ({ default: m.UserProfilePage })),
)
export const ArticlePage = lazy(() =>
  import('../pages/ArticlePage').then((m) => ({ default: m.ArticlePage })),
)
export const ClubPage = lazy(() =>
  import('../pages/ClubPage').then((m) => ({ default: m.ClubPage })),
)
export const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
)
export const DataSourcesSettingsPage = lazy(() =>
  import('../pages/DataSourcesSettings').then((m) => ({ default: m.DataSourcesSettingsPage })),
)
export const NationPage = lazy(() =>
  import('../pages/NationPage').then((m) => ({ default: m.NationPage })),
)
export const NationsHubPage = lazy(() =>
  import('../pages/NationsHub').then((m) => ({ default: m.NationsHub })),
)
export const CdmHubPage = lazy(() =>
  import('../pages/CdmHub').then((m) => ({ default: m.CdmHubPage })),
)
export const CdmGroupsPage = lazy(() =>
  import('../pages/CdmGroups').then((m) => ({ default: m.CdmGroupsPage })),
)
export const CdmBracketPage = lazy(() =>
  import('../pages/CdmBracket').then((m) => ({ default: m.CdmBracketPage })),
)
export const CdmStatsPage = lazy(() =>
  import('../pages/CdmStats').then((m) => ({ default: m.CdmStatsPage })),
)
