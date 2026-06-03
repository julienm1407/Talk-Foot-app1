import { WC_DATASET } from '../../data/wc2026Mock'
import type { WcDataSource } from './types'

/** Source mock — arbre, stades, effectifs, repli poules sans SportMonks. */
export const wc2026MockSource: WcDataSource = {
  loadDataset: async () => WC_DATASET,
  refreshLive: async () => ({
    matches: WC_DATASET.matches,
    standings: WC_DATASET.standings,
    stats: WC_DATASET.stats,
  }),
  loadMatchDetails: async (id) => {
    const m = WC_DATASET.matches.find((x) => x.id === id)
    if (!m) throw new Error(`Match ${id} introuvable`)
    return m
  },
  loadSquad: async (nationIso) => {
    return (
      WC_DATASET.squads.find((s) => s.nationIso === nationIso) ?? {
        nationIso,
        players: [],
      }
    )
  },
}
