#!/usr/bin/env node
/**
 * Importe les shorts clubs (PNG) vers assets/ + public/shorts/clubs/.
 * Usage : node scripts/import-club-shorts.mjs [sourceDir]
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')
const defaultSource = join(projectRoot, '_import_club_kits', 'shorts')
const sourceDir = resolve(process.argv[2] || defaultSource)

/** Nom de fichier (sans extension, après normalisation) → id club Talk Foot. */
const FILE_TO_CLUB_ID = {
  // Préfixe « Short » déjà retiré, ou fichiers sans préfixe
  '99': 'villarreal',
  'AC MILAN': 'milan',
  ALAVES: 'alaves',
  Angers: 'angers',
  ANGERS: 'angers',
  Arsenal: 'ars',
  ARSENAL: 'ars',
  'Aston Villa': 'avl',
  'ASTON VILLA': 'avl',
  Atalanta: 'atalanta',
  ATALANTA: 'atalanta',
  'ATLETIC BILBAO': 'bilbao',
  'ATLETICO MADRID': 'atleti',
  Ausburg: 'augsburg',
  AUGSBURG: 'augsburg',
  Auxerre: 'auxerre',
  AUXERRE: 'auxerre',
  Barca: 'fcb',
  BARCA: 'fcb',
  'BAYER LEVERKUSEN': 'leverkusen',
  Bayern: 'bayern',
  'BAYERN MUNICH': 'bayern',
  Betis: 'betis',
  BETIS: 'betis',
  Bologne: 'bologna',
  BOLOGNE: 'bologna',
  Bournemouth: 'bournemouth',
  BOURNEMOUTH: 'bournemouth',
  Brentford: 'brentford',
  BRENTFORD: 'brentford',
  Brest: 'brest',
  BREST: 'brest',
  Cagliari: 'cagliari',
  CAGLIARI: 'cagliari',
  Celta: 'celta',
  CELTA: 'celta',
  Chelsea: 'che',
  CHELSEA: 'che',
  City: 'mci',
  'MAN CITY': 'mci',
  Cologne: 'koln',
  COLOGNE: 'koln',
  Come: 'como',
  COME: 'como',
  Coventry: 'coventry',
  COVENTRY: 'coventry',
  'Crystal Palace': 'palace',
  DORTMUND: 'bvb',
  Elche: 'elche',
  ELCHE: 'elche',
  ELVERSBERG: 'elversberg',
  Espanyol: 'espanyol',
  Everton: 'everton',
  EVERTON: 'everton',
  Fiorentina: 'fiorentina',
  FIORENTINA: 'fiorentina',
  FRANCFORT: 'frankfurt',
  FRIBOURG: 'freiburg',
  Frosinone: 'frosinone',
  FROSINONE: 'frosinone',
  Fulham: 'fulham',
  FULHAM: 'fulham',
  Genoa: 'genoa',
  GENOA: 'genoa',
  Getafe: 'getafe',
  GETAFE: 'getafe',
  HAMBOURG: 'hamburg',
  HOFFENHEIM: 'hoffenheim',
  Hull: 'hull',
  HULL: 'hull',
  Inter: 'inter',
  INTER: 'inter',
  IPSWICH: 'ipswich',
  Juventus: 'juve',
  JUVENTUS: 'juve',
  'La Corogne': 'coruna',
  'LA COROGNE': 'coruna',
  Lazio: 'lazio',
  LAZIO: 'lazio',
  'Le Havre': 'lehavre',
  'LE HAVRE': 'lehavre',
  'Le Mans': 'lemans',
  'LE MANS': 'lemans',
  Lecce: 'lecce',
  LECCE: 'lecce',
  Leeds: 'leeds',
  LEEDS: 'leeds',
  Leipzig: 'leipzig',
  LEIPZIG: 'leipzig',
  Lens: 'lens',
  LENS: 'lens',
  LEVANTE: 'levante',
  Lille: 'lille',
  LILLE: 'lille',
  Liverpool: 'liv',
  LIVERPOOL: 'liv',
  Lorient: 'lorient',
  LORIENT: 'lorient',
  Lyon: 'lyon',
  LYON: 'lyon',
  MALAGA: 'malaga',
  Mayence: 'mainz',
  MAYENCE: 'mainz',
  Monaco: 'monaco',
  MONACO: 'monaco',
  MONCHENGLADBACH: 'gladbach',
  Monza: 'monza',
  MONZA: 'monza',
  Naples: 'napoli',
  NAPLES: 'napoli',
  Newcastle: 'new',
  NEWCASTLE: 'new',
  Nice: 'nice',
  NICE: 'nice',
  Nottingham: 'forest',
  'NOTT FOREST': 'forest',
  OM: 'om',
  '0M': 'om',
  Ossasuna: 'osasuna',
  OSSASUNA: 'osasuna',
  Paderborn: 'paderborn',
  PADERBORN: 'paderborn',
  Parme: 'parma',
  PARME: 'parma',
  PFC: 'parisfc',
  'Paris FC': 'parisfc',
  PSG: 'psg',
  'Real Madrid': 'rma',
  'REAL MADRID': 'rma',
  'Real Sociedad': 'sociedad',
  'REAL SOCIEDAD': 'sociedad',
  Rennes: 'rennes',
  RENNES: 'rennes',
  Roma: 'roma',
  'AS ROMA': 'roma',
  Santander: 'santander',
  SANTANDER: 'santander',
  Sassuolo: 'sassuolo',
  SASSUOLO: 'sassuolo',
  Schalke: 'schalke',
  SHALKE: 'schalke',
  Seville: 'sevilla',
  SEVILLE: 'sevilla',
  Strasbourg: 'strasbourg',
  STRASBOURG: 'strasbourg',
  STUTTGART: 'stuttgart',
  Sunderland: 'sunderland',
  SUNDERLAND: 'sunderland',
  Torino: 'torino',
  TORINO: 'torino',
  Totttenham: 'tot',
  TOTTENHAM: 'tot',
  Toulouse: 'toulouse',
  TOULOUSE: 'toulouse',
  troyes: 'troyes',
  TROYES: 'troyes',
  Udinese: 'udinese',
  UDINESE: 'udinese',
  'UNION BERLIN': 'union',
  United: 'mun',
  UNITED: 'mun',
  VALENCE: 'valencia',
  Vallecano: 'rayo',
  VALLECANO: 'rayo',
  Venise: 'venezia',
  Venezia: 'venezia',
  VILLAREAL: 'villarreal',
  Werder: 'bremen',
  WERDER: 'bremen',
  'Base Blanc': 'blanc',
  'Base Bleu': 'bleu',
  'Base Jaune': 'jaune',
  'Base Rouge': 'rouge',
}

function normalizeLabel(raw) {
  let label = raw.replace(/^Short\s+/i, '').trim()
  // NFC + strip accents for Barça → Barca (map keys are ASCII)
  label = label.normalize('NFD').replace(/\p{M}/gu, '')
  return label
}

const assetsShorts = join(projectRoot, 'assets', 'shorts')
const publicClubs = join(projectRoot, 'public', 'shorts', 'clubs')
const publicBase = join(projectRoot, 'public', 'shorts', 'base')

for (const d of [assetsShorts, publicClubs, publicBase]) {
  mkdirSync(d, { recursive: true })
}

if (!existsSync(sourceDir)) {
  console.error(`Source introuvable: ${sourceDir}`)
  process.exit(1)
}

const imported = []
const skipped = []
const seen = new Set()

for (const file of readdirSync(sourceDir)) {
  if (extname(file).toLowerCase() !== '.png') continue
  const rawLabel = basename(file, extname(file))
  const label = normalizeLabel(rawLabel)
  const clubId =
    FILE_TO_CLUB_ID[label] ||
    FILE_TO_CLUB_ID[label.toUpperCase()] ||
    FILE_TO_CLUB_ID[rawLabel] ||
    FILE_TO_CLUB_ID[normalizeLabel(rawLabel)]

  if (!clubId) {
    skipped.push(rawLabel)
    continue
  }
  if (seen.has(clubId)) {
    console.warn(`Doublon ignoré pour ${clubId}: ${file}`)
    continue
  }
  seen.add(clubId)

  const src = join(sourceDir, file)
  const isBase = ['blanc', 'bleu', 'jaune', 'rouge'].includes(clubId)

  if (isBase) {
    copyFileSync(src, join(assetsShorts, `short_base_${clubId}.png`))
    copyFileSync(src, join(publicBase, `${clubId}.png`))
    imported.push({ label: rawLabel, clubId, kind: 'base' })
  } else {
    copyFileSync(src, join(assetsShorts, `short_club_${clubId}.png`))
    copyFileSync(src, join(publicClubs, `${clubId}.png`))
    copyFileSync(src, join(publicClubs, `${clubId}-boutique.png`))
    imported.push({ label: rawLabel, clubId, kind: 'club' })
  }
}

console.log(
  `Imported ${imported.length} shorts (${imported.filter((x) => x.kind === 'club').length} clubs, ${imported.filter((x) => x.kind === 'base').length} bases).`,
)
if (skipped.length) {
  console.log(`Non mappés (${skipped.length}): ${skipped.join(', ')}`)
}
