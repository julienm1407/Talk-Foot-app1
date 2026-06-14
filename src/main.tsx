import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, isClerkAuthConfigured } from './contexts/AuthContext'
import { AppearanceProvider } from './contexts/AppearanceContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import { CookieConsentBanner } from './components/legal/CookieConsentBanner'
import { RouteSeo } from './components/seo/RouteSeo'

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmed = typeof base === 'string' ? base.replace(/\/$/, '') : ''
  return trimmed || undefined
}

/** Sur GitHub Pages (`/Talk-Foot-app1/`), « / » renvoie hors de l’app ; Clerk doit retomber sur la base Vite. */
function clerkFallbackPath(): string {
  const raw = typeof import.meta.env.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/'
  if (raw === '/' || raw === '') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

const appTree = (
  <ErrorBoundary>
    <BrowserRouter basename={routerBasename()}>
      <AppearanceProvider>
        <AuthProvider>
          <RouteSeo />
          <App />
          <CookieConsentBanner />
        </AuthProvider>
      </AppearanceProvider>
    </BrowserRouter>
  </ErrorBoundary>
)

const root = (
  <StrictMode>
    {isClerkAuthConfigured() ? (
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        signInFallbackRedirectUrl={clerkFallbackPath()}
        signUpFallbackRedirectUrl={clerkFallbackPath()}
        touchSession
      >
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </StrictMode>
)

function showFatalBootError(title: string, detail: string) {
  const el = document.getElementById('root')
  if (!el) return
  el.replaceChildren()
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'min-height:100dvh;margin:0;display:flex;align-items:center;justify-content:center;padding:1.5rem;text-align:center;font-family:ui-sans-serif,system-ui,sans-serif;background:linear-gradient(180deg,#041424 0%,#061a2e 100%);color:#e8f0f8;'
  const box = document.createElement('div')
  box.style.cssText = 'max-width:26rem;line-height:1.5'
  const h = document.createElement('p')
  h.style.cssText = 'font-weight:800;font-size:1rem;margin:0 0 0.75rem'
  h.textContent = title
  const d = document.createElement('p')
  d.style.cssText = 'font-size:0.85rem;font-weight:500;opacity:0.92;margin:0 0 1rem;word-break:break-word'
  d.textContent = detail
  const hint = document.createElement('p')
  hint.style.cssText = 'font-size:0.78rem;opacity:0.8;margin:0'
  hint.textContent =
    'Vérifie l’URL (sur GitHub Pages : …/Talk-Foot-app1/), le réseau, puis F12 → onglet Réseau si un fichier .js est en erreur 404.'
  box.append(h, d, hint)
  wrap.append(box)
  el.append(wrap)
}

const mountEl = document.getElementById('root')
if (!mountEl) {
  document.body.textContent = 'Élément #root introuvable dans index.html.'
} else {
  try {
    createRoot(mountEl).render(root)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    showFatalBootError('Talk Foot n’a pas pu démarrer.', msg)
  }
}
