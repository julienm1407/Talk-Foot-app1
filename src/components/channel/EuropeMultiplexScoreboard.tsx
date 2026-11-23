import { Link } from 'react-router-dom'
import type { TalkFootMultiplex } from '../../utils/talkFootMatchOfTheDay'
import { formatKickoff } from '../../utils/time'
import { cn } from '../../utils/cn'

export function EuropeMultiplexScoreboard({
  multiplex,
  light,
}: {
  multiplex: TalkFootMultiplex
  light: boolean
}) {
  return (
    <div
      className={cn(
        'mb-2 rounded-lg border px-2 py-1.5',
        light ? 'border-slate-200 bg-white/90' : 'border-[#3a6690]/50 bg-[#0c2339]/70',
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-wide text-sky-100">{multiplex.title}</p>
      <ul className="mt-1 space-y-0.5">
        {multiplex.matches.map((m) => (
          <li key={m.id}>
            <Link
              to={`/channel/${m.id}`}
              className="flex items-center justify-between gap-2 text-[11px] font-semibold text-sky-50 hover:underline"
            >
              <span className="min-w-0 truncate">
                {m.home.shortName} – {m.away.shortName}
              </span>
              <span className="shrink-0 tabular-nums text-sky-200/85">
                {m.status === 'upcoming'
                  ? formatKickoff(m.kickoffAt)
                  : `${m.score?.home ?? 0}–${m.score?.away ?? 0}${m.status === 'live' ? ' · LIVE' : ''}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
