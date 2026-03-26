import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'

const STORAGE_KEY = 'talkfoot.appearance.v1'

export type Appearance = 'dark' | 'light'

type Ctx = {
  appearance: Appearance
  setAppearance: (a: Appearance) => void
  toggleAppearance: () => void
}

const AppearanceContext = createContext<Ctx | null>(null)

function readStored(): Appearance {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    typeof document !== 'undefined' ? readStored() : 'dark',
  )

  const setAppearance = useCallback((a: Appearance) => {
    setAppearanceState(a)
    try {
      localStorage.setItem(STORAGE_KEY, a)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleAppearance = useCallback(() => {
    setAppearance(appearance === 'dark' ? 'light' : 'dark')
  }, [appearance, setAppearance])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.tfAppearance = appearance
    root.style.colorScheme = appearance === 'light' ? 'light' : 'dark'
  }, [appearance])

  const value = useMemo(
    () => ({ appearance, setAppearance, toggleAppearance }),
    [appearance, setAppearance, toggleAppearance],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance(): Ctx {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider')
  }
  return ctx
}

/** Pour composants optionnels hors provider (ex. storybook) */
export function useAppearanceOptional(): Ctx | null {
  return useContext(AppearanceContext)
}
