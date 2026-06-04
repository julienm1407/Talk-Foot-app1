import { useEffect } from 'react'
import { absolutePageUrl, viteBasePath } from '../seo/basePath'
import { absoluteBrandLogoUrl } from '../seo/brandLogo'
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_OG_IMAGE, SITE_NAME } from '../seo/siteCopy'
import type { RouteSeoConfig } from '../seo/routeMeta'

const SEO_ATTR = 'data-tf-page-seo'
const DEFAULT_TITLE = `${SITE_NAME} — live foot, débats et tribunes`

function upsertLinkRel(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"][${SEO_ATTR}]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    el.setAttribute(SEO_ATTR, '')
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"][${SEO_ATTR}]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(SEO_ATTR, '')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertJsonLd(json: object) {
  let el = document.head.querySelector(`script[type="application/ld+json"][${SEO_ATTR}]`) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute(SEO_ATTR, '')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(json)
}

function removePageSeoNodes() {
  document.head.querySelectorAll(`[${SEO_ATTR}]`).forEach((n) => n.remove())
}

export type PageSeoMode = RouteSeoConfig | null | 'skip'

/**
 * SEO pour les pages « génériques » (pas les articles : voir useArticleSeo).
 * `skip` : enlève uniquement les balises page-SEO (ex. /article/* laisse useArticleSeo gérer title & description).
 */
export function usePageSeo(pathname: string, config: PageSeoMode) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (config === 'skip') {
      removePageSeoNodes()
      return
    }

    if (!config) {
      removePageSeoNodes()
      document.title = DEFAULT_TITLE
      const existingDesc = document.head.querySelector(
        'meta[name="description"]:not([data-tf-article-seo]):not([data-tf-page-seo])',
      ) as HTMLMetaElement | null
      if (existingDesc) {
        existingDesc.setAttribute('content', SITE_DEFAULT_DESCRIPTION)
      }
      return
    }

    const canonicalUrl = absolutePageUrl(pathname)
    const robots = config.robots ?? 'index, follow'
    const prevTitle = document.title
    document.title = config.title

    const existingDesc = document.head.querySelector(
      'meta[name="description"]:not([data-tf-article-seo])',
    ) as HTMLMetaElement | null
    const prevDescContent = existingDesc?.getAttribute('content') ?? null
    if (existingDesc) {
      existingDesc.setAttribute('content', config.description)
    } else {
      upsertMeta('name', 'description', config.description)
    }

    upsertMeta('name', 'robots', robots)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:title', config.title)
    upsertMeta('property', 'og:description', config.description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', SITE_DEFAULT_OG_IMAGE)
    upsertMeta('property', 'og:locale', 'fr_FR')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', config.title)
    upsertMeta('name', 'twitter:description', config.description)
    upsertMeta('name', 'twitter:image', SITE_DEFAULT_OG_IMAGE)

    upsertLinkRel('canonical', canonicalUrl)

    const logoUrl = absoluteBrandLogoUrl()
    const base = viteBasePath()

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: config.title,
      description: config.description,
      url: canonicalUrl,
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: typeof window !== 'undefined' ? `${window.location.origin}${base}/` : base || '/',
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: logoUrl },
        },
      },
    })

    return () => {
      document.title = prevTitle || DEFAULT_TITLE
      removePageSeoNodes()
      if (existingDesc) {
        if (prevDescContent !== null) {
          existingDesc.setAttribute('content', prevDescContent)
        } else {
          existingDesc.setAttribute('content', SITE_DEFAULT_DESCRIPTION)
        }
      }
    }
  }, [pathname, config])
}
