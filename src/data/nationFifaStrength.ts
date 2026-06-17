/**
 * Classement FIFA approximatif (début 2026) — calibrage des cotes 1N2 sélections.
 * Les cotes visent un ordre de grandeur bookmaker (ex. Suisse ~1,20 vs Qatar ~12–15).
 */

import { NATIONS } from './nations'
import type { FormResult } from '../types/standings'
import type { TeamPowerFactors } from '../odds/types'
import { formScoreFromResults } from '../odds/buildTeamOddsInput'

/** Rang FIFA indicatif (1 = meilleur). Valeur par défaut pour sélections hors tableau. */
const FIFA_RANK_BY_ISO: Record<string, number> = {
  ARG: 1,
  FRA: 2,
  ENG: 3,
  BRA: 4,
  ESP: 5,
  PRT: 6,
  NLD: 7,
  BEL: 8,
  DEU: 9,
  URY: 10,
  COL: 11,
  MAR: 12,
  MEX: 13,
  USA: 14,
  SUI: 15,
  CHE: 19,
  CRO: 14,
  HRV: 14,
  JPN: 16,
  SEN: 17,
  IRN: 18,
  DEN: 19,
  KOR: 20,
  ECU: 21,
  AUT: 22,
  TUR: 23,
  UKR: 24,
  AUS: 25,
  NGA: 26,
  CAN: 27,
  PAN: 28,
  EGY: 29,
  ALG: 30,
  DZA: 30,
  CIV: 31,
  CZE: 32,
  NOR: 33,
  PAR: 34,
  PRY: 34,
  SWE: 35,
  TUN: 36,
  CRC: 37,
  ROU: 38,
  SCO: 39,
  SRB: 40,
  POL: 41,
  UZB: 42,
  QAT: 58,
  KSA: 45,
  SAU: 45,
  JOR: 46,
  IRQ: 47,
  GHA: 48,
  ZAF: 49,
  CPV: 50,
  COD: 68,
  COG: 72,
  HTI: 53,
  CUW: 54,
  NZL: 55,
  BIH: 56,
  BOL: 57,
  PER: 58,
  VEN: 59,
  CHI: 60,
  WAL: 61,
  FIN: 62,
  GRE: 63,
  SVN: 64,
  ISL: 65,
  IDN: 66,
  THA: 67,
  VIE: 68,
  CHN: 69,
  IND: 70,
}

const DEFAULT_FIFA_RANK = 72

export function getNationFifaRank(iso: string): number {
  const key = iso.toUpperCase()
  return FIFA_RANK_BY_ISO[key] ?? DEFAULT_FIFA_RANK
}

/** Score 0–100 dérivé du rang FIFA (écart non linéaire). */
export function nationStrengthScoreFromRank(rank: number): number {
  const r = Math.max(1, Math.min(rank, 120))
  if (r <= 5) return 94 - (r - 1) * 1.8
  if (r <= 15) return 86 - (r - 6) * 0.75
  if (r <= 30) return 78 - (r - 16) * 0.55
  if (r <= 50) return 70 - (r - 31) * 0.45
  if (r <= 80) return 61 - (r - 51) * 0.35
  return Math.max(32, 50 - (r - 81) * 0.2)
}

export function nationPowerFactorsFromIso(
  iso: string,
  isHomeInMatch: boolean,
  formOverride?: FormResult[],
): TeamPowerFactors {
  const rank = getNationFifaRank(iso)
  const strength = nationStrengthScoreFromRank(rank)
  const formBase = formOverride?.length
    ? formScoreFromResults(formOverride)
    : strength + (rank <= 20 ? 4 : rank >= 55 ? -4 : 0)
  const rankingScore = Math.round(100 - (rank - 1) * 0.92)
  return {
    form: Math.round(clamp(formBase, 28, 96)),
    attack: Math.round(strength),
    defense: Math.round(clamp(strength * 0.94 + 4, 30, 95)),
    home: isHomeInMatch ? 100 : 0,
    ranking: Math.round(clamp(rankingScore, 8, 100)),
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** ISO connus dans le catalogue nations. */
export function allKnownNationIsos(): string[] {
  return NATIONS.map((n) => n.iso.toUpperCase())
}
