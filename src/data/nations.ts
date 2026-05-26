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
  /** Chemin public vers le maillot CDM (PNG ~ 600 Ko). */
  jerseyUrl: string
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
const JERSEY_ASSET_VERSION = '2026-05-26'
function jersey(iso: string): string {
  return `/jerseys/nations/${iso.toLowerCase()}.png?v=${JERSEY_ASSET_VERSION}`
}

export const NATIONS: Nation[] = [
  // ───────────────── UEFA ─────────────────
  { iso: 'FRA', nameFr: 'France', nameEn: 'France', flag: '🇫🇷', confederation: 'UEFA', primary: '#001f5b', secondary: '#ffffff', accent: '#ef3340', jerseyUrl: jersey('FRA') },
  { iso: 'ESP', nameFr: 'Espagne', nameEn: 'Spain', flag: '🇪🇸', confederation: 'UEFA', primary: '#c60b1e', secondary: '#ffc400', accent: '#0a3161', jerseyUrl: jersey('ESP') },
  { iso: 'DEU', nameFr: 'Allemagne', nameEn: 'Germany', flag: '🇩🇪', confederation: 'UEFA', primary: '#000000', secondary: '#ffffff', accent: '#dd0000', jerseyUrl: jersey('DEU') },
  { iso: 'ENG', nameFr: 'Angleterre', nameEn: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', primary: '#ffffff', secondary: '#0a3161', accent: '#cf142b', jerseyUrl: jersey('ENG') },
  { iso: 'PRT', nameFr: 'Portugal', nameEn: 'Portugal', flag: '🇵🇹', confederation: 'UEFA', primary: '#c8102e', secondary: '#006847', accent: '#ffd700', jerseyUrl: jersey('PRT') },
  { iso: 'BEL', nameFr: 'Belgique', nameEn: 'Belgium', flag: '🇧🇪', confederation: 'UEFA', primary: '#c8102e', secondary: '#ffc72c', accent: '#000000', jerseyUrl: jersey('BEL') },
  { iso: 'NLD', nameFr: 'Pays-Bas', nameEn: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', primary: '#ff6c0e', secondary: '#21468b', accent: '#ffffff', jerseyUrl: jersey('NLD') },
  { iso: 'HRV', nameFr: 'Croatie', nameEn: 'Croatia', flag: '🇭🇷', confederation: 'UEFA', primary: '#ff0000', secondary: '#ffffff', accent: '#171796', jerseyUrl: jersey('HRV') },
  { iso: 'CHE', nameFr: 'Suisse', nameEn: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA', primary: '#d52b1e', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('CHE') },
  { iso: 'AUT', nameFr: 'Autriche', nameEn: 'Austria', flag: '🇦🇹', confederation: 'UEFA', primary: '#ed2939', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('AUT') },
  { iso: 'NOR', nameFr: 'Norvège', nameEn: 'Norway', flag: '🇳🇴', confederation: 'UEFA', primary: '#ef2b2d', secondary: '#002868', accent: '#ffffff', jerseyUrl: jersey('NOR') },
  { iso: 'TUR', nameFr: 'Turquie', nameEn: 'Turkey', flag: '🇹🇷', confederation: 'UEFA', primary: '#e30a17', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('TUR') },
  { iso: 'SWE', nameFr: 'Suède', nameEn: 'Sweden', flag: '🇸🇪', confederation: 'UEFA', primary: '#006aa7', secondary: '#fecc02', accent: '#ffffff', jerseyUrl: jersey('SWE') },
  { iso: 'BIH', nameFr: 'Bosnie-Herzégovine', nameEn: 'Bosnia and Herzegovina', flag: '🇧🇦', confederation: 'UEFA', primary: '#002395', secondary: '#fecb00', accent: '#ffffff', jerseyUrl: jersey('BIH') },
  { iso: 'CZE', nameFr: 'République Tchèque', nameEn: 'Czech Republic', flag: '🇨🇿', confederation: 'UEFA', primary: '#11457e', secondary: '#d7141a', accent: '#ffffff', jerseyUrl: jersey('CZE') },
  { iso: 'SCO', nameFr: 'Écosse', nameEn: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', primary: '#0065bd', secondary: '#ffffff', accent: '#ffd700', jerseyUrl: jersey('SCO') },

  // ──────────────── CONMEBOL ───────────────
  { iso: 'ARG', nameFr: 'Argentine', nameEn: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', primary: '#74acdf', secondary: '#ffffff', accent: '#f6b40e', jerseyUrl: jersey('ARG') },
  { iso: 'BRA', nameFr: 'Brésil', nameEn: 'Brazil', flag: '🇧🇷', confederation: 'CONMEBOL', primary: '#fedf00', secondary: '#009c3b', accent: '#002776', jerseyUrl: jersey('BRA') },
  { iso: 'URY', nameFr: 'Uruguay', nameEn: 'Uruguay', flag: '🇺🇾', confederation: 'CONMEBOL', primary: '#5cbcec', secondary: '#ffffff', accent: '#fcd116', jerseyUrl: jersey('URY') },
  { iso: 'COL', nameFr: 'Colombie', nameEn: 'Colombia', flag: '🇨🇴', confederation: 'CONMEBOL', primary: '#fcd116', secondary: '#003893', accent: '#ce1126', jerseyUrl: jersey('COL') },
  { iso: 'ECU', nameFr: 'Équateur', nameEn: 'Ecuador', flag: '🇪🇨', confederation: 'CONMEBOL', primary: '#ffcc00', secondary: '#003893', accent: '#ce1126', jerseyUrl: jersey('ECU') },
  { iso: 'PRY', nameFr: 'Paraguay', nameEn: 'Paraguay', flag: '🇵🇾', confederation: 'CONMEBOL', primary: '#d62718', secondary: '#ffffff', accent: '#0038a8', jerseyUrl: jersey('PRY') },

  // ──────────────── CONCACAF ───────────────
  { iso: 'USA', nameFr: 'États-Unis', nameEn: 'United States', flag: '🇺🇸', confederation: 'CONCACAF', primary: '#bf0a30', secondary: '#002868', accent: '#ffffff', jerseyUrl: jersey('USA') },
  { iso: 'MEX', nameFr: 'Mexique', nameEn: 'Mexico', flag: '🇲🇽', confederation: 'CONCACAF', primary: '#006847', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('MEX') },
  { iso: 'CAN', nameFr: 'Canada', nameEn: 'Canada', flag: '🇨🇦', confederation: 'CONCACAF', primary: '#d50000', secondary: '#ffffff', accent: '#0033a0', jerseyUrl: jersey('CAN') },
  { iso: 'HTI', nameFr: 'Haïti', nameEn: 'Haiti', flag: '🇭🇹', confederation: 'CONCACAF', primary: '#00209f', secondary: '#d21034', accent: '#ffffff', jerseyUrl: jersey('HTI') },
  { iso: 'PAN', nameFr: 'Panama', nameEn: 'Panama', flag: '🇵🇦', confederation: 'CONCACAF', primary: '#c8102e', secondary: '#005aa7', accent: '#ffffff', jerseyUrl: jersey('PAN') },
  { iso: 'CUW', nameFr: 'Curaçao', nameEn: 'Curaçao', flag: '🇨🇼', confederation: 'CONCACAF', primary: '#002b7f', secondary: '#fecb00', accent: '#ffffff', jerseyUrl: jersey('CUW') },

  // ─────────────────── CAF ─────────────────
  { iso: 'MAR', nameFr: 'Maroc', nameEn: 'Morocco', flag: '🇲🇦', confederation: 'CAF', primary: '#c1272d', secondary: '#006233', accent: '#ffffff', jerseyUrl: jersey('MAR') },
  { iso: 'DZA', nameFr: 'Algérie', nameEn: 'Algeria', flag: '🇩🇿', confederation: 'CAF', primary: '#006233', secondary: '#ffffff', accent: '#d21034', jerseyUrl: jersey('DZA') },
  { iso: 'SEN', nameFr: 'Sénégal', nameEn: 'Senegal', flag: '🇸🇳', confederation: 'CAF', primary: '#00853f', secondary: '#fdef42', accent: '#e31b23', jerseyUrl: jersey('SEN') },
  { iso: 'TUN', nameFr: 'Tunisie', nameEn: 'Tunisia', flag: '🇹🇳', confederation: 'CAF', primary: '#e70013', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('TUN') },
  { iso: 'EGY', nameFr: 'Égypte', nameEn: 'Egypt', flag: '🇪🇬', confederation: 'CAF', primary: '#ce1126', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('EGY') },
  { iso: 'GHA', nameFr: 'Ghana', nameEn: 'Ghana', flag: '🇬🇭', confederation: 'CAF', primary: '#ffffff', secondary: '#006b3f', accent: '#fcd116', jerseyUrl: jersey('GHA') },
  { iso: 'CIV', nameFr: "Côte d'Ivoire", nameEn: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF', primary: '#f77f00', secondary: '#ffffff', accent: '#009e60', jerseyUrl: jersey('CIV') },
  { iso: 'CPV', nameFr: 'Cap-Vert', nameEn: 'Cape Verde', flag: '🇨🇻', confederation: 'CAF', primary: '#003893', secondary: '#ffffff', accent: '#cf2027', jerseyUrl: jersey('CPV') },
  { iso: 'ZAF', nameFr: 'Afrique du Sud', nameEn: 'South Africa', flag: '🇿🇦', confederation: 'CAF', primary: '#007a4d', secondary: '#fcb514', accent: '#001489', jerseyUrl: jersey('ZAF') },
  { iso: 'COG', nameFr: 'Congo', nameEn: 'Congo', flag: '🇨🇬', confederation: 'CAF', primary: '#009543', secondary: '#fbde4a', accent: '#dc241f', jerseyUrl: jersey('COG') },

  // ──────────────────── AFC ────────────────
  { iso: 'JPN', nameFr: 'Japon', nameEn: 'Japan', flag: '🇯🇵', confederation: 'AFC', primary: '#0a2756', secondary: '#ffffff', accent: '#bc002d', jerseyUrl: jersey('JPN') },
  { iso: 'KOR', nameFr: 'Corée du Sud', nameEn: 'South Korea', flag: '🇰🇷', confederation: 'AFC', primary: '#ed1a3b', secondary: '#0047a0', accent: '#ffffff', jerseyUrl: jersey('KOR') },
  { iso: 'AUS', nameFr: 'Australie', nameEn: 'Australia', flag: '🇦🇺', confederation: 'AFC', primary: '#ffcd00', secondary: '#00843d', accent: '#0033a0', jerseyUrl: jersey('AUS') },
  { iso: 'SAU', nameFr: 'Arabie Saoudite', nameEn: 'Saudi Arabia', flag: '🇸🇦', confederation: 'AFC', primary: '#006c35', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('SAU') },
  { iso: 'QAT', nameFr: 'Qatar', nameEn: 'Qatar', flag: '🇶🇦', confederation: 'AFC', primary: '#8a1538', secondary: '#ffffff', accent: '#000000', jerseyUrl: jersey('QAT') },
  { iso: 'IRQ', nameFr: 'Irak', nameEn: 'Iraq', flag: '🇮🇶', confederation: 'AFC', primary: '#007a3d', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('IRQ') },
  { iso: 'IRN', nameFr: 'Iran', nameEn: 'Iran', flag: '🇮🇷', confederation: 'AFC', primary: '#239f40', secondary: '#ffffff', accent: '#da0000', jerseyUrl: jersey('IRN') },
  { iso: 'JOR', nameFr: 'Jordanie', nameEn: 'Jordan', flag: '🇯🇴', confederation: 'AFC', primary: '#000000', secondary: '#ffffff', accent: '#ce1126', jerseyUrl: jersey('JOR') },
  { iso: 'UZB', nameFr: 'Ouzbékistan', nameEn: 'Uzbekistan', flag: '🇺🇿', confederation: 'AFC', primary: '#1eb53a', secondary: '#ffffff', accent: '#0099b5', jerseyUrl: jersey('UZB') },

  // ─────────────────── OFC ─────────────────
  { iso: 'NZL', nameFr: 'Nouvelle-Zélande', nameEn: 'New Zealand', flag: '🇳🇿', confederation: 'OFC', primary: '#ffffff', secondary: '#000000', accent: '#cc0000', jerseyUrl: jersey('NZL') },
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

/** Recherche tolérante par nom FR ou EN (utile pour matcher SportMonks). */
export function findNationByName(name?: string | null): Nation | null {
  if (!name) return null
  const norm = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
  for (const n of NATIONS) {
    const fr = n.nameFr
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
    const en = n.nameEn.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (fr === norm || en === norm) return n
  }
  return null
}

export const CONFEDERATIONS: { id: Confederation; label: string }[] = [
  { id: 'UEFA', label: 'Europe' },
  { id: 'CONMEBOL', label: 'Amérique du Sud' },
  { id: 'CONCACAF', label: 'Amérique du Nord & Caraïbes' },
  { id: 'CAF', label: 'Afrique' },
  { id: 'AFC', label: 'Asie' },
  { id: 'OFC', label: 'Océanie' },
]
