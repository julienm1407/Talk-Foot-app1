import { Link, Navigate, useParams } from 'react-router-dom'
import { getDebateById } from '../data/debates'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { DebateMessagePreview } from '../components/debate/DebateMessagePreview'

export function DebateDetailPage() {
  const { debateId } = useParams()
  const debate = debateId ? getDebateById(debateId) : undefined

  if (!debate) {
    return <Navigate to="/debates" replace />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
        <Link to="/" className="text-tf-grey hover:text-tf-dark">
          Accueil
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <Link to="/debates" className="text-tf-grey hover:text-tf-dark">
          Débats
        </Link>
        <span className="text-tf-grey-pastel">/</span>
        <span className="truncate text-tf-dark">Fil</span>
      </div>

      <header>
        {debate.trending ? (
          <span className="inline-flex rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-black text-orange-800">
            🔥 Tendance
          </span>
        ) : null}
        <h1 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight text-tf-dark sm:text-3xl">
          {debate.title}
        </h1>
        <p className="mt-2 text-sm font-semibold text-tf-grey">{debate.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-tf-dark">
          <span className="rounded-2xl border border-tf-grey-pastel/60 bg-tf-white/90 px-4 py-2">
            👥 {debate.participantsCount.toLocaleString('fr-FR')} participants
          </span>
          <span className="rounded-2xl border border-tf-grey-pastel/60 bg-tf-white/90 px-4 py-2">
            💬 {debate.messagesCount.toLocaleString('fr-FR')} messages
          </span>
        </div>
      </header>

      <Card className="p-5 sm:p-6" elevation="soft">
        <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-grey">
          Aperçu des messages
        </h2>
        <ul className="mt-4 space-y-3" role="list">
          {debate.previewMessages.map((m, i) => (
            <li key={i}>
              <DebateMessagePreview message={m} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs font-semibold text-tf-grey">
          La suite de la discussion se poursuit dans le salon groupe — réactions, sondages et modération.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/group/${debate.groupId}`}>
            <Button variant="primary" className="tf-interactive-press rounded-2xl px-6 py-3 text-sm font-black">
              💬 Rejoindre le salon du débat
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
