/**
 * Interface de source de données — Coupe du Monde 2026.
 *
 * Tout consommateur (composants, pages, hooks) appelle ces fonctions, pas
 * l'API HTTP directement. Quand l'API officielle arrivera, on créera
 * `src/api/wc2026/live.ts` (ou `sportmonks.ts`, `fifa.ts`) qui implémente
 * `WcDataSource`, et on remplace `wc2026MockSource` par celui-ci dans
 * `Cdm2026DataProvider`.
 */

import { WC_DATASET } from '../../data/wc2026Mock'
import type {
  WcDataset,
  WcMatch,
  WcMatchId,
  WcSquad,
} from '../../types/wc2026'

export type WcDataSource = {
  /** Récupère l'agrégat complet (chargement initial). */
  loadDataset: () => Promise<WcDataset>
  /** Rafraîchit uniquement les classements et les matchs (poll). */
  refreshLive?: () => Promise<Pick<WcDataset, 'matches' | 'standings' | 'stats'>>
  /** Détail d'un match (events, lineups, stats) — appelé à l'ouverture de la fiche. */
  loadMatchDetails?: (id: WcMatchId) => Promise<WcMatch>
  /** Effectif d'une sélection — appelé sur la fiche pays. */
  loadSquad?: (nationIso: string) => Promise<WcSquad>
}

/** Source mock — sert tant qu'on n'a pas d'API. */
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

/**
 * Source active utilisée par `Cdm2026DataProvider`. On change cette constante
 * (ou on remplace via env / flag) le jour où on branche l'API réelle.
 */
export const activeWcDataSource: WcDataSource = wc2026MockSource
