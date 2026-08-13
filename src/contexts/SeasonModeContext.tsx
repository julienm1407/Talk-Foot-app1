import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorage'
import {
  isCdm2026SeasonClosed,
  resolveSeasonMode,
  type SeasonModeId,
  type SeasonModeOverride,
} from '../utils/seasonMode'

const OVERRIDE_STORAGE_KEY = 'talkfoot.seasonMode.override.v1'

type StoredOverride = { override: SeasonModeOverride }

function isStoredOverride(parsed: unknown): parsed is StoredOverride {
  if (!parsed || typeof parsed !== 'object') return false
  const v = (parsed as { override?: unknown }).override
  return v === 'auto' || v === 'on' || v === 'off'
}

/**
 * Après le Mondial : `auto` devient `off` (championnats + coupes).
 * L’admin peut encore forcer ON pour des tests.
 */
function normalizePostCdmOverride(override: SeasonModeOverride): SeasonModeOverride {
  if (!isCdm2026SeasonClosed()) return override
  if (override === 'auto') return 'off'
  return override
}

export type SeasonModeContextValue = {
  /** Mode appliqué (résolu après override + fenêtre). */
  seasonMode: SeasonModeId
  /** Raccourci pratique consommé partout. */
  isCdm2026: boolean
  /** Source actuelle de la valeur (auto = dérivée des dates). */
  override: SeasonModeOverride
  /** Mode résolu si l'override était `auto` (sert au libellé admin). */
  autoMode: SeasonModeId
  setOverride: (next: SeasonModeOverride) => void
}

const SeasonModeContext = createContext<SeasonModeContextValue | null>(null)

export function SeasonModeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useLocalStorageState<StoredOverride>(
    OVERRIDE_STORAGE_KEY,
    { override: 'off' },
    isStoredOverride,
  )
  const override = normalizePostCdmOverride(stored.override)

  useEffect(() => {
    if (stored.override === override) return
    setStored({ override })
  }, [override, setStored, stored.override])

  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const autoMode = useMemo<SeasonModeId>(() => resolveSeasonMode('auto', now), [now])
  const seasonMode = useMemo<SeasonModeId>(
    () => resolveSeasonMode(override, now),
    [override, now],
  )
  const isCdm2026 = seasonMode === 'cdm2026'

  useEffect(() => {
    const root = document.documentElement
    if (isCdm2026) {
      root.setAttribute('data-tf-season', 'cdm2026')
    } else {
      root.removeAttribute('data-tf-season')
    }
    return () => {
      root.removeAttribute('data-tf-season')
    }
  }, [isCdm2026])

  const setOverride = useCallback(
    (next: SeasonModeOverride) => setStored({ override: next }),
    [setStored],
  )

  const value = useMemo<SeasonModeContextValue>(
    () => ({ seasonMode, isCdm2026, override, autoMode, setOverride }),
    [seasonMode, isCdm2026, override, autoMode, setOverride],
  )

  return <SeasonModeContext.Provider value={value}>{children}</SeasonModeContext.Provider>
}

export function useSeasonMode(): SeasonModeContextValue {
  const ctx = useContext(SeasonModeContext)
  if (!ctx) throw new Error('useSeasonMode must be used within SeasonModeProvider')
  return ctx
}

/** Variante non-throwante, utile dans les routes hors AppShell. */
export function useOptionalSeasonMode(): SeasonModeContextValue | null {
  return useContext(SeasonModeContext)
}
