import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { getAllDebates } from '../data/debates'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'
import { SectionIntro } from '../components/ui/SectionIntro'

export function DebatesPage() {
  const all = getAllDebates()

  return (
    <div className="space-y-6">
      <SectionIntro
        section="debates"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Débats"
        title="Tribunes & polémiques"
        description="Ouvre un fil pour lire les avis, puis rejoins le salon pour enchaîner en live."
      />

      <ul className="space-y-4" role="list">
        {all.map((d) => {
          const first = d.previewMessages[0]
          return (
            <li key={d.id}>
              <Card
                elevation="soft"
                className="overflow-hidden border border-orange-200/40 p-0 transition-shadow"
                style={{ ['--debate-accent' as string]: d.accent }}
              >
                <div
                  className="relative px-5 py-5 sm:px-6 sm:py-6"
                  style={{
                    background: `linear-gradient(155deg, ${d.accent} 0%, color-mix(in srgb, ${d.accent} 42%, #0a1628) 52%, #061018 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                      background: `radial-gradient(ellipse 100% 70% at 15% 0%, #fff, transparent 50%)`,
                    }}
                    aria-hidden
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {d.trending ? (
                        <span className="inline-flex rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                          🔥 Trending
                        </span>
                      ) : null}
                      <h2 className="mt-2 font-display text-xl font-black leading-[1.18] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.38),0_1px_2px_rgba(0,0,0,0.55)] sm:text-2xl sm:leading-[1.15]">
                        {d.title}
                      </h2>
                      <p className="mt-2.5 text-sm font-semibold leading-snug text-white/88">{d.excerpt}</p>
                      <p className="mt-2 text-xs font-bold text-white/78">
                        👥 {d.participantsCount.toLocaleString('fr-FR')} participants · 💬{' '}
                        {d.messagesCount.toLocaleString('fr-FR')} messages
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Link
                        to={`/group/${d.groupId}?debate=${encodeURIComponent(d.id)}`}
                        className="tf-interactive-press rounded-2xl bg-white px-5 py-2.5 text-center text-sm font-black text-tf-dark shadow-md transition hover:bg-orange-50"
                      >
                        Écrire au salon
                      </Link>
                      <Link
                        to={`/debate/${d.id}`}
                        className="tf-interactive-press rounded-2xl border-2 border-white/55 bg-white/12 px-5 py-2.5 text-center text-sm font-black text-white shadow-sm backdrop-blur-sm transition hover:border-white/75 hover:bg-white/20"
                      >
                        Lire le fil
                      </Link>
                    </div>
                  </div>
                </div>
                {first ? (
                  <div className="border-t border-orange-100/80 bg-gradient-to-b from-orange-50/35 to-white p-5 sm:p-6">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-tf-grey">Aperçu</p>
                    <DebateMessagePreview message={first} compact />
                  </div>
                ) : null}
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
