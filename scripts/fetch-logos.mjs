import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('src/assets/logos')
fs.mkdirSync(outDir, { recursive: true })

/**
 * Use Wikimedia's direct file redirect.
 * https://commons.wikimedia.org/wiki/Special:FilePath/<FileName>
 */
const logos = [
  // Leagues
  { key: 'ligue-1', filename: 'Ligue1.svg' },
  { key: 'laliga', filename: 'LaLiga_logo_2023.svg' },
  { key: 'serie-a', filename: 'Serie_A.svg' },
  { key: 'bundesliga', filename: 'Bundesliga_logo.svg' },
  // Clubs (some may vary by naming on Commons; add as needed)
  { key: 'om', filename: 'Olympique_Marseille_logo.svg' },
  { key: 'int', filename: 'FC_Internazionale_Milano_2021.svg' },
  { key: 'bvb', filename: 'Borussia_Dortmund_logo.svg' },
  { key: 'bay', filename: 'FC_Bayern_München_logo_(2024).svg' },
  { key: 'juv', filename: 'Juventus_FC_-_pictogram_black_(Italy,_2017).svg' },
  { key: 'liv', filename: 'Liverpool_logo.svg' },
  // Alternatives / historical (Commons availability varies for current marks)
  { key: 'psg', filename: 'Logo_Paris_SG_1992.svg' },
  {
    key: 'rma',
    filename: 'Real_Madrid_CF_(ancien_logo).svg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Real_Madrid_CF_%28ancien_logo%29.svg',
  },
]

async function download(url, destPath) {
  // If already downloaded, don't re-fetch (be nice to Commons).
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 200) return 'cached'

  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, { redirect: 'follow' })
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(destPath, buf)
      return 'downloaded'
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 600 * attempt + Math.round(Math.random() * 400)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  throw new Error(`Failed after retries for ${url}`)
}

async function main() {
  const manifest = {}
  for (const l of logos) {
    const url =
      l.url ??
      `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
        l.filename,
      )}`
    const out = path.join(outDir, l.filename)
    process.stdout.write(`Fetching ${l.key} → ${l.filename}...\n`)
    try {
      const status = await download(url, out)
      process.stdout.write(`  - ${status}\n`)
      manifest[l.key] = `/src/assets/logos/${l.filename}`
    } catch (e) {
      process.stdout.write(`  - failed\n`)
      manifest[l.key] = null
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  )
  process.stdout.write(`Done. Saved to ${outDir}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

