/**
 * Interface de source de données — Coupe du Monde 2026.
 *
 * Les composants consomment `activeWcDataSource` via `Cdm2026DataProvider`.
 * Poules / classements : SportMonks (`standings/seasons/{id}`) ; repli mock.
 */

export type { WcDataSource } from './types'
export { wc2026MockSource } from './mockSource'
export { wc2026SportMonksSource } from './sportmonksSource'

import { wc2026SportMonksSource } from './sportmonksSource'

/** Source active : SportMonks pour poules / classements (repli mock sans jeton). */
export const activeWcDataSource = wc2026SportMonksSource
