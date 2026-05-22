import type { ReactNode } from 'react'
import { ArticlesProvider } from '../contexts/ArticlesContext'
import { DebatesProvider } from '../contexts/DebatesContext'

/** Données hub (actus, débats) — uniquement sous AppShell, pas sur login / pages légales. */
export function AppShellProviders({ children }: { children: ReactNode }) {
  return (
    <ArticlesProvider>
      <DebatesProvider>{children}</DebatesProvider>
    </ArticlesProvider>
  )
}
