import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppearanceProvider } from './contexts/AppearanceContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
            <App />
          </AuthProvider>
        </AppearanceProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
