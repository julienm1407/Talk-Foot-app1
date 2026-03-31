import { Link, Navigate, useParams } from 'react-router-dom'
import { getDebateById } from '../data/debates'
import { findCustomDebateById } from '../utils/customGroupDebatesStorage'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'

export function DebateDetailPage() {
  const { debateId } = useParams()
  const debate = debateId
    ? getDebateById(debateId) ?? findCustomDebateById(debateId)
    : undefined

  if (!debate) {
    return <Navigate to="/debates" replace />
  }

  const dth = getAppSectionTheme('debates')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
        <Link to="/" className="text-tf-grey hover:text-tf-dark">
          Accueil
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <Link
          to="/debates"
          className={cn('text-tf-grey hover:text-tf-dark', dth.page.eyebrowClass, 'hover:underline')}
        >
          Débats
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <span className="truncate text-tf-dark">Fil</span>
      </div>

      <header
        className="overflow-hidden rounded-2xl border border-orange-200/40 shadow-tf-card"
        style={{ ['--debate-accent' as string]: debate.accent }}
      >
        <div
          className="relative px-4 py-5 sm:px-6 sm:py-6"
          style={{
            background: `linear-gradient(155deg, ${debate.accent} 0%, color-mix(in srgb, ${debate.accent} 42%, #0a1628) 52%, #061018 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              background: `radial-gradient(ellipse 100% 70% at 15% 0%, #fff, transparent 50%)`,
            }}
            aria-hidden
          />
          <div className="relative">
            {debate.trending ? (
              <span className="inline-flex rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white ring-1 ring-white/35">
                🔥 Tendance
              </span>
            ) : null}
            <h1 className="mt-3 font-display text-2xl font-black leading-[1.15] tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.55)] sm:text-3xl sm:leading-[1.12]">
              {debate.title}
            </h1>
            <p className="mt-2.5 text-sm font-semibold leading-snug text-white/88">{debate.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black sm:text-sm">
              <span className="rounded-xl border border-white/30 bg-white/14 px-3 py-1.5 text-white/95 backdrop-blur-sm sm:px-4 sm:py-2">
                👥 {debate.participantsCount.toLocaleString('fr-FR')} participants
              </span>
              <span className="rounded-xl border border-white/30 bg-white/14 px-3 py-1.5 text-white/95 backdrop-blur-sm sm:px-4 sm:py-2">
                💬 {debate.messagesCount.toLocaleString('fr-FR')} messages
              </span>
            </div>
          </div>
        </div>
      </header>

      <Card className="p-5 sm:p-6" elevation="soft">
        <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-grey">
          Aperçu des messages
        </h2>
        <ul className="mt-4 space-y-3" role="list">
          {debate.previewMessages.map((m, i) => (
            <li key={`${debate.id}-pv-${i}`}>
              <DebateMessagePreview message={m} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-semibold text-tf-grey">
          La suite de la discussion se poursuit dans le salon groupe — réactions, sondages et modération.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/group/${debate.groupId}?debate=${encodeURIComponent(debate.id)}`}>
            <Button variant="primary" className="tf-interactive-press rounded-2xl px-6 py-3 text-sm font-black">
              💬 Écrire dans le salon
            </Button>
          </Link>
          <Link to="/debates">
            <Button variant="soft" className="tf-interactive-press rounded-2xl px-5 py-3 text-sm font-black">
              Autres débats
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
