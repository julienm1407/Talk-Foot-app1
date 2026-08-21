/** Bump à chaque import majeur de kits clubs (maillots / shorts). */
export const CLUB_KIT_ASSET_VERSION = '2026-08-21a'

export function clubJerseyUrl(clubId: string): string {
  return `/jerseys/clubs/${clubId.toLowerCase()}.png?v=${CLUB_KIT_ASSET_VERSION}`
}

export function boutiqueClubJerseyUrl(clubId: string): string {
  return `/jerseys/clubs/${clubId.toLowerCase()}-boutique.png?v=${CLUB_KIT_ASSET_VERSION}`
}

export function clubShortsUrl(clubId: string): string {
  return `/shorts/clubs/${clubId.toLowerCase()}.png?v=${CLUB_KIT_ASSET_VERSION}`
}

export function boutiqueClubShortsUrl(clubId: string): string {
  return `/shorts/clubs/${clubId.toLowerCase()}-boutique.png?v=${CLUB_KIT_ASSET_VERSION}`
}

/** IDs club avec un PNG domicile importé (Big 5 + montées). */
export const CLUB_JERSEY_ASSET_IDS = [
  'psg',
  'parisfc',
  'om',
  'monaco',
  'nice',
  'lille',
  'lyon',
  'lens',
  'rennes',
  'brest',
  'strasbourg',
  'toulouse',
  'lorient',
  'lehavre',
  'auxerre',
  'angers',
  'lemans',
  'troyes',
  'rma',
  'fcb',
  'atleti',
  'sevilla',
  'sociedad',
  'betis',
  'villarreal',
  'bilbao',
  'valencia',
  'getafe',
  'osasuna',
  'alaves',
  'celta',
  'rayo',
  'espanyol',
  'mci',
  'liv',
  'ars',
  'che',
  'mun',
  'tot',
  'new',
  'avl',
  'brentford',
  'palace',
  'fulham',
  'bournemouth',
  'forest',
  'everton',
  'inter',
  'juve',
  'napoli',
  'milan',
  'roma',
  'lazio',
  'atalanta',
  'fiorentina',
  'torino',
  'bologna',
  'genoa',
  'udinese',
  'monza',
  'lecce',
  'cagliari',
  'bayern',
  'bvb',
  'leverkusen',
  'leipzig',
  'frankfurt',
  'freiburg',
  'hoffenheim',
  'union',
  'stuttgart',
  'augsburg',
  'mainz',
  'bremen',
  'gladbach',
  'koln',
  'como',
  'sassuolo',
  'parma',
  'venezia',
  'frosinone',
  'leeds',
  'ipswich',
  'sunderland',
  'coventry',
  'hull',
  'levante',
  'elche',
  'malaga',
  'coruna',
  'santander',
  'hamburg',
  'schalke',
  'paderborn',
  'elversberg',
] as const

/** Même périmètre que les maillots (shorts importés en parallèle). */
export const CLUB_SHORT_ASSET_IDS = CLUB_JERSEY_ASSET_IDS

export type ClubJerseyAssetId = (typeof CLUB_JERSEY_ASSET_IDS)[number]
export type ClubShortAssetId = (typeof CLUB_SHORT_ASSET_IDS)[number]

export function hasClubJerseyAsset(clubId: string): clubId is ClubJerseyAssetId {
  return (CLUB_JERSEY_ASSET_IDS as readonly string[]).includes(clubId)
}

export function hasClubShortAsset(clubId: string): clubId is ClubShortAssetId {
  return (CLUB_SHORT_ASSET_IDS as readonly string[]).includes(clubId)
}
