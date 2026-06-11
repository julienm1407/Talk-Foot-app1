import { useMemo, useState } from 'react'
import { BetSlipCard } from '../bet/BetSlipCard'
import { Card } from '../ui/Card'
import { useBetMatchesMap } from '../../hooks/useBetMatchesMap'
import { useAppearance } from '../../contexts/AppearanceContext'
import type { Bet } from '../../types/bet'
import {
  filterBetsByTab,
  sortBetsForSlipList,
  type BetFilterTab,
} from '../../utils/betDisplay'
import { cn } from '../../utils/cn'

const TABS: { id: BetFilterTab; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'En cours' },
  { id: 'won', label: 'Gagnés' },
  { id: 'lost', label: 'Perdus' },
]

export function FriendPronosticsPanel({
  displayName,
  bets,
  loading,
  error,
  counts,
}: {
  displayName: string
  bets: Bet[]
  loading: boolean
  error: string | null
  counts: { all: number; open: number; won: number; lost: number }
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [tab, setTab] = useState<BetFilterTab>('all')
  const { getBetMatch, isBetMatchResolving } = useBetMatchesMap(bets)

  const visibleBets = useMemo(() => {
    const filtered = filterBetsByTab(bets, tab)
    return sortBetsForSlipList(filtered)
  }, [bets, tab])

  const tabBtn = (t: BetFilterTab, label: string) => {
    const active = tab === t
    const count = counts[t]
    return (
      <button
        key={t}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setTab(t)}
        className={cn(
          'min-h-10 shrink-0 rounded-xl px-3 py-2 text-center text-xs font-black transition sm:px-4 sm:text-sm',
          active
            ? 'bg-tf-cta text-white shadow-tf-cta'
            : L
              ? 'bg-tf-dark/[0.06] text-tf-dark hover:bg-tf-dark/10'
              : 'bg-white/10 text-sky-100/90 hover:bg-white/14',
        )}
      >
        {label}
        {count > 0 ? (
          <span
            className={cn(
              'ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-md px-1 text-[10px] tabular-nums',
              active ? 'bg-white/20' : L ? 'bg-tf-dark/10' : 'bg-white/10',
            )}
          >
            {count}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <Card className="overflow-hidden p-0" elevation="soft">
      <div
        className={cn(
          'border-b px-4 py-3 sm:px-5',
          L ? 'border-tf-cta/20 bg-emerald-50/50' : 'border-tf-cta/25 bg-emerald-950/20',
        )}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-tf-cta">
          Pronostics ami
        </p>
        <h2 className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
          Paris de {displayName}
        </h2>
        <p className="mt-1 text-xs font-medium text-tf-app-muted">
          Visible car vous êtes amis — pronos et résultats en lecture seule.
        </p>
      </div>

      {loading ? (
        <p className={cn('px-4 py-5 text-sm font-semibold', L ? 'text-tf-grey' : 'text-sky-200/80')}>
          Chargement des paris…
        </p>
      ) : error === 'not_friends' ? (
        <p className={cn('px-4 py-5 text-sm font-semibold', L ? 'text-tf-grey' : 'text-sky-200/80')}>
          Les paris de ce joueur sont réservés à ses amis.
        </p>
      ) : error ? (
        <p className={cn('px-4 py-5 text-sm font-semibold', L ? 'text-amber-800' : 'text-amber-200')}>
          Impossible de charger les paris pour le moment.
        </p>
      ) : (
        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div
            className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={`Filtrer les paris de ${displayName}`}
          >
            {TABS.map(({ id, label }) => tabBtn(id, label))}
          </div>

          {visibleBets.length > 0 ? (
            <ul className="grid gap-3 sm:gap-4">
              {visibleBets.map((bet) => (
                <li key={bet.id}>
                  <BetSlipCard
                    bet={bet}
                    match={getBetMatch(bet)}
                    matchResolving={isBetMatchResolving(bet)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div
              className={cn(
                'rounded-2xl border border-dashed p-6 text-center',
                L ? 'border-slate-200 bg-slate-50/80' : 'border-white/15 bg-white/[0.04]',
              )}
            >
              <p className="text-base font-black text-tf-app-fg">
                {tab === 'open'
                  ? `${displayName} n’a aucun pari en cours.`
                  : tab === 'won'
                    ? `Pas encore de pari gagné pour ${displayName}.`
                    : tab === 'lost'
                      ? `Aucun pari perdu dans ce filtre.`
                      : `${displayName} n’a pas encore placé de pari.`}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
