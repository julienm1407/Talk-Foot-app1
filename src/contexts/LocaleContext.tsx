import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MESSAGES } from '../i18n/messages'
import {
  detectLocaleFromNavigator,
  isAppLocale,
  localeHtmlLang,
  localeTag,
  resolveMessage,
  type AppLocale,
} from '../i18n/types'

const STORAGE_KEY = 'talkfoot.locale.v1'

type Ctx = {
  locale: AppLocale
  localeTag: string
  setLocale: (locale: AppLocale) => void
  t: (path: string, fallback?: string) => string
}

const LocaleContext = createContext<Ctx | null>(null)

function detectDefaultLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isAppLocale(stored)) return stored
  } catch {
    /* ignore */
  }
  try {
    return detectLocaleFromNavigator(navigator.language || '') ?? 'fr'
  } catch {
    return 'fr'
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    typeof document !== 'undefined' ? detectDefaultLocale() : 'fr',
  )

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.lang = localeHtmlLang(locale)
  }, [locale])

  const t = useCallback(
    (path: string, fallback?: string) => {
      return (
        resolveMessage(MESSAGES[locale], path) ??
        resolveMessage(MESSAGES.fr, path) ??
        fallback ??
        path
      )
    },
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      localeTag: localeTag(locale),
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useLocaleOptional(): Ctx | null {
  return useContext(LocaleContext)
}

export function useT() {
  return useLocale().t
}
