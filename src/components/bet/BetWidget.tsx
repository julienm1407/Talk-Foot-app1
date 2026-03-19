import { useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { cn } from '../../utils/cn'
import type { Bet } from '../../types/bet'
import type { Wallet } from '../../types/bet'
import type { BetMarket, BetSelection } from '../../types/bet'
import { useBetting } from '../../hooks/useBetting'

function fmtOdds(n: number) {
  return n.toFixed(2).replace('.', ',')
}

export function BetWidget({
  match,
  betting,
}: {
  match: Match
  betting?: {
    wallet: Wallet
    matchBets: Bet[]
    openBets: Bet[]
    stats: { total: number; won: number }
    placeBet: (
      market: BetMarket,
      selection: BetSelection,
      stake: number,
      odds: number,
    ) =>
      | { ok: true; bet: Bet }
      | { ok: false; reason: 'not_enough_tokens' }
    cancelBet: (betId: string) => void
  }
}) {
  const fallback = useBetting(match.id)
  const { wallet, openBets, matchBets, placeBet, cancelBet: _cancelBet, stats } = betting ?? fallback
  const [open, setOpen] = useState(false)
  const [stake, setStake] = useState(25)
  const [pending, setPending] = useState<null | {
    market: BetMarket
    selection: BetSelection
    label: string
    odds: number
  }>(null)
  const [notice, setNotice] = useState<null | { tone: 'ok' | 'err'; text: string }>(null)

  const isLive = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'

  const markets = useMemo(() => {
    const base = [
      {
        id: 'result_1x2' as const,
        label: '1N2',
        enabled: true,
        picks: [
          { id: 'home' as const, label: match.home.shortName, odds: 1.85 },
          { id: 'draw' as const, label: 'Nul', odds: 3.2 },
          { id: 'away' as const, label: match.away.shortName, odds: 2.05 },
        ],
      },
      {
        id: 'over25' as const,
        label: '+2,5 buts',
        enabled: true,
        picks: [
          { id: 'over' as const, label: 'Over', odds: 1.75 },
          { id: 'under' as const, label: 'Under', odds: 2.05 },
        ],
      },
      {
        id: 'exact_score' as const,
        label: 'Score exact',
        enabled: isUpcoming,
        picks: [
          { id: '10' as const, label: '1–0', odds: 6.5 },
          { id: '20' as const, label: '2–0', odds: 8.5 },
          { id: '21' as const, label: '2–1', odds: 7.5 },
          { id: '11' as const, label: '1–1', odds: 6.8 },
          { id: '01' as const, label: '0–1', odds: 6.5 },
          { id: '12' as const, label: '1–2', odds: 7.5 },
          { id: '00' as const, label: '0–0', odds: 9.0 },
        ],
      },
    ]

    const scorerMarket = (isLive ? 'next_goal' : 'first_goal') as BetMarket
    const scorer = {
      id: scorerMarket,
      label: isLive ? 'Prochain but' : 'Premier but',
      enabled: true,
      picks: [
        { id: 'home' as const, label: match.home.shortName, odds: 1.9 },
        { id: 'away' as const, label: match.away.shortName, odds: 1.9 },
      ],
    }

    return [scorer, ...base]
  }, [isLive, isUpcoming, match.away.shortName, match.home.shortName])

  const canStake = stake >= 5 && stake <= 250
  const stakePct = Math.round((Math.min(250, Math.max(0, stake)) / 250) * 100)
  const settled = useMemo(() => matchBets.filter((b) => b.status !== 'open'), [matchBets])

  const placePending = () => {
    if (!pending) return
    const res = placeBet(pending.market, pending.selection, stake, pending.odds)
    if (res && typeof res === 'object' && 'ok' in res && (res as any).ok === false) {
      setNotice({ tone: 'err', text: 'Pas assez de jetons.' })
      return
    }
    setNotice({ tone: 'ok', text: 'Pari activé.' })
    setPending(null)
    window.setTimeout(() => setNotice(null), 1400)
  }

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500/30"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="text-lg" aria-hidden="true">
            🎯
          </span>
          <span className="text-sm font-black text-slate-900">Pronos</span>
          <span className="text-xs font-bold text-slate-500">
            {open ? '▼' : '▶'}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Badge className="border-slate-200/70 bg-white text-slate-800">
            {wallet.tokens} jetons
          </Badge>
          <Badge className="border-slate-200/60 bg-slate-50/80 text-slate-600">
            {stats.won}/{Math.max(1, stats.total)} ✓
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="soft"
            className="h-10 min-w-0 rounded-xl justify-between gap-2 px-4 text-sm font-bold"
            onClick={() =>
              setPending({
                market: isLive ? 'next_goal' : 'first_goal',
                selection: 'home',
                odds: 1.9,
                label: `${isLive ? 'Prochain but' : '1er but'} ${match.home.shortName}`,
              })
            }
          >
            <span className="min-w-0 overflow-hidden text-ellipsis">
              {match.home.shortName}
            </span>
            <span className="shrink-0 text-xs font-black text-slate-500">
              {fmtOdds(1.9)}
            </span>
          </Button>
          <Button
            variant="soft"
            className="h-10 min-w-0 rounded-xl justify-between gap-2 px-4 text-sm font-bold"
            onClick={() =>
              setPending({
                market: isLive ? 'next_goal' : 'first_goal',
                selection: 'away',
                odds: 1.9,
                label: `${isLive ? 'Prochain but' : '1er but'} ${match.away.shortName}`,
              })
            }
          >
            <span className="min-w-0 overflow-hidden text-ellipsis">
              {match.away.shortName}
            </span>
            <span className="shrink-0 text-xs font-black text-slate-500">
              {fmtOdds(1.9)}
            </span>
          </Button>
        </div>

        {pending ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/60 bg-blue-50/50 px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-slate-900">
                {pending.label}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-600">
                {stake}j • {fmtOdds(pending.odds)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-8 rounded-lg px-3 text-sm"
                onClick={() => setPending(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="h-8 rounded-lg px-4 text-sm font-bold"
                disabled={!canStake}
                onClick={placePending}
              >
                Valider
              </Button>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold',
              notice.tone === 'ok'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800',
            )}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-xl border border-slate-200/50 bg-slate-50/50 px-3 py-2">
          <div className="flex gap-2 text-xs font-semibold text-slate-600">
            <span>En cours: {openBets.length}</span>
            <span>•</span>
            <span>Résolus: {settled.length}</span>
          </div>
          <Link
            to="/profile"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Profil →
          </Link>
        </div>
      </div>

      {open && (
        <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
          <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-600">Mise</span>
              <span
                className={cn(
                  'text-sm font-black',
                  canStake ? 'text-slate-900' : 'text-rose-600',
                )}
              >
                {stake}j
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={stakePct} tone="blue" />
            </div>
            <div className="mt-2 flex gap-2">
              {[10, 25, 50, 100].map((n) => (
                <Button
                  key={n}
                  variant={stake === n ? 'primary' : 'soft'}
                  className="h-8 rounded-lg px-3"
                  onClick={() => setStake(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {markets.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200/60 bg-white/80 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">
                  {m.label}
                </span>
                {!m.enabled && (
                  <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                    Live
                  </Badge>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {m.picks.map((p) => (
                  <Button
                    key={p.id}
                    variant="soft"
                    className="h-9 rounded-lg justify-between text-xs"
                    disabled={!m.enabled}
                    onClick={() => {
                      setPending({
                        market: m.id,
                        selection: p.id,
                        odds: p.odds,
                        label: `${m.label} • ${p.label}`,
                      })
                    }}
                  >
                    <span className="truncate">{p.label}</span>
                    <span className="font-black text-slate-500">
                      {fmtOdds(p.odds)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
