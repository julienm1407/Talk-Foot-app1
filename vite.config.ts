import { defineConfig, loadEnv, type Plugin, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * Nom du dépôt GitHub = segment d’URL du site
 * ex. https://julienm1407.github.io/Talk-Foot-app1/ → /Talk-Foot-app1/
 */
const GH_PAGES_BASE = (process.env.GH_PAGES_BASE ?? '/Talk-Foot-app1/').replace(
  /\/?$/,
  '/',
)

function githubPagesStaticPlugin(outDir: string): Plugin {
  return {
    name: 'github-pages-static',
    closeBundle() {
      const out = resolve(__dirname, outDir)
      const indexHtml = resolve(out, 'index.html')
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, resolve(out, '404.html'))
      }
      writeFileSync(resolve(out, '.nojekyll'), '')
    },
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Slugs + lastmod (date publication) depuis `news.ts` — un bloc par entrée `  {`. */
function extractArticleSitemapEntries(
  newsPath: string,
  fallbackLastmod: string,
): { path: string; lastmod: string }[] {
  if (!existsSync(newsPath)) return []
  const src = readFileSync(newsPath, 'utf8')
  const chunks = src.split(/\n {2}\{/g)
  const seen = new Set<string>()
  const out: { path: string; lastmod: string }[] = []
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const slugM = chunk.match(/slug:\s*['"]([^'"]+)['"]/)
    if (!slugM) continue
    const slug = slugM[1]
    if (seen.has(slug)) continue
    seen.add(slug)
    let lastmod = fallbackLastmod
    const pubM = chunk.match(/publishedAt:\s*['"]([^'"]+)['"]/)
    if (pubM) {
      const d = new Date(pubM[1])
      if (!Number.isNaN(d.getTime())) {
        lastmod = d.toISOString().slice(0, 10)
      }
    }
    out.push({ path: `/article/${slug}`, lastmod })
  }
  return out
}

/** Sitemap + robots avec Sitemap: si VITE_PUBLIC_SITE_URL est défini (URL publique sans slash final). */
function tfSitemapRobotsPlugin(outDir: string, siteUrl: string, publicPathPrefix: string): Plugin {
  const origin = siteUrl.replace(/\/$/, '')
  const prefix = publicPathPrefix.replace(/\/$/, '')
  const buildLastmod = new Date().toISOString().slice(0, 10)
  const loc = (path: string) => {
    const p = path.startsWith('/') ? path : `/${path}`
    return escapeXml(`${origin}${prefix}${p}`)
  }
  const staticPaths = ['/', '/privacy', '/match', '/groups', '/debates', '/rankings', '/boutique', '/videos']
  return {
    name: 'tf-sitemap-robots',
    closeBundle() {
      const dir = resolve(__dirname, outDir)
      if (!existsSync(dir)) return
      const newsPath = resolve(__dirname, 'src/data/news.ts')
      const articleEntries = extractArticleSitemapEntries(newsPath, buildLastmod)
      const staticUrls = staticPaths.map((path) => ({
        path,
        lastmod: buildLastmod,
        priority: path === '/' ? '1.0' : '0.75',
      }))
      const articleUrls = articleEntries.map((e) => ({
        ...e,
        priority: '0.9',
      }))
      const allUrls = [...staticUrls, ...articleUrls]
      const body = allUrls
        .map(({ path, lastmod, priority }) => {
          return `  <url>\n    <loc>${loc(path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
        })
        .join('\n')
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
      writeFileSync(resolve(dir, 'sitemap.xml'), sitemap, 'utf8')
      const robots = `User-agent: *
Allow: /

Disallow: /admin

Sitemap: ${origin}${prefix}/sitemap.xml
`
      writeFileSync(resolve(dir, 'robots.txt'), robots, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Aligné sur ce que Vite injecte dans `import.meta.env` au build (inclut `process.env` Vercel, etc.). */
  const buildHasSmToken = Boolean(String(env.VITE_SPORTMONKS_TOKEN ?? '').trim())
  const siteUrl = env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  const GITHUB_PAGES = process.env.GITHUB_PAGES === 'true'
  const outDir = GITHUB_PAGES ? 'docs' : 'dist'
  /** Aligné sur `base` : URLs publiques complètes (ex. GitHub Pages sous /Talk-Foot-app1/). */
  const publicPathPrefix = GITHUB_PAGES ? GH_PAGES_BASE.replace(/\/$/, '') : ''

  const plugins: PluginOption[] = [react()]
  if (GITHUB_PAGES) plugins.push(githubPagesStaticPlugin('docs'))
  if (siteUrl) plugins.push(tfSitemapRobotsPlugin(outDir, siteUrl, publicPathPrefix))

  return {
    define: {
      /** Exposé au client pour diagnostiquer « clé absente » après déploiement (sans révéler le jeton). */
      __TF_BUILD_HAS_SM_TOKEN__: JSON.stringify(buildHasSmToken),
    },
    plugins,
    base: GITHUB_PAGES ? GH_PAGES_BASE : '/',
    build: {
      outDir,
      emptyOutDir: true,
    },
    /** En dev, les appels passent par `/sm-api` → même origine (évite CORS navigateur → SportMonks). */
    server: {
      proxy: {
        '/sm-api': {
          target: 'https://api.sportmonks.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/sm-api/, '/v3/football'),
        },
      },
    },
  }
})
