import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
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
import { useAppearance } from '../../contexts/AppearanceContext'
import { TF_TEXT_FG, TF_TEXT_MUTED, TF_TEXT_SUBTLE, tfInsetCard } from '../../theme/appearanceClasses'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../../api/sportMonks'
import {
  adjust1x2OddsForLive,
  anytimeScorerOdds,
  scorerLineupMatchesScoredGoal,
  slugScorer,
  type ScorerLineupMeta,
} from '../../utils/liveFootballOdds'
import { getBetPickedOutcomeLabel } from '../../utils/betDisplay'
import { useMatch1x2BetVolume } from '../../hooks/useMatch1x2BetVolume'
import {
  Bet1x2PickTile,
  BetSheet1x2Grid,
  BetSheetExactScoreGrid,
  BetSheetMarketCard,
  BetSheetScorerList,
} from './BetSheetMarketUi'
import { exactScorePicksFrom1x2 } from '../../odds/exactScoreOdds'

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

type ScorerPickRow = {
  id: BetSelection
  label: string
  odds: number
  disabled?: boolean
}

function sortScorerPicksByLikelihood(rows: ScorerPickRow[]): ScorerPickRow[] {
  return [...rows].sort((a, b) => {
    const aClosed = Boolean(a.disabled)
    const bClosed = Boolean(b.disabled)
    if (aClosed !== bClosed) return aClosed ? 1 : -1
    return a.odds - b.odds
  })
}

/** Cotes 1N2 bookmaker (SportMonks) + ajustement live score ; jetons fictifs. */
export function BetWidget({
  match,
  betting,
  bookOdds1x2 = null,
  bookOddsOverUnder25 = null,
  bookOddsLoading = false,
  oddsSource = 'talkfoot',
  teamAttackIndices = null,
  compact = false,
  prominent = false,
  /** Panneau Paris mobile : feuille inline dans le sheet channel (pas de modale plein écran). */
  inlineSheet = false,
  liveScore = null,
  liveMinute = null,
  liveStatRows = [],
  lineupScorers = [],
  scoredButeurs = [],
  oddsAlreadyLiveAdjusted = false,
  bettingSuspended = false,
  bettingSuspendReason,
}: {
  match: Match
  bookOdds1x2?: SmBookOdds1x2 | null
  bookOddsOverUnder25?: SmBookOddsOverUnder25 | null
  bookOddsLoading?: boolean
  /** Origine des cotes affichées (moteur Talk Foot par défaut). */
  oddsSource?: 'talkfoot' | 'fallback'
  teamAttackIndices?: { home: number; away: number } | null
  compact?: boolean
  /** Panneau mobile / zone étroite : cotes et boutons plus grands. */
  prominent?: boolean
  /** Feuille de paris rendue dans le panneau parent (dock Paris mobile). */
  inlineSheet?: boolean
  liveStatRows?: { key: string; home: number; away: number }[]
  liveScore?: { home: number; away: number } | null
  liveMinute?: number | null
  lineupScorers?: {
    side: 'home' | 'away'
    name: string
    formationPosition?: number
    formationField?: string
    isStarter?: boolean
    substitutedOff?: boolean
  }[]
  scoredButeurs?: { side: 'home' | 'away'; slug: string; name?: string }[]
  /** Cotes déjà ajustées live par useTalkFootInternalOdds — évite double calcul. */
  oddsAlreadyLiveAdjusted?: boolean
  bettingSuspended?: boolean
  bettingSuspendReason?: string
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
  void bookOddsOverUnder25
  const fallback = useBetting(match.id, match)
  const { appearance } = useAppearance()
  const sheetLight = appearance === 'light'
  const { wallet, openBets, matchBets, placeBet, cancelBet: _cancelBet, stats } = betting ?? fallback
  const { shares: bet1x2Shares, recordBet: record1x2Bet } = useMatch1x2BetVolume(match.id)
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetDense = compact
  const sheetEmbedded = Boolean(compact && inlineSheet)
  const hideInlineForSheet = compact && sheetOpen

  const [stake, setStake] = useState(25)
  const [pending, setPending] = useState<null | {
    market: BetMarket
    selection: BetSelection
    label: string
    odds: number
  }>(null)
  const [notice, setNotice] = useState<null | { tone: 'ok' | 'err'; text: string; href?: string }>(
    null,
  )
  const sheetScrollRef = useRef<HTMLDivElement>(null)
  const x12SectionRef = useRef<HTMLDivElement>(null)
  const exactScoreSectionRef = useRef<HTMLDivElement>(null)
  const scorersSectionRef = useRef<HTMLDivElement>(null)

  const isUpcoming = match.status === 'upcoming'

  const maxStake = Math.max(0, wallet.tokens)
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

  const isLive = match.status === 'live'
  const liveBlocked = isLive && bettingSuspended
  const scoreHome = liveScore?.home ?? match.score?.home ?? 0
  const scoreAway = liveScore?.away ?? match.score?.away ?? 0
  const minuteLive = Math.max(0, liveMinute ?? match.minute ?? 0)

  /** Cotes affichées / prise de pari : book (ou synthèse) hors live ; ajustement dynamique en live. */
  const liveStatExtras = useMemo(() => {
    const row = (key: string) => liveStatRows.find((r) => r.key === key)
    const red = row('redcards') ?? row('red_cards')
    const sot = row('shots_on_target') ?? row('shotsontarget')
    return {
      homeRedCards: red?.home ?? 0,
      awayRedCards: red?.away ?? 0,
      homeShotsOnTarget: sot?.home ?? 0,
      awayShotsOnTarget: sot?.away ?? 0,
    }
  }, [liveStatRows])

  useEffect(() => {
    if (!liveBlocked) return
    setPending(null)
  }, [liveBlocked])

  const x12Displayed = useMemo((): SmBookOdds1x2 | null => {
    if (!x12Resolved) return null
    if (!isLive || oddsAlreadyLiveAdjusted) return x12Resolved
    return adjust1x2OddsForLive(x12Resolved, scoreHome, scoreAway, minuteLive, liveStatExtras)
  }, [x12Resolved, isLive, oddsAlreadyLiveAdjusted, scoreHome, scoreAway, minuteLive, liveStatExtras])

  const exactScorePicks = useMemo(() => {
    if (!x12Displayed) return []
    return exactScorePicksFrom1x2(x12Displayed, {
      liveScore: isLive || scoreHome > 0 || scoreAway > 0 ? { home: scoreHome, away: scoreAway } : null,
      liveMinute: isLive ? minuteLive : null,
      prematchOdds1x2: x12Resolved,
    })
  }, [x12Displayed, x12Resolved, isLive, scoreHome, scoreAway, minuteLive])

  const userExactScoreBets = useMemo(
    () => matchBets.filter((b) => b.market === 'exact_score' && b.status !== 'cancelled'),
    [matchBets],
  )

  const oddsSourceLabel =
    oddsSource === 'talkfoot' ? 'Cotes Talk Foot' : 'Cotes estimées'

  const scorerPicksSplit = useMemo(() => {
    if (!x12Resolved) return { home: [] as ScorerPickRow[], away: [] as ScorerPickRow[] }
    const seenH = new Set<string>()
    const seenA = new Set<string>()
    const home: ScorerPickRow[] = []
    const away: ScorerPickRow[] = []
    for (const p of lineupScorers) {
      const slug = slugScorer(p.name)
      if (!slug) continue
      const k = `${p.side}:${slug}`
      const already = scoredButeurs.some(
        (s) => s.side === p.side && scorerLineupMatchesScoredGoal(slug, s),
      )
      const meta: ScorerLineupMeta = {
        formationPosition: p.formationPosition,
        formationField: p.formationField,
        isStarter: p.isStarter !== false,
      }
      const row: ScorerPickRow = {
        id: `scor:${p.side}:${slug}`,
        label: p.name,
        odds: anytimeScorerOdds(p.name, p.side, x12Resolved, already, meta, {
          liveMinute: isLive ? minuteLive : undefined,
          teamAttackIndex:
            teamAttackIndices == null
              ? undefined
              : p.side === 'home'
                ? teamAttackIndices.home
                : teamAttackIndices.away,
        }),
        disabled: already || Boolean(p.substitutedOff),
      }
      if (p.side === 'home') {
        if (seenH.has(k)) continue
        seenH.add(k)
        home.push(row)
      } else {
        if (seenA.has(k)) continue
        seenA.add(k)
        away.push(row)
      }
    }
    return { home, away }
  }, [lineupScorers, scoredButeurs, x12Resolved, isLive, minuteLive, teamAttackIndices])

  const isFinished = match.status === 'finished'
  const exactScoreLiveClosed = isLive && minuteLive >= 80
  const showExactScoreMarket =
    exactScorePicks.length > 0 &&
    (isUpcoming || (isLive && !exactScoreLiveClosed) || (isFinished && userExactScoreBets.length > 0))
  const userScorerBets = useMemo(
    () => matchBets.filter((b) => b.market === 'anytime_scorer' && b.status !== 'cancelled'),
    [matchBets],
  )

  const scorerPicksForDisplay = useMemo(() => {
    const home = sortScorerPicksByLikelihood([...scorerPicksSplit.home])
    const away = sortScorerPicksByLikelihood([...scorerPicksSplit.away])
    const seen = new Set([...home, ...away].map((p) => String(p.id)))
    for (const bet of userScorerBets) {
      const sel = String(bet.selection)
      if (!sel.startsWith('scor:')) continue
      if (seen.has(sel)) continue
      seen.add(sel)
      const m = /^scor:(home|away):(.+)$/.exec(sel)
      if (!m) continue
      const row: ScorerPickRow = {
        id: bet.selection,
        label: getBetPickedOutcomeLabel(bet, match),
        odds: bet.odds,
        disabled: true,
      }
      if (m[1] === 'home') home.push(row)
      else away.push(row)
    }
    return {
      home: sortScorerPicksByLikelihood(home),
      away: sortScorerPicksByLikelihood(away),
    }
  }, [scorerPicksSplit, userScorerBets, match])

  const scorerPicksDisplayTotal =
    scorerPicksForDisplay.home.length + scorerPicksForDisplay.away.length

  const showScorerMarket =
    scorerPicksDisplayTotal > 0 &&
    (isUpcoming || isLive || (isFinished && userScorerBets.length > 0))

  const markets = useMemo(() => {
    const liveBlocked = isLive && bettingSuspended
    const base: Array<{
      id: BetMarket
      label: string
      enabled: boolean
      gridCols?: 2 | 3
      picks: ScorerPickRow[]
      /** Marché buteur : deux colonnes (domicile / extérieur), sans mélanger les joueurs. */
      scorerSides?: { teamLabel: string; picks: ScorerPickRow[] }[]
    }> = []

    if (showScorerMarket) {
      const homePicks = scorerPicksForDisplay.home
      const awayPicks = scorerPicksForDisplay.away
      const scorerSides = [
        { teamLabel: match.home.shortName, picks: homePicks },
        { teamLabel: match.away.shortName, picks: awayPicks },
      ].filter((side) => side.picks.length > 0)

      base.push({
        id: 'anytime_scorer',
        label: isFinished ? 'Buteur (résultat)' : 'Buteur (marque dans le match)',
        enabled: isFinished ? false : x12Ready && !liveBlocked,
        gridCols: 2,
        picks: [...homePicks, ...awayPicks],
        scorerSides: scorerSides.length > 0 ? scorerSides : undefined,
      })
    }

    return base
  }, [
    isLive,
    isFinished,
    bettingSuspended,
    match.away.shortName,
    match.home.shortName,
    scorerPicksForDisplay,
    showScorerMarket,
    x12Ready,
  ])

  const canStake =
    maxStake >= minStake && stake >= minStake && stake <= maxStake && stake <= wallet.tokens
  const stakePct =
    maxStake > 0 ? Math.round((Math.min(maxStake, Math.max(0, stake)) / maxStake) * 100) : 0
  const settled = useMemo(() => matchBets.filter((b) => b.status !== 'open'), [matchBets])

  const resultBetsForSide = useCallback(
    (side: BetSelection) =>
      matchBets.filter(
        (b) =>
          b.market === 'result_1x2' &&
          b.selection === side &&
          b.status !== 'cancelled',
      ),
    [matchBets],
  )

  const pickTeamVisual = useCallback(
    (side: 'home' | 'away' | 'draw') => {
      const bets = resultBetsForSide(side)
      const defaultVisual = {
        shell: '',
        odd: 'border-[#00b39c]/55 bg-[#18d3b8] text-[#042f2a] shadow-sm',
        badge: null as string | null,
      }
      if (!bets.length) return defaultVisual
      if (bets.some((b) => b.status === 'won')) {
        return {
          shell: '',
          odd: 'border-emerald-600/50 bg-emerald-500 text-white not-italic',
          badge: 'Gagné ✓',
        }
      }
      if (bets.some((b) => b.status === 'lost')) {
        return {
          shell: '',
          odd: 'border-rose-500/50 bg-rose-400/90 text-white not-italic',
          badge: 'Perdu',
        }
      }
      if (pending?.market === 'result_1x2' && pending.selection === side) {
        return {
          shell: '',
          odd: 'border-emerald-700/60 bg-emerald-400 text-emerald-950 ring-2 ring-emerald-500/35',
          badge: '✓',
        }
      }
      return defaultVisual
    },
    [pending, resultBetsForSide],
  )

  const scorerBetsForSelection = useCallback(
    (selection: BetSelection) =>
      matchBets.filter(
        (b) =>
          b.market === 'anytime_scorer' &&
          b.selection === selection &&
          b.status !== 'cancelled',
      ),
    [matchBets],
  )

  const pickScorerVisual = useCallback(
    (selection: BetSelection) => {
      const bets = scorerBetsForSelection(selection)
      const defaultVisual = {
        shell: '',
        badge: null as string | null,
        odd: 'border-[#00b39c]/55 bg-[#18d3b8] text-[#042f2a] shadow-sm',
      }
      if (bets.some((b) => b.status === 'won')) {
        return {
          shell: '',
          badge: 'Gagné ✓',
          odd: 'border-emerald-600/50 bg-emerald-500 text-white not-italic',
        }
      }
      if (bets.some((b) => b.status === 'lost')) {
        return {
          shell: '',
          badge: 'Perdu',
          odd: 'border-rose-500/50 bg-rose-400/90 text-white not-italic',
        }
      }
      if (pending?.market === 'anytime_scorer' && pending.selection === selection) {
        return {
          shell: '',
          badge: '✓',
          odd: 'border-emerald-700/60 bg-emerald-400 text-emerald-950 ring-2 ring-emerald-500/35',
        }
      }
      return defaultVisual
    },
    [pending, scorerBetsForSelection],
  )

  const exactScoreBetsForSelection = useCallback(
    (selection: BetSelection) =>
      matchBets.filter(
        (b) =>
          b.market === 'exact_score' &&
          b.selection === selection &&
          b.status !== 'cancelled',
      ),
    [matchBets],
  )

  const pickExactScoreVisual = useCallback(
    (selection: BetSelection) => {
      const bets = exactScoreBetsForSelection(selection)
      const defaultVisual = {
        shell: '',
        badge: null as string | null,
        odd: 'border-[#00b39c]/55 bg-[#18d3b8] text-[#042f2a] shadow-sm',
      }
      if (bets.some((b) => b.status === 'won')) {
        return {
          shell: 'border-emerald-500/80 bg-emerald-100',
          badge: 'Gagné ✓',
          odd: 'border-emerald-600/50 bg-emerald-500 text-white not-italic',
        }
      }
      if (bets.some((b) => b.status === 'lost')) {
        return {
          shell: 'border-rose-500/80 bg-rose-100',
          badge: 'Perdu',
          odd: 'border-rose-500/50 bg-rose-400/90 text-white not-italic',
        }
      }
      if (pending?.market === 'exact_score' && pending.selection === selection) {
        return {
          shell: '',
          badge: '✓',
          odd: 'border-emerald-700/60 bg-emerald-400 text-emerald-950 ring-2 ring-emerald-500/35',
        }
      }
      return defaultVisual
    },
    [pending, exactScoreBetsForSelection],
  )

  const exactScoreGroups = useMemo(() => {
    const home = exactScorePicks.filter((p) => p.category === 'home')
    const draw = exactScorePicks.filter((p) => p.category === 'draw')
    const away = exactScorePicks.filter((p) => p.category === 'away')
    return [
      { key: 'home' as const, title: `Victoire ${match.home.shortName}`, picks: home },
      { key: 'draw' as const, title: 'Match nul', picks: draw },
      { key: 'away' as const, title: `Victoire ${match.away.shortName}`, picks: away },
    ]
  }, [exactScorePicks, match.home.shortName, match.away.shortName])

  const scrollSheetToTop = useCallback(() => {
    sheetScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollSheetToSection = useCallback((ref: RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const selectPendingPick = useCallback(
    (
      pick: { market: BetMarket; selection: BetSelection; odds: number; label: string },
      options?: { scrollToConfirm?: boolean },
    ) => {
      setPending(pick)
      if (maxStake >= minStake) {
        setStake((s) => Math.min(Math.max(s, minStake), maxStake))
      }
      const shouldScroll =
        options?.scrollToConfirm ??
        (pick.market === 'anytime_scorer' ||
          pick.market === 'result_1x2' ||
          pick.market === 'exact_score')
      if (shouldScroll) {
        if (!sheetOpen) setSheetOpen(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollSheetToTop())
        })
      }
    },
    [maxStake, minStake, sheetOpen, scrollSheetToTop],
  )

  const openSheet = () => setSheetOpen(true)

  const openSheetToScorers = useCallback(() => {
    setSheetOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollSheetToSection(scorersSectionRef))
    })
  }, [scrollSheetToSection])

  const pick1x2Side = useCallback(
    (side: 'home' | 'draw' | 'away') => {
      if (liveBlocked) return
      if (!x12Displayed) return
      const odds =
        side === 'home' ? x12Displayed.home : side === 'away' ? x12Displayed.away : x12Displayed.draw
      selectPendingPick({
        market: 'result_1x2',
        selection: side,
        odds,
        label:
          side === 'draw'
            ? '1N2 · Nul'
            : `1N2 · ${side === 'home' ? match.home.name : match.away.name}`,
      })
    },
    [liveBlocked, match.away.name, match.home.name, selectPendingPick, x12Displayed],
  )

  const placePending = () => {
    if (!pending) return
    if (isLive && bettingSuspended) {
      setNotice({
        tone: 'err',
        text: bettingSuspendReason ?? 'Paris suspendus momentanément.',
      })
      return
    }
    if (pending.market === 'anytime_scorer') {
      const m = /^scor:(home|away):(.+)$/.exec(pending.selection)
      if (m) {
        const side = m[1] as 'home' | 'away'
        const pickSlug = m[2] ?? ''
        const blocked = scoredButeurs.some(
          (s) => s.side === side && scorerLineupMatchesScoredGoal(pickSlug, s),
        )
        if (blocked) {
          setNotice({ tone: 'err', text: 'Ce joueur a déjà marqué : pari buteur fermé.' })
          setPending(null)
          return
        }
      }
    }
    const res = placeBet(pending.market, pending.selection, stake, pending.odds)
    if (res && typeof res === 'object' && 'ok' in res && (res as { ok: boolean }).ok === false) {
      setNotice({ tone: 'err', text: 'Pas assez de jetons.' })
      return
    }
    const selectionText = pending.label.replace(/^1N2\s·\s/, '')
    setNotice({
      tone: 'ok',
      text: `✅ Pari validé : ${selectionText}`,
      href: '/pronostic',
    })
    if (pending.market === 'result_1x2') {
      const sel = pending.selection
      if (sel === 'home' || sel === 'draw' || sel === 'away') {
        void record1x2Bet(sel)
      }
    }
    setPending(null)
    window.setTimeout(() => {
      setNotice(null)
      setSheetOpen(false)
    }, 1100)
  }

  const potentialReturn = pending ? Math.round(stake * pending.odds * 10) / 10 : 0
  const compactProminent = compact && prominent

  return (
    <div
      className={cn(
        'tf-bet-widget relative flex h-full flex-col overflow-hidden rounded-xl border bg-[#0b1f34] shadow-[0_10px_20px_rgba(2,8,18,0.26)]',
        sheetEmbedded ? 'min-h-0 flex-1 border-0 bg-transparent p-0 shadow-none' : 'min-h-[12rem]',
        compactProminent
          ? 'border-emerald-400/45 ring-1 ring-emerald-400/20'
          : 'border-[#3a6690]/55',
        compact ? 'p-2' : 'p-3',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-emerald-300/85" />
      {!hideInlineForSheet ? (
      <>
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
                {isLive
                  ? `1N2 live (${scoreHome}–${scoreAway}, ${minuteLive}′) · ${oddsSourceLabel}.`
                  : `${oddsSourceLabel} · 1N2 + buteur.`}{' '}
                Clique une cote puis valide.
              </span>
            ) : (
              <span className="mt-0.5 block text-[10px] font-semibold text-sky-200/70">
                {compactProminent ? '1N2 · clique une cote puis valide' : 'Mise rapide'}
              </span>
            )}
            {isLive && bettingSuspended && bettingSuspendReason ? (
              <span className="mt-1 block text-[10px] font-bold text-amber-200/95">{bettingSuspendReason}</span>
            ) : null}
          </div>
          {compact ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={openSheet}
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                className="rounded-lg border border-[#00d1b6]/50 bg-[#18d3b8] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#06242a] shadow-sm transition hover:bg-[#2be0c6] focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Parier
              </button>
              {showScorerMarket ? (
                <button
                  type="button"
                  onClick={openSheetToScorers}
                  aria-haspopup="dialog"
                  aria-expanded={sheetOpen}
                  className="rounded-lg border border-violet-300/45 bg-violet-500/90 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-violet-400 focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-300/50"
                >
                  Buteurs
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            'flex flex-wrap items-center gap-2.5',
            compact ? 'justify-between' : 'sm:justify-end',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                'tf-bet-chip tf-bet-chip--tokens !border-[#6b9cc4]/80 !bg-[#0e2a45] !font-bold !text-sky-50',
                compact ? 'px-2.5 py-0.5 text-[11px]' : '!text-xs',
              )}
            >
              {wallet.tokens} jetons
            </Badge>
            <Badge
              className={cn(
                'tf-bet-chip tf-bet-chip--stats !border-[#8b7bff]/70 !bg-[#6a5bd7]/28 !font-bold !text-violet-50',
                compact ? 'px-2.5 py-0.5 text-[11px]' : '!text-xs',
              )}
            >
              {stats.won}/{Math.max(1, stats.total)} ✓
            </Badge>
          </div>
          {!compact ? (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={openSheet}
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                className="min-h-11 flex-1 rounded-xl border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2.5 text-center text-xs font-black uppercase tracking-wide text-[#06242a] shadow-sm transition hover:bg-[#2be0c6] focus-visible:outline focus-visible:ring-2 focus-visible:ring-cyan-300/50 sm:min-h-0 sm:flex-none sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[10px]"
              >
                Parier
              </button>
              {showScorerMarket ? (
                <button
                  type="button"
                  onClick={openSheetToScorers}
                  aria-haspopup="dialog"
                  aria-expanded={sheetOpen}
                  className="min-h-11 flex-1 rounded-xl border border-violet-300/50 bg-violet-500/90 px-3 py-2.5 text-center text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-violet-400 focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-300/50 sm:min-h-0 sm:flex-none sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[10px]"
                >
                  Buteurs
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'tf-bet-soft space-y-2.5 rounded-xl border border-[#3f6f97]/50 bg-[#0b2238]/82 p-2.5 sm:bg-transparent sm:p-0',
          compact ? 'mt-2.5' : 'mt-3',
        )}
      >
        <div className={cn('grid grid-cols-3', compact ? 'gap-1.5' : 'gap-2')}>
          {(
            [
              { side: 'home' as const, label: match.home.name },
              { side: 'draw' as const, label: 'Nul' },
              { side: 'away' as const, label: match.away.name },
            ] as const
          ).map(({ side, label }) => {
            const oddsVal =
              x12Ready && x12Displayed
                ? side === 'home'
                  ? x12Displayed.home
                  : side === 'away'
                    ? x12Displayed.away
                    : x12Displayed.draw
                : null
            const oddsLabel =
              oddsVal != null && oddsVal >= 1.01 ? fmtOdds(oddsVal) : x12UnavailableLabel
            return (
              <Bet1x2PickTile
                key={side}
                side={side}
                label={label}
                oddsLabel={oddsLabel}
                disabled={!x12Ready || !x12Displayed || !oddsVal || oddsVal < 1.01 || liveBlocked}
                dense={compact}
                inline
                pickVisual={pickTeamVisual(side)}
                isSelected={pending?.market === 'result_1x2' && pending.selection === side}
                onClick={() => pick1x2Side(side)}
              />
            )
          })}
        </div>

        <div
          className={cn(
            'tf-bet-soft tf-bet-summary-row flex items-center justify-between rounded-xl border px-2.5 sm:px-3',
            sheetLight
              ? 'border-slate-200/80 bg-white/90'
              : 'border-[#3f6f97]/55 bg-[#0d2842]/90',
            compact ? 'py-2' : 'py-2',
          )}
        >
          <div
            className={cn(
              'flex flex-wrap items-center gap-1.5 text-xs font-semibold',
              sheetLight ? 'text-slate-600' : 'text-sky-200/90',
            )}
          >
            <span>En cours: {openBets.length}</span>
            <span>•</span>
            <span>Résolus: {settled.length}</span>
          </div>
          <Link
            to="/pronostic"
            className={cn(
              'text-xs font-bold',
              sheetLight ? 'text-sky-700 hover:text-sky-800' : 'text-cyan-300 hover:text-cyan-200',
            )}
          >
            Mes paris →
          </Link>
        </div>
        {compact ? null : null}
      </div>
      </>
      ) : null}

      {sheetOpen ? (
        <div
          className={cn(
            sheetEmbedded
              ? 'tf-bet-sheet-embedded flex min-h-0 flex-1 flex-col overflow-hidden'
              : cn(
                  'fixed inset-0 flex flex-col justify-end sm:justify-center sm:p-4',
                  sheetDense ? 'z-[2147482505]' : 'z-[88]',
                ),
            !sheetEmbedded && 'tf-bet-sheet-layer',
          )}
          data-no-swipe="true"
          data-tf-modal={sheetEmbedded ? undefined : 'true'}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bet-sheet-title"
        >
          {!sheetEmbedded ? (
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
              onClick={() => setSheetOpen(false)}
              aria-label="Fermer les pronos"
            />
          ) : null}
          <div
            className={cn(
              'relative z-10 mx-auto flex w-full flex-col overflow-hidden border shadow-2xl tf-bet-sheet',
              sheetEmbedded
                ? 'min-h-0 flex-1 rounded-xl tf-bet-sheet--dense'
                : 'rounded-t-3xl sm:rounded-3xl',
              sheetDense && !sheetEmbedded && 'tf-bet-sheet--dense max-w-lg',
              sheetLight
                ? 'border-slate-200/80 bg-white'
                : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface)]',
              !sheetEmbedded &&
                (sheetDense
                  ? 'h-[min(88dvh,620px)] min-h-[min(72dvh,480px)] max-h-[min(88dvh,620px)]'
                  : 'max-h-[min(92vh,720px)] max-w-lg sm:max-h-[min(88vh,680px)] sm:max-w-xl'),
            )}
          >
            {!sheetEmbedded ? (
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-2 border-b',
                sheetLight ? 'border-slate-100' : 'border-[color:var(--tf-c30-border)]',
                sheetDense ? 'px-3 py-2' : 'px-4 py-3 sm:px-5',
              )}
            >
              <div>
                <h2
                  id="bet-sheet-title"
                  className={cn('font-black', TF_TEXT_FG, sheetDense ? 'text-sm' : 'text-base')}
                >
                  Pronos
                </h2>
                <p className={cn('font-semibold', TF_TEXT_MUTED, sheetDense ? 'text-[10px]' : 'text-[11px]')}>
                  Mise d’abord, puis valide ta sélection
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    sheetLight
                      ? 'border-slate-200 bg-slate-50 text-slate-800'
                      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-fg',
                    sheetDense && 'px-2 py-0.5 text-[10px]',
                  )}
                >
                  {wallet.tokens} j.
                </Badge>
                <button
                  type="button"
                  className={cn(
                    'grid place-items-center rounded-2xl border font-bold transition',
                    sheetLight
                      ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-muted hover:text-tf-app-fg',
                    sheetDense ? 'size-8 text-base' : 'size-10 text-lg',
                  )}
                  onClick={() => setSheetOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            </div>
            ) : (
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-2 border-b',
                sheetLight ? 'border-slate-100 bg-white' : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface)]',
                'px-3 py-2',
              )}
            >
              <button
                type="button"
                className={cn(
                  'inline-flex min-h-11 min-w-11 items-center gap-1 rounded-xl px-2 text-xs font-black transition',
                  sheetLight
                    ? 'text-sky-800 hover:bg-slate-50'
                    : 'text-sky-100 hover:bg-[color:var(--tf-c30-surface-soft)]',
                )}
                onClick={() => setSheetOpen(false)}
              >
                <span aria-hidden>←</span>
                <span>Retour</span>
              </button>
              <span className={cn('text-xs font-black uppercase tracking-wide', TF_TEXT_FG)}>Pronos</span>
              <button
                type="button"
                className={cn(
                  'grid min-h-11 min-w-11 place-items-center rounded-2xl border font-bold transition',
                  sheetLight
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] text-tf-app-muted hover:text-tf-app-fg',
                  'size-10 text-lg',
                )}
                onClick={() => setSheetOpen(false)}
                aria-label="Fermer les pronos"
              >
                ×
              </button>
            </div>
            )}

            <div
              ref={sheetScrollRef}
              className={cn(
                'tf-bet-sheet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain',
                sheetDense ? 'px-3 py-2.5' : 'px-4 py-4 sm:px-5',
              )}
            >
              <div className={cn(tfInsetCard(sheetLight), 'shadow-sm', sheetDense ? 'p-3' : 'p-4')}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'font-black uppercase tracking-wide',
                      sheetLight ? 'text-sky-900/80' : 'text-sky-200/90',
                      sheetDense ? 'text-[10px]' : 'text-xs',
                    )}
                  >
                    Ta mise
                  </span>
                  <span
                    className={cn(
                      'font-black tabular-nums',
                      sheetDense ? 'text-base' : 'text-lg',
                      canStake ? TF_TEXT_FG : 'text-rose-500',
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
                    <div className={cn(sheetDense ? 'mt-2' : 'mt-3')}>
                      <input
                        type="range"
                        min={minStake}
                        max={maxStake}
                        step={5}
                        value={Math.min(stake, maxStake)}
                        onChange={(e) => setStake(Number(e.target.value))}
                        className={cn(
                          'w-full cursor-pointer accent-sky-600',
                          sheetDense ? 'h-1.5' : 'h-2',
                        )}
                        aria-label="Réglage de la mise"
                      />
                    </div>
                    <div className={cn(sheetDense ? 'mt-1.5' : 'mt-2')}>
                      <ProgressBar value={stakePct} tone="blue" />
                    </div>
                    <div className={cn('flex flex-wrap gap-1.5', sheetDense ? 'mt-2' : 'mt-3')}>
                      {[10, 25, 50, 100].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          variant="soft"
                          className={cn(
                            sheetDense
                              ? 'h-8 rounded-lg px-2.5 text-xs font-black'
                              : 'h-9 rounded-xl px-3 text-sm font-black',
                            stake === n &&
                              'border-sky-500 bg-sky-100 text-sky-950 ring-2 ring-sky-500/35',
                          )}
                          disabled={n > maxStake}
                          onClick={() => setStake(Math.min(n, maxStake))}
                        >
                          {n}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="soft"
                        className={cn(
                          sheetDense
                            ? 'h-8 rounded-lg px-2.5 text-xs font-black'
                            : 'h-9 rounded-xl px-3 text-sm font-black',
                          stake === maxStake &&
                            'border-sky-500 bg-sky-100 text-sky-950 ring-2 ring-sky-500/35',
                        )}
                        disabled={maxStake < minStake}
                        onClick={() => setStake(maxStake)}
                      >
                        Max
                      </Button>
                    </div>
                  </>
                )}
                {pending ? (
                  <p className={cn('mt-3 text-xs font-semibold', TF_TEXT_MUTED)}>
                    Gain potentiel (brut) :{' '}
                    <span className={cn('font-black', sheetLight ? 'text-emerald-700' : 'text-emerald-400')}>{potentialReturn} j.</span>{' '}
                    <span className={TF_TEXT_SUBTLE}>(@ {fmtOdds(pending.odds)})</span>
                  </p>
                ) : (
                  <p className={cn('mt-3 text-xs font-semibold', TF_TEXT_MUTED)}>
                    Choisis un marché ci-dessous pour voir le gain estimé.
                  </p>
                )}
              </div>

              {pending ? (
                <div
                  className={cn(
                    'mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                    pending.market === 'anytime_scorer'
                      ? 'border-emerald-300/80 bg-emerald-50/90 ring-2 ring-emerald-400/25'
                      : pending.market === 'result_1x2' || pending.market === 'exact_score'
                        ? 'border-emerald-300/80 bg-emerald-50/90 ring-2 ring-emerald-400/25'
                        : 'border-blue-200/70 bg-blue-50/60',
                  )}
                >
                  <div className="min-w-0">
                    <div
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wide',
                        pending.market === 'anytime_scorer' || pending.market === 'result_1x2' || pending.market === 'exact_score'
                          ? 'text-emerald-900/80'
                          : 'text-blue-900/70',
                      )}
                    >
                      {pending.market === 'anytime_scorer'
                          ? 'Buteur sélectionné'
                          : pending.market === 'result_1x2'
                            ? '1N2 sélectionné'
                            : pending.market === 'exact_score'
                              ? 'Score exact sélectionné'
                              : 'Sélection'}
                    </div>
                    <div className={cn('truncate text-sm font-black', TF_TEXT_FG)}>{pending.label}</div>
                    <div className={cn('mt-0.5 text-xs font-semibold', TF_TEXT_MUTED)}>
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
                      variant="success"
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
                  <div>{notice.text}</div>
                  {notice.href ? (
                    <Link
                      to={notice.href}
                      className="mt-2 inline-block text-xs font-black text-emerald-700 underline-offset-2 hover:underline"
                    >
                      Voir mes paris →
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <div
                className={cn(
                  'sticky top-0 z-10 flex gap-1.5 border-b backdrop-blur',
                  sheetLight
                    ? 'border-slate-100 bg-white/95'
                    : 'border-[color:var(--tf-c30-border)] bg-[color:color-mix(in_srgb,var(--tf-c30-surface)_95%,transparent)]',
                  sheetDense ? '-mx-3 mt-3 px-3 py-1.5' : '-mx-4 mt-4 px-4 py-2 sm:-mx-5 sm:px-5',
                )}
              >
                <button
                  type="button"
                  onClick={() => scrollSheetToSection(x12SectionRef)}
                  className={cn(
                    'flex-1 rounded-xl border font-black uppercase tracking-wide transition',
                    sheetLight
                      ? 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100'
                      : 'border-sky-400/35 bg-sky-950/40 text-sky-100 hover:bg-sky-900/50',
                    sheetDense ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
                  )}
                >
                  1N2
                </button>
                {showExactScoreMarket ? (
                  <button
                    type="button"
                    onClick={() => scrollSheetToSection(exactScoreSectionRef)}
                    className={cn(
                      'flex-1 rounded-xl border font-black uppercase tracking-wide transition',
                      sheetLight
                        ? 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border-amber-400/35 bg-amber-950/35 text-amber-100 hover:bg-amber-900/45',
                      sheetDense ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
                    )}
                  >
                    Scores
                  </button>
                ) : null}
                {showScorerMarket ? (
                  <button
                    type="button"
                    onClick={() => scrollSheetToSection(scorersSectionRef)}
                    className={cn(
                      'flex-1 rounded-xl border font-black uppercase tracking-wide transition',
                      sheetLight
                        ? 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100'
                        : 'border-violet-400/35 bg-violet-950/40 text-violet-100 hover:bg-violet-900/50',
                      sheetDense ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
                    )}
                  >
                    Buteurs
                  </button>
                ) : null}
              </div>

              <div ref={x12SectionRef} className={cn(sheetDense ? 'mt-3' : 'mt-4')}>
                <BetSheetMarketCard
                  title={isLive ? 'Résultat du match (live)' : 'Résultat du match'}
                  subtitle="Temps réglementaire · 1N2"
                  dense={sheetDense}
                >
                  <BetSheet1x2Grid
                    homeLabel={match.home.name}
                    awayLabel={match.away.name}
                    odds={x12Ready && x12Displayed ? x12Displayed : null}
                    disabled={!x12Ready || !x12Displayed}
                    dense={sheetDense}
                    pickVisual={pickTeamVisual}
                    pendingSelection={
                      pending?.market === 'result_1x2'
                        ? (pending.selection as 'home' | 'draw' | 'away')
                        : null
                    }
                    onSelect={(side, oddsVal) => {
                      selectPendingPick({
                        market: 'result_1x2',
                        selection: side,
                        odds: oddsVal,
                        label:
                          side === 'draw'
                            ? '1N2 · Nul'
                            : `1N2 · ${side === 'home' ? match.home.name : match.away.name}`,
                      })
                    }}
                    betShares={bet1x2Shares}
                  />
                </BetSheetMarketCard>
              </div>

              {showExactScoreMarket ? (
                <div ref={exactScoreSectionRef} className={cn(sheetDense ? 'mt-3' : 'mt-4')}>
                  <BetSheetMarketCard
                    title={isLive ? 'Score exact (live)' : 'Score exact'}
                    subtitle={
                      exactScoreLiveClosed
                        ? 'Paris fermés après 80′'
                        : 'Temps réglementaire · cotes élevées'
                    }
                    dense={sheetDense}
                  >
                    <BetSheetExactScoreGrid
                      homeLabel={match.home.shortName}
                      awayLabel={match.away.shortName}
                      groups={exactScoreGroups}
                      enabled={
                        !isFinished &&
                        x12Ready &&
                        !(isLive && (bettingSuspended || exactScoreLiveClosed))
                      }
                      dense={sheetDense}
                      pickVisual={pickExactScoreVisual}
                      pendingSelection={
                        pending?.market === 'exact_score' ? pending.selection : null
                      }
                      onSelect={(p) => {
                        selectPendingPick({
                          market: 'exact_score',
                          selection: p.id,
                          odds: p.odds,
                          label: `Score exact · ${p.label}`,
                        })
                      }}
                    />
                  </BetSheetMarketCard>
                </div>
              ) : null}

              {markets.length > 0 ? (
                <div ref={scorersSectionRef} className={cn(sheetDense ? 'mt-3' : 'mt-4')}>
                  {markets.map((m) =>
                    m.scorerSides && m.scorerSides.length > 0 ? (
                      <BetSheetMarketCard
                        key={m.id}
                        title={m.label}
                        subtitle="Marque à tout moment"
                        dense={sheetDense}
                      >
                        <div
                          className={cn(
                            'overflow-y-auto overscroll-contain pr-0.5',
                            sheetDense
                              ? 'max-h-[min(52dvh,20rem)] sm:max-h-60'
                              : 'max-h-[min(60vh,28rem)] sm:max-h-72',
                          )}
                        >
                          <BetSheetScorerList
                            sides={m.scorerSides.map((side) => ({
                              ...side,
                              picks: side.picks.map((p) => ({
                                ...p,
                                scoredLive:
                                  p.disabled &&
                                  m.id === 'anytime_scorer' &&
                                  scorerBetsForSelection(p.id).length === 0,
                              })),
                            }))}
                            enabled={m.enabled}
                            dense={sheetDense}
                            pickVisual={pickScorerVisual}
                            pendingSelection={
                              pending?.market === 'anytime_scorer' ? pending.selection : null
                            }
                            onSelect={(p) => {
                              selectPendingPick({
                                market: m.id,
                                selection: p.id,
                                odds: p.odds,
                                label: `${m.label} • ${p.label}`,
                              })
                            }}
                          />
                        </div>
                      </BetSheetMarketCard>
                    ) : null,
                  )}
                </div>
              ) : null}

              <Link
                to="/profile"
                className={cn(
                  'mt-2 block pb-2 text-center text-xs font-bold underline-offset-2 hover:underline',
                  sheetLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-300 hover:text-sky-200',
                )}
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
