import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { BetSelection } from '../../types/bet'
import { useAppearance } from '../../contexts/AppearanceContext'
import { TF_TEXT_FG, TF_TEXT_MUTED, TF_TEXT_SUBTLE, tfInsetCard } from '../../theme/appearanceClasses'
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
  dark,
}: {
  share: number
  tone: 'fav' | 'mid' | 'out'
  dense?: boolean
  dark?: boolean
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
        'mt-1.5 w-full overflow-hidden rounded-full',
        dark ? 'bg-white/12' : 'bg-slate-200/90',
        dense ? 'h-1' : 'h-1.5',
      )}
      aria-hidden="true"
    >
      <div
        className={cn('h-full rounded-full transition-[width]', fill)}
        style={{ width: share <= 0 ? '0%' : `${Math.min(100, share)}%` }}
      />
    </div>
  )
}

function resolve1x2TileShell(opts: {
  light: boolean
  visual: BetPickVisualState
  isSelected: boolean
  side: 'home' | 'draw' | 'away'
}): string {
  const { light, visual, isSelected, side } = opts
  if (visual.badge === 'Gagné ✓') {
    return light
      ? 'border-2 border-emerald-500/80 bg-emerald-100 ring-2 ring-emerald-400/35'
      : 'border-2 border-emerald-400/70 bg-emerald-500/15 ring-2 ring-emerald-400/35'
  }
  if (visual.badge === 'Perdu') {
    return light
      ? 'border-2 border-rose-500/80 bg-rose-100 ring-2 ring-rose-400/35'
      : 'border-2 border-rose-400/70 bg-rose-500/15 ring-2 ring-rose-400/35'
  }
  if (isSelected || visual.badge === '✓') {
    return light
      ? 'border-2 border-emerald-500/85 bg-emerald-50 ring-2 ring-emerald-400/40 shadow-sm'
      : 'border-2 border-emerald-400/70 bg-emerald-500/12 ring-2 ring-emerald-400/35'
  }
  if (!light) {
    if (side === 'draw') {
      return 'border border-amber-400/40 bg-[#1a3048] hover:border-amber-300/55 hover:bg-[#203a56] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
    }
    if (side === 'home') {
      return 'border border-sky-400/40 bg-[#122c48] hover:border-sky-300/55 hover:bg-[#163556] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
    }
    return 'border border-violet-400/35 bg-[#142945] hover:border-violet-300/50 hover:bg-[#183152] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
  }
  if (side === 'draw') {
    return 'border-2 border-amber-300/90 bg-white hover:border-amber-400 hover:bg-amber-50/90 shadow-sm'
  }
  if (side === 'home') {
    return 'border-2 border-sky-300/90 bg-white hover:border-sky-400 hover:bg-sky-50/90 shadow-sm'
  }
  return 'border-2 border-violet-300/90 bg-white hover:border-violet-400 hover:bg-violet-50/90 shadow-sm'
}

export function Bet1x2PickTile({
  side,
  label,
  oddsLabel,
  share,
  disabled,
  dense,
  inline: _inline,
  pickVisual,
  isSelected,
  onClick,
}: {
  side: 'home' | 'draw' | 'away'
  label: string
  oddsLabel: string
  share?: number
  disabled?: boolean
  dense?: boolean
  inline?: boolean
  pickVisual: BetPickVisualState
  isSelected?: boolean
  onClick: () => void
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const darkSurface = !L
  const visual = pickVisual
  const shell = resolve1x2TileShell({
    light: L,
    visual,
    isSelected: Boolean(isSelected),
    side,
  })
  const sideTag =
    side === 'draw' ? 'Match nul' : side === 'home' ? 'Domicile' : 'Extérieur'

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'tf-bet-1x2-tile flex min-w-0 flex-col items-center rounded-2xl px-1.5 text-center transition',
        dense ? 'py-2' : 'py-2.5',
        shell,
        'disabled:cursor-not-allowed disabled:opacity-55',
      )}
    >
      <span
        className={cn(
          'tf-bet-1x2-tag font-black uppercase tracking-[0.14em]',
          darkSurface ? 'text-sky-200/90' : 'text-slate-500',
          dense ? 'text-[8px]' : 'text-[9px]',
        )}
      >
        {sideTag}
      </span>
      <span
        className={cn(
          'tf-bet-1x2-label mt-0.5 line-clamp-2 w-full font-black leading-tight',
          darkSurface ? 'text-white' : 'text-slate-900',
          dense ? 'text-[11px]' : 'text-xs sm:text-sm',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tf-bet-pick-odd mt-1.5 inline-flex min-w-[3.25rem] items-center justify-center rounded-xl border-2 font-black italic tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
          dense ? 'px-2.5 py-1 text-sm' : 'min-w-[3.5rem] px-3 py-1.5 text-base',
          visual.odd,
        )}
      >
        {oddsLabel}
      </span>
      {visual.badge && visual.badge !== '✓' ? (
        <span
          className={cn(
            'mt-0.5 font-black uppercase',
            darkSurface ? 'text-emerald-300' : 'text-emerald-800',
            dense ? 'text-[8px]' : 'text-[9px]',
          )}
        >
          {visual.badge}
        </span>
      ) : null}
      {share != null ? (
        <BetImpliedBar share={share} tone={share >= 40 ? 'fav' : share >= 18 ? 'mid' : 'out'} dense={dense} dark={darkSurface} />
      ) : null}
    </button>
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
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <section
      className={cn(
        tfInsetCard(L),
        'overflow-hidden shadow-sm',
        dense ? 'p-2.5' : 'p-3.5',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={cn(
              'font-black',
              TF_TEXT_FG,
              dense ? 'text-xs' : 'text-sm',
            )}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              className={cn(
                'mt-0.5 font-semibold',
                TF_TEXT_MUTED,
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
  betShares,
}: {
  homeLabel: string
  awayLabel: string
  odds: { home: number; draw: number; away: number } | null
  disabled?: boolean
  dense?: boolean
  pickVisual: (side: 'home' | 'draw' | 'away') => BetPickVisualState
  pendingSelection?: 'home' | 'draw' | 'away' | null
  onSelect: (side: 'home' | 'draw' | 'away', oddsVal: number) => void
  /** Parts des paris communautaires (0–100). Si absent ou tout à 0, barres vides. */
  betShares?: [number, number, number]
}) {
  const shares = betShares ?? [0, 0, 0]
  const sides = [
    { side: 'home' as const, label: homeLabel, share: shares[0] ?? 0 },
    { side: 'draw' as const, label: 'Nul', share: shares[1] ?? 0 },
    { side: 'away' as const, label: awayLabel, share: shares[2] ?? 0 },
  ]

  return (
    <div className={cn('grid grid-cols-3', dense ? 'gap-1.5' : 'gap-2')}>
      {sides.map(({ side, label, share }) => {
        const oddsVal =
          side === 'home' ? odds?.home : side === 'away' ? odds?.away : odds?.draw
        const oddsLabel =
          oddsVal != null && oddsVal >= 1.01 ? fmtOdds(oddsVal) : '—'
        return (
          <Bet1x2PickTile
            key={side}
            side={side}
            label={label}
            oddsLabel={oddsLabel}
            share={share}
            disabled={disabled || !odds || !oddsVal || oddsVal < 1.01}
            dense={dense}
            pickVisual={pickVisual(side)}
            isSelected={pendingSelection === side}
            onClick={() => {
              if (!oddsVal || oddsVal < 1.01) return
              onSelect(side, oddsVal)
            }}
          />
        )
      })}
    </div>
  )
}

export function BetSheetExactScoreGrid({
  homeLabel,
  awayLabel,
  groups,
  enabled,
  dense,
  pickVisual,
  pendingSelection,
  onSelect,
}: {
  homeLabel: string
  awayLabel: string
  groups: {
    key: 'home' | 'draw' | 'away'
    title: string
    picks: { id: BetSelection; label: string; odds: number; disabled?: boolean }[]
  }[]
  enabled: boolean
  dense?: boolean
  pickVisual: (selection: BetSelection) => BetPickVisualState
  pendingSelection?: BetSelection | null
  onSelect: (pick: { id: BetSelection; label: string; odds: number }) => void
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [expanded, setExpanded] = useState(false)

  const byKey = useMemo(
    () => ({
      home: groups.find((g) => g.key === 'home')?.picks ?? [],
      draw: groups.find((g) => g.key === 'draw')?.picks ?? [],
      away: groups.find((g) => g.key === 'away')?.picks ?? [],
    }),
    [groups],
  )

  const previewRows = useMemo(() => {
    const rows: Array<{
      home: (typeof byKey.home)[number] | null
      draw: (typeof byKey.draw)[number] | null
      away: (typeof byKey.away)[number] | null
    }> = []
    for (let i = 0; i < 3; i += 1) {
      rows.push({
        home: byKey.home[i] ?? null,
        draw: byKey.draw[i] ?? null,
        away: byKey.away[i] ?? null,
      })
    }
    return rows
  }, [byKey])

  const extraGroups = useMemo(
    () =>
      [
        { key: 'home' as const, title: groups.find((g) => g.key === 'home')?.title ?? '', picks: byKey.home.slice(3) },
        { key: 'draw' as const, title: groups.find((g) => g.key === 'draw')?.title ?? '', picks: byKey.draw.slice(3) },
        { key: 'away' as const, title: groups.find((g) => g.key === 'away')?.title ?? '', picks: byKey.away.slice(3) },
      ].filter((g) => g.picks.length > 0),
    [byKey, groups],
  )

  const hasMore = extraGroups.length > 0

  useEffect(() => {
    if (!pendingSelection || expanded) return
    const inPreview = previewRows.some(
      (row) =>
        row.home?.id === pendingSelection ||
        row.draw?.id === pendingSelection ||
        row.away?.id === pendingSelection,
    )
    if (!inPreview) setExpanded(true)
  }, [pendingSelection, previewRows, expanded])

  const renderPick = (pick: (typeof byKey.home)[number] | null) => {
    if (!pick) return <div aria-hidden="true" />
    const visual = pickVisual(pick.id)
    const isSelected = pendingSelection === pick.id
    return (
      <button
        type="button"
        disabled={!enabled || pick.disabled}
        aria-pressed={isSelected}
        onClick={() => onSelect(pick)}
        className={cn(
          'flex min-w-0 w-full items-center gap-1.5 rounded-lg px-0.5 py-1 text-left transition',
          isSelected && 'rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/45',
          visual.shell.includes('emerald-100') && 'bg-emerald-500/10',
          visual.shell.includes('rose-100') && 'bg-rose-500/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span
          className={cn(
            'shrink-0 font-bold tabular-nums',
            TF_TEXT_FG,
            dense ? 'text-[11px]' : 'text-xs',
          )}
        >
          {pick.label.replace('-', ' - ')}
        </span>
        <span
          className={cn(
            'h-px min-w-[0.35rem] flex-1',
            L ? 'bg-slate-300/80' : 'bg-white/20',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 font-black italic tabular-nums',
            dense ? 'min-w-[2.35rem] text-[11px]' : 'min-w-[2.6rem] text-xs',
            visual.odd,
          )}
        >
          {fmtOdds(pick.odds)}
        </span>
      </button>
    )
  }

  return (
    <div className={cn('space-y-3', dense && 'space-y-2')}>
      <div className={cn('space-y-2', dense && 'space-y-1.5')}>
        {previewRows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {renderPick(row.home)}
            {renderPick(row.draw)}
            {renderPick(row.away)}
          </div>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? 'Afficher moins de scores' : 'Afficher plus de scores'}
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'grid size-9 place-items-center rounded-full border transition',
              L
                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-muted hover:border-sky-300/40 hover:text-tf-app-fg',
            )}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            >
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}

      {expanded && hasMore ? (
        <div className={cn('space-y-3 border-t pt-3', L ? 'border-slate-200/80' : 'border-[color:var(--tf-c30-border)]', dense && 'space-y-2 pt-2')}>
          {extraGroups.map((group) => (
            <div key={group.key}>
              <p
                className={cn(
                  'font-black uppercase tracking-wide',
                  TF_TEXT_SUBTLE,
                  dense ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                {group.title}
              </p>
              <div className={cn('mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2', dense && 'gap-0.5')}>
                {group.picks.map((pick) => renderPick(pick))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p
        className={cn(
          'text-center font-semibold',
          TF_TEXT_SUBTLE,
          dense ? 'text-[9px]' : 'text-[10px]',
        )}
      >
        {homeLabel} · extérieur · {awayLabel}
      </p>
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
  const { appearance } = useAppearance()
  const L = appearance === 'light'

  return (
    <div className={cn('space-y-3', dense && 'space-y-2')}>
      {sides.map((side) => (
        <div key={side.teamLabel}>
          <p
            className={cn(
              'font-black uppercase tracking-wide',
              TF_TEXT_SUBTLE,
              dense ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {side.teamLabel}
          </p>
          <ul
            className={cn(
              'mt-1 divide-y overflow-hidden rounded-xl border',
              L
                ? 'divide-slate-200/90 border-slate-200/80 bg-slate-50/50'
                : 'divide-[color:var(--tf-c30-border)] border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)]',
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
                        ? L
                          ? 'bg-emerald-50/90 ring-1 ring-inset ring-emerald-300/60'
                          : 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/35'
                        : L
                          ? 'hover:bg-white/80'
                          : 'hover:bg-white/[0.04]',
                      visual.shell.includes('emerald-100') &&
                        (L ? 'bg-emerald-50/80' : 'bg-emerald-500/10'),
                      visual.shell.includes('rose-100') &&
                        (L ? 'bg-rose-50/80' : 'bg-rose-500/10'),
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 font-semibold leading-snug',
                        L ? 'text-slate-800' : 'text-tf-app-fg',
                        dense ? 'text-xs' : 'text-sm',
                        p.disabled && !scoredLive && (L ? 'text-slate-400 line-through' : 'text-tf-app-subtle line-through'),
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
