import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type OpenOpts = {
  /** Ouvre le panneau MP sur ce fil (`dm-friend-…` ou fil Coach). */
  threadId?: string
}

type PrivateMessagesUiApi = {
  isOpen: boolean
  /** Fil affiché dans le panneau (null = liste des conversations). */
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void
  /** Fil à activer une fois le panneau monté (consommé par le panneau). */
  pendingThreadId: string | null
  open: (opts?: OpenOpts) => void
  close: () => void
  clearPendingThread: () => void
}

const PrivateMessagesUiContext = createContext<PrivateMessagesUiApi | null>(null)

export function PrivateMessagesUiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null)

  const open = useCallback((opts?: OpenOpts) => {
    if (opts?.threadId != null && opts.threadId !== '') {
      setPendingThreadId(opts.threadId)
    } else {
      setActiveThreadId(null)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setPendingThreadId(null)
    setActiveThreadId(null)
  }, [])

  const clearPendingThread = useCallback(() => {
    setPendingThreadId(null)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      activeThreadId,
      setActiveThreadId,
      pendingThreadId,
      open,
      close,
      clearPendingThread,
    }),
    [isOpen, activeThreadId, pendingThreadId, open, close, clearPendingThread],
  )

  return <PrivateMessagesUiContext.Provider value={value}>{children}</PrivateMessagesUiContext.Provider>
}

export function usePrivateMessagesUi(): PrivateMessagesUiApi {
  const ctx = useContext(PrivateMessagesUiContext)
  if (!ctx) throw new Error('usePrivateMessagesUi doit être utilisé sous PrivateMessagesUiProvider')
  return ctx
}
