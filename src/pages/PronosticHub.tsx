import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BetSlipCard } from '../components/bet/BetSlipCard'
import { BettorLeaderboard } from '../components/home/BettorLeaderboard'
import { PronoStatsPanel } from '../components/pronostic/PronoStatsPanel'
import { FictionalBettingNotice } from '../components/legal/FictionalBettingNotice'
import { FriendsParieurMiniRank } from '../components/social/FriendsParieurMiniRank'
import { Card } from '../components/ui/Card'
import { SectionIntro } from '../components/ui/SectionIntro'
import { useBetMatchesMap } from '../hooks/useBetMatchesMap'
import { useMatches } from '../contexts/MatchesContext'
import { useUserBets } from '../hooks/useUserBets'
import { useAppearance } from '../contexts/AppearanceContext'
import {
  filterBetsByTab,
  sortBetsForSlipList,
  type BetFilterTab,
} from '../utils/betDisplay'
import { cn } from '../utils/cn'
import type { Match } from '../types/match'

const TABS: { id: BetFilterTab; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'En cours' },
  { id: 'won', label: 'Gagnés' },
  { id: 'lost', label: 'Perdus' },
]

type HubView = 'paris' | 'classement'

/**
 * Hub « Pronostic » : mes paris, stats et classement parieurs.
 */
export function PronosticHubPage() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [searchParams, setSearchParams] = useSearchParams()
  const hubView: HubView = searchParams.get('vue') === 'classement' ? 'classement' : 'paris'
  const [bets] = useUserBets()
  const { matches } = useMatches()
  const [tab, setTab] = useState<BetFilterTab>('all')

  const setHubView = (view: HubView) => {
    if (view === 'classement') {
      setSearchParams({ vue: 'classement' }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const { getBetMatch, isBetMatchResolving } = useBetMatchesMap(bets)
  const liveMatch = useMemo(() => matches.find((m) => m.status === 'live') ?? null, [matches])

  const counts = useMemo(
    () => ({
      all: bets.length,
      open: bets.filter((b) => b.status === 'open').length,
      won: bets.filter((b) => b.status === 'won').length,
      lost: bets.filter((b) => b.status === 'lost').length,
    }),
    [bets],
  )

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
    <div className="space-y-5 sm:space-y-6">
      <SectionIntro
        section="pronostic"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Pronostic"
        title="Mes paris"
        description="Tes paris et le classement des meilleurs parieurs Talk Foot."
        actions={
          liveMatch ? (
            <Link
              to={`/channel/${liveMatch.id}?paris=1`}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border-2 border-tf-cta-hover/40 bg-tf-cta px-4 text-sm font-black text-white shadow-tf-cta transition hover:bg-tf-cta-hover"
            >
              Parier en live
            </Link>
          ) : (
            <Link
              to="/match"
              className={cn(
                'inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 text-sm font-bold shadow-sm transition',
                L
                  ? 'border-tf-dark/20 bg-white text-tf-dark hover:bg-tf-electric-soft'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15',
              )}
            >
              Voir les matchs
            </Link>
          )
        }
      />

      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        role="tablist"
        aria-label="Sections pronostic"
      >
        <HubTabButton
          active={hubView === 'paris'}
          onClick={() => setHubView('paris')}
          label="Mes paris"
          L={L}
        />
        <HubTabButton
          active={hubView === 'classement'}
          onClick={() => setHubView('classement')}
          label="Classement parieurs"
          L={L}
        />
      </div>

      {hubView === 'classement' ? (
        <section className="space-y-4" aria-label="Classement des parieurs">
          <PronoStatsPanel className="border-t-0 pt-0 sm:pt-0" />
          <FriendsParieurMiniRank />
          <Card className="p-5 sm:p-6" elevation="soft">
            <BettorLeaderboard extended embedded />
          </Card>
        </section>
      ) : (
        <>
      <div
        className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filtrer mes paris"
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
        <EmptyBets tab={tab} liveMatch={liveMatch} L={L} />
      )}
        </>
      )}

      <FictionalBettingNotice className="mt-2" />
    </div>
  )
}

function HubTabButton({
  active,
  onClick,
  label,
  L,
}: {
  active: boolean
  onClick: () => void
  label: string
  L: boolean
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'min-h-11 flex-1 rounded-2xl px-4 py-2.5 text-center text-xs font-black transition sm:min-h-0 sm:flex-none sm:px-6 sm:text-sm',
        active
          ? 'bg-tf-cta text-white shadow-tf-cta'
          : L
            ? 'bg-tf-dark/[0.06] text-tf-dark hover:bg-tf-dark/10'
            : 'bg-white/10 text-sky-100/90 hover:bg-white/14',
      )}
    >
      {label}
    </button>
  )
}

function EmptyBets({
  tab,
  liveMatch,
  L,
}: {
  tab: BetFilterTab
  liveMatch: Match | null
  L: boolean
}) {
  const msg =
    tab === 'open'
      ? 'Aucun pari en cours pour le moment.'
      : tab === 'won'
        ? 'Pas encore de pari gagné — continue !'
        : tab === 'lost'
          ? 'Aucun pari perdu dans ce filtre.'
          : 'Tu n’as pas encore de pari.'

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed p-8 text-center',
        L ? 'border-slate-200 bg-slate-50/80' : 'border-white/15 bg-white/[0.04]',
      )}
    >
      <p className="text-lg font-black text-tf-app-fg">🎯 {msg}</p>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-tf-app-muted">
        Ouvre un match, choisis un prono (buteur, 1N2, over…) — il apparaîtra ici avec le score
        live.
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link
          to="/match"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-tf-cta-hover/40 bg-tf-cta px-5 text-sm font-black text-white shadow-tf-cta"
        >
          Calendrier matchs
        </Link>
        {liveMatch ? (
          <Link
            to={`/channel/${liveMatch.id}?paris=1`}
            className={cn(
              'inline-flex min-h-11 items-center justify-center rounded-2xl border px-5 text-sm font-bold',
              L
                ? 'border-tf-dark/20 bg-white text-tf-dark'
                : 'border-white/20 bg-white/10 text-white',
            )}
          >
            Parier sur {liveMatch.home.shortName} — {liveMatch.away.shortName}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
