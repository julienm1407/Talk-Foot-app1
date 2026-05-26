#!/usr/bin/env node
/**
 * Importe les maillots nationaux (PNG) depuis le dossier `Downloads` vers
 * `public/jerseys/nations/<iso>.png`.
 *
 * Usage :
 *   node scripts/import-nation-jerseys.mjs                       # source : maillot CDM png
 *   JERSEY_SOURCE_DIR="..." node scripts/import-nation-jerseys.mjs
 *
 * Variables d'environnement (optionnelles) :
 *   JERSEY_SOURCE_DIR   chemin du dossier source (par défaut ~/Downloads/maillot CDM png)
 *   JERSEY_TARGET_DIR   chemin du dossier cible (par défaut public/jerseys/nations)
 *
 * Convention : on préfère la version "Maillot <Pays> Talkfoot.png" (plus récente)
 * et on fallback sur la version "<Pays> MAILLOT.png" si la première est absente.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const SOURCE_DIR =
  process.env.JERSEY_SOURCE_DIR || join(homedir(), 'Downloads', 'maillot CDM png')
const TARGET_DIR =
  process.env.JERSEY_TARGET_DIR || join(projectRoot, 'public', 'jerseys', 'nations')

/**
 * Correspondance ISO (alpha-3) → noms FR usuels.
 * On accepte plusieurs orthographes pour matcher les fichiers livrés.
 */
const NATION_ALIASES = {
  FRA: ['france'],
  ESP: ['espagne'],
  DEU: ['allemagne'],
  ENG: ['angleterre', 'england'],
  PRT: ['portugal'],
  BEL: ['belgique'],
  NLD: ['pays bas', 'pays-bas', 'paysbas'],
  HRV: ['croatie'],
  CHE: ['suisse'],
  AUT: ['autriche'],
  NOR: ['norvege', 'norvège'],
  TUR: ['turquie'],
  SWE: ['suede', 'suède'],
  BIH: ['bosnie'],
  CZE: ['republique tcheque', 'république tchèque', 'tcheque', 'rep tcheque', 'rep. tcheque'],
  SCO: ['ecosse', 'écosse'],
  ARG: ['argentine'],
  BRA: ['bresil', 'brésil', 'bresill', 'brésill'],
  URY: ['uruguay'],
  COL: ['colombie'],
  ECU: ['equateur', 'équateur'],
  PRY: ['paraguay'],
  USA: ['etats unis', 'états-unis', 'etats-unis', 'usa', 'etat unis', 'états unis'],
  MEX: ['mexique'],
  CAN: ['canada'],
  HTI: ['haiti', 'haïti'],
  PAN: ['panama'],
  CUW: ['curacao', 'curaçao'],
  MAR: ['maroc'],
  DZA: ['algerie', 'algérie'],
  SEN: ['senegal', 'sénégal'],
  TUN: ['tunisie'],
  EGY: ['egypte', 'égypte'],
  GHA: ['ghana'],
  CIV: ['cote d ivoire', "cote d'ivoire", 'cote-d-ivoire', 'cote_d_ivoire'],
  CPV: ['cap vert', 'cap-vert'],
  ZAF: ['afrique du sud', 'affrique du sud'],
  COG: ['congo'],
  JPN: ['japon'],
  KOR: ['coree du sud', 'corée du sud', 'korea', 'corée'],
  AUS: ['australie'],
  SAU: ['arabie saoudite'],
  QAT: ['qatar'],
  IRQ: ['irak', 'iraq'],
  IRN: ['iran'],
  JOR: ['jordanie'],
  UZB: ['ouzbekistan', 'ouzbékistan'],
  NZL: ['nouvelle zelande', 'nouvelle-zélande', 'nouvelle zélande'],
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickBestFileFor(iso, files) {
  const aliases = NATION_ALIASES[iso] || []
  const normFiles = files.map((f) => ({ raw: f, norm: normalize(f) }))
  const matches = normFiles.filter((f) =>
    aliases.some((alias) => f.norm.includes(normalize(alias))),
  )
  if (matches.length === 0) return null
  const talkfoot = matches.find((f) => /talkfoot/.test(f.norm))
  if (talkfoot) return talkfoot.raw
  const maillotUpper = matches.find((f) => /maillot/.test(f.norm))
  if (maillotUpper) return maillotUpper.raw
  return matches[0].raw
}

function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`[import-jerseys] Dossier source introuvable : ${SOURCE_DIR}`)
    console.error('Définis JERSEY_SOURCE_DIR pour pointer ailleurs.')
    process.exit(1)
  }
  if (!existsSync(TARGET_DIR)) {
    mkdirSync(TARGET_DIR, { recursive: true })
    console.log(`[import-jerseys] Dossier cible créé : ${TARGET_DIR}`)
  }

  const allFiles = readdirSync(SOURCE_DIR).filter((f) => /\.png$/i.test(f))
  console.log(`[import-jerseys] ${allFiles.length} PNG trouvés dans le dossier source`)

  let copied = 0
  let missing = []
  for (const iso of Object.keys(NATION_ALIASES)) {
    const file = pickBestFileFor(iso, allFiles)
    if (!file) {
      missing.push(iso)
      continue
    }
    const src = join(SOURCE_DIR, file)
    const dst = join(TARGET_DIR, `${iso.toLowerCase()}.png`)
    copyFileSync(src, dst)
    copied += 1
    console.log(`  ${iso.toLowerCase()}.png  ←  ${file}`)
  }

  console.log(`\n[import-jerseys] ${copied} maillot(s) copié(s)`)
  if (missing.length > 0) {
    console.warn(`[import-jerseys] Manquants (${missing.length}) : ${missing.join(', ')}`)
  }
}

main()
