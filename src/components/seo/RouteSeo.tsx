import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageSeo } from '../../hooks/usePageSeo'
import { seoForRoutePath } from '../../seo/routeMeta'

/** Synchronise title & meta avec la route (SPA). Les articles utilisent useArticleSeo sur la page détail. */
export function RouteSeo() {
  const { pathname } = useLocation()
  const isArticle = pathname.startsWith('/article/')
  const isClub = pathname.startsWith('/club/')
  const config = useMemo(() => {
    if (isArticle) return 'skip' as const
    if (isClub) return 'skip' as const
    return seoForRoutePath(pathname)
  }, [pathname, isArticle, isClub])
  usePageSeo(pathname, config)
  return null
}
