import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageSeo } from '../../hooks/usePageSeo'
import { seoForRoutePath } from '../../seo/routeMeta'

/** Synchronise title & meta avec la route (SPA). Les articles utilisent useArticleSeo sur la page détail. */
export function RouteSeo() {
  const { pathname } = useLocation()
  const isArticle = pathname.startsWith('/article/')
  const config = useMemo(() => {
    if (isArticle) return 'skip' as const
    return seoForRoutePath(pathname)
  }, [pathname, isArticle])
  usePageSeo(pathname, config)
  return null
}
