import type { NewsItem } from '../../data/news'
import { footballImageUrl } from '../../data/news'
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
  /** Dans la carte FEED home : pas de 2e carte ni bandeau titre (évite le vide). */
  embedded,
}: {
  items: NewsItem[]
  personalized?: boolean
  supporterClubShort?: string | null
  embedded?: boolean
}) {
  const focus = supporterClubShort?.trim()

  const list = (
    <div className="divide-y divide-slate-200/80">
      {items.map((n) => (
        <article
          key={n.id}
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:gap-4',
            embedded ? 'px-4 py-4 sm:px-5 sm:py-4' : 'px-5 py-5 sm:px-6 sm:py-5',
          )}
        >
          <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
            <img
              src={footballImageUrl(n.id)}
              alt=""
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
                <span className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                  il y a {n.minutesAgo} min
                </span>
              </div>
              <h3 className="mt-1.5 text-sm font-black tracking-tight text-slate-900 sm:text-base">
                {n.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600 sm:text-sm">
                {n.excerpt}
              </p>
            </div>
            <div>
              <span className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs font-black text-slate-900 transition hover:bg-white sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm">
                Lire →
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )

  if (embedded) {
    return (
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm">
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
                ? `Mode supporter : actus de ta ligue, de ${focus} et brèves Talk Foot — le reste est masqué (mock).`
                : personalized
                  ? 'Filtré et trié selon ta ligue et ton club (mock).'
                  : 'Des vraies sensations “journalistiques” (mock).'}
            </div>
          </div>
        </div>
      </div>
      {list}
    </Card>
  )
}
