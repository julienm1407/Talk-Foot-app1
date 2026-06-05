/**
 * Import moustache + barbe complète pour le système modulaire.
 * Canvas cible : 1000×1000 (comme body, mouth, goatee, 3days…).
 * Les sources 1024×1024 sont redimensionnées proportionnellement.
 */
import sharp from 'sharp'
import { readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const beardDir = join(root, 'assets', 'beard')
const CANVAS = 1000

async function hairBBox(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const a = data[i + 3]
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (a < 16 || (r < 28 && g < 28 && b < 28)) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return null
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

async function makeTransparentCanvas(srcPath) {
  const img = sharp(srcPath).ensureAlpha()
  const meta = await img.metadata()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const out = Buffer.from(data)

  for (let i = 0; i < width * height; i++) {
    const o = i * channels
    if (out[o] < 28 && out[o + 1] < 28 && out[o + 2] < 28) {
      out[o + 3] = 0
    }
  }

  let pipeline = sharp(out, { raw: { width, height, channels } })

  if (width !== CANVAS || height !== CANVAS) {
    pipeline = pipeline.resize(CANVAS, CANVAS, { fit: 'fill' })
  }

  return pipeline.png().toBuffer()
}

async function validateSource(srcPath, kind) {
  const buffer = await makeTransparentCanvas(srcPath)
  const bbox = await hairBBox(buffer)
  if (!bbox) throw new Error(`Aucun pixel visible: ${srcPath}`)
  if (kind === 'mustache' && (bbox.height > 35 || bbox.width > 120)) {
    throw new Error(`Fichier moustache invalide (trop grand): ${srcPath}`)
  }
  if (kind === 'full' && (bbox.height < 50 || bbox.width < 100)) {
    throw new Error(`Fichier barbe complète invalide (trop petit): ${srcPath}`)
  }
  return bbox
}

async function findLatest(srcRoot, needle, kind) {
  const hits = readdirSync(srcRoot)
    .filter((f) => f.includes(needle) && f.endsWith('.png'))
    .map((f) => ({ f, mtime: statSync(join(srcRoot, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)

  if (!hits.length) throw new Error(`Source introuvable: ${needle}`)

  for (const hit of hits) {
    const path = join(srcRoot, hit.f)
    try {
      await validateSource(path, kind)
      return path
    } catch {
      continue
    }
  }
  throw new Error(`Aucune source valide pour: ${needle}`)
}

async function processBeardAsset(srcPath, outPath) {
  const buffer = await makeTransparentCanvas(srcPath)
  await sharp(buffer).png().toFile(outPath)
  const bbox = await hairBBox(buffer)
  const meta = await sharp(outPath).metadata()
  console.log(`OK ${outPath} (${meta.width}×${meta.height}) bbox`, bbox)
}

async function main() {
  const srcRoot =
    process.argv[2] ||
    'C:\\Users\\User\\.cursor\\projects\\c-Users-User-Documents-Talk-Foot-TOM\\assets'

  const mustacheSrc = await findLatest(srcRoot, 'moustache__2_', 'mustache')
  const fullSrc = await findLatest(srcRoot, 'beard_full__2_', 'full')

  console.log('Sources:')
  console.log(' ', mustacheSrc.split(/[\\/]/).pop())
  console.log(' ', fullSrc.split(/[\\/]/).pop())

  await processBeardAsset(mustacheSrc, join(beardDir, 'beard_mustache.png'))
  await processBeardAsset(fullSrc, join(beardDir, 'beard_full.png'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
