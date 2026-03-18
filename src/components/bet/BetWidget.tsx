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
  const { wallet, openBets, matchBets, placeBet, cancelBet, stats } = betting ?? fallback
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
    // Simple, readable markets; non-monetary tokens.
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
      label: isLive ? 'Prochaine équipe à marquer' : 'Première équipe à marquer',
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
    <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-white/70 to-slate-50/70 p-2.5 shadow-[0_14px_45px_rgba(11,27,58,.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="text-base" aria-hidden="true">
            🎟
          </span>
          <div className="text-sm font-black text-slate-900">Pronos express</div>
          <span className="text-xs font-bold text-slate-600">{open ? '—' : '+'}</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge className="border-blue-200/70 bg-white/80 text-slate-900">
            {wallet.tokens} jetons
          </Badge>
          <Badge className="border-slate-200 bg-white/70 text-slate-700">
            {stats.won}/{Math.max(1, stats.total)} gagnés
          </Badge>
        </div>
      </div>

      {/* Always-visible quick bets (so it's never "hidden") */}
      <div className="mt-2 rounded-3xl bg-white/55 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-black tracking-[0.14em] text-slate-700/70">
            PARIS RAPIDES
          </div>
          <Button variant="ghost" className="h-7 rounded-2xl px-2.5" onClick={() => setOpen(true)}>
            Plus
          </Button>
        </div>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          <Button
            variant="soft"
            className="h-9 rounded-3xl justify-between px-3 text-sm"
            onClick={() =>
              setPending({
                market: isLive ? 'next_goal' : 'first_goal',
                selection: 'home',
                odds: 1.9,
                label: `${isLive ? 'Prochain but' : '1er but'} ${match.home.shortName}`,
              })
            }
          >
            <span className="truncate">
              {isLive ? 'Prochain but' : '1er but'} {match.home.shortName}
            </span>
            <span className="text-xs font-black text-slate-600">{fmtOdds(1.9)}</span>
          </Button>
          <Button
            variant="soft"
            className="h-9 rounded-3xl justify-between px-3 text-sm"
            onClick={() =>
              setPending({
                market: isLive ? 'next_goal' : 'first_goal',
                selection: 'away',
                odds: 1.9,
                label: `${isLive ? 'Prochain but' : '1er but'} ${match.away.shortName}`,
              })
            }
          >
            <span className="truncate">
              {isLive ? 'Prochain but' : '1er but'} {match.away.shortName}
            </span>
            <span className="text-xs font-black text-slate-600">{fmtOdds(1.9)}</span>
          </Button>
        </div>

        {/* Validate bar */}
        {pending ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-blue-200/70 bg-white/85 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-black text-slate-900">
                {pending.label}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-600">
                Mise {stake}j • cote {fmtOdds(pending.odds)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-8 rounded-2xl px-3"
                onClick={() => setPending(null)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="h-8 rounded-2xl px-4"
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
              'mt-2 rounded-2xl px-3 py-2 text-xs font-semibold',
              notice.tone === 'ok'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800',
            )}
          >
            {notice.text}
          </div>
        ) : null}

        {/* Tiny reminder (full history lives in Profile) */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-slate-200/70 bg-white/70 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-slate-200 bg-white/80 text-slate-900">
              En cours: {openBets.length}
            </Badge>
            <Badge className="border-slate-200 bg-white/80 text-slate-700">
              Validés: {settled.length}
            </Badge>
          </div>
          <Link
            to="/profile"
            className="text-xs font-black text-blue-700 hover:text-blue-800"
          >
            Voir sur Profil →
          </Link>
        </div>
      </div>

      {open ? (
        <div className="mt-2 space-y-2 max-h-[240px] overflow-y-auto pr-1">
          <div className="rounded-3xl bg-white/55 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-black tracking-[0.14em] text-slate-700/70">MISE</div>
              <div className={cn('text-sm font-black', canStake ? 'text-slate-900' : 'text-rose-700')}>
                {stake}j
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={stakePct} tone="blue" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((n) => (
                <Button
                  key={n}
                  variant={stake === n ? 'primary' : 'soft'}
                  className="h-8 rounded-2xl px-3"
                  onClick={() => setStake(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-slate-700/70">
              Pas d’argent réel — juste des jetons pour se challenger.
            </div>
          </div>

          <div className="space-y-2">
            {markets.map((m) => (
              <div key={m.id} className="rounded-3xl bg-white/55 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-900">{m.label}</div>
                  {!m.enabled ? (
                    <Badge className="border-slate-200 bg-white/70 text-slate-700">
                      Live seulement
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {m.picks.map((p) => (
                    <Button
                      key={p.id}
                      variant="soft"
                      className="h-9 rounded-3xl justify-between"
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
                      <span className="text-xs font-black text-slate-600">
                        {fmtOdds(p.odds)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white/55 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-slate-900">Historique</div>
              <Link to="/profile" className="text-xs font-black text-blue-700 hover:text-blue-800">
                Profil →
              </Link>
            </div>
            <div className="mt-2 space-y-2">
              {matchBets.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-white/75 px-3 py-2"
                >
                  <div className="text-xs font-bold text-slate-900">
                    {b.market} • {b.selection} • {b.stake}j • x{fmtOdds(b.odds)}
                  </div>
                  {b.status === 'open' ? (
                    <Button
                      variant="ghost"
                      className="h-7 rounded-2xl px-3"
                      onClick={() => cancelBet(b.id)}
                    >
                      Annuler
                    </Button>
                  ) : (
                    <Badge
                      className={
                        b.status === 'won'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : b.status === 'lost'
                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-white/70 text-slate-700'
                      }
                    >
                      {b.status === 'won'
                        ? `Gagné +${b.payout ?? 0}`
                        : b.status === 'lost'
                          ? 'Perdu'
                          : 'Annulé'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-slate-700/70">
              “Prochaine équipe à marquer” se règle au prochain but. “Première équipe à marquer” au 1er but.
            </div>
          </div>

          {matchBets.length ? (
            <div className="text-[11px] font-semibold text-slate-700/70">
              Astuce: tente “Prochain but” en live pour une résolution immédiate.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

