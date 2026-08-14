#!/usr/bin/env node
/**
 * Importe les maillots clubs (PNG domicile) vers assets/ + public/jerseys/clubs/.
 * Usage : node scripts/import-club-jerseys.mjs [sourceDir]
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')
const defaultSource = join(projectRoot, '_import_club_kits')
const sourceDir = resolve(process.argv[2] || defaultSource)

/** Nom de fichier (sans extension) → id club Talk Foot. */
const FILE_TO_CLUB_ID = {
  '0M': 'om',
  PSG: 'psg',
  'Paris FC': 'parisfc',
  MONACO: 'monaco',
  NICE: 'nice',
  LILLE: 'lille',
  LYON: 'lyon',
  LENS: 'lens',
  RENNES: 'rennes',
  BREST: 'brest',
  STRASBOURG: 'strasbourg',
  TOULOUSE: 'toulouse',
  LORIENT: 'lorient',
  'LE HAVRE': 'lehavre',
  AUXERRE: 'auxerre',
  ANGERS: 'angers',
  'LE MANS': 'lemans',
  TROYES: 'troyes',
  'REAL MADRID': 'rma',
  BARCA: 'fcb',
  'ATLETICO MADRID': 'atleti',
  SEVILLE: 'sevilla',
  'REAL SOCIEDAD': 'sociedad',
  BETIS: 'betis',
  VILLAREAL: 'villarreal',
  'ATLETIC BILBAO': 'bilbao',
  VALENCE: 'valencia',
  GETAFE: 'getafe',
  OSSASUNA: 'osasuna',
  ALAVES: 'alaves',
  CELTA: 'celta',
  VALLECANO: 'rayo',
  Espanyol: 'espanyol',
  'MAN CITY': 'mci',
  LIVERPOOL: 'liv',
  ARSENAL: 'ars',
  CHELSEA: 'che',
  UNITED: 'mun',
  TOTTENHAM: 'tot',
  NEWCASTLE: 'new',
  'ASTON VILLA': 'avl',
  BRENTFORD: 'brentford',
  'Crystal Palace': 'palace',
  FULHAM: 'fulham',
  BOURNEMOUTH: 'bournemouth',
  'NOTT FOREST': 'forest',
  EVERTON: 'everton',
  INTER: 'inter',
  JUVENTUS: 'juve',
  NAPLES: 'napoli',
  'AC MILAN': 'milan',
  'AS ROMA': 'roma',
  LAZIO: 'lazio',
  ATALANTA: 'atalanta',
  FIORENTINA: 'fiorentina',
  TORINO: 'torino',
  BOLOGNE: 'bologna',
  GENOA: 'genoa',
  UDINESE: 'udinese',
  MONZA: 'monza',
  LECCE: 'lecce',
  CAGLIARI: 'cagliari',
  'BAYERN MUNICH': 'bayern',
  DORTMUND: 'bvb',
  'BAYER LEVERKUSEN': 'leverkusen',
  LEIPZIG: 'leipzig',
  FRANCFORT: 'frankfurt',
  FRIBOURG: 'freiburg',
  HOFFENHEIM: 'hoffenheim',
  'UNION BERLIN': 'union',
  STUTTGART: 'stuttgart',
  AUGSBURG: 'augsburg',
  MAYENCE: 'mainz',
  WERDER: 'bremen',
  MONCHENGLADBACH: 'gladbach',
  COLOGNE: 'koln',
  'Base Blanc': 'blanc',
  'Base Bleu': 'bleu',
  'Base Jaune': 'jaune',
  'Base Rouge': 'rouge',
}

const assetsJerseys = join(projectRoot, 'assets', 'jerseys')
const publicClubs = join(projectRoot, 'public', 'jerseys', 'clubs')
const publicBase = join(projectRoot, 'public', 'jerseys', 'base')

for (const d of [assetsJerseys, publicClubs, publicBase]) {
  mkdirSync(d, { recursive: true })
}

if (!existsSync(sourceDir)) {
  console.error(`Source introuvable: ${sourceDir}`)
  process.exit(1)
}

const imported = []
const skipped = []

for (const file of readdirSync(sourceDir)) {
  if (extname(file).toLowerCase() !== '.png') continue
  const label = basename(file, extname(file))
  const clubId = FILE_TO_CLUB_ID[label]
  if (!clubId) {
    skipped.push(label)
    continue
  }

  const src = join(sourceDir, file)
  const isBase = ['blanc', 'bleu', 'jaune', 'rouge'].includes(clubId)

  if (isBase) {
    copyFileSync(src, join(assetsJerseys, `jersey_base_${clubId}.png`))
    copyFileSync(src, join(publicBase, `${clubId}.png`))
    imported.push({ label, clubId, kind: 'base' })
  } else {
    copyFileSync(src, join(assetsJerseys, `jersey_club_${clubId}.png`))
    copyFileSync(src, join(publicClubs, `${clubId}.png`))
    copyFileSync(src, join(publicClubs, `${clubId}-boutique.png`))
    imported.push({ label, clubId, kind: 'club' })
  }
}

console.log(`Imported ${imported.length} maillots (${imported.filter((x) => x.kind === 'club').length} clubs, ${imported.filter((x) => x.kind === 'base').length} bases).`)
if (skipped.length) {
  console.log(`Non mappés (${skipped.length}): ${skipped.join(', ')}`)
}
