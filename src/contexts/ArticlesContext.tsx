import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { NewsItem } from '../data/news'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { fetchPublishedArticles } from '../lib/supabase/articles'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

type ArticlesContextValue = {
  articles: NewsItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const ArticlesContext = createContext<ArticlesContextValue | null>(null)

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setArticles([])
      setError(null)
      setLoading(false)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (!sb) {
      setArticles([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await fetchPublishedArticles(sb)
      setArticles(rows)
      setError(null)
    } catch (e) {
      setArticles([])
      setError(e instanceof Error ? e.message : 'Impossible de charger les actus.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ articles, loading, error, refresh }),
    [articles, loading, error, refresh],
  )

  return <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>
}

export function useArticles(): ArticlesContextValue {
  const ctx = useContext(ArticlesContext)
  if (!ctx) {
    throw new Error('useArticles must be used within ArticlesProvider')
  }
  return ctx
}
