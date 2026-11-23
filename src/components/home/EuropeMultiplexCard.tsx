import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { useAppearance } from '../../contexts/AppearanceContext'
import type { TalkFootMultiplex } from '../../utils/talkFootMatchOfTheDay'
import { formatKickoff } from '../../utils/time'

export function EuropeMultiplexCard({ multiplex }: { multiplex: TalkFootMultiplex | null }) {
  if (!multiplex) return null
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const live = multiplex.matches.some((m) => m.status === 'live')
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border p-3',
        L ? 'border-tf-dark/10 bg-white/90' : 'border-white/12 bg-white/[0.04]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-tf-app-muted">Soirée Europe</p>
          <h3 className="font-display text-base font-black text-tf-app-fg">{multiplex.title}</h3>
        </div>
        <Link
          to={`/channel/${multiplex.id}`}
          className={cn(
            TF_FOCUS_VISIBLE,
            'rounded-full bg-tf-cta px-3 py-1.5 text-[11px] font-black text-white',
          )}
        >
          {live ? 'Ouvrir le multiplex' : 'Ouvrir la tribune'}
        </Link>
      </div>
      <ul className="mt-2 space-y-1.5">
        {multiplex.matches.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 text-[12px] font-bold">
            <span className="min-w-0 truncate text-tf-app-fg">
              {m.home.shortName} – {m.away.shortName}
            </span>
            <span className="shrink-0 tabular-nums text-tf-app-muted">
              {m.status === 'upcoming'
                ? formatKickoff(m.kickoffAt)
                : `${m.score?.home ?? 0}–${m.score?.away ?? 0}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
