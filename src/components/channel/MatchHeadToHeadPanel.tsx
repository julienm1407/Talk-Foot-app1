import { useMatchHeadToHead } from '../../hooks/useMatchHeadToHead'
import type { Match } from '../../types/match'
import type { ClubScheduleListItem } from '../../api/sportMonks'
import { cn } from '../../utils/cn'

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(+d)) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function RecentList({
  title,
  rows,
  light,
}: {
  title: string
  rows: ClubScheduleListItem[]
  light: boolean
}) {
  return (
    <div>
      <p className={cn('mb-1 text-[10px] font-black uppercase tracking-wide', light ? 'text-slate-500' : 'text-sky-200/80')}>
        {title}
      </p>
      {rows.length === 0 ? (
        <p className={cn('rounded-lg px-2 py-1.5 text-[11px] font-semibold', light ? 'bg-slate-50 text-slate-500' : 'bg-[#0a1f35]/70 text-sky-200/70')}>
          Pas encore de résultats.
        </p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.matchId}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold',
                light ? 'bg-slate-50 text-slate-800' : 'bg-[#0a1f35]/70 text-sky-50',
              )}
            >
              <span className="min-w-0 truncate">
                {fmtDate(row.kickoffIso)} · {row.homeName} – {row.awayName}
              </span>
              <span className="shrink-0 tabular-nums">
                {row.scoreLine ?? '—'}
                {row.result ? ` · ${row.result}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MatchHeadToHeadPanel({
  match,
  enabled,
  light,
}: {
  match: Match | null
  enabled: boolean
  light?: boolean
}) {
  const L = Boolean(light)
  const { homeRecent, awayRecent, h2h, loading } = useMatchHeadToHead(match, enabled)

  if (!match) return null

  return (
    <div className="space-y-3">
      <p className={cn('text-xs font-black uppercase tracking-wide', L ? 'text-slate-700' : 'text-sky-100')}>
        Tête à tête
      </p>
      {loading ? (
        <p className={cn('text-[11px] font-semibold', L ? 'text-slate-500' : 'text-sky-200/80')}>
          Chargement des dernières rencontres…
        </p>
      ) : null}
      <RecentList title={`5 derniers · ${match.home.shortName || match.home.name}`} rows={homeRecent} light={L} />
      <RecentList title={`5 derniers · ${match.away.shortName || match.away.name}`} rows={awayRecent} light={L} />
      <div>
        <p className={cn('mb-1 text-[10px] font-black uppercase tracking-wide', L ? 'text-slate-500' : 'text-sky-200/80')}>
          5 dernières confrontations
        </p>
        {h2h.length === 0 && !loading ? (
          <p className={cn('rounded-lg px-2 py-1.5 text-[11px] font-semibold', L ? 'bg-slate-50 text-slate-500' : 'bg-[#0a1f35]/70 text-sky-200/70')}>
            Pas de confrontations récentes trouvées.
          </p>
        ) : (
          <ul className="space-y-1">
            {h2h.map((row) => (
              <li
                key={row.matchId}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold',
                  L ? 'bg-slate-50 text-slate-800' : 'bg-[#0a1f35]/70 text-sky-50',
                )}
              >
                <span className="min-w-0 truncate">
                  {fmtDate(row.kickoffIso)} · {row.league} · {row.homeName} – {row.awayName}
                </span>
                <span className="shrink-0 tabular-nums">{row.scoreLine}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
