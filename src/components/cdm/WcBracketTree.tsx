import { Link } from 'react-router-dom'
import type { WcBracket, WcMatch, WcRoundId } from '../../types/wc2026'
import { WC_ROUND_LABELS } from '../../types/wc2026'
import { getNationByIso } from '../../data/nations'
import { formatHubDayLabel } from '../../utils/time'
import { cn } from '../../utils/cn'

const ROUND_ORDER: WcRoundId[] = ['r32', 'r16', 'qf', 'sf', 'final', 'third-place']

/**
 * Affichage de l'arbre de la compétition (32 → finale + petite finale).
 * Layout responsive : colonnes horizontales en desktop, accordéon vertical en mobile.
 */
export function WcBracketTree({
  bracket,
  matches,
  className,
}: {
  bracket: WcBracket
  matches: WcMatch[]
  className?: string
}) {
  const matchById = new Map(matches.map((m) => [m.id, m]))

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4',
        className,
      )}
    >
      <div className="flex min-w-[68rem] gap-3 lg:gap-4">
        {ROUND_ORDER.map((round) => {
          const slots = bracket.slots.filter((s) => s.round === round)
          if (slots.length === 0) return null
          return (
            <section key={round} className="flex min-w-[12rem] flex-1 flex-col gap-2">
              <header className="text-center">
                <p className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
                  {WC_ROUND_LABELS[round]}
                </p>
              </header>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {slots.map((slot) => {
                  const match = slot.matchId ? matchById.get(slot.matchId) : null
                  return <BracketSlotCard key={slot.id} slot={slot} match={match} />
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function BracketSlotCard({
  slot,
  match,
}: {
  slot: import('../../types/wc2026').WcBracketSlot
  match: WcMatch | null | undefined
}) {
  const homeNation = match?.home?.iso ? getNationByIso(match.home.iso) : null
  const awayNation = match?.away?.iso ? getNationByIso(match.away.iso) : null
  const showLabel = !homeNation && !awayNation

  return (
    <article
      className={cn(
        'rounded-lg border bg-white/[0.04] px-2.5 py-2 text-xs shadow-sm transition',
        'border-tf-c30-border hover:border-tf-cdm-gold/45',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-wider text-tf-app-muted">
        <span className="text-tf-cdm-gold/90">{slot.id}</span>
        {match ? (
          <span className="truncate" title={match.kickoffAt}>
            {formatHubDayLabel(match.kickoffAt)}
          </span>
        ) : null}
      </div>
      {showLabel ? (
        <p className="text-tf-app-muted">{slot.description}</p>
      ) : (
        <div className="space-y-0.5">
          <SideRow
            label={match?.home?.label}
            iso={homeNation?.iso}
            nationName={homeNation?.nameFr}
            flag={homeNation?.flag}
            goals={match?.home?.goals}
          />
          <SideRow
            label={match?.away?.label}
            iso={awayNation?.iso}
            nationName={awayNation?.nameFr}
            flag={awayNation?.flag}
            goals={match?.away?.goals}
          />
        </div>
      )}
    </article>
  )
}

function SideRow({
  label,
  iso,
  nationName,
  flag,
  goals,
}: {
  label?: string
  iso?: string
  nationName?: string
  flag?: string
  goals?: number
}) {
  if (iso && nationName) {
    return (
      <Link
        to={`/nation/${iso.toLowerCase()}`}
        className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-white/[0.05]"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate font-bold text-tf-app-fg">
          {flag ? <span aria-hidden>{flag}</span> : null}
          <span className="truncate">{nationName}</span>
        </span>
        <span className="shrink-0 font-black tabular-nums text-tf-app-fg">
          {goals ?? '—'}
        </span>
      </Link>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2 px-1 py-1 text-tf-app-muted">
      <span className="truncate">{label ?? '—'}</span>
      <span aria-hidden>—</span>
    </div>
  )
}
