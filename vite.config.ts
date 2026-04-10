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

function extractArticleSlugsFromNewsTs(newsPath: string): string[] {
  if (!existsSync(newsPath)) return []
  const src = readFileSync(newsPath, 'utf8')
  const slugs: string[] = []
  for (const m of src.matchAll(/slug:\s*'([^']+)'/g)) {
    slugs.push(m[1])
  }
  return [...new Set(slugs)]
}

/** Sitemap + robots avec Sitemap: si VITE_PUBLIC_SITE_URL est défini (URL publique sans slash final). */
function tfSitemapRobotsPlugin(outDir: string, siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/$/, '')
  const loc = (path: string) => `${origin}${path.startsWith('/') ? path : `/${path}`}`
  const staticPaths = ['/', '/privacy', '/match', '/groups', '/debates', '/rankings', '/boutique', '/videos']
  return {
    name: 'tf-sitemap-robots',
    closeBundle() {
      const dir = resolve(__dirname, outDir)
      if (!existsSync(dir)) return
      const newsPath = resolve(__dirname, 'src/data/news.ts')
      const articlePaths = extractArticleSlugsFromNewsTs(newsPath).map((slug) => `/article/${slug}`)
      const allPaths = [...staticPaths, ...articlePaths]
      const body = allPaths
        .map((path) => {
          const priority = path === '/' ? '1.0' : path.startsWith('/article/') ? '0.9' : '0.75'
          return `  <url>\n    <loc>${loc(path)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
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

Sitemap: ${loc('/sitemap.xml')}
`
      writeFileSync(resolve(dir, 'robots.txt'), robots, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  const GITHUB_PAGES = process.env.GITHUB_PAGES === 'true'
  const outDir = GITHUB_PAGES ? 'docs' : 'dist'

  const plugins: PluginOption[] = [react()]
  if (GITHUB_PAGES) plugins.push(githubPagesStaticPlugin('docs'))
  if (siteUrl) plugins.push(tfSitemapRobotsPlugin(outDir, siteUrl))

  return {
    plugins,
    base: GITHUB_PAGES ? GH_PAGES_BASE : '/',
    build: {
      outDir,
      emptyOutDir: true,
    },
  }
})
