#!/usr/bin/env node
/**
 * Résout les ids SportMonks + dossiers CDN pour les clubs du catalogue Talk Foot.
 * Usage: node scripts/sync-sm-team-ids.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const API = 'https://api.sportmonks.com/v3/football'
const FOLDERS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 25, 27, 28]

/** id catalogue → terme de recherche SM */
const CLUBS = {
  betis: 'Real Betis',
  girona: 'Girona',
  getafe: 'Getafe',
  osasuna: 'Osasuna',
  mallorca: 'Mallorca',
  alaves: 'Alaves',
  celta: 'Celta',
  rayo: 'Rayo Vallecano',
  sociedad: 'Real Sociedad',
  bilbao: 'Athletic Club',
  valencia: 'Valencia',
  palace: 'Crystal Palace',
  whu: 'West Ham',
  bha: 'Brighton',
  brentford: 'Brentford',
  fulham: 'Fulham',
  wolves: 'Wolverhampton',
  bournemouth: 'Bournemouth',
  forest: 'Nottingham Forest',
  saints: 'Southampton',
  leicester: 'Leicester',
  everton: 'Everton',
  torino: 'Torino',
  genoa: 'Genoa',
  udinese: 'Udinese',
  monza: 'Monza',
  lecce: 'Lecce',
  cagliari: 'Cagliari',
  empoli: 'Empoli',
  frankfurt: 'Eintracht Frankfurt',
  wolfsburg: 'Wolfsburg',
  freiburg: 'Freiburg',
  hoffenheim: 'Hoffenheim',
  union: 'Union Berlin',
  stuttgart: 'Stuttgart',
  augsburg: 'Augsburg',
  mainz: 'Mainz',
  bremen: 'Werder Bremen',
  gladbach: 'Mönchengladbach',
  bochum: 'Bochum',
  heidenheim: 'Heidenheim',
  koln: 'Köln',
  parisfc: 'Paris FC',
  monaco: 'Monaco',
  lyon: 'Lyon',
  lille: 'Lille',
  lens: 'Lens',
  rennes: 'Rennes',
  brest: 'Brest',
  nantes: 'Nantes',
  strasbourg: 'Strasbourg',
  montpellier: 'Montpellier',
  reims: 'Reims',
  toulouse: 'Toulouse',
  lorient: 'Lorient',
  lehavre: 'Le Havre',
  metz: 'Metz',
  auxerre: 'Auxerre',
  angers: 'Angers',
  lemans: 'Le Mans',
  troyes: 'Troyes',
  stetienne: 'Saint-Étienne',
}

function readToken() {
  for (const key of ['SPORTMONKS_TOKEN', 'VITE_SPORTMONKS_TOKEN']) {
    if (process.env[key]?.trim()) return process.env[key].trim()
  }
  const envPath = path.resolve('.env.local')
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^\s*VITE_SPORTMONKS_TOKEN=(.+)\s*$/m)
    if (m?.[1]) return m[1].trim()
  }
  throw new Error('Token SM manquant (.env.local ou env)')
}

function cdnFolderFromImagePath(imagePath) {
  if (typeof imagePath !== 'string') return null
  const m = imagePath.match(/\/teams\/(\d+)\/(\d+)\./i)
  if (!m) return null
  return { folder: Number(m[1]), teamId: Number(m[2]) }
}

async function smFetch(url, token) {
  const sep = url.includes('?') ? '&' : '?'
  const res = await fetch(`${url}${sep}api_token=${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

async function searchTeam(query, token) {
  const json = await smFetch(`${API}/teams/search/${encodeURIComponent(query)}`, token)
  const rows = Array.isArray(json?.data) ? json.data : []
  return rows[0] ?? null
}

async function probeCdn(teamId) {
  for (const folder of FOLDERS) {
    const url = `https://cdn.sportmonks.com/images/soccer/teams/${folder}/${teamId}.png`
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok) return { folder, url }
  }
  return null
}

async function main() {
  const token = readToken()
  const teamIds = {}
  const folders = {}

  for (const [clubId, query] of Object.entries(CLUBS)) {
    process.stdout.write(`${clubId}… `)
    try {
      const row = await searchTeam(query, token)
      if (!row?.id) {
        process.stdout.write('not found\n')
        continue
      }
      const parsed = cdnFolderFromImagePath(row.image_path ?? row.logo_path ?? '')
      let folder = parsed?.folder
      const smId = parsed?.teamId ?? row.id
      if (folder == null) {
        const probed = await probeCdn(smId)
        folder = probed?.folder ?? null
      }
      teamIds[clubId] = smId
      if (folder != null) folders[smId] = folder
      process.stdout.write(`ok id=${smId} folder=${folder ?? '?'}\n`)
    } catch (e) {
      process.stdout.write(`err ${e.message}\n`)
    }
    await new Promise((r) => setTimeout(r, 120))
  }

  const out = { teamIds, folders }
  fs.writeFileSync(path.resolve('scripts/sm-team-ids-output.json'), JSON.stringify(out, null, 2))
  console.log('\nWrote scripts/sm-team-ids-output.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
