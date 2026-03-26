import type { BigFiveLeagueId, LeagueStandingRow } from '../../data/leagueStandings'
import { teams } from '../../data/teams'
import { cn } from '../../utils/cn'

function teamShort(leagueId: string, teamId: string) {
  const list = teams[leagueId as keyof typeof teams]
  const t = list?.find((x) => x.id === teamId)
  return t?.shortName ?? teamId.toUpperCase()
}

/** 3 barres verticales par équipe : attaque / défense / momentum (indices mock 0–100). */
export function TeamIndicesRadar({
  rows,
  leagueId,
  className,
}: {
  rows: LeagueStandingRow[]
  leagueId: BigFiveLeagueId
  className?: string
}) {
  const pick = rows.slice(0, 5)

  return (
    <div className={cn('rounded-2xl border border-tf-grey-pastel/50 bg-white/95 p-4', className)}>
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-tf-grey">Profil de forme</h3>
      <p className="mt-1 text-[11px] font-semibold text-tf-grey">Attaque · Défense · Dynamique (mock)</p>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
        {pick.map((r) => (
          <div key={r.teamId} className="flex min-w-0 flex-col items-center gap-2">
            <div className="flex h-24 w-full max-w-[56px] gap-0.5 sm:h-28 sm:max-w-[64px] sm:gap-1">
              <Bar h={r.attackIndex} tone="from-emerald-500 to-emerald-600" label="A" />
              <Bar h={r.defenseIndex} tone="from-sky-500 to-sky-600" label="D" />
              <Bar h={r.momentumIndex} tone="from-violet-500 to-violet-600" label="M" />
            </div>
            <span className="max-w-full truncate text-center text-[9px] font-black text-tf-dark sm:text-[10px]">
              {teamShort(leagueId, r.teamId)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-[10px] font-bold text-tf-grey">
        <span>A = attaque</span>
        <span>D = défense</span>
        <span>M = dynamique</span>
      </div>
    </div>
  )
}

function Bar({ h, tone, label }: { h: number; tone: string; label: string }) {
  const pct = Math.max(12, Math.round(h * 0.88))
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
      <div
        className={cn(
          'w-full min-w-[5px] max-w-[12px] rounded-t-md bg-gradient-to-t shadow-sm sm:max-w-[14px]',
          tone,
        )}
        style={{ height: `${pct}%` }}
        title={`${label} : ${h}/100`}
      />
      <span className="text-[8px] font-black text-tf-grey">{label}</span>
    </div>
  )
}
