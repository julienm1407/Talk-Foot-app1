import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useDebates } from '../contexts/DebatesContext'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'
import { SectionIntro } from '../components/ui/SectionIntro'
import { cn } from '../utils/cn'
import { DebateRankBadge } from '../components/debate/DebateRankBadge'

export function DebatesPage() {
  const { debates: all, loading } = useDebates()

  return (
    <div className="space-y-6">
      <SectionIntro
        section="debates"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Débats"
        title="Tribunes & polémiques"
        description="Classement de tous les débats publiés — pas de minimum de messages : les plus actifs (ou les plus récents) en tête."
      />

      {loading ? (
        <p className="text-sm font-semibold text-tf-grey">Chargement des débats…</p>
      ) : all.length === 0 ? (
        <Card elevation="soft" className="border-dashed p-8 text-center">
          <p className="font-black text-tf-dark">Aucun débat pour le moment</p>
          <p className="mt-2 text-sm font-semibold text-tf-grey">
            Rejoins un groupe et lance un sujet dans la tribune Général — les compteurs participants et messages
            sont calculés en temps réel.
          </p>
          <Link
            to="/groups"
            className="mt-4 inline-flex rounded-2xl bg-tf-dark px-5 py-2.5 text-sm font-black text-white"
          >
            Groupes supporters
          </Link>
        </Card>
      ) : null}

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
                      <div className="flex flex-wrap items-center gap-2">
                        {d.leaderboardRank ? <DebateRankBadge rank={d.leaderboardRank} /> : null}
                        {d.trending ? (
                          <span className="inline-flex rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                            🔥 Top 3
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-display text-xl font-black leading-[1.18] tracking-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.38),0_1px_2px_rgba(0,0,0,0.55)] sm:text-2xl sm:leading-[1.15]">
                        {d.title}
                      </h2>
                      <p
                        className={cn(
                          'mt-3 max-w-2xl rounded-xl px-3 py-2.5 text-sm font-semibold leading-relaxed text-white',
                          'bg-black/35 ring-1 ring-white/15 backdrop-blur-[2px]',
                          '[text-shadow:0_1px_2px_rgba(0,0,0,0.65)]',
                          'sm:mt-3.5 sm:px-4 sm:py-3 sm:text-[0.9375rem] sm:leading-relaxed',
                        )}
                      >
                        {d.excerpt}
                      </p>
                      <p className="mt-2 text-xs font-bold text-white/92 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        👥 {d.participantsCount.toLocaleString('fr-FR')} participants · 💬{' '}
                        {d.messagesCount.toLocaleString('fr-FR')} messages
                      </p>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Link
                        to={`/group/${d.groupId}?debate=${encodeURIComponent(d.id)}`}
                        className="tf-interactive-press rounded-2xl bg-white px-5 py-2.5 text-center text-sm font-black text-tf-dark shadow-md transition hover:bg-orange-50"
                      >
                        Écrire dans la tribune
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
