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

const appTree = (
  <ErrorBoundary>
    <BrowserRouter
      basename={(() => {
        const base = import.meta.env.BASE_URL ?? '/'
        const trimmed = typeof base === 'string' ? base.replace(/\/$/, '') : ''
        return trimmed || undefined
      })()}
    >
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
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      >
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(root)
