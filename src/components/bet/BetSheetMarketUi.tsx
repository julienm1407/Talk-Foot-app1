import type { ReactNode } from 'react'
import type { BetSelection } from '../../types/bet'
import { cn } from '../../utils/cn'

export type BetPickVisualState = {
  shell: string
  odd: string
  badge: string | null
}

function fmtOdds(n: number) {
  return n.toFixed(2).replace('.', ',')
}

/** Parts implicites normalisées (barres sous les cotes 1N2). */
export function impliedSharesFromOdds(odds: number[]): number[] {
  const weights = odds.map((o) => (o > 1 ? 1 / o : 0))
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return odds.map(() => 0)
  return weights.map((w) => Math.round((w / sum) * 100))
}

function BetImpliedBar({
  share,
  tone,
  dense,
}: {
  share: number
  tone: 'fav' | 'mid' | 'out'
  dense?: boolean
}) {
  const fill =
    tone === 'fav'
      ? 'bg-emerald-500'
      : tone === 'mid'
        ? 'bg-sky-400'
        : 'bg-rose-400/85'
  return (
    <div
      className={cn(
        'mt-1.5 w-full overflow-hidden rounded-full bg-slate-200/90',
        dense ? 'h-1' : 'h-1.5',
      )}
      aria-hidden="true"
    >
      <div
        className={cn('h-full rounded-full transition-[width]', fill)}
        style={{ width: `${Math.max(4, Math.min(100, share))}%` }}
      />
    </div>
  )
}

function BetOddsPill({
  oddsLabel,
  scoredLive,
  visual,
  dense,
  className,
}: {
  oddsLabel: string
  scoredLive?: boolean
  visual: BetPickVisualState
  dense?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex shrink-0 flex-col items-end gap-0.5', className)}>
      {visual.badge ? (
        <span
          className={cn(
            'font-black uppercase tracking-wide text-emerald-800',
            dense ? 'text-[8px]' : 'text-[9px]',
          )}
        >
          {visual.badge}
        </span>
      ) : null}
      <span
        className={cn(
          'inline-flex min-w-[3.25rem] items-center justify-center rounded-xl border-2 font-black italic tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
          dense ? 'px-2.5 py-1 text-sm' : 'min-w-[3.5rem] px-3 py-1.5 text-base',
          scoredLive
            ? 'border-emerald-600/50 bg-emerald-500 text-white not-italic'
            : visual.odd,
        )}
      >
        {scoredLive ? 'But ✓' : oddsLabel}
      </span>
    </div>
  )
}

export function BetSheetMarketCard({
  title,
  subtitle,
  dense,
  children,
}: {
  title: string
  subtitle?: string
  dense?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm',
        dense ? 'p-2.5' : 'p-3.5',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={cn(
              'font-black text-slate-900',
              dense ? 'text-xs' : 'text-sm',
            )}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              className={cn(
                'mt-0.5 font-semibold text-slate-500',
                dense ? 'text-[10px]' : 'text-[11px]',
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <div className={cn(dense ? 'mt-2' : 'mt-3')}>{children}</div>
    </section>
  )
}

export function BetSheet1x2Grid({
  homeLabel,
  awayLabel,
  odds,
  disabled,
  dense,
  pickVisual,
  pendingSelection,
  onSelect,
}: {
  homeLabel: string
  awayLabel: string
  odds: { home: number; draw: number; away: number } | null
  disabled?: boolean
  dense?: boolean
  pickVisual: (side: 'home' | 'draw' | 'away') => BetPickVisualState
  pendingSelection?: 'home' | 'draw' | 'away' | null
  onSelect: (side: 'home' | 'draw' | 'away', oddsVal: number) => void
}) {
  const shares = odds
    ? impliedSharesFromOdds([odds.home, odds.draw, odds.away])
    : [0, 0, 0]
  const sides = [
    { side: 'home' as const, label: homeLabel, share: shares[0] ?? 0 },
    { side: 'draw' as const, label: 'Nul', share: shares[1] ?? 0 },
    { side: 'away' as const, label: awayLabel, share: shares[2] ?? 0 },
  ]
  const toneForShare = (share: number, maxShare: number): 'fav' | 'mid' | 'out' => {
    if (share >= maxShare - 2) return 'fav'
    if (share >= maxShare * 0.55) return 'mid'
    return 'out'
  }
  const maxShare = Math.max(...shares, 1)

  return (
    <div className={cn('grid grid-cols-3', dense ? 'gap-1.5' : 'gap-2')}>
      {sides.map(({ side, label, share }) => {
        const visual = pickVisual(side)
        const isSelected = pendingSelection === side
        const oddsVal =
          side === 'home' ? odds?.home : side === 'away' ? odds?.away : odds?.draw
        const oddsLabel =
          oddsVal != null && oddsVal >= 1.01 ? fmtOdds(oddsVal) : '—'
        return (
          <button
            key={side}
            type="button"
            disabled={disabled || !odds || !oddsVal || oddsVal < 1.01}
            aria-pressed={isSelected}
            onClick={() => {
              if (!oddsVal || oddsVal < 1.01) return
              onSelect(side, oddsVal)
            }}
            className={cn(
              'flex min-w-0 flex-col items-center rounded-2xl border-2 px-1.5 py-2 text-center transition',
              dense ? 'py-1.5' : 'py-2.5',
              visual.shell,
              isSelected && 'ring-2 ring-emerald-400/45',
              'disabled:cursor-not-allowed disabled:opacity-55',
            )}
          >
            <span
              className={cn(
                'line-clamp-2 w-full font-bold leading-tight text-slate-700',
                dense ? 'text-[10px]' : 'text-[11px]',
              )}
            >
              {label}
            </span>
            <span
              className={cn(
                'mt-1 font-black italic tabular-nums text-slate-900',
                dense ? 'text-lg' : 'text-xl',
              )}
            >
              {oddsLabel}
            </span>
            {visual.badge && visual.badge !== '✓' ? (
              <span className="mt-0.5 text-[9px] font-black uppercase text-emerald-800">
                {visual.badge}
              </span>
            ) : null}
            <BetImpliedBar
              share={share}
              tone={toneForShare(share, maxShare)}
              dense={dense}
            />
          </button>
        )
      })}
    </div>
  )
}

export function BetSheetScorerList({
  sides,
  enabled,
  dense,
  pickVisual,
  pendingSelection,
  onSelect,
}: {
  sides: {
    teamLabel: string
    picks: { id: BetSelection; label: string; odds: number; disabled?: boolean; scoredLive?: boolean }[]
  }[]
  enabled: boolean
  dense?: boolean
  pickVisual: (selection: BetSelection) => BetPickVisualState
  pendingSelection?: BetSelection | null
  onSelect: (pick: { id: BetSelection; label: string; odds: number }) => void
}) {
  return (
    <div className={cn('space-y-3', dense && 'space-y-2')}>
      {sides.map((side) => (
        <div key={side.teamLabel}>
          <p
            className={cn(
              'font-black uppercase tracking-wide text-slate-500',
              dense ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {side.teamLabel}
          </p>
          <ul
            className={cn(
              'mt-1 divide-y divide-slate-200/90 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50',
            )}
          >
            {side.picks.map((p) => {
              const visual = pickVisual(p.id)
              const isSelected = pendingSelection === p.id
              const scoredLive = p.scoredLive === true
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={!enabled || p.disabled}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(p)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition',
                      dense ? 'px-2.5 py-2' : 'px-3 py-2.5',
                      isSelected
                        ? 'bg-emerald-50/90 ring-1 ring-inset ring-emerald-300/60'
                        : 'hover:bg-white/80',
                      visual.shell.includes('emerald-100') && 'bg-emerald-50/80',
                      visual.shell.includes('rose-100') && 'bg-rose-50/80',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 font-semibold leading-snug text-slate-800',
                        dense ? 'text-xs' : 'text-sm',
                        p.disabled && !scoredLive && 'text-slate-400 line-through',
                      )}
                    >
                      {p.label}
                    </span>
                    <BetOddsPill
                      oddsLabel={fmtOdds(p.odds)}
                      scoredLive={scoredLive && !visual.badge}
                      visual={visual}
                      dense={dense}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
