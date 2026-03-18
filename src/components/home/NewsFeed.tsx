import type { NewsItem } from '../../data/news'
import { Card } from '../ui/Card'

const tagStyles: Record<NewsItem['tag'], string> = {
  Breaking: 'bg-rose-50 text-rose-700 ring-rose-200',
  Analyse: 'bg-blue-50 text-blue-700 ring-blue-200',
  Rumeurs: 'bg-amber-50 text-amber-700 ring-amber-200',
  Débrief: 'bg-slate-50 text-slate-700 ring-slate-200',
}

export function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-wide text-slate-600">
              ACTU
            </div>
            <div className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Revue du matchday
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-700 sm:text-base">
              Des vraies sensations “journalistiques” (mock).
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200/80">
        {items.map((n) => (
          <article key={n.id} className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${tagStyles[n.tag]}`}
                  >
                    {n.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    il y a {n.minutesAgo} min
                  </span>
                </div>
                <h3 className="mt-2 text-base font-black tracking-tight text-slate-900">
                  {n.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {n.excerpt}
                </p>
              </div>
              <div className="shrink-0">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-black text-slate-900 transition hover:bg-white">
                  Lire →
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

