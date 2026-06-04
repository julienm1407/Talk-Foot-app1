import { cn } from './cn'
import { getArticleEncartMeta, type ArticleEncartKey } from '../theme/appSectionThemes'

export type ArticleSidebarEncartTone = 'light' | 'dark'

export type ArticleSidebarEncart = {
  wrap: string
  chrome: { bar: string; badge: string; pathClass: string }
  cta: string
  pillButton: string
  titleClass: string
  mutedClass: string
  label: string
  hint: string
}

const DARK_SHELL = cn(
  'relative flex flex-col overflow-hidden rounded-2xl border border-white/14',
  'bg-[#0a1628]/90 shadow-[0_10px_32px_rgba(0,0,0,0.32)] backdrop-blur-sm',
  'outline-none transition hover:border-white/22 hover:bg-[#0d1c32]/95',
  'focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
)

const DARK_ACCENT: Record<
  Extract<ArticleEncartKey, 'debates' | 'groups'>,
  { bar: string; badge: string; pathClass: string; cta: string; pillRing: string }
> = {
  debates: {
    bar: 'bg-orange-400/90',
    badge: 'bg-orange-500/20 text-orange-50 ring-1 ring-orange-300/35',
    pathClass: 'text-orange-100/88 font-bold',
    cta: 'text-orange-200 font-black',
    pillRing: 'ring-orange-400/30',
  },
  groups: {
    bar: 'bg-violet-400/90',
    badge: 'bg-violet-500/20 text-violet-50 ring-1 ring-violet-300/35',
    pathClass: 'text-violet-100/88 font-bold',
    cta: 'text-violet-200 font-black',
    pillRing: 'ring-violet-400/30',
  },
}

export function getArticleSidebarEncart(
  key: Extract<ArticleEncartKey, 'debates' | 'groups'>,
  tone: ArticleSidebarEncartTone,
): ArticleSidebarEncart {
  const meta = getArticleEncartMeta(key)
  if (tone === 'light') {
    return {
      wrap: meta.encart.wrap,
      chrome: {
        bar: meta.encart.bar,
        badge: meta.encart.badge,
        pathClass: meta.encart.pathClass,
      },
      cta: meta.encart.cta,
      pillButton: meta.encart.pillButton,
      titleClass: 'text-tf-dark',
      mutedClass: 'text-tf-grey',
      label: meta.label,
      hint: meta.hint,
    }
  }

  const accent = DARK_ACCENT[key]
  return {
    wrap: DARK_SHELL,
    chrome: {
      bar: accent.bar,
      badge: accent.badge,
      pathClass: accent.pathClass,
    },
    cta: accent.cta,
    pillButton: cn(
      'rounded-tf-lg border border-tf-cta-hover/35 bg-tf-cta px-4 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-tf-cta transition hover:bg-tf-cta-hover',
      accent.pillRing,
    ),
    titleClass: 'text-sky-50',
    mutedClass: 'text-sky-100/72',
    label: meta.label,
    hint: meta.hint,
  }
}
