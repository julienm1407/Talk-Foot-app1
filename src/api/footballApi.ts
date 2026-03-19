const API_BASE = 'https://v3.football.api-sports.io'

// IDs des 5 grands championnats (API-FOOTBALL)
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
}

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    timestamp: number
    status: { short: string; elapsed?: number; extra?: number }
  }
  league: { id: number; name: string }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: { home: number | null; away: number | null }
  score?: {
    halftime?: { home: number | null; away: number | null }
    fulltime?: { home: number | null; away: number | null }
  }
}

// Mapping noms API -> id interne (normalisation approximative)
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/g, '')
}

const NAME_TO_ID: Record<string, string> = {
  // Ligue 1
  parissaintgermain: 'psg',
  paris: 'psg',
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
  parisfc: 'parisfc',

  // La Liga
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

  // EPL
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

  // Serie A
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

  // Bundesliga
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

// Inversion : league API id → compId interne
const LEAGUE_ID_TO_COMP: Record<number, string> = Object.fromEntries(
  Object.entries(LEAGUE_IDS).map(([k, v]) => [v, k]),
)

/**
 * Plan gratuit : saisons 2022–2024 uniquement.
 * On force la saison 2024 (2024-25) pour avoir des matchs réels.
 * Plage : fév–mai 2025 (fin de saison 2024-25).
 */
const FREE_PLAN_SEASON = 2024
const FREE_PLAN_FROM = '2025-02-01'
const FREE_PLAN_TO = '2025-05-15'

export async function fetchFixtures(
  apiKey: string,
  from?: string,
  to?: string,
): Promise<Array<ApiFixture & { compId: string }>> {
  const fromDate = from ?? FREE_PLAN_FROM
  const toDate = to ?? FREE_PLAN_TO
  const all: Array<ApiFixture & { compId: string }> = []
  for (const [compId, leagueId] of Object.entries(LEAGUE_IDS)) {
    const url = `${API_BASE}/fixtures?league=${leagueId}&season=${FREE_PLAN_SEASON}&from=${fromDate}&to=${toDate}`
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    })
    const data = await res.json()
    if (data.errors?.length) continue
    const items = data.response ?? []
    for (const f of items) {
      all.push({ ...f, compId } as ApiFixture & { compId: string })
    }
  }
  return all.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
}

/**
 * Matchs en direct (paramètre live=all).
 * Filtre sur les 5 grands championnats uniquement.
 */
/** Rennes–PSG 8 mars 2025 17h — match en direct (replay) */
export const REPLAY_MATCH_FIXTURE_ID = 1213970

/**
 * Récupère le match Rennes–PSG du 8 mars 2025 17h pour le replay live.
 */
export async function fetchRennesPsgReplay(
  apiKey: string,
): Promise<(ApiFixture & { compId: string }) | null> {
  const res = await fetch(
    `${API_BASE}/fixtures?league=61&season=2024&from=2025-03-07&to=2025-03-09`,
    { headers: { 'x-apisports-key': apiKey } },
  )
  const data = await res.json()
  if (data.errors?.length) return null
  const items: ApiFixture[] = data.response ?? []
  const f = items.find(
    (x) =>
      (x.teams.home.name === 'Rennes' && x.teams.away.name === 'Paris Saint Germain') ||
      (x.teams.home.name === 'Paris Saint Germain' && x.teams.away.name === 'Rennes'),
  )
  if (!f || !f.goals) return null
  return { ...f, compId: 'ligue-1' }
}

export async function fetchLiveFixtures(
  apiKey: string,
): Promise<Array<ApiFixture & { compId: string }>> {
  const res = await fetch(`${API_BASE}/fixtures?live=all`, {
    headers: { 'x-apisports-key': apiKey },
  })
  const data = await res.json()
  if (data.errors?.length) return []
  const items = data.response ?? []
  const ourLeagueIds = new Set(Object.values(LEAGUE_IDS))
  return items
    .filter((f: ApiFixture) => ourLeagueIds.has(f.league.id))
    .map((f: ApiFixture) => ({
      ...f,
      compId: LEAGUE_ID_TO_COMP[f.league.id] ?? 'ligue-1',
    }))
}
