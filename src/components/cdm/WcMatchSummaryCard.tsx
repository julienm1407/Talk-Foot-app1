import type { WcMatch, WcVenue } from '../../types/wc2026'
import { WC_ROUND_LABELS } from '../../types/wc2026'
import { formatHubDayLabel, formatKickoff } from '../../utils/time'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { resolveNationForWcSlot } from '../../utils/resolveMatchNation'
import { MatchTeamSideLabel } from '../match/MatchTeamSideLabel'
import { cn } from '../../utils/cn'

/**
 * Résumé compact d'un match CDM — versions « preview » (avant), « live »
 * (chrono + score) et « finished » (score final + events clés).
 * Les compositions, stats détaillées et chrono complet sont sur la fiche match
 * dédiée (page séparée à venir).
 */
export function WcMatchSummaryCard({
  match,
  venue,
  className,
  size = 'md',
}: {
  match: WcMatch
  venue?: WcVenue | null
  className?: string
  size?: 'sm' | 'md'
}) {
  const homeNation = resolveNationForWcSlot(match.home)
  const awayNation = resolveNationForWcSlot(match.away)

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'

  const { favoriteNationIsos } = useFanPreferences()
  const favSet = new Set(favoriteNationIsos)
  const homeIsFav = Boolean(homeNation && favSet.has(homeNation.iso))
  const awayIsFav = Boolean(awayNation && favSet.has(awayNation.iso))
  const hasFav = homeIsFav || awayIsFav

  return (
    <article
      className={cn(
        'rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface shadow-tf-elev-1 transition',
        isLive && 'ring-1 ring-tf-cdm-gold/55 shadow-tf-elev-2',
        !isLive && hasFav && 'border-tf-cdm-gold/55 bg-tf-cdm-gold/[0.06]',
        size === 'sm' ? 'p-3' : 'p-4',
        className,
      )}
    >
      <header className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em]">
        <span className="text-tf-cdm-gold inline-flex items-center gap-1">
          ★ {WC_ROUND_LABELS[match.round]}
          {hasFav ? (
            <span
              className="rounded-full border border-tf-cdm-gold/60 bg-tf-cdm-gold/15 px-1.5 py-0.5 text-[9px] tracking-wider"
              title="Match d'une de tes sélections favorites"
            >
              Ma sélection
            </span>
          ) : null}
        </span>
        <span className="text-tf-app-muted">
          {isLive ? (
            <span className="text-rose-400">EN DIRECT · {match.minute ?? "—"}'</span>
          ) : isFinished ? (
            <span className="text-emerald-400">TERMINÉ</span>
          ) : (
            <>
              {formatHubDayLabel(match.kickoffAt)} · {formatKickoff(match.kickoffAt)}
            </>
          )}
        </span>
      </header>

      <div className="flex items-center justify-between gap-3">
        <MatchTeamSideLabel
          label={homeNation?.nameFr ?? match.home.label ?? 'À déterminer'}
          nation={homeNation}
        />
        <div className="flex flex-col items-center">
          {match.home.goals !== undefined && match.away.goals !== undefined ? (
            <span className="font-display text-2xl font-black tabular-nums text-tf-app-fg">
              {match.home.goals} – {match.away.goals}
            </span>
          ) : (
            <span className="text-xs font-black uppercase tracking-wider text-tf-app-muted">vs</span>
          )}
          {match.home.penaltyGoals !== undefined && match.away.penaltyGoals !== undefined ? (
            <span className="text-[10px] font-bold text-tf-app-muted">
              t.a.b. {match.home.penaltyGoals}–{match.away.penaltyGoals}
            </span>
          ) : null}
        </div>
        <MatchTeamSideLabel
          label={awayNation?.nameFr ?? match.away.label ?? 'À déterminer'}
          nation={awayNation}
          align="right"
        />
      </div>

      {venue ? (
        <footer className="mt-2 truncate text-[10px] text-tf-app-muted">
          {venue.name} · {venue.city}
        </footer>
      ) : null}
    </article>
  )
}
