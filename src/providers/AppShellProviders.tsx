import type { ReactNode } from 'react'
import { ArticlesProvider } from '../contexts/ArticlesContext'
import { DebatesProvider } from '../contexts/DebatesContext'
import { DirectMessagesProvider } from '../contexts/DirectMessagesContext'
import { PrivateMessagesUiProvider } from '../contexts/PrivateMessagesUiContext'

/** Données hub (actus, débats, MP) — uniquement sous AppShell, pas sur login / pages légales. */
export function AppShellProviders({ children }: { children: ReactNode }) {
  return (
    <ArticlesProvider>
      <DebatesProvider>
        <DirectMessagesProvider>
          <PrivateMessagesUiProvider>{children}</PrivateMessagesUiProvider>
        </DirectMessagesProvider>
      </DebatesProvider>
    </ArticlesProvider>
  )
}
