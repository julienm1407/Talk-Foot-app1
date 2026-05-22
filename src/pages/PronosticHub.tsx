import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BetSlipCard } from '../components/bet/BetSlipCard'
import { PronoStatsPanel } from '../components/pronostic/PronoStatsPanel'
import { SectionIntro } from '../components/ui/SectionIntro'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { useMatches } from '../contexts/MatchesContext'
import { useUserBets } from '../hooks/useUserBets'
import { useWallet } from '../hooks/useWallet'
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

/**
 * Hub « Pronostic » : mes paris, jetons et accès rapide au salon live.
 */
export function PronosticHubPage() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const [bets] = useUserBets()
  const { wallet } = useWallet()
  const { matches } = useMatches()
  const [tab, setTab] = useState<BetFilterTab>('all')

  const matchesById = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches])
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
        title="Mes paris & jetons"
        description="Tous tes paris en un coup d’œil — en cours, gagnés ou perdus — avec le score live du match."
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

      <PronoStatsPanel />

      <div
        className={cn(
          'flex flex-wrap items-stretch gap-3 rounded-2xl border p-4 sm:p-5',
          L
            ? 'border-tf-dark/12 bg-white shadow-sm'
            : 'border-white/12 bg-[#0d2135]/90 shadow-tf-elev-2',
        )}
      >
        <WalletStat
          label="Jetons"
          value={wallet.tokens}
          hint="Pour tes paris"
          accent="emerald"
          L={L}
          icon={<TokenGlyph className="size-6" variant={L ? 'solid' : 'onDark'} />}
        />
        <div
          className={cn('hidden w-px sm:block', L ? 'bg-tf-dark/10' : 'bg-white/12')}
          aria-hidden
        />
        <WalletStat
          label="Médailles"
          value={wallet.medals}
          hint="Boutique & cosmétiques"
          accent="amber"
          L={L}
          icon={<span className="text-2xl leading-none" aria-hidden>🏅</span>}
        />
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:flex-col sm:items-end">
          <Link
            to="/profile#monnaie"
            className={cn(
              'text-xs font-bold underline-offset-2 hover:underline',
              L ? 'text-tf-dark/70' : 'text-sky-200/80',
            )}
          >
            Gérer mon solde
          </Link>
          {liveMatch ? (
            <Link
              to={`/channel/${liveMatch.id}?paris=1`}
              className="text-xs font-black text-tf-cta hover:text-tf-cta-hover"
            >
              Nouveau pari →
            </Link>
          ) : null}
        </div>
      </div>

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
              <BetSlipCard bet={bet} match={matchesById.get(bet.matchId) ?? null} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyBets tab={tab} liveMatch={liveMatch} L={L} />
      )}
    </div>
  )
}

function WalletStat({
  label,
  value,
  hint,
  accent,
  L,
  icon,
}: {
  label: string
  value: number
  hint: string
  accent: 'emerald' | 'amber'
  L: boolean
  icon: ReactNode
}) {
  const valueColor =
    accent === 'emerald'
      ? L
        ? 'text-emerald-800'
        : 'text-emerald-300'
      : L
        ? 'text-amber-900'
        : 'text-amber-200'
  return (
    <div className="flex min-w-[8.5rem] flex-1 items-center gap-3 sm:flex-none">
      {icon}
      <div>
        <div className="text-[10px] font-black uppercase tracking-wide text-tf-app-muted">
          {label}
        </div>
        <div className={cn('text-2xl font-black tabular-nums leading-none', valueColor)}>
          {Math.round(value)}
        </div>
        <div className="mt-0.5 text-[11px] font-semibold text-tf-app-muted">{hint}</div>
      </div>
    </div>
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
