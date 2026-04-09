import { createContext, useContext, type ReactNode } from 'react'
import { useDirectMessages } from '../hooks/useDirectMessages'

type DirectMessagesApi = ReturnType<typeof useDirectMessages>

const DirectMessagesContext = createContext<DirectMessagesApi | null>(null)

export function DirectMessagesProvider({ children }: { children: ReactNode }) {
  const value = useDirectMessages()
  return <DirectMessagesContext.Provider value={value}>{children}</DirectMessagesContext.Provider>
}

export function useDirectMessagesContext(): DirectMessagesApi {
  const ctx = useContext(DirectMessagesContext)
  if (!ctx) {
    throw new Error('useDirectMessagesContext doit être utilisé sous DirectMessagesProvider')
  }
  return ctx
}

/** Pour le partage hors panneau MP : null si le provider n’est pas monté. */
export function useDirectMessagesOptional(): DirectMessagesApi | null {
  return useContext(DirectMessagesContext)
}
