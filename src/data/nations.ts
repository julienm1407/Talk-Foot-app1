/**
 * Catalogue des sélections nationales — mode CDM 2026.
 *
 * Mode minimal : couleurs, drapeau, codes ISO, nom + chemin du maillot officiel
 * (PNG livré dans `public/jerseys/nations/`).
 *
 * Les codes utilisés sont des codes ISO-3166-1 alpha-3 quand applicables,
 * avec deux exceptions (ENG/SCO) qui ne sont pas des États mais des sélections
 * historiques de la FIFA.
 */

export type Confederation = 'UEFA' | 'CONMEBOL' | 'AFC' | 'CAF' | 'CONCACAF' | 'OFC'

export type Nation = {
  /** Code stable utilisé en URL (`/nation/:iso`) et en clé. ISO-3 (ou ENG/SCO). */
  iso: string
  /** Nom français affiché dans l'UI. */
  nameFr: string
  /** Nom anglais (utile pour matching SportMonks / SEO). */
  nameEn: string
  /** Drapeau emoji (fallback léger sans asset). */
  flag: string
  /** Confédération FIFA (filtres). */
  confederation: Confederation
  /** Couleur principale (palette maillot domicile). */
  primary: string
  /** Couleur secondaire (rayures / col / shorts). */
  secondary: string
  /** Couleur accent (détails, logo, étoile). */
  accent: string
  /** Chemin public vers le maillot CDM (PNG). */
  jerseyUrl: string
  /** Chemin public vers le short assorti (PNG). */
  shortsUrl: string
  /** Code SportMonks de la sélection nationale (à compléter au fur et à mesure). */
  sportMonksTeamId?: number
}

/**
 * Helper interne pour générer un chemin uniforme.
 *
 * On suffixe d'un identifiant de version (`?v=…`) afin de forcer le navigateur
 * à recharger l'image après une mise à jour des PNG : sans ça, les anciens
 * maillots restent en cache (le chemin de fichier ne change pas, on importe
 * juste un nouveau binaire). Bump cette constante à chaque import majeur.
 */
const KIT_ASSET_VERSION = '2026-05-29h'
function jersey(iso: string): string {
  return `/jerseys/nations/${iso.toLowerCase()}.png?v=${KIT_ASSET_VERSION}`
}
function shorts(iso: string): string {
  return `/shorts/nations/${iso.toLowerCase()}.png?v=${KIT_ASSET_VERSION}`
}
/** PNG dédié boutique (gros plan) — déposer `fra-boutique.png` dans `public/jerseys/nations/`. */
export function boutiqueJerseyUrl(iso: string): string {
  return `/jerseys/nations/${iso.toLowerCase()}-boutique.png?v=${KIT_ASSET_VERSION}`
}
export function boutiqueShortsUrl(iso: string): string {
  return `/shorts/nations/${iso.toLowerCase()}-boutique.png?v=${KIT_ASSET_VERSION}`
}
/** Pack tenue complète (maillot + short sur un seul PNG). */
export function kitPackUrl(iso: string): string {
  return `/kits/nations/${iso.toLowerCase()}-pack.png?v=${KIT_ASSET_VERSION}`
}
export function baseJerseyUrl(color: 'blanc' | 'bleu' | 'jaune' | 'rouge'): string {
  return `/jerseys/base/${color}.png?v=${KIT_ASSET_VERSION}`
}
export function baseShortsUrl(color: 'blanc' | 'bleu' | 'jaune' | 'rouge'): string {
  return `/shorts/base/${color}.png?v=${KIT_ASSET_VERSION}`
}

export const NATIONS: Nation[] = [
  // ───────────────── UEFA ─────────────────
  { iso: 'FRA', nameFr: 'France', nameEn: 'France', flag: '🇫🇷', confederation: 'UEFA', primary: '#001f5b', secondary: '#ffffff', accent: '#ef3340', jerseyUrl: jersey('FRA'), shortsUrl: shorts('FRA') },
  { iso: 'ESP', nameFr: 'Espagne', nameEn: 'Spain', flag: '🇪🇸', confederation: 'UEFA', primary: '#c60b1e', secondary: '#ffc400', accent: '#0a3161', jerseyUrl: jersey('ESP'), shortsUrl: shorts('ESP') },
  { iso: 'DEU', nameFr: 'Allemagne', nameEn: 'Germany', flag: '🇩🇪', confederation: 'UEFA', primary: '#000000', secondary: '#ffffff', accent: '#dd0000', jerseyUrl: jersey('DEU'), shortsUrl: shorts('DEU') },
  { iso: 'ENG', nameFr: 'Angleterre', nameEn: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', primary: '#ffffff', secondary: '#0a3161', accent: '#cf142b', jerseyUrl: jersey('ENG'), shortsUrl: shorts('ENG') },
  { iso: 'PRT', nameFr: 'Portugal', nameEn: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', primary: '#c8102e', secondary: '#006847', accent: '#ffd700', jerseyUrl: jersey('PRT'), shortsUrl: shorts('PRT') },
  { iso: 'BEL', nameFr: 'Belgique', nameEn: 'Belgium', flag: '🇧🇪', confederation: 'UEFA', primary: '#c8102e', secondary: '#ffc72c', accent: '#000000', jerseyUrl: jersey('BEL'), shortsUrl: shorts('BEL') },
  { iso: 'NLD', nameFr: 'Pays-Bas', nameEn: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', primary: '#ff6c0e', secondary: '#21468b', accent: '#ffffff', jerseyUrl: jersey('NLD'), shortsUrl: shorts('NLD') },
  { iso: 'HRV', nameFr: 'Croatie', nameEn: 'Croatia', flag: '🇭🇷', confederation: 'UEFA', primary: '#ff0000', secondary: '#ffffff', accent: '#171796', jerseyUrl: jersey('HRV'), shortsUrl: shorts('HRV') },
  { iso: 'CHE', nameFr: 'Suisse', nameEn: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA', primary: '#d52b1e', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('CHE'), shortsUrl: shorts('CHE') },
  { iso: 'AUT', nameFr: 'Autriche', nameEn: 'Austria', flag: '🇦🇹', confederation: 'UEFA', primary: '#ed2939', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('AUT'), shortsUrl: shorts('AUT') },
  { iso: 'NOR', nameFr: 'Norvège', nameEn: 'Norway', flag: '🇳🇴', confederation: 'UEFA', primary: '#ef2b2d', secondary: '#002868', accent: '#ffffff', jerseyUrl: jersey('NOR'), shortsUrl: shorts('NOR') },
  { iso: 'TUR', nameFr: 'Turquie', nameEn: 'Turkey', flag: '🇹🇷', confederation: 'UEFA', primary: '#e30a17', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('TUR'), shortsUrl: shorts('TUR') },
  { iso: 'SWE', nameFr: 'Suède', nameEn: 'Sweden', flag: '🇸🇪', confederation: 'UEFA', primary: '#006aa7', secondary: '#fecc02', accent: '#ffffff', jerseyUrl: jersey('SWE'), shortsUrl: shorts('SWE') },
  { iso: 'BIH', nameFr: 'Bosnie-Herzégovine', nameEn: 'Bosnia and Herzegovina', flag: '🇧🇦', confederation: 'UEFA', primary: '#002395', secondary: '#fecb00', accent: '#ffffff', jerseyUrl: jersey('BIH'), shortsUrl: shorts('BIH') },
  { iso: 'CZE', nameFr: 'République Tchèque', nameEn: 'Czech Republic', flag: '🇨🇿', confederation: 'UEFA', primary: '#11457e', secondary: '#d7141a', accent: '#ffffff', jerseyUrl: jersey('CZE'), shortsUrl: shorts('CZE') },
  { iso: 'SCO', nameFr: 'Écosse', nameEn: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', primary: '#0065bd', secondary: '#ffffff', accent: '#ffd700', jerseyUrl: jersey('SCO'), shortsUrl: shorts('SCO') },

  // ──────────────── CONMEBOL ───────────────
  { iso: 'ARG', nameFr: 'Argentine', nameEn: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', primary: '#74acdf', secondary: '#ffffff', accent: '#f6b40e', jerseyUrl: jersey('ARG'), shortsUrl: shorts('ARG') },
  { iso: 'BRA', nameFr: 'Brésil', nameEn: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL', primary: '#fedf00', secondary: '#009c3b', accent: '#002776', jerseyUrl: jersey('BRA'), shortsUrl: shorts('BRA') },
  { iso: 'URY', nameFr: 'Uruguay', nameEn: 'Uruguay', flag: '🇺🇾', confederation: 'CONMEBOL', primary: '#5cbcec', secondary: '#ffffff', accent: '#fcd116', jerseyUrl: jersey('URY'), shortsUrl: shorts('URY') },
  { iso: 'COL', nameFr: 'Colombie', nameEn: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL', primary: '#fcd116', secondary: '#003893', accent: '#ce1126', jerseyUrl: jersey('COL'), shortsUrl: shorts('COL') },
  { iso: 'ECU', nameFr: 'Équateur', nameEn: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL', primary: '#ffcc00', secondary: '#003893', accent: '#ce1126', jerseyUrl: jersey('ECU'), shortsUrl: shorts('ECU') },
  { iso: 'PRY', nameFr: 'Paraguay', nameEn: 'Paraguay', flag: '🇵🇾', confederation: 'CONMEBOL', primary: '#d62718', secondary: '#ffffff', accent: '#0038a8', jerseyUrl: jersey('PRY'), shortsUrl: shorts('PRY') },

  // ──────────────── CONCACAF ───────────────
  { iso: 'USA', nameFr: 'États-Unis', nameEn: 'United States', flag: '🇺🇸', confederation: 'CONCACAF', primary: '#bf0a30', secondary: '#002868', accent: '#ffffff', jerseyUrl: jersey('USA'), shortsUrl: shorts('USA') },
  { iso: 'MEX', nameFr: 'Mexique', nameEn: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF', primary: '#006847', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('MEX'), shortsUrl: shorts('MEX') },
  { iso: 'CAN', nameFr: 'Canada', nameEn: 'Canada', flag: '🇨🇦', confederation: 'CONCACAF', primary: '#d50000', secondary: '#ffffff', accent: '#0033a0', jerseyUrl: jersey('CAN'), shortsUrl: shorts('CAN') },
  { iso: 'HTI', nameFr: 'Haïti', nameEn: 'Haiti', flag: '🇭🇹', confederation: 'CONCACAF', primary: '#00209f', secondary: '#d21034', accent: '#ffffff', jerseyUrl: jersey('HTI'), shortsUrl: shorts('HTI') },
  { iso: 'PAN', nameFr: 'Panama', nameEn: 'Panama', flag: '🇵🇦', confederation: 'CONCACAF', primary: '#c8102e', secondary: '#005aa7', accent: '#ffffff', jerseyUrl: jersey('PAN'), shortsUrl: shorts('PAN') },
  { iso: 'CUW', nameFr: 'Curaçao', nameEn: 'Curaçao', flag: '🇨🇼', confederation: 'CONCACAF', primary: '#002b7f', secondary: '#fecb00', accent: '#ffffff', jerseyUrl: jersey('CUW'), shortsUrl: shorts('CUW') },

  // ─────────────────── CAF ─────────────────
  { iso: 'MAR', nameFr: 'Maroc', nameEn: 'Morocco', flag: '🇲🇦', confederation: 'CAF', primary: '#c1272d', secondary: '#006233', accent: '#ffffff', jerseyUrl: jersey('MAR'), shortsUrl: shorts('MAR') },
  { iso: 'DZA', nameFr: 'Algérie', nameEn: 'Algeria', flag: '🇩🇿', confederation: 'CAF', primary: '#006233', secondary: '#ffffff', accent: '#d21034', jerseyUrl: jersey('DZA'), shortsUrl: shorts('DZA') },
  { iso: 'SEN', nameFr: 'Sénégal', nameEn: 'Senegal', flag: '🇸🇳', confederation: 'CAF', primary: '#00853f', secondary: '#fdef42', accent: '#e31b23', jerseyUrl: jersey('SEN'), shortsUrl: shorts('SEN') },
  { iso: 'TUN', nameFr: 'Tunisie', nameEn: 'Tunisia', flag: '🇹🇳', confederation: 'CAF', primary: '#e70013', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('TUN'), shortsUrl: shorts('TUN') },
  { iso: 'EGY', nameFr: 'Égypte', nameEn: 'Egypt', flag: '🇪🇬', confederation: 'CAF', primary: '#ce1126', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('EGY'), shortsUrl: shorts('EGY') },
  { iso: 'GHA', nameFr: 'Ghana', nameEn: 'Ghana', flag: '🇬🇭', confederation: 'CAF', primary: '#ffffff', secondary: '#006b3f', accent: '#fcd116', jerseyUrl: jersey('GHA'), shortsUrl: shorts('GHA') },
  { iso: 'CIV', nameFr: "Côte d'Ivoire", nameEn: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF', primary: '#f77f00', secondary: '#ffffff', accent: '#009e60', jerseyUrl: jersey('CIV'), shortsUrl: shorts('CIV') },
  { iso: 'CPV', nameFr: 'Cap-Vert', nameEn: 'Cape Verde', flag: '🇨🇻', confederation: 'CAF', primary: '#003893', secondary: '#ffffff', accent: '#cf2027', jerseyUrl: jersey('CPV'), shortsUrl: shorts('CPV') },
  { iso: 'ZAF', nameFr: 'Afrique du Sud', nameEn: 'South Africa', flag: '🇿🇦', confederation: 'CAF', primary: '#007a4d', secondary: '#fcb514', accent: '#001489', jerseyUrl: jersey('ZAF'), shortsUrl: shorts('ZAF') },
  { iso: 'COG', nameFr: 'Congo', nameEn: 'Congo', flag: '🇨🇬', confederation: 'CAF', primary: '#009543', secondary: '#fbde4a', accent: '#dc241f', jerseyUrl: jersey('COG'), shortsUrl: shorts('COG') },
  { iso: 'COD', nameFr: 'RD Congo', nameEn: 'DR Congo', flag: '🇨🇩', confederation: 'CAF', primary: '#007fff', secondary: '#f7d618', accent: '#ce1021', jerseyUrl: jersey('COD'), shortsUrl: shorts('COD') },

  // ──────────────────── AFC ────────────────
  { iso: 'JPN', nameFr: 'Japon', nameEn: 'Japan', flag: '🇯🇵', confederation: 'AFC', primary: '#0a2756', secondary: '#ffffff', accent: '#bc002d', jerseyUrl: jersey('JPN'), shortsUrl: shorts('JPN') },
  { iso: 'KOR', nameFr: 'Corée du Sud', nameEn: 'South Korea', flag: '🇰🇷', confederation: 'AFC', primary: '#ed1a3b', secondary: '#0047a0', accent: '#ffffff', jerseyUrl: jersey('KOR'), shortsUrl: shorts('KOR') },
  { iso: 'AUS', nameFr: 'Australie', nameEn: 'Australia', flag: '🇦🇺', confederation: 'AFC', primary: '#ffcd00', secondary: '#00843d', accent: '#0033a0', jerseyUrl: jersey('AUS'), shortsUrl: shorts('AUS') },
  { iso: 'SAU', nameFr: 'Arabie Saoudite', nameEn: 'Saudi Arabia', flag: '🇸🇦', confederation: 'AFC', primary: '#006c35', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('SAU'), shortsUrl: shorts('SAU') },
  { iso: 'QAT', nameFr: 'Qatar', nameEn: 'Qatar', flag: '🇶🇦', confederation: 'AFC', primary: '#8a1538', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('QAT'), shortsUrl: shorts('QAT') },
  { iso: 'IRQ', nameFr: 'Irak', nameEn: 'Iraq', flag: '🇮🇶', confederation: 'AFC', primary: '#007a3d', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('IRQ'), shortsUrl: shorts('IRQ') },
  { iso: 'IRN', nameFr: 'Iran', nameEn: 'Iran', flag: '🇮🇷', confederation: 'AFC', primary: '#239f40', secondary: '#ffffff', accent: '#da0000', jerseyUrl: jersey('IRN'), shortsUrl: shorts('IRN') },
  { iso: 'JOR', nameFr: 'Jordanie', nameEn: 'Jordan', flag: '🇯🇴', confederation: 'AFC', primary: '#000000', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('JOR'), shortsUrl: shorts('JOR') },
  { iso: 'UZB', nameFr: 'Ouzbékistan', nameEn: 'Uzbekistan', flag: '🇺🇿', confederation: 'AFC', primary: '#1eb53a', secondary: '#ffffff', accent: '#0099b5', jerseyUrl: jersey('UZB'), shortsUrl: shorts('UZB') },

  // ─────────────────── OFC ─────────────────
  { iso: 'NZL', nameFr: 'Nouvelle-Zélande', nameEn: 'New Zealand', flag: '🇳🇿', confederation: 'OFC', primary: '#ffffff', secondary: '#000000', accent: '#cc0000', jerseyUrl: jersey('NZL'), shortsUrl: shorts('NZL') },
]

export const NATIONS_BY_ISO: Record<string, Nation> = NATIONS.reduce(
  (acc, n) => {
    acc[n.iso] = n
    return acc
  },
  {} as Record<string, Nation>,
)

export function getNationByIso(iso?: string | null): Nation | null {
  if (!iso) return null
  return NATIONS_BY_ISO[iso.toUpperCase()] ?? null
}

/** Normalise un libellé API (accents, tirets, espaces) pour la recherche. */
export function normalizeNationName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/['']/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Noms officiels FIFA / SportMonks non couverts par `nameEn` seul.
 * Clés = forme normalisée (`normalizeNationName`).
 */
const NATION_NAME_ALIASES: Record<string, string> = {
  turkiye: 'TUR',
  'korea republic': 'KOR',
  'republic of korea': 'KOR',
  czechia: 'CZE',
  'bosnia herzegovina': 'BIH',
  'ivory coast': 'CIV',
  "cote d ivoire": 'CIV',
  curacao: 'CUW',
  'cape verde': 'CPV',
  'cape verde islands': 'CPV',
  'cabo verde': 'CPV',
  'congo dr': 'COD',
  'dr congo': 'COD',
  'democratic republic of congo': 'COD',
  'saudi arabia': 'SAU',
  'united states': 'USA',
  usa: 'USA',
  'ir iran': 'IRN',
  'islamic republic of iran': 'IRN',
  'south korea': 'KOR',
  'new zealand': 'NZL',
  'bosnia and herzegovina': 'BIH',
}

const NATION_LOOKUP_BY_NORM = (() => {
  const map = new Map<string, Nation>()
  for (const n of NATIONS) {
    map.set(normalizeNationName(n.nameFr), n)
    map.set(normalizeNationName(n.nameEn), n)
  }
  for (const [alias, iso] of Object.entries(NATION_NAME_ALIASES)) {
    const nation = NATIONS_BY_ISO[iso]
    if (nation) map.set(alias, nation)
  }
  return map
})()

/** Recherche tolérante par nom FR, EN ou alias FIFA/SportMonks. */
export function findNationByName(name?: string | null): Nation | null {
  if (!name) return null
  return NATION_LOOKUP_BY_NORM.get(normalizeNationName(name)) ?? null
}

export const CONFEDERATIONS: { id: Confederation; label: string }[] = [
  { id: 'UEFA', label: 'Europe' },
  { id: 'CONMEBOL', label: 'Amérique du Sud' },
  { id: 'CONCACAF', label: 'Amérique du Nord & Caraïbes' },
  { id: 'CAF', label: 'Afrique' },
  { id: 'AFC', label: 'Asie' },
  { id: 'OFC', label: 'Océanie' },
]
