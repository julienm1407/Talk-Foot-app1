import { lazyWithRetry } from '../utils/lazyWithRetry'

export const HomePage = lazyWithRetry(() =>
  import('../pages/Home').then((m) => ({ default: m.HomePage })),
)
export const CalendarPage = lazyWithRetry(() =>
  import('../pages/Calendar').then((m) => ({ default: m.CalendarPage })),
)
export const PronosticHubPage = lazyWithRetry(() =>
  import('../pages/PronosticHub').then((m) => ({ default: m.PronosticHubPage })),
)
export const ChannelPage = lazyWithRetry(() =>
  import('../pages/Channel').then((m) => ({ default: m.ChannelPage })),
)
export const ChannelStadiumPage = lazyWithRetry(() =>
  import('../pages/ChannelStadium').then((m) => ({ default: m.ChannelStadiumPage })),
)
export const GroupPage = lazyWithRetry(() =>
  import('../pages/Group').then((m) => ({ default: m.GroupPage })),
)
export const GroupsHubPage = lazyWithRetry(() =>
  import('../pages/GroupsHub').then((m) => ({ default: m.GroupsHubPage })),
)
export const DebatesPage = lazyWithRetry(() =>
  import('../pages/Debates').then((m) => ({ default: m.DebatesPage })),
)
export const DebateDetailPage = lazyWithRetry(() =>
  import('../pages/DebateDetail').then((m) => ({ default: m.DebateDetailPage })),
)
export const RankingsPage = lazyWithRetry(() =>
  import('../pages/Rankings').then((m) => ({ default: m.RankingsPage })),
)
export const VideosPage = lazyWithRetry(() =>
  import('../pages/Videos').then((m) => ({ default: m.VideosPage })),
)
export const BoutiquePage = lazyWithRetry(() =>
  import('../pages/Boutique').then((m) => ({ default: m.BoutiquePage })),
)
export const BoutiqueMedalPacksPage = lazyWithRetry(() =>
  import('../pages/BoutiqueMedalPacks').then((m) => ({ default: m.BoutiqueMedalPacksPage })),
)
export const BoutiquePurchaseSuccessPage = lazyWithRetry(() =>
  import('../pages/BoutiquePurchaseSuccess').then((m) => ({ default: m.BoutiquePurchaseSuccessPage })),
)
export const ProfilePage = lazyWithRetry(() =>
  import('../pages/Profile').then((m) => ({ default: m.ProfilePage })),
)
export const UserProfilePage = lazyWithRetry(() =>
  import('../pages/UserProfile').then((m) => ({ default: m.UserProfilePage })),
)
export const ArticlePage = lazyWithRetry(() =>
  import('../pages/ArticlePage').then((m) => ({ default: m.ArticlePage })),
)
export const ClubPage = lazyWithRetry(() =>
  import('../pages/ClubPage').then((m) => ({ default: m.ClubPage })),
)
export const AdminPage = lazyWithRetry(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
)
export const DataSourcesSettingsPage = lazyWithRetry(() =>
  import('../pages/DataSourcesSettings').then((m) => ({ default: m.DataSourcesSettingsPage })),
)
export const NationPage = lazyWithRetry(() =>
  import('../pages/NationPage').then((m) => ({ default: m.NationPage })),
)
export const NationsHubPage = lazyWithRetry(() =>
  import('../pages/NationsHub').then((m) => ({ default: m.NationsHub })),
)
export const CdmHubPage = lazyWithRetry(() =>
  import('../pages/CdmHub').then((m) => ({ default: m.CdmHubPage })),
)
export const CdmGroupsPage = lazyWithRetry(() =>
  import('../pages/CdmGroups').then((m) => ({ default: m.CdmGroupsPage })),
)
export const CdmBracketPage = lazyWithRetry(() =>
  import('../pages/CdmBracket').then((m) => ({ default: m.CdmBracketPage })),
)
export const CdmStatsPage = lazyWithRetry(() =>
  import('../pages/CdmStats').then((m) => ({ default: m.CdmStatsPage })),
)
