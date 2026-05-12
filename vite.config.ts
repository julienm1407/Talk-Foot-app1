import type { IncomingMessage, ServerResponse } from 'node:http'
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
      writeFileSync(resolve(out, '.nojekyll'), '')
    },
  }
}

/** Copie `index.html` en `404.html` pour fallback SPA au refresh (hébergeurs statiques). */
function spa404FallbackPlugin(outDir: string): Plugin {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const out = resolve(__dirname, outDir)
      const indexHtml = resolve(out, 'index.html')
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, resolve(out, '404.html'))
      }
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
  const staticPaths = ['/', '/privacy', '/terms', '/match', '/groups', '/debates', '/rankings', '/boutique', '/videos']
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

/** En dev, même contrat que `api/sm.js` (Vercel) : clé `SPORTMONKS_TOKEN` hors bundle + `VITE_USE_SM_DEV_RELAY=true`. */
function sportMonksRelayDevPlugin(mode: string): Plugin {
  return {
    name: 'tf-sportmonks-relay-dev',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '')
      const useRelay = env.VITE_USE_SM_DEV_RELAY === 'true' || env.VITE_USE_SM_DEV_RELAY === '1'
      const token = String(env.SPORTMONKS_TOKEN || env.VITE_SPORTMONKS_TOKEN || '').trim()
      if (!useRelay || !token) {
        if (useRelay && !token) {
          console.warn(
            '[TalkFoot] VITE_USE_SM_DEV_RELAY activé mais SPORTMONKS_TOKEN (ou VITE_SPORTMONKS_TOKEN) manquant dans .env.local — relais /api/sm indisponible.',
          )
        }
        return
      }
      console.info('[TalkFoot] Relais dev SportMonks : GET /api/sm → api.sportmonks.com (jeton côté serveur Vite).')

      const cachePolicyForPath = (pathname: string) => {
        if (pathname.startsWith('/livescores/inplay')) return 'public, s-maxage=30, stale-while-revalidate=60'
        if (pathname.startsWith('/fixtures/')) return 'public, s-maxage=45, stale-while-revalidate=90'
        if (pathname.startsWith('/rounds/')) return 'public, s-maxage=60, stale-while-revalidate=120'
        if (pathname.startsWith('/leagues/date/')) return 'public, s-maxage=300, stale-while-revalidate=600'
        if (pathname.startsWith('/standings/')) return 'public, s-maxage=180, stale-while-revalidate=360'
        if (pathname.startsWith('/schedules/')) return 'public, s-maxage=120, stale-while-revalidate=240'
        if (pathname.startsWith('/teams/')) return 'public, s-maxage=120, stale-while-revalidate=240'
        if (pathname.startsWith('/squads/')) return 'public, s-maxage=300, stale-while-revalidate=600'
        return 'public, s-maxage=60, stale-while-revalidate=120'
      }

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/sm')) return next()
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Allow', 'GET')
          res.end('Method Not Allowed')
          return
        }
        const host = req.headers.host || 'localhost'
        const incoming = new URL(rawUrl, `http://${host}`)
        const smPath = incoming.searchParams.get('__sm_path') || ''
        if (!smPath.startsWith('/') || smPath.includes('..')) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ message: 'Paramètre __sm_path invalide' }))
          return
        }
        incoming.searchParams.delete('__sm_path')
        const upstream = new URL(`https://api.sportmonks.com/v3/football${smPath}`)
        incoming.searchParams.forEach((value, key) => {
          upstream.searchParams.set(key, value)
        })
        if (!upstream.searchParams.has('timezone')) {
          upstream.searchParams.set('timezone', 'Europe/Paris')
        }

        void fetch(upstream.toString(), {
          headers: { Authorization: token },
          cache: 'no-store',
        })
          .then(async (smRes) => {
            const text = await smRes.text()
            const ct = smRes.headers.get('content-type') || 'application/json; charset=utf-8'
            res.statusCode = smRes.status
            res.setHeader('Content-Type', ct)
            if (smRes.status >= 200 && smRes.status < 300) {
              res.setHeader('Cache-Control', cachePolicyForPath(smPath))
            } else {
              res.setHeader('Cache-Control', 'no-store')
            }
            res.end(text)
          })
          .catch((e: unknown) => {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(
              JSON.stringify({
                message: e instanceof Error ? `SportMonks relay: ${e.message}` : 'SportMonks relay error',
              }),
            )
          })
      })
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

  const plugins: PluginOption[] = [react(), sportMonksRelayDevPlugin(mode), spa404FallbackPlugin(outDir)]
  if (GITHUB_PAGES) plugins.push(githubPagesStaticPlugin('docs'))
  if (siteUrl) plugins.push(tfSitemapRobotsPlugin(outDir, siteUrl, publicPathPrefix))

  return {
    define: {
      /** Exposé au client pour diagnostiquer « clé absente » après déploiement (sans révéler le jeton). */
      __TF_BUILD_HAS_SM_TOKEN__: JSON.stringify(buildHasSmToken),
      /** Build exécuté sur les machines Vercel → relais `/api/sm` possible sans jeton dans le bundle. */
      __TF_VERCEL_DEPLOY__: JSON.stringify(process.env.VERCEL === '1'),
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
