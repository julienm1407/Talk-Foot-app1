import { useEffect } from 'react'

const SEO_ATTR = 'data-tf-article-seo'
const DEFAULT_TITLE = 'Talk Foot'
const DEFAULT_DESCRIPTION =
  'Talk Foot — réseau social foot en direct : salons de match, chat live, réactions et immersion tribune.'

function basePath(): string {
  const b = import.meta.env.BASE_URL ?? '/'
  return b.endsWith('/') ? b.slice(0, -1) : b
}

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

function removeSeoNodes() {
  document.head.querySelectorAll(`[${SEO_ATTR}]`).forEach((n) => n.remove())
}

type ArticleSeoInput = {
  title: string
  description: string
  canonicalPath: string
  ogImage: string
  publishedAt: string
  modifiedAt?: string
  section?: string
}

/**
 * Met à jour title, meta, Open Graph, Twitter Card, canonical et JSON-LD Article.
 * Restaure le titre par défaut et supprime les nœuds injectés au démontage.
 */
export function useArticleSeo(opts: ArticleSeoInput | null) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!opts) return

    const rel = opts.canonicalPath.startsWith('/') ? opts.canonicalPath : `/${opts.canonicalPath}`
    const path = `${basePath()}${rel}`
    const canonicalUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

    const prevTitle = document.title
    document.title = `${opts.title} | Talk Foot`

    const existingDesc = document.head.querySelector(
      'meta[name="description"]:not([data-tf-article-seo])',
    ) as HTMLMetaElement | null
    const prevDescContent = existingDesc?.getAttribute('content') ?? null
    if (existingDesc) {
      existingDesc.setAttribute('content', opts.description)
    } else {
      upsertMeta('name', 'description', opts.description)
    }
    upsertMeta('property', 'og:type', 'article')
    upsertMeta('property', 'og:title', opts.title)
    upsertMeta('property', 'og:description', opts.description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', opts.ogImage)
    upsertMeta('property', 'og:locale', 'fr_FR')
    upsertMeta('property', 'og:site_name', 'Talk Foot')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', opts.title)
    upsertMeta('name', 'twitter:description', opts.description)
    upsertMeta('name', 'twitter:image', opts.ogImage)

    upsertLinkRel('canonical', canonicalUrl)

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: opts.title,
      description: opts.description,
      image: [opts.ogImage],
      datePublished: opts.publishedAt,
      dateModified: opts.modifiedAt ?? opts.publishedAt,
      author: { '@type': 'Organization', name: 'Talk Foot' },
      publisher: {
        '@type': 'Organization',
        name: 'Talk Foot',
        logo: {
          '@type': 'ImageObject',
          url:
            typeof window !== 'undefined'
              ? `${window.location.origin}${basePath()}/logo-talk-foot.png`
              : `${basePath()}/logo-talk-foot.png`,
        },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      articleSection: opts.section ?? 'Football',
      inLanguage: 'fr-FR',
    })

    return () => {
      document.title = prevTitle || DEFAULT_TITLE
      removeSeoNodes()
      if (existingDesc) {
        if (prevDescContent !== null) {
          existingDesc.setAttribute('content', prevDescContent)
        } else {
          existingDesc.setAttribute('content', DEFAULT_DESCRIPTION)
        }
      }
    }
  }, [opts])
}
