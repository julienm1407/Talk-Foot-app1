import { Link } from 'react-router-dom'
import type { NewsItem } from '../../data/news'
import { footballImageUrl, newsItemHasArticlePage } from '../../data/news'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { resolveArticleExcerpt } from '../../utils/articleExcerpt'
import { formatRelativeMinutesAgo } from '../../utils/formatRelativeMinutes'

function tagClass(tag: NewsItem['tag'], light: boolean): string {
  if (light) {
    const map: Record<NewsItem['tag'], string> = {
      Breaking: 'bg-rose-50 text-rose-700 ring-rose-200',
      Analyse: 'bg-blue-50 text-blue-700 ring-blue-200',
      Rumeurs: 'bg-amber-50 text-amber-700 ring-amber-200',
      Débrief: 'bg-slate-50 text-slate-700 ring-slate-200',
    }
    return map[tag]
  }
  const map: Record<NewsItem['tag'], string> = {
    Breaking: 'bg-rose-500/22 text-rose-50 ring-rose-400/35',
    Analyse: 'bg-sky-500/22 text-sky-50 ring-sky-400/35',
    Rumeurs: 'bg-amber-500/22 text-amber-50 ring-amber-400/35',
    Débrief: 'bg-slate-500/22 text-slate-100 ring-slate-400/30',
  }
  return map[tag]
}

export function NewsFeed({
  items,
  personalized,
  supporterClubShort,
  loading,
  /** Dans la carte FEED home : pas de 2e carte ni bandeau titre (évite le vide). */
  embedded,
}: {
  items: NewsItem[]
  personalized?: boolean
  supporterClubShort?: string | null
  loading?: boolean
  embedded?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const focus = supporterClubShort?.trim()
  const resolveFeedImage = (item: NewsItem) => {
    const customCover = item.coverImageUrl?.trim()
    return customCover && customCover.length > 0 ? customCover : footballImageUrl(item.id)
  }

  if (loading) {
    const shell = embedded
      ? cn(
          'rounded-2xl border px-4 py-8 text-center text-sm font-semibold',
          L
            ? 'border-slate-200/70 bg-white/95 text-slate-600'
            : 'border-white/12 bg-white/[0.06] text-sky-100/88',
        )
      : cn('px-6 py-10 text-center text-sm font-semibold', L ? 'text-slate-600' : 'text-sky-100/88')
    return <div className={shell}>Chargement des actus…</div>
  }

  if (items.length === 0) {
    const shell = embedded
      ? cn(
          'rounded-2xl border border-dashed px-4 py-10 text-center',
          L ? 'border-slate-200/80 bg-slate-50/80' : 'border-white/15 bg-white/[0.04]',
        )
      : 'px-6 py-10 text-center'
    return (
      <div className={shell}>
        <p className={cn('text-sm font-black', L ? 'text-slate-900' : 'text-sky-50')}>
          Pas encore d’actu
        </p>
        <p
          className={cn(
            'mt-2 text-xs font-semibold leading-relaxed',
            L ? 'text-slate-600' : 'text-sky-100/78',
          )}
        >
          Les articles publiés sur Talk Foot apparaîtront ici dès qu’ils seront en ligne.
        </p>
      </div>
    )
  }

  const list = (
    <div className={cn('divide-y', L ? 'divide-slate-200/80' : 'divide-white/10')}>
      {items.map((n) => {
        const excerpt = resolveArticleExcerpt(n)
        const rowClass = cn(
          'grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8.75rem] sm:items-stretch sm:gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]',
          embedded ? 'px-4 py-4 sm:px-5 sm:py-4' : 'px-5 py-5 sm:px-6 sm:py-5',
          newsItemHasArticlePage(n) &&
            cn(
              'cursor-pointer outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/35',
              L
                ? 'hover:bg-slate-50/90 focus-visible:bg-slate-50/90'
                : 'hover:bg-white/[0.07] focus-visible:bg-white/[0.09]',
            ),
        )
        const inner = (
          <>
            <div className="order-2 flex min-w-0 flex-col justify-between gap-2 sm:order-1 sm:pr-1">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ring-1 sm:px-2.5 sm:py-1 sm:text-[11px]',
                      tagClass(n.tag, L),
                    )}
                  >
                    {n.tag}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold sm:text-[11px]',
                      L ? 'text-slate-500' : 'text-sky-100/72',
                    )}
                  >
                    {formatRelativeMinutesAgo(n.minutesAgo)}
                  </span>
                </div>
                <h3
                  className={cn(
                    'mt-1.5 text-sm font-black tracking-tight sm:text-base',
                    L ? 'text-slate-950' : 'text-sky-50',
                  )}
                >
                  {n.title}
                </h3>
                {excerpt ? (
                  <p
                    className={cn(
                      'mt-1 line-clamp-2 text-xs font-semibold sm:text-sm',
                      L ? 'text-slate-700' : 'text-sky-100/82',
                    )}
                  >
                    {excerpt}
                  </p>
                ) : null}
              </div>
              <div>
                <span
                  className={cn(
                    'inline-flex rounded-xl border px-2.5 py-1.5 text-xs font-black transition sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm',
                    L
                      ? 'border-slate-300 bg-white text-slate-900 group-hover:border-slate-400'
                      : 'border-white/22 bg-white/10 text-sky-50 group-hover:border-white/30 group-hover:bg-white/14',
                  )}
                >
                  {newsItemHasArticlePage(n) ? 'Lire l’article →' : 'Lire →'}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'relative order-1 w-full shrink-0 overflow-hidden rounded-xl',
                'aspect-[16/10] max-h-[11rem]',
                'sm:order-2 sm:h-full sm:min-h-[6.75rem] sm:w-full sm:max-h-none sm:rounded-2xl',
                L ? 'bg-slate-100' : 'bg-slate-900/50',
              )}
            >
              <img
                src={resolveFeedImage(n)}
                alt={newsItemHasArticlePage(n) ? n.title : ''}
                className="absolute inset-0 size-full object-cover object-center"
                loading="lazy"
              />
            </div>
          </>
        )
        return (
          <article key={n.id} className="group">
            {newsItemHasArticlePage(n) ? (
              <Link to={`/article/${n.slug}`} className={cn(rowClass, 'block text-inherit no-underline')}>
                {inner}
              </Link>
            ) : (
              <div className={rowClass}>{inner}</div>
            )}
          </article>
        )
      })}
    </div>
  )

  if (embedded) {
    return (
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border shadow-sm',
          L ? 'border-slate-200/70 bg-white/95' : 'border-white/12 bg-[#0a1628]/75',
        )}
      >
        {list}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className={cn('text-[11px] font-black tracking-wide', L ? 'text-slate-600' : 'text-sky-100/75')}>
              ACTU
            </div>
            <div
              className={cn(
                'text-2xl font-black tracking-tight sm:text-3xl',
                L ? 'text-slate-900' : 'text-sky-50',
              )}
            >
              {focus ? `Actus ${focus}` : 'Actu'}
            </div>
            <div
              className={cn(
                'text-sm font-semibold sm:text-base',
                L ? 'text-slate-700' : 'text-sky-100/80',
              )}
            >
              {focus
                ? `Priorité aux actus de ta ligue et de ${focus}.`
                : personalized
                  ? 'Filtré et trié selon ta ligue et ton club.'
                  : 'Articles publiés sur Talk Foot.'}
            </div>
          </div>
        </div>
      </div>
      {list}
    </Card>
  )
}
