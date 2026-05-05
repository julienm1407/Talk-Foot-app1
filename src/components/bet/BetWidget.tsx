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
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../../api/sportMonks'

function fmtOdds(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function seeded01(seed: number): number {
  const x = Math.sin(seed * 12_989.123) * 43_758.5453
  return x - Math.floor(x)
}

function hashMatchSeed(match: Match): number {
  const s = `${match.id}|${match.home.id}|${match.away.id}|${match.kickoffAt}`
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h || 1
}

function synthetic1x2ForMatch(match: Match): SmBookOdds1x2 {
  const seed = hashMatchSeed(match)
  const h = seeded01(seed + 11)
  const d = seeded01(seed + 23)
  const pHome = 0.42 + (h - 0.5) * 0.16 + 0.06
  const pDraw = 0.26 + (d - 0.5) * 0.1
  const pAway = clamp(1 - pHome - pDraw, 0.15, 0.56)
  const sum = pHome + pDraw + pAway
  const overround = 1.06
  const toOdd = (p: number) => {
    const implied = clamp((p / sum) * overround, 0.02, 0.92)
    return Math.round(clamp(1 / implied, 1.2, 25) * 100) / 100
  }
  return { home: toOdd(pHome), draw: toOdd(pDraw), away: toOdd(pAway) }
}

function syntheticOu25ForMatch(match: Match): SmBookOddsOverUnder25 {
  const seed = hashMatchSeed(match)
  const s = seeded01(seed + 41)
  const lambda = 2.55 + (s - 0.5) * 0.7
  const exp = Math.exp(-lambda)
  const pUnder = exp * (1 + lambda + (lambda * lambda) / 2)
  const pOver = clamp(1 - pUnder, 0.2, 0.8)
  const overround = 1.05
  const toOdd = (p: number) => {
    const implied = clamp(p * overround, 0.02, 0.92)
    return Math.round(clamp(1 / implied, 1.2, 20) * 100) / 100
  }
  return { over: toOdd(pOver), under: toOdd(1 - pOver) }
}

/** `bookOdds1x2` : cotes 1N2 API ; `bookOddsLoading` : pas de cote démo tant que le chargement SM. */
export function BetWidget({
  match,
  betting,
  bookOdds1x2 = null,
  bookOddsOverUnder25 = null,
  bookOddsLoading = false,
  compact = false,
}: {
  match: Match
  bookOdds1x2?: SmBookOdds1x2 | null
  bookOddsOverUnder25?: SmBookOddsOverUnder25 | null
  bookOddsLoading?: boolean
  compact?: boolean
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
  const [sheetOpen, setSheetOpen] = useState(false)
  const [stake, setStake] = useState(25)
  const [pending, setPending] = useState<null | {
    market: BetMarket
    selection: BetSelection
    label: string
    odds: number
  }>(null)
  const [notice, setNotice] = useState<null | { tone: 'ok' | 'err'; text: string }>(null)

  const isUpcoming = match.status === 'upcoming'

  const maxStakeCap = 250
  const maxStake = Math.min(maxStakeCap, Math.max(0, wallet.tokens))
  const minStake = 5

  /** Triplet 1N2 affichable : API, puis fallback estimé stable par match. */
  const x12Resolved = useMemo((): SmBookOdds1x2 | null => {
    if (
      bookOdds1x2 &&
      bookOdds1x2.home >= 1.01 &&
      bookOdds1x2.draw >= 1.01 &&
      bookOdds1x2.away >= 1.01
    ) {
      return bookOdds1x2
    }
    return synthetic1x2ForMatch(match)
  }, [bookOdds1x2, match])

  const x12Ready = Boolean(x12Resolved)
  const x12OddsPending = Boolean(match.sportMonksFixtureId && bookOddsLoading && !x12Ready)
  const x12UnavailableLabel = x12OddsPending ? 'Chargement…' : 'Estimé'
  const ou25Ready = Boolean(
    bookOddsOverUnder25 &&
      bookOddsOverUnder25.over >= 1.01 &&
      bookOddsOverUnder25.under >= 1.01,
  )
  const ou25Resolved = useMemo(() => {
    if (ou25Ready && bookOddsOverUnder25) return bookOddsOverUnder25
    return syntheticOu25ForMatch(match)
  }, [ou25Ready, bookOddsOverUnder25, match])

  const markets = useMemo(() => {
    const base = [
      {
        id: 'result_1x2' as const,
        label: '1N2',
        enabled: x12Ready,
        picks: [
          { id: 'home' as const, label: match.home.shortName, odds: x12Resolved?.home ?? 0 },
          { id: 'draw' as const, label: 'Nul', odds: x12Resolved?.draw ?? 0 },
          { id: 'away' as const, label: match.away.shortName, odds: x12Resolved?.away ?? 0 },
        ],
      },
      {
        id: 'over25' as const,
        label: '+2,5 buts',
        enabled: true,
        picks: [
          { id: 'over' as const, label: 'Over', odds: ou25Resolved.over },
          { id: 'under' as const, label: 'Under', odds: ou25Resolved.under },
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

    return base
  }, [isUpcoming, match.away.shortName, match.home.shortName, x12Ready, x12Resolved, ou25Resolved])

  const canStake =
    maxStake >= minStake && stake >= minStake && stake <= maxStake && stake <= wallet.tokens
  const stakePct =
    maxStake > 0 ? Math.round((Math.min(maxStake, Math.max(0, stake)) / maxStake) * 100) : 0
  const settled = useMemo(() => matchBets.filter((b) => b.status !== 'open'), [matchBets])

  const openSheet = () => setSheetOpen(true)

  const pickQuick = (side: 'home' | 'away') => {
    if (!x12Resolved) return
    const odds = side === 'home' ? x12Resolved.home : x12Resolved.away
    setPending({
      market: 'result_1x2',
      selection: side,
      odds,
      label: side === 'home' ? `1N2 · ${match.home.shortName}` : `1N2 · ${match.away.shortName}`,
    })
    if (maxStake >= minStake) {
      setStake((s) => Math.min(Math.max(s, minStake), maxStake))
    }
    openSheet()
  }

  const placePending = () => {
    if (!pending) return
    const res = placeBet(pending.market, pending.selection, stake, pending.odds)
    if (res && typeof res === 'object' && 'ok' in res && (res as { ok: boolean }).ok === false) {
      setNotice({ tone: 'err', text: 'Pas assez de jetons.' })
      return
    }
    setNotice({ tone: 'ok', text: 'Pari activé.' })
    setPending(null)
    window.setTimeout(() => {
      setNotice(null)
      setSheetOpen(false)
    }, 1100)
  }

  const potentialReturn = pending ? Math.round(stake * pending.odds * 10) / 10 : 0

  return (
    <div
      className={cn(
        'tf-bet-widget relative flex h-full flex-col overflow-hidden rounded-xl border border-[#3a6690]/55 bg-[#0b1f34] shadow-[0_10px_20px_rgba(2,8,18,0.26)]',
        compact ? 'p-2' : 'p-3',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-emerald-300/85" />
      <div
        className={cn(
          'tf-bet-soft rounded-xl border border-[#4b7ba8]/60 bg-[#0d2741]',
          compact ? 'space-y-2.5 p-2.5' : 'flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3',
        )}
      >
        <div className={cn('flex min-w-0 items-start gap-2', compact ? 'items-center justify-between' : 'sm:items-center')}>
          <span className={cn('shrink-0', compact ? 'text-sm' : 'text-lg')} aria-hidden="true">
            🎯
          </span>
          <div className="min-w-0">
            <span className={cn('block font-black text-sky-100', compact ? 'text-[11px]' : 'text-sm')}>Pronos Live</span>
            {!compact ? (
              <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-sky-200/70">
                Mise rapide ou ouvre le détail des marchés.
              </span>
            ) : (
              <span className="mt-0.5 block text-[10px] font-semibold text-sky-200/70">Mise rapide</span>
            )}
          </div>
          {compact ? (
            <button
              type="button"
              onClick={openSheet}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="shrink-0 rounded-lg border border-[#00d1b6]/50 bg-[#18d3b8] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#06242a] shadow-sm transition hover:bg-[#2be0c6] focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            >
              Ouvrir
            </button>
          ) : null}
        </div>
        <div
          className={cn(
            'flex flex-wrap items-center gap-2.5',
            compact ? 'justify-between' : 'sm:justify-end',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('tf-bet-chip border-[#557da3]/70 bg-[#0e2a45] text-sky-100', compact ? 'px-2 py-0.5 text-[10px]' : '')}>
              {wallet.tokens} jetons
            </Badge>
            <Badge className={cn('tf-bet-chip border-[#6a5bd7]/70 bg-[#6a5bd7]/18 text-violet-100', compact ? 'px-2 py-0.5 text-[10px]' : '')}>
              {stats.won}/{Math.max(1, stats.total)} ✓
            </Badge>
          </div>
          {!compact ? (
            <button
              type="button"
              onClick={openSheet}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="min-h-11 w-full shrink-0 rounded-xl border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2.5 text-center text-xs font-black uppercase tracking-wide text-[#06242a] shadow-sm transition hover:bg-[#2be0c6] focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-300/50 sm:min-h-0 sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[10px]"
            >
              Ouvrir
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'tf-bet-soft space-y-2.5 rounded-xl border border-[#3f6f97]/50 bg-[#0b2238]/82 p-2.5 sm:bg-transparent sm:p-0',
          compact ? 'mt-2.5' : 'mt-3',
        )}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <Button
            variant="soft"
            title="Pari 1N2 — vainqueur domicile"
            disabled={!x12Ready}
            className={cn(
              'min-h-11 min-w-0 justify-between gap-2 rounded-xl px-3 text-sm font-bold sm:min-h-0 sm:px-4',
              compact ? 'sm:h-10' : 'sm:h-10',
            )}
            onClick={() => pickQuick('home')}
          >
            <span className="min-w-0 overflow-hidden text-ellipsis">
              {match.home.shortName}
            </span>
              <span className="shrink-0 text-xs font-black text-sky-200/75">
              {x12Ready ? fmtOdds(x12Resolved!.home) : x12UnavailableLabel}
            </span>
          </Button>
          <Button
            variant="soft"
            title="Pari 1N2 — vainqueur extérieur"
            disabled={!x12Ready}
            className={cn(
              'min-h-11 min-w-0 justify-between gap-2 rounded-xl px-3 text-sm font-bold sm:min-h-0 sm:px-4',
              compact ? 'sm:h-10' : 'sm:h-10',
            )}
            onClick={() => pickQuick('away')}
          >
            <span className="min-w-0 overflow-hidden text-ellipsis">
              {match.away.shortName}
            </span>
              <span className="shrink-0 text-xs font-black text-sky-200/75">
              {x12Ready ? fmtOdds(x12Resolved!.away) : x12UnavailableLabel}
            </span>
          </Button>
        </div>
        {compact ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!x12Resolved) return
                setPending({
                  market: 'result_1x2',
                  selection: 'draw',
                  odds: x12Resolved.draw,
                  label: '1N2 · Nul',
                })
                openSheet()
              }}
              className="tf-bet-soft tf-bet-mini rounded-lg border border-[#4f7ea8]/60 bg-[#0d2842] px-2 py-1.5 text-left text-[11px] font-bold text-sky-100 transition hover:border-sky-300/70"
              disabled={!x12Ready}
              title="Pari 1N2 — nul"
            >
              <span className="block text-[10px] text-sky-200/70">Nul</span>
              <span>{x12Ready ? fmtOdds(x12Resolved!.draw) : x12UnavailableLabel}</span>
            </button>
            <div className="tf-bet-soft tf-bet-mini rounded-lg border border-[#4f7ea8]/60 bg-[#0d2842] px-2 py-1.5 text-[11px] font-bold text-sky-100">
              <span className="block text-[10px] text-sky-200/70">+2,5</span>
              <span>{fmtOdds(ou25Resolved.over)}</span>
            </div>
            <div className="tf-bet-soft tf-bet-mini rounded-lg border border-[#4f7ea8]/60 bg-[#0d2842] px-2 py-1.5 text-[11px] font-bold text-sky-100">
              <span className="block text-[10px] text-sky-200/70">-2,5</span>
              <span>{fmtOdds(ou25Resolved.under)}</span>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            'tf-bet-soft flex items-center justify-between rounded-xl border border-[#3f6f97]/55 bg-[#0d2842]/75 px-2.5 sm:px-3',
            compact ? 'py-2' : 'py-2',
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-sky-200/75">
            <span>En cours: {openBets.length}</span>
            <span>•</span>
            <span>Résolus: {settled.length}</span>
          </div>
          <Link
            to="/profile"
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
          >
            Profil →
          </Link>
        </div>
        {compact ? (
          <div className="tf-bet-soft tf-bet-momentum rounded-xl border border-[#496f91]/40 bg-[#11263f]/86 px-2.5 py-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-sky-200/80">
              <span>Momentum pronos</span>
              <span className="text-violet-200">{Math.min(99, 52 + openBets.length * 6)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1a3a57]/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300"
                style={{ width: `${Math.min(100, 52 + openBets.length * 6)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] font-semibold text-sky-100/75">
              Activité live: {openBets.length > 0 ? 'marchés chauds' : 'ouverture prudente'}
            </p>
          </div>
        ) : null}
      </div>

      {sheetOpen ? (
        <div
          className="fixed inset-0 z-[88] flex items-end justify-center sm:items-center sm:p-4"
          data-no-swipe="true"
          data-tf-modal="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bet-sheet-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
            aria-label="Fermer les pronos"
          />
          <div
            className={cn(
              'relative z-10 flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl',
              'sm:max-h-[min(85vh,620px)] sm:rounded-3xl',
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h2 id="bet-sheet-title" className="text-base font-black text-slate-900">
                  Pronos
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Mise d’abord, puis valide ta sélection
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-slate-200 bg-slate-50 text-slate-800">
                  {wallet.tokens} j.
                </Badge>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
              <div className="rounded-2xl border border-sky-200/70 bg-sky-50/90 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-sky-900/80">
                    Ta mise
                  </span>
                  <span
                    className={cn(
                      'text-lg font-black tabular-nums',
                      canStake ? 'text-slate-900' : 'text-rose-600',
                    )}
                  >
                    {stake} j.
                  </span>
                </div>
                {maxStake < minStake ? (
                  <p className="mt-2 text-xs font-semibold text-rose-600">
                    Pas assez de jetons pour miser (minimum {minStake} j.).
                  </p>
                ) : (
                  <>
                    <div className="mt-3">
                      <input
                        type="range"
                        min={minStake}
                        max={maxStake}
                        step={5}
                        value={Math.min(stake, maxStake)}
                        onChange={(e) => setStake(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer accent-sky-600"
                        aria-label="Réglage de la mise"
                      />
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={stakePct} tone="blue" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[10, 25, 50, 100].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          variant={stake === n ? 'primary' : 'soft'}
                          className="h-9 rounded-xl px-3 text-sm font-black"
                          disabled={n > maxStake}
                          onClick={() => setStake(Math.min(n, maxStake))}
                        >
                          {n}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={stake === maxStake ? 'primary' : 'soft'}
                        className="h-9 rounded-xl px-3 text-sm font-black"
                        disabled={maxStake < minStake}
                        onClick={() => setStake(maxStake)}
                      >
                        Max
                      </Button>
                    </div>
                  </>
                )}
                {pending ? (
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Gain potentiel (brut) :{' '}
                    <span className="font-black text-emerald-700">{potentialReturn} j.</span>{' '}
                    <span className="text-slate-400">(@ {fmtOdds(pending.odds)})</span>
                  </p>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Choisis un marché ci-dessous pour voir le gain estimé.
                  </p>
                )}
              </div>

              {pending ? (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wide text-blue-900/70">
                      Sélection
                    </div>
                    <div className="truncate text-sm font-black text-slate-900">{pending.label}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-600">
                      {stake} j. · cote {fmtOdds(pending.odds)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      className="h-10 rounded-xl px-4"
                      onClick={() => setPending(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      className="h-10 rounded-xl px-5 font-black"
                      disabled={!canStake}
                      onClick={placePending}
                    >
                      Valider le pari
                    </Button>
                  </div>
                </div>
              ) : null}

              {notice ? (
                <div
                  className={cn(
                    'mt-4 rounded-2xl px-4 py-3 text-sm font-semibold',
                    notice.tone === 'ok'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-rose-200 bg-rose-50 text-rose-800',
                  )}
                >
                  {notice.text}
                </div>
              ) : null}

              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Coup rapide — 1N2
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    variant="soft"
                    className="h-11 justify-between rounded-xl px-4 text-sm font-bold"
                    disabled={!x12Ready}
                    onClick={() => pickQuick('home')}
                  >
                    <span className="truncate">{match.home.shortName}</span>
                    <span className="shrink-0 text-xs font-black text-slate-500">
                      {x12OddsPending ? '…' : x12Ready ? fmtOdds(x12Resolved!.home) : '—'}
                    </span>
                  </Button>
                  <Button
                    variant="soft"
                    className="h-11 justify-between rounded-xl px-4 text-sm font-bold"
                    disabled={!x12Ready}
                    onClick={() => pickQuick('away')}
                  >
                    <span className="truncate">{match.away.shortName}</span>
                    <span className="shrink-0 text-xs font-black text-slate-500">
                      {x12OddsPending ? '…' : x12Ready ? fmtOdds(x12Resolved!.away) : '—'}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-3 pb-2">
                {markets.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">{m.label}</span>
                      {!m.enabled && (
                        <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                          {m.id === 'result_1x2'
                            ? x12OddsPending
                              ? '…'
                              : 'Bientot'
                            : 'Live'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {m.picks.map((p) => (
                        <Button
                          key={p.id}
                          variant="soft"
                          className="h-10 min-w-0 justify-between gap-1 rounded-xl px-2 text-xs font-bold"
                          disabled={!m.enabled}
                          onClick={() => {
                            setPending({
                              market: m.id,
                              selection: p.id,
                              odds: p.odds,
                              label: `${m.label} • ${p.label}`,
                            })
                            if (maxStake >= minStake) {
                              setStake((s) => Math.min(Math.max(s, minStake), maxStake))
                            }
                          }}
                        >
                          <span className="min-w-0 truncate">{p.label}</span>
                          <span className="shrink-0 font-black text-slate-500">
                            {m.id === 'result_1x2' && !x12Ready
                              ? x12OddsPending
                                ? '…'
                                : '—'
                              : fmtOdds(p.odds)}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/profile"
                className="mt-2 block pb-2 text-center text-xs font-bold text-blue-600 hover:text-blue-700"
                onClick={() => setSheetOpen(false)}
              >
                Voir l’historique dans le profil →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
