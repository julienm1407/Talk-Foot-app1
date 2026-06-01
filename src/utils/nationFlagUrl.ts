/** Bump pour invalider le cache navigateur après import des PNG. */
export const NATION_FLAG_ASSET_VERSION = '2026-05-29a'

/**
 * Codes flagcdn (import script → public/flags/{iso3}.png).
 */
const ISO3_TO_FLAG_CODE: Record<string, string> = {
  FRA: 'fr',
  ESP: 'es',
  DEU: 'de',
  ENG: 'gb-eng',
  PRT: 'pt',
  BEL: 'be',
  NLD: 'nl',
  HRV: 'hr',
  CHE: 'ch',
  AUT: 'at',
  NOR: 'no',
  TUR: 'tr',
  SWE: 'se',
  BIH: 'ba',
  CZE: 'cz',
  SCO: 'gb-sct',
  ARG: 'ar',
  BRA: 'br',
  URY: 'uy',
  COL: 'co',
  ECU: 'ec',
  PRY: 'py',
  USA: 'us',
  MEX: 'mx',
  CAN: 'ca',
  HTI: 'ht',
  PAN: 'pa',
  CUW: 'cw',
  MAR: 'ma',
  DZA: 'dz',
  SEN: 'sn',
  TUN: 'tn',
  EGY: 'eg',
  GHA: 'gh',
  CIV: 'ci',
  CPV: 'cv',
  ZAF: 'za',
  COG: 'cg',
  JPN: 'jp',
  KOR: 'kr',
  AUS: 'au',
  SAU: 'sa',
  QAT: 'qa',
  IRQ: 'iq',
  IRN: 'ir',
  JOR: 'jo',
  UZB: 'uz',
  NZL: 'nz',
}

export function nationFlagCode(iso3: string): string | null {
  return ISO3_TO_FLAG_CODE[iso3.toUpperCase()] ?? null
}

/** Chemin public du drapeau (fichiers générés par scripts/import-nation-flags.ps1). */
export function nationFlagUrl(iso3: string, _height = 80): string | null {
  const iso = iso3.toUpperCase()
  if (!nationFlagCode(iso)) return null
  return `/flags/${iso.toLowerCase()}.png?v=${NATION_FLAG_ASSET_VERSION}`
}
