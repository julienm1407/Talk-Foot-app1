import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** Build pour GitHub Pages (dossier /docs + base du dépôt) */
const GITHUB_PAGES = process.env.GITHUB_PAGES === 'true'

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

export default defineConfig({
  plugins: [
    react(),
    ...(GITHUB_PAGES ? [githubPagesStaticPlugin('docs')] : []),
  ],
  base: GITHUB_PAGES ? GH_PAGES_BASE : '/',
  build: {
    outDir: GITHUB_PAGES ? 'docs' : 'dist',
    emptyOutDir: true,
  },
})
