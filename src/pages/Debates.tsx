import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { getAllDebates } from '../data/debates'
import { cn } from '../utils/cn'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'

export function DebatesPage() {
  const all = getAllDebates()

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-black tracking-[0.2em] text-tf-grey">DÉBATS</p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
          Tribunes & polémiques
        </h1>
        <p className="mt-1 text-sm font-semibold text-tf-grey">
          Ouvre un fil pour lire les avis (pseudo + club), puis rejoins le salon pour enchaîner en live.
        </p>
      </header>

      <ul className="space-y-4" role="list">
        {all.map((d) => {
          const first = d.previewMessages[0]
          return (
            <li key={d.id}>
              <Card
                elevation="soft"
                className={cn(
                  'overflow-hidden p-0 transition-shadow',
                  'border-l-4 border-l-[var(--debate-accent)]',
                )}
                style={{ ['--debate-accent' as string]: d.accent }}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {d.trending ? (
                        <span className="inline-flex rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black text-orange-800">
                          🔥 Trending
                        </span>
                      ) : null}
                      <h2 className="mt-2 font-display text-lg font-black text-tf-dark sm:text-xl">
                        {d.title}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-tf-grey">{d.excerpt}</p>
                      <p className="mt-2 text-xs font-bold text-tf-grey">
                        👥 {d.participantsCount.toLocaleString('fr-FR')} participants · 💬{' '}
                        {d.messagesCount.toLocaleString('fr-FR')} messages
                      </p>
                    </div>
                    <Link
                      to={`/debate/${d.id}`}
                      className="tf-interactive-press shrink-0 rounded-2xl bg-tf-dark px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-tf-dark-alt"
                    >
                      Ouvrir le débat
                    </Link>
                  </div>
                  {first ? (
                    <div className="mt-4 border-t border-tf-grey-pastel/40 pt-4">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-tf-grey">
                        Aperçu
                      </p>
                      <DebateMessagePreview message={first} compact />
                    </div>
                  ) : null}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
