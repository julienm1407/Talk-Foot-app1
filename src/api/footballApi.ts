/**
 * Référentiel Big 5 + mapping noms d’équipes (SportMonks, etc.) → ids internes Talk Foot.
 * L’ancienne intégration API-Football a été retirée : uniquement SportMonks pour les matchs.
 */
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
export const LEAGUE_IDS: Record<string, number> = {
  'ligue-1': 61,
  laliga: 140,
  epl: 39,
  'serie-a': 135,
  bund: 78,
}

export const COMP_NAMES: Record<string, { name: string; shortName: string }> = {
  'ligue-1': { name: 'Ligue 1', shortName: 'L1' },
  laliga: { name: 'LaLiga', shortName: 'LL' },
  epl: { name: 'Premier League', shortName: 'EPL' },
  'serie-a': { name: 'Serie A', shortName: 'SA' },
  bund: { name: 'Bundesliga', shortName: 'BUN' },
  ucl: { name: 'Ligue des champions', shortName: 'C1' },
  uel: { name: 'Ligue Europa', shortName: 'EL' },
  uecl: { name: 'Ligue Europa Conf.', shortName: 'ECL' },
}

/**
 * `league_id` renvoyé sur les fixtures SportMonks v3 (doc / réponses réelles).
 * Les anciennes valeurs `LEAGUE_IDS` ci-dessus restent un référentiel interne, pas des ids SM.
 */
export const SM_LEAGUE_ID_TO_COMP: Record<number, string> = {
  301: 'ligue-1',
  8: 'epl',
  564: 'laliga',
  384: 'serie-a',
  82: 'bund',
  2: 'ucl',
  2286: 'uel',
  1371: 'uecl',
  271: 'uecl',
}

/** Ids ligue SportMonks pour `standings/live/leagues/{id}` (inverse de `SM_LEAGUE_ID_TO_COMP` Big 5). */
export const SM_LEAGUE_ID_BY_TALKFOOT_COMP: Record<string, number> = {
  'ligue-1': 301,
  epl: 8,
  laliga: 564,
  'serie-a': 384,
  bund: 82,
}

const LEAGUE_NAME_TO_COMP: [RegExp, string][] = [
  [/ligue\s*1/i, 'ligue-1'],
  [/premier\s*league|premiership\s*\(?\s*eng/i, 'epl'],
  [/la\s*liga/i, 'laliga'],
  [/serie\s*a\b/i, 'serie-a'],
  [/bundesliga/i, 'bund'],
  [/champions\s*league|uefa\s*champions|ligue\s*des\s*champions/i, 'ucl'],
  [/europa\s*league|ligue\s*europa(?!\s*conf)/i, 'uel'],
  [/conference\s*league|europa\s*conf/i, 'uecl'],
]

/** Mappe la ligue SportMonks → id compétition Talk Foot (thèmes, filtres calendrier). */
export function inferTalkFootCompIdFromSmLeague(
  league: { id?: number; name?: string; short_code?: string } | null | undefined,
): string {
  const lid = league?.id
  if (typeof lid === 'number') {
    const byId = SM_LEAGUE_ID_TO_COMP[lid]
    if (byId) return byId
  }

  const blob = `${league?.name ?? ''} ${league?.short_code ?? ''}`
  for (const [re, id] of LEAGUE_NAME_TO_COMP) {
    if (re.test(blob)) return id
  }

  const sc = (league?.short_code ?? '').toUpperCase().replace(/\s+/g, ' ').trim()
  if (/^UK\s*PL$|^PL$|PREM/i.test(sc) || /\bEPL\b/.test(sc)) return 'epl'
  if (/^ESP\s*PD$|^PD$|^LL$/.test(sc) || /PRIMERA|LALIGA/i.test(blob)) return 'laliga'
  if (/^BL1$|BUND/i.test(sc + blob)) return 'bund'
  if (/^SA$|SERIE\s*A|CALCIO/i.test(sc + blob)) return 'serie-a'
  if (/^L1$|LIGUE\s*1|DIVISION\s*1.*FRANCE/i.test(sc + blob)) return 'ligue-1'

  if (typeof lid === 'number') return `ext-${lid}`
  return 'ligue-1'
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

const NAME_TO_ID: Record<string, string> = {
  parissaintgermain: 'psg',
  parissaintgermainfc: 'psg',
  parissg: 'psg',
  parisfootballclub: 'parisfc',
  parisfc: 'parisfc',
  olympiquedemarseille: 'om',
  marseille: 'om',
  asmonaco: 'monaco',
  monaco: 'monaco',
  ogcnice: 'nice',
  nice: 'nice',
  lilleosc: 'lille',
  lille: 'lille',
  olympiquelyonnais: 'lyon',
  lyon: 'lyon',
  rclens: 'lens',
  lens: 'lens',
  staderennais: 'rennes',
  rennes: 'rennes',
  stadebrestois: 'brest',
  stadebrestois29: 'brest',
  brest: 'brest',
  fcnantes: 'nantes',
  nantes: 'nantes',
  rcstrasbourg: 'strasbourg',
  strasbourg: 'strasbourg',
  montpellierhsc: 'montpellier',
  montpellier: 'montpellier',
  stagedereims: 'reims',
  reims: 'reims',
  toulousefc: 'toulouse',
  toulouse: 'toulouse',
  fclorient: 'lorient',
  lorient: 'lorient',
  lehavreac: 'lehavre',
  lehavre: 'lehavre',
  auxerre: 'auxerre',
  ajauxerre: 'auxerre',
  angerssco: 'angers',
  angers: 'angers',
  saintsetienne: 'stetienne',
  saintsaintetienne: 'stetienne',
  stetienne: 'stetienne',
  realmadrid: 'rma',
  rma: 'rma',
  fcbarcelona: 'fcb',
  barcelona: 'fcb',
  athleticomadrid: 'atleti',
  atletico: 'atleti',
  sevillafc: 'sevilla',
  sevilla: 'sevilla',
  realsociedad: 'sociedad',
  sociedad: 'sociedad',
  realbetis: 'betis',
  betis: 'betis',
  villarrealcf: 'villarreal',
  villarreal: 'villarreal',
  athleticclub: 'bilbao',
  athleticbilbao: 'bilbao',
  bilbao: 'bilbao',
  valenciacf: 'valencia',
  valencia: 'valencia',
  getafecf: 'getafe',
  getafe: 'getafe',
  gironafc: 'girona',
  girona: 'girona',
  caosasuna: 'osasuna',
  osasuna: 'osasuna',
  rcdmallorca: 'mallorca',
  mallorca: 'mallorca',
  deportivoalaves: 'alaves',
  alaves: 'alaves',
  celta: 'celta',
  celtavigo: 'celta',
  rayovallecano: 'rayo',
  rayo: 'rayo',
  manchestercity: 'mci',
  mancity: 'mci',
  liverpool: 'liv',
  arsenal: 'ars',
  chelsea: 'che',
  manchesterunited: 'mun',
  manunited: 'mun',
  tottenham: 'tot',
  newcastleunited: 'new',
  newcastle: 'new',
  astonvilla: 'avl',
  villa: 'avl',
  westhamunited: 'whu',
  westham: 'whu',
  brighton: 'bha',
  brentford: 'brentford',
  crystalpalace: 'palace',
  palace: 'palace',
  fulham: 'fulham',
  wolverhampton: 'wolves',
  wolves: 'wolves',
  bournemouth: 'bournemouth',
  nottinghamforest: 'forest',
  forest: 'forest',
  southampton: 'saints',
  leicestercity: 'leicester',
  leicester: 'leicester',
  everton: 'everton',
  ipswichtown: 'ipswich',
  ipswich: 'ipswich',
  inter: 'inter',
  intermilan: 'inter',
  juventus: 'juve',
  juve: 'juve',
  napoli: 'napoli',
  acmilan: 'milan',
  milan: 'milan',
  asroma: 'roma',
  roma: 'roma',
  lazio: 'lazio',
  atalanta: 'atalanta',
  fiorentina: 'fiorentina',
  torino: 'torino',
  bologna: 'bologna',
  genoa: 'genoa',
  udinese: 'udinese',
  acmonza: 'monza',
  monza: 'monza',
  lecce: 'lecce',
  cagliari: 'cagliari',
  empoli: 'empoli',
  sassuolo: 'sassuolo',
  salernitana: 'salernitana',
  verona: 'verona',
  hellasverona: 'verona',
  bayernmunich: 'bayern',
  bayern: 'bayern',
  borussiadortmund: 'bvb',
  dortmund: 'bvb',
  bayerleverkusen: 'leverkusen',
  leverkusen: 'leverkusen',
  rbleipzig: 'leipzig',
  leipzig: 'leipzig',
  vflwolfsburg: 'wolfsburg',
  wolfsburg: 'wolfsburg',
  scfreiburg: 'freiburg',
  freiburg: 'freiburg',
  eintrachtfrankfurt: 'frankfurt',
  frankfurt: 'frankfurt',
  tsg1899hoffenheim: 'hoffenheim',
  hoffenheim: 'hoffenheim',
  unionberlin: 'union',
  vfbstuttgart: 'stuttgart',
  stuttgart: 'stuttgart',
  fcaugsburg: 'augsburg',
  augsburg: 'augsburg',
  mainz05: 'mainz',
  mainz: 'mainz',
  werderbremen: 'bremen',
  bremen: 'bremen',
  borussiamonchengladbach: 'gladbach',
  gladbach: 'gladbach',
  vflbochum: 'bochum',
  bochum: 'bochum',
  fcunionberlin: 'union',
  '1fcunionberlin': 'union',
  heidenheim: 'heidenheim',
  fckoln: 'koln',
  koln: 'koln',
}

export function apiNameToOurId(name: string): string {
  const key = normalize(name)
  return NAME_TO_ID[key] ?? key.slice(0, 8)
}

/** Id interne Talk Foot depuis le `participant_id` SportMonks (prioritaire sur le nom API). */
export function clubIdFromSportMonksTeamId(sportMonksTeamId: number | undefined): string | undefined {
  if (sportMonksTeamId == null) return undefined
  for (const [clubId, smId] of Object.entries(SPORTMONKS_TEAM_ID_BY_CLUB_ID)) {
    if (smId === sportMonksTeamId) return clubId
  }
  return undefined
}

/** Résout l’id club : d’abord SportMonks, sinon nom API (évite Paris FC → PSG). */
export function resolveTalkFootClubId(opts: {
  apiName: string
  sportMonksTeamId?: number
}): string {
  return clubIdFromSportMonksTeamId(opts.sportMonksTeamId) ?? apiNameToOurId(opts.apiName)
}
