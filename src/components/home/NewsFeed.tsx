import { Link } from 'react-router-dom'
import type { NewsItem } from '../../data/news'
import { footballImageUrl, newsItemHasArticlePage } from '../../data/news'
import { Card } from '../ui/Card'
import { cn } from '../../utils/cn'

const tagStyles: Record<NewsItem['tag'], string> = {
  Breaking: 'bg-rose-50 text-rose-700 ring-rose-200',
  Analyse: 'bg-blue-50 text-blue-700 ring-blue-200',
  Rumeurs: 'bg-amber-50 text-amber-700 ring-amber-200',
  Débrief: 'bg-slate-50 text-slate-700 ring-slate-200',
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
  const focus = supporterClubShort?.trim()
  const resolveFeedImage = (item: NewsItem) => {
    const customCover = item.coverImageUrl?.trim()
    return customCover && customCover.length > 0 ? customCover : footballImageUrl(item.id)
  }

  if (loading) {
    const shell = embedded
      ? 'rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-8 text-center text-sm font-semibold text-slate-600 dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-200'
      : 'px-6 py-10 text-center text-sm font-semibold text-slate-600'
    return <div className={shell}>Chargement des actus…</div>
  }

  if (items.length === 0) {
    const shell = embedded
      ? 'rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 px-4 py-10 text-center dark:border-white/15 dark:bg-white/[0.04]'
      : 'px-6 py-10 text-center'
    return (
      <div className={shell}>
        <p className="text-sm font-black text-slate-900 dark:text-slate-100">Pas encore d’actu</p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
          Les articles publiés sur Talk Foot apparaîtront ici dès qu’ils seront en ligne.
        </p>
      </div>
    )
  }

  const list = (
    <div className="divide-y divide-slate-200/80">
      {items.map((n) => {
        const rowClass = cn(
          'flex flex-col gap-3 sm:flex-row sm:gap-4',
          embedded ? 'px-4 py-4 sm:px-5 sm:py-4' : 'px-5 py-5 sm:px-6 sm:py-5',
          newsItemHasArticlePage(n) &&
            'cursor-pointer outline-none transition hover:bg-slate-50/90 focus-visible:bg-slate-50/90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/35',
        )
        const inner = (
          <>
            <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
              <img
                src={resolveFeedImage(n)}
                alt={newsItemHasArticlePage(n) ? n.title : ''}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ring-1 sm:px-2.5 sm:py-1 sm:text-[11px] ${tagStyles[n.tag]}`}
                  >
                    {n.tag}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px] dark:text-slate-300">
                    il y a {n.minutesAgo} min
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-black tracking-tight text-slate-900 sm:text-base dark:text-slate-100">
                  {n.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-300">
                  {n.excerpt}
                </p>
              </div>
              <div>
                <span className="inline-flex rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-black text-slate-900 transition group-hover:border-slate-300 group-hover:bg-white sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm dark:border-white/20 dark:bg-white/[0.08] dark:text-slate-100 dark:group-hover:bg-white/[0.12]">
                  {newsItemHasArticlePage(n) ? 'Lire l’article →' : 'Lire →'}
                </span>
              </div>
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
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm dark:border-white/12 dark:bg-white/[0.04]">
        {list}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-[11px] font-black tracking-wide text-slate-600">ACTU</div>
            <div className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {focus ? `Actus ${focus}` : 'Actu'}
            </div>
            <div className="text-sm font-semibold text-slate-700 sm:text-base">
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
