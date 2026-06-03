import type { WcDataset, WcMatch, WcMatchId, WcSquad } from '../../types/wc2026'

export type WcDataSource = {
  loadDataset: () => Promise<WcDataset>
  refreshLive?: () => Promise<Pick<WcDataset, 'matches' | 'standings' | 'stats'>>
  loadMatchDetails?: (id: WcMatchId) => Promise<WcMatch>
  loadSquad?: (nationIso: string) => Promise<WcSquad>
}
