import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMatches } from '../contexts/MatchesContext'
import { useSportMonksFixtureLineups } from '../hooks/useSportMonksFixtureLineups'
import { useSportMonksRound1x2Odds } from '../hooks/useSportMonksRound1x2Odds'
import { useSportMonksFixtureLiveStats } from '../hooks/useSportMonksFixtureLiveStats'
import { BetWidget } from '../components/bet/BetWidget'
import { useBetting } from '../hooks/useBetting'
import { DressableCharacter } from '../components/profile/DressableCharacter'
import { defaultUserProfile } from '../data/userAppStateDefaults'
import { mergeCharacterLook } from '../data/characterPresets'
import { seedToLegoPalette } from '../utils/seedLegoPalette'
import { useAppearanceOptional } from '../contexts/AppearanceContext'
import { useLinearDisplayedLiveMinute } from '../hooks/useLinearDisplayedLiveMinute'
import { translateSportMonksLiveTextToFr } from '../utils/translateSportMonksLiveEnToFr'
import { useLiveMatchChatSync } from '../hooks/useLiveMatchChatSync'
import { useLiveMatchReactionsSync } from '../hooks/useLiveMatchReactionsSync'
import type { Message, ReactionType, MatchTribuneZone } from '../types/chat'
import type { Highlight } from '../data/highlights'
import { highlightFullscreenDedupeKey } from '../api/sportMonks'

type ChatMessageItem = {
  id: string
  userId: string
  username: string
  text: string
  time: string
  avatarSeed: string
  avatarAccent?: 'violet' | 'emerald' | 'rose' | 'amber'
  likes: number
  likedByMe?: boolean
  emoteId?: string
  matchTribune?: MatchTribuneZone
}

type PaidAnimation = {
  id: 'fumigene' | 'ola' | 'tifo-geant' | 'stroboscope'
  label: string
  cost: number
  emoji: string
}

type ActivePaidFx = {
  id: PaidAnimation['id']
  label: string
  tifoSide?: 'home' | 'away'
}

function Card({
  className = '',
  children,
  style,
}: {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <section
      className={`tf-live-card relative overflow-hidden rounded-xl border border-[#2d5f8a]/55 bg-[#0b2440] p-4 text-sky-50 shadow-[0_10px_28px_rgba(2,8,18,0.3),inset_0_1px_0_rgba(125,211,252,0.14)] ${className}`}
      style={style}
    >
      {children}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide text-sky-100">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#32d4ff] shadow-[0_0_8px_rgba(50,212,255,0.45)]" />
      {children}
    </h3>
  )
}

function TeamLogo({ label, logoUrl }: { label: string; logoUrl?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#d9e6f3] text-xs font-bold text-[#0a223a]">
      {logoUrl ? (
        <img src={logoUrl} alt={`Logo ${label}`} className="h-[78%] w-[78%] object-contain" loading="lazy" />
      ) : (
        label.slice(0, 3).toUpperCase()
      )}
    </div>
  )
}

function teamShortChip(label: string) {
  const cleaned = label.replace(/[^A-Za-z0-9 ]/g, ' ').trim()
  if (!cleaned) return '---'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}${parts[0][1] ?? ''}`.toUpperCase()
  }
  return parts[0].slice(0, 3).toUpperCase()
}

function fullscreenKindFromHighlight(h: Highlight): 'goal' | 'card' | 'var' | null {
  const t = String(h.type || '').toLowerCase()
  if (t.includes('but')) return 'goal'
  if (t.includes('carton')) return 'card'
  if (t.includes('var')) return 'var'
  return null
}

function compactPlayerLabel(name: string) {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Joueur'
  const parts = cleaned.split(' ')
  const last = parts[parts.length - 1] ?? cleaned
  const candidate = last.length >= 3 ? last : cleaned
  return candidate.slice(0, 10)
}

function cloudMessageToUi(m: Message): ChatMessageItem {
  const created = new Date(m.createdAt)
  const time = Number.isFinite(created.getTime())
    ? created.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  return {
    id: m.id,
    userId: m.userId,
    username: m.authorDisplayName?.trim() || 'Supporteur',
    text: m.text,
    time,
    avatarSeed: m.userId || m.authorDisplayName || m.id,
    avatarAccent: 'violet',
    likes: 0,
    emoteId: m.emoteId,
    matchTribune: m.matchTribune,
  }
}

function liveChatVisibleInTribune(msg: ChatMessageItem, zone: MatchTribuneZone): boolean {
  if (!msg.matchTribune) return zone === 'neutres' || zone === 'analystes'
  return msg.matchTribune === zone
}

function paidAnimationToReactionType(id: PaidAnimation['id']): ReactionType {
  if (id === 'fumigene') return 'flare'
  if (id === 'ola') return 'confetti'
  if (id === 'tifo-geant') return 'goal'
  return 'rage'
}

function reactionTypeToPaidFx(type: ReactionType): ActivePaidFx {
  if (type === 'flare') return { id: 'fumigene', label: 'Fumigène (pyro)' }
  if (type === 'confetti') return { id: 'ola', label: 'Ola du virage' }
  if (type === 'goal') return { id: 'tifo-geant', label: 'Tifo géant' }
  return { id: 'stroboscope', label: 'Stroboscope' }
}

function MatchRow({
  home,
  away,
  homeScore,
  awayScore,
}: {
  home: string
  away: string
  homeScore: number
  awayScore: number
}) {
  return (
    <div className="tf-live-soft-surface flex items-center justify-between rounded-lg bg-[#0a233d] px-3 py-2">
      <div className="flex items-center gap-2">
        <TeamLogo label={home} />
        <span className="text-sm font-semibold text-sky-50">{home}</span>
      </div>
      <span className="text-lg font-bold text-white">
        {homeScore} - {awayScore}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-sky-50">{away}</span>
        <TeamLogo label={away} />
      </div>
    </div>
  )
}

function ChatMessage({
  message,
  onToggleLike,
}: {
  message: ChatMessageItem
  onToggleLike: (id: string) => void
}) {
  const avatarProfile = useMemo(
    () => ({
      ...defaultUserProfile,
      characterLook: mergeCharacterLook({
        ...seedToLegoPalette(message.avatarSeed, message.avatarAccent ?? 'violet'),
        supporterTint: false,
      }),
    }),
    [message.avatarAccent, message.avatarSeed],
  )

  return (
    <article className="tf-chat-message flex items-start gap-2 rounded-lg bg-[#0a2239] p-1.5 transition hover:bg-[#0f2841]">
      <div className="relative h-6 w-6 shrink-0 overflow-visible">
        <div className="pointer-events-none absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.18]">
          <DressableCharacter profile={avatarProfile} variant="front" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <p className="truncate text-xs font-semibold text-sky-50">{message.username}</p>
            {message.matchTribune ? (
              <span className="shrink-0 rounded border border-white/15 bg-black/25 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-sky-200/90">
                {message.matchTribune === 'home-ultras'
                  ? 'Ultras'
                  : message.matchTribune === 'away-ultras'
                    ? 'Parcage'
                    : message.matchTribune === 'analystes'
                      ? 'Analyse'
                      : 'Neutre'}
              </span>
            ) : null}
          </div>
          <p className="shrink-0 text-[10px] text-sky-200/70">{message.time}</p>
        </div>
        <p className="mt-0.5 text-xs leading-tight text-sky-100">{message.text}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggleLike(message.id)}
        className={`tf-chat-like mt-0.5 inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-bold transition ${
          message.likedByMe
            ? 'border-rose-300/70 bg-rose-400/20 text-rose-100'
            : 'border-[#3a6690] bg-[#08223a] text-sky-100 hover:border-sky-300/70'
        }`}
        title="Like"
      >
        <span aria-hidden="true">{message.likedByMe ? '❤️' : '🤍'}</span>
        <span>{message.likes}</span>
      </button>
    </article>
  )
}

function PlayerBadge({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute max-w-[30%] truncate rounded-md border border-cyan-200/55 bg-[#062235]/92 px-1.5 py-1 text-[9px] font-bold leading-none text-sky-50 shadow-[0_4px_10px_rgba(0,0,0,0.35)] backdrop-blur-[1px] ${className ?? ''}`}
      style={style}
      title={name}
    >
      {compactPlayerLabel(name)}
    </div>
  )
}

export function ChannelPage() {
  const appearance = useAppearanceOptional()
  const isLight = appearance?.appearance === 'light'
  const navigate = useNavigate()
  const { matchId } = useParams()
  const { matches, loading } = useMatches()
  const routeMatch = useMemo(() => matches.find((m) => m.id === matchId) ?? null, [matches, matchId])
  const hasRouteMatchId = Boolean(matchId)
  const waitingRouteResolution = hasRouteMatchId && loading && !routeMatch
  const fallbackMatch = useMemo(
    () => matches.find((m) => m.status === 'live') ?? matches[0] ?? null,
    [matches],
  )
  const match = waitingRouteResolution ? null : routeMatch ?? fallbackMatch
  useEffect(() => {
    if (waitingRouteResolution || routeMatch || !fallbackMatch) return
    navigate(`/channel/${fallbackMatch.id}`, { replace: true })
  }, [waitingRouteResolution, routeMatch, fallbackMatch, navigate])

  const homeName = match?.home.name ?? match?.home.shortName ?? 'Paris SG'
  const awayName = match?.away.name ?? match?.away.shortName ?? 'Nantes'
  const homeFullName = match?.home.name ?? homeName
  const awayFullName = match?.away.name ?? awayName
  const initialHomeScore = match?.score?.home ?? 0
  const initialAwayScore = match?.score?.away ?? 0
  const [displayScore, setDisplayScore] = useState({ home: initialHomeScore, away: initialAwayScore })
  useEffect(() => {
    setDisplayScore({ home: initialHomeScore, away: initialAwayScore })
  }, [match?.id, initialHomeScore, initialAwayScore])
  const homeScore = displayScore.home
  const awayScore = displayScore.away
  const status = match?.status ?? 'upcoming'
  const isFinished = status === 'finished'
  const { starters } = useSportMonksFixtureLineups(match?.sportMonksFixtureId)
  const betting = useBetting(match?.id ?? 'channel-demo-match')
  const { odds1x2, oddsOverUnder25, oddsLoading } = useSportMonksRound1x2Odds(
    match?.sportMonksFixtureId,
    match?.sportMonksRoundId,
    status,
  )
  const hasAnyLineup = (starters?.home?.length ?? 0) > 0 || (starters?.away?.length ?? 0) > 0
  const oddsReady = Boolean(
    odds1x2 && odds1x2.home >= 1.01 && odds1x2.draw >= 1.01 && odds1x2.away >= 1.01,
  )
  const { liveStatRows, smTimelineHighlights } = useSportMonksFixtureLiveStats(
    match?.sportMonksFixtureId,
    status,
    match?.id,
  )
  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'live' && m.id !== match?.id),
    [matches, match?.id],
  )
  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState<string>('')
  useEffect(() => {
    if (!liveMatches.length) {
      setSelectedLiveMatchId('')
      return
    }
    setSelectedLiveMatchId((prev) =>
      liveMatches.some((m) => m.id === prev) ? prev : liveMatches[0].id,
    )
  }, [liveMatches])
  const selectedLiveMatch = useMemo(
    () => liveMatches.find((m) => m.id === selectedLiveMatchId) ?? null,
    [liveMatches, selectedLiveMatchId],
  )

  const liveDisplayedMinute = useLinearDisplayedLiveMinute(match)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const timerText = useMemo(() => {
    const kickoffTs = match?.kickoffAt ? new Date(match.kickoffAt).getTime() : null
    if (status === 'upcoming' && kickoffTs != null) {
      const remaining = Math.max(0, kickoffTs - nowMs)
      const totalSec = Math.floor(remaining / 1000)
      const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0')
      const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
      const ss = String(totalSec % 60).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }
    if (status === 'live') {
      if (match?.liveClockPaused) return 'Mi-temps'
      return `${Math.max(0, liveDisplayedMinute)}'`
    }
    return 'Terminé'
  }, [match?.kickoffAt, nowMs, status, liveDisplayedMinute, match?.liveClockPaused])
  const liveTickSec = Math.floor(nowMs / 1000)
  const kickoffMs = useMemo(
    () => (match?.kickoffAt ? new Date(match.kickoffAt).getTime() : null),
    [match?.kickoffAt],
  )
  const chatOpenAtMs = kickoffMs != null ? kickoffMs - 5 * 60 * 1000 : null
  const chatLocked = status === 'upcoming' && chatOpenAtMs != null && nowMs < chatOpenAtMs
  const chatCountdownText = useMemo(() => {
    if (!chatLocked || chatOpenAtMs == null) return null
    const remainingMs = Math.max(0, chatOpenAtMs - nowMs)
    const totalSec = Math.floor(remainingMs / 1000)
    if (totalSec >= 3600) {
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      if (days > 0) return `${days}j ${hours}h ${mins}min`
      return `${hours}h ${mins}min`
    }
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const ss = String(totalSec % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [chatLocked, chatOpenAtMs, nowMs])

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([])
  const [draft, setDraft] = useState('')
  const [selectedTribune, setSelectedTribune] = useState<MatchTribuneZone>('home-ultras')
  const [tifoCheerSide, setTifoCheerSide] = useState<'home' | 'away'>('home')
  const [tribuneModalOpen, setTribuneModalOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'match' | 'paris' | 'tribune' | null>(null)
  const [mobileMatchTab, setMobileMatchTab] = useState<'stats' | 'infos' | 'compo'>('stats')
  const [animationsOpen, setAnimationsOpen] = useState(false)
  const [animationNotice, setAnimationNotice] = useState<string | null>(null)
  const [activePaidFx, setActivePaidFx] = useState<ActivePaidFx | null>(null)
  const [livePanelOpen, setLivePanelOpen] = useState(false)
  const [liveMicEnabled, setLiveMicEnabled] = useState(true)
  const [liveCamEnabled, setLiveCamEnabled] = useState(false)
  const [liveBroadcastActive, setLiveBroadcastActive] = useState(false)
  const { publishMessage, isCloudChatConfigured } = useLiveMatchChatSync({
    matchId: match?.id ?? '',
    enabled: Boolean(match?.id),
    onRemoteMessages: (msgs) => {
      setChatMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]))
        for (const m of msgs) {
          const mapped = cloudMessageToUi(m)
          if (!byId.has(mapped.id)) byId.set(mapped.id, mapped)
        }
        return Array.from(byId.values())
      })
    },
  })
  const filteredChatMessages = useMemo(
    () => chatMessages.filter((m) => liveChatVisibleInTribune(m, selectedTribune)),
    [chatMessages, selectedTribune],
  )
  const { publishReaction } = useLiveMatchReactionsSync({
    matchId: match?.id ?? '',
    enabled: Boolean(match?.id),
    onHydrate: (events) => {
      const last = events[events.length - 1]
      if (!last) return
      setActivePaidFx(reactionTypeToPaidFx(last.type))
    },
    onLiveInsert: (event) => {
      setActivePaidFx(reactionTypeToPaidFx(event.type))
    },
  })
  const chatBottomRef = useRef<HTMLDivElement | null>(null)
  const pageScrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [filteredChatMessages.length])
  useEffect(() => {
    pageScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [match?.id, status])
  useEffect(() => {
    setChatMessages([])
  }, [match?.id])
  useEffect(() => {
    if (!activePaidFx) return
    const timeout = window.setTimeout(() => setActivePaidFx(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [activePaidFx])
  useEffect(() => {
    const latestFxMessage = [...chatMessages]
      .reverse()
      .find((m) => typeof m.emoteId === 'string' && m.emoteId.startsWith('fx:'))
    if (!latestFxMessage?.emoteId) return
    const fxIdRaw = latestFxMessage.emoteId.slice(3)
    if (
      fxIdRaw !== 'fumigene' &&
      fxIdRaw !== 'ola' &&
      fxIdRaw !== 'tifo-geant' &&
      fxIdRaw !== 'stroboscope'
    ) {
      return
    }
    const fxId: PaidAnimation['id'] = fxIdRaw
    const labelById: Record<string, string> = {
      fumigene: 'Fumigène (pyro)',
      ola: 'Ola du virage',
      'tifo-geant': 'Tifo géant',
      stroboscope: 'Stroboscope',
    }
    setActivePaidFx({ id: fxId, label: labelById[fxId] ?? fxId, ...(fxId === 'tifo-geant' ? { tifoSide: 'home' as const } : {}) })
  }, [chatMessages])

  const onSend = async (e: FormEvent) => {
    e.preventDefault()
    if (isFinished) return
    if (chatLocked) return
    if (!match?.id) return
    const text = draft.trim()
    if (!text) return
    const res = await publishMessage({ matchId: match.id, text, matchTribune: selectedTribune })
    if (!res.ok) {
      setAnimationNotice("Impossible d'envoyer le message (sync cloud indisponible).")
      window.setTimeout(() => setAnimationNotice(null), 1800)
      return
    }
    setDraft('')
  }
  const onToggleLikeMessage = (id: string) => {
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const liked = Boolean(m.likedByMe)
        return {
          ...m,
          likedByMe: !liked,
          likes: Math.max(0, (m.likes ?? 0) + (liked ? -1 : 1)),
        }
      }),
    )
  }

  const latestHighlight = useMemo(
    () => (smTimelineHighlights.length ? smTimelineHighlights[smTimelineHighlights.length - 1] : null),
    [smTimelineHighlights],
  )
  const latestHighlightText = useMemo(() => {
    const raw = latestHighlight?.title || latestHighlight?.detail || ''
    return translateSportMonksLiveTextToFr(raw)
  }, [latestHighlight])
  const [fullscreenEvent, setFullscreenEvent] = useState<{
    kind: 'goal' | 'card' | 'var' | 'kickoff'
    title: string
    subtitle?: string
    side?: 'home' | 'away'
  } | null>(null)
  const channelLiveMatchIdRef = useRef<string | undefined>(undefined)
  const fullscreenDedupePrimedRef = useRef(false)
  const fullscreenDedupeKeysRef = useRef<Set<string>>(new Set())
  const infoHighlightPrimedRef = useRef(false)
  const infoHighlightIdsRef = useRef<Set<string>>(new Set())
  const infoToastTimeoutRef = useRef<number | null>(null)

  const detectHighlightSide = useCallback(
    (raw: string): 'home' | 'away' | undefined => {
      const s = raw.toLowerCase()
      const homeTokens = [match?.home.name, match?.home.shortName, homeName]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
      const awayTokens = [match?.away.name, match?.away.shortName, awayName]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
      if (homeTokens.some((t) => t.length >= 2 && s.includes(t))) return 'home'
      if (awayTokens.some((t) => t.length >= 2 && s.includes(t))) return 'away'
      return undefined
    },
    [match?.home.name, match?.home.shortName, match?.away.name, match?.away.shortName, homeName, awayName],
  )

  const launchFullscreenEvent = useCallback(
    (
      kind: 'goal' | 'card' | 'var' | 'kickoff',
      title: string,
      subtitle?: string,
      durationMs = 3200,
      side?: 'home' | 'away',
    ) => {
      setFullscreenEvent({ kind, title, subtitle, side })
      window.setTimeout(() => setFullscreenEvent(null), durationMs)
    },
    [],
  )
  const kickoffFxMatchIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!match?.id) return
    if (status !== 'live') return
    if (kickoffFxMatchIdRef.current === match.id) return
    kickoffFxMatchIdRef.current = match.id
    launchFullscreenEvent('kickoff', 'COUP D’ENVOI', `${homeName} vs ${awayName}`, 4200)
  }, [status, match?.id, homeName, awayName, launchFullscreenEvent])

  useEffect(() => {
    if (channelLiveMatchIdRef.current !== match?.id) {
      channelLiveMatchIdRef.current = match?.id
      fullscreenDedupePrimedRef.current = false
      fullscreenDedupeKeysRef.current = new Set()
      infoHighlightPrimedRef.current = false
      infoHighlightIdsRef.current = new Set()
    }
    if (status !== 'live' || !smTimelineHighlights.length) return

    if (!fullscreenDedupePrimedRef.current) {
      for (const h of smTimelineHighlights) {
        const kind = fullscreenKindFromHighlight(h)
        if (!kind) continue
        fullscreenDedupeKeysRef.current.add(highlightFullscreenDedupeKey(h))
      }
      fullscreenDedupePrimedRef.current = true
      return
    }

    for (const h of smTimelineHighlights) {
      const kind = fullscreenKindFromHighlight(h)
      if (!kind) continue
      const key = highlightFullscreenDedupeKey(h)
      if (fullscreenDedupeKeysRef.current.has(key)) continue
      fullscreenDedupeKeysRef.current.add(key)
      const raw = `${h.title ?? ''} ${h.detail ?? ''}`
      const side = detectHighlightSide(raw)
      const teamLabel = side === 'home' ? homeName : side === 'away' ? awayName : ''
      const hlText = translateSportMonksLiveTextToFr(String(h.title || h.detail || '').trim())

      if (kind === 'goal') {
        launchFullscreenEvent(
          'goal',
          'BUT',
          `${h.minute}' · But${teamLabel ? ` · ${teamLabel}` : ''}`,
          6200,
          side,
        )
      } else if (kind === 'card') {
        launchFullscreenEvent(
          'card',
          'CARTON',
          `${h.minute}' · Carton${teamLabel ? ` · ${teamLabel}` : ''}`,
          4600,
          side,
        )
      } else {
        launchFullscreenEvent('var', 'VAR', `${h.minute}' ${hlText}`, 5200)
      }
      break
    }
  }, [
    smTimelineHighlights,
    status,
    match?.id,
    launchFullscreenEvent,
    detectHighlightSide,
    homeName,
    awayName,
  ])

  /** Moments forts API (hors but/carton/VAR) → micro-signal visuel lisible sans envahir l’écran. */
  useEffect(() => {
    if (!match?.id || status !== 'live' || smTimelineHighlights.length === 0) return

    if (!infoHighlightPrimedRef.current) {
      for (const h of smTimelineHighlights) infoHighlightIdsRef.current.add(h.id)
      infoHighlightPrimedRef.current = true
      return
    }

    const unseen = smTimelineHighlights.filter((h) => !infoHighlightIdsRef.current.has(h.id))
    if (unseen.length === 0) return
    for (const h of unseen) infoHighlightIdsRef.current.add(h.id)

    const latest = unseen[unseen.length - 1]
    const t = String(latest.type || '').toLowerCase()
    if (t.includes('but') || t.includes('carton') || t.includes('var')) return

    const raw = String(latest.title || latest.detail || '').trim()
    const translated = translateSportMonksLiveTextToFr(raw)
    const compact = translated.length > 92 ? `${translated.slice(0, 89)}…` : translated
    const side = detectHighlightSide(`${latest.title ?? ''} ${latest.detail ?? ''}`)
    const teamLabel = side === 'home' ? homeName : side === 'away' ? awayName : ''
    const label =
      t.includes('arrêt') || t.includes('arret') || t.includes('save')
        ? '🧤 Arrêt'
        : t.includes('occasion') || t.includes('shot') || t.includes('chance')
          ? '⚡ Occasion'
          : t.includes('penalty')
            ? '🎯 Penalty'
            : t.includes('hors') || t.includes('offside')
              ? '🚫 Hors-jeu'
              : '📣 Live'

    setAnimationNotice(
      `${label}${latest.minute ? ` ${latest.minute}'` : ''}${teamLabel ? ` · ${teamLabel}` : ''}${compact ? ` — ${compact}` : ''}`,
    )
    if (infoToastTimeoutRef.current != null) window.clearTimeout(infoToastTimeoutRef.current)
    infoToastTimeoutRef.current = window.setTimeout(() => setAnimationNotice(null), 3600)
  }, [smTimelineHighlights, status, match?.id, detectHighlightSide, homeName, awayName])

  useEffect(
    () => () => {
      if (infoToastTimeoutRef.current != null) window.clearTimeout(infoToastTimeoutRef.current)
    },
    [],
  )

  const kickoffLabel = match?.kickoffAt
    ? new Date(match.kickoffAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '21:00'
  const homeLineupNames = useMemo(() => {
    const home = starters?.home?.slice(0, 11) ?? []
    return home.map((p) => (typeof p === 'string' ? p : p.label))
  }, [starters])
  const awayLineupNames = useMemo(() => {
    const away = starters?.away?.slice(0, 11) ?? []
    return away.map((p) => (typeof p === 'string' ? p : p.label))
  }, [starters])
  const [lineupSide, setLineupSide] = useState<'home' | 'away'>('home')
  const displayedLineupPlayers = useMemo(
    () => (lineupSide === 'home' ? starters?.home ?? [] : starters?.away ?? []),
    [lineupSide, starters],
  )
  const displayedLineupBadges = useMemo(() => {
    const fallback = [
      { left: 50, top: 18 },
      { left: 23, top: 50 },
      { left: 77, top: 50 },
      { left: 20, top: 92 },
      { left: 50, top: 86 },
      { left: 80, top: 92 },
      { left: 13, top: 136 },
      { left: 36, top: 144 },
      { left: 64, top: 144 },
      { left: 87, top: 136 },
      { left: 50, top: 232 },
    ]

    const parsed = displayedLineupPlayers
      .slice(0, 11)
      .map((p, index) => {
        if (typeof p === 'string') return { name: p, index }
        const ff = p.formationField
        if (!ff) return { name: p.label, index, formationPosition: p.formationPosition }
        const [rowRaw, colRaw] = ff.split(':').map((x) => Number(x.trim()))
        const row = Number.isFinite(rowRaw) ? rowRaw : null
        const col = Number.isFinite(colRaw) ? colRaw : null
        return { name: p.label, index, row, col, formationPosition: p.formationPosition }
      })
      .filter((p) => p.name.trim().length > 0)

    const positioned = parsed.filter((p) => p.row != null && p.col != null)
    if (positioned.length < 7) {
      return parsed.map((p, i) => ({
        name: p.name,
        left: fallback[i]?.left ?? 50,
        top: fallback[i]?.top ?? 120,
      }))
    }

    const rows = [...new Set(positioned.map((p) => p.row as number))].sort((a, b) => a - b)
    const gk = positioned.find((p) => p.formationPosition === 1)
    const invert = gk ? (gk.row as number) <= Math.min(...rows) : true
    const rowIndexByValue = new Map(rows.map((v, i) => [v, i] as const))
    const rowCount = Math.max(1, rows.length - 1)

    return parsed.map((p, i) => {
      if (p.row == null || p.col == null) {
        return { name: p.name, left: fallback[i]?.left ?? 50, top: fallback[i]?.top ?? 120 }
      }
      const rowPlayers = positioned.filter((x) => x.row === p.row).sort((a, b) => (a.col as number) - (b.col as number))
      const slot = Math.max(0, rowPlayers.findIndex((x) => x === p))
      const rowSlots = Math.max(1, rowPlayers.length - 1)
      const x = rowPlayers.length === 1 ? 50 : 12 + (slot / rowSlots) * 76
      const rowIdx = rowIndexByValue.get(p.row) ?? 0
      const normalized = rowIdx / rowCount
      const y = invert ? 86 - normalized * 74 : 12 + normalized * 74
      return { name: p.name, left: x, top: y }
    })
  }, [displayedLineupPlayers])
  const lineupAutoTimerRef = useRef<number | null>(null)
  const lineupAutoPausedUntilRef = useRef<number>(0)
  const pauseLineupAutoFor3Min = () => {
    lineupAutoPausedUntilRef.current = Date.now() + 3 * 60 * 1000
  }
  useEffect(() => {
    if (!homeLineupNames.length || !awayLineupNames.length) return
    const scheduleNext = () => {
      lineupAutoTimerRef.current = window.setTimeout(() => {
        if (lineupAutoPausedUntilRef.current > Date.now()) {
          scheduleNext()
          return
        }
        setLineupSide((prev) => (prev === 'home' ? 'away' : 'home'))
        scheduleNext()
      }, 10000)
    }
    scheduleNext()
    return () => {
      if (lineupAutoTimerRef.current != null) {
        window.clearTimeout(lineupAutoTimerRef.current)
        lineupAutoTimerRef.current = null
      }
    }
  }, [homeLineupNames.length, awayLineupNames.length])
  const homeColor = match?.home.colors.primary ?? '#2f8fff'
  const awayColor = match?.away.colors.primary ?? '#ff3b3b'
  const homeSecondaryColor = match?.home.colors.secondary ?? homeColor
  const awaySecondaryColor = match?.away.colors.secondary ?? awayColor
  const homeToneColor = `color-mix(in srgb, ${homeColor} 72%, ${homeSecondaryColor} 28%)`
  const awayToneColor = `color-mix(in srgb, ${awayColor} 72%, ${awaySecondaryColor} 28%)`
  const fullscreenAccentColor =
    fullscreenEvent?.side === 'home'
      ? homeColor
      : fullscreenEvent?.side === 'away'
        ? awayColor
        : null
  const ballX = 50 + Math.sin(liveTickSec / 3.2) * 36
  const ballY = 50 + Math.cos(liveTickSec / 2.4) * 30
  const homePlayers = [
    [12, 50],
    [24, 18],
    [24, 38],
    [24, 62],
    [24, 82],
    [38, 24],
    [38, 44],
    [38, 58],
    [38, 78],
    [50, 35],
    [50, 65],
  ] as const
  const awayPlayers = [
    [88, 50],
    [76, 18],
    [76, 38],
    [76, 62],
    [76, 82],
    [62, 24],
    [62, 44],
    [62, 58],
    [62, 78],
    [50, 30],
    [50, 70],
  ] as const
  const tribuneOptions = useMemo(
    () => [
      { id: 'home-ultras' as const, label: `Ultras ${homeName}`, vibe: 'Chants et ambiance chaude' },
      { id: 'away-ultras' as const, label: `Parcage ${awayName}`, vibe: 'Bloc visiteurs' },
      { id: 'analystes' as const, label: 'Analystes', vibe: 'Debat tactique en direct' },
      { id: 'neutres' as const, label: 'Neutres', vibe: 'Discussion chill' },
    ],
    [homeName, awayName],
  )
  const tacticalRows = useMemo(() => {
    const pick = (keys: string[]) => liveStatRows.find((r) => keys.includes(r.key))
    const dangerous = pick(['dangerous_attacks'])
    const shotsOnTarget = pick(['shots_on_target', 'shotsontarget'])
    const shotsTotal = pick(['shots_total', 'shots'])
    const corners = pick(['corners'])
    const fouls = pick(['fouls'])
    const offsides = pick(['offsides'])
    const yellow = pick(['yellowcards', 'yellow_cards'])
    const red = pick(['redcards', 'red_cards'])
    const saves = pick(['saves'])
    const possession = pick(['ball_possession', 'possession'])
    return [
      dangerous ? { label: 'Att. dangereuses', home: dangerous.home, away: dangerous.away } : null,
      shotsOnTarget ? { label: 'Tirs cadres', home: shotsOnTarget.home, away: shotsOnTarget.away } : null,
      shotsTotal ? { label: 'Tirs', home: shotsTotal.home, away: shotsTotal.away } : null,
      corners ? { label: 'Corners', home: corners.home, away: corners.away } : null,
      fouls ? { label: 'Coups francs', home: fouls.home, away: fouls.away } : null,
      offsides ? { label: 'Hors-jeu', home: offsides.home, away: offsides.away } : null,
      yellow ? { label: 'Cartons jaunes', home: yellow.home, away: yellow.away } : null,
      red ? { label: 'Cartons rouges', home: red.home, away: red.away } : null,
      saves ? { label: 'Arrets', home: saves.home, away: saves.away } : null,
      possession ? { label: 'Possession %', home: possession.home, away: possession.away } : null,
    ].filter(Boolean) as Array<{ label: string; home: number; away: number }>
  }, [liveStatRows])
  const dangerousRow = useMemo(
    () => liveStatRows.find((r) => r.key === 'dangerous_attacks') ?? null,
    [liveStatRows],
  )
  const dangerousDelta = (dangerousRow?.home ?? 0) - (dangerousRow?.away ?? 0)
  const dangerousLeader = dangerousDelta === 0 ? 'equal' : dangerousDelta > 0 ? 'home' : 'away'
  const tacticalPreview = useMemo(() => tacticalRows.slice(0, 4), [tacticalRows])
  const paidAnimations = useMemo<PaidAnimation[]>(
    () => [
      { id: 'fumigene', label: 'Fumigène rouge', cost: 20, emoji: '💨' },
      { id: 'ola', label: 'Ola du virage', cost: 12, emoji: '👏' },
      { id: 'tifo-geant', label: 'Tifo géant', cost: 35, emoji: '🏴' },
      { id: 'stroboscope', label: 'Stroboscope', cost: 18, emoji: '⚡' },
    ],
    [],
  )
  const fxActiveCount = activePaidFx ? 1 : 0
  const viewersDisplay = 'N/D'

  const triggerPaidAnimation = async (anim: PaidAnimation) => {
    const res = betting.spendTokens(anim.cost, `chat_animation:${anim.id}`)
    if (!res.ok) {
      setAnimationNotice('Pas assez de jetons pour lancer cette animation.')
      window.setTimeout(() => setAnimationNotice(null), 1800)
      return
    }
    if (match?.id) {
      const sent = await publishReaction(paidAnimationToReactionType(anim.id))
      if (!sent.ok) {
        setAnimationNotice('Animation non synchronisée (cloud indisponible).')
        window.setTimeout(() => setAnimationNotice(null), 1800)
      }
    }
    window.setTimeout(() => {
      setActivePaidFx({
        id: anim.id,
        label: anim.label,
        ...(anim.id === 'tifo-geant' ? { tifoSide: tifoCheerSide } : {}),
      })
    }, 80)
    setAnimationsOpen(false)
    setAnimationNotice(`${anim.emoji} ${anim.label} activee`)
    window.setTimeout(() => setAnimationNotice(null), 1600)
  }

  const startLiveBroadcast = async () => {
    if (match?.id) {
      await publishMessage({
        matchId: match.id,
        text: `🔴 Live lancé (${liveMicEnabled ? 'micro ON' : 'micro OFF'} · ${liveCamEnabled ? 'camera ON' : 'camera OFF'})`,
        matchTribune: selectedTribune,
      })
    }
    setLiveBroadcastActive(true)
    setAnimationNotice(`Live demarre (${liveMicEnabled ? 'micro ON' : 'micro OFF'} · ${liveCamEnabled ? 'cam ON' : 'cam OFF'})`)
    window.setTimeout(() => setAnimationNotice(null), 1800)
    setLivePanelOpen(false)
  }

  if (waitingRouteResolution) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#03172a] p-4">
        <div className="rounded-xl border border-[#2f5f8f] bg-[#0b2440] px-4 py-3 text-center text-sm font-semibold text-sky-100">
          Chargement du live…
        </div>
      </div>
    )
  }

  return (
    <div
      ref={pageScrollRef}
      className={`tf-channel-live relative flex h-full w-full flex-col overflow-y-auto bg-[#03172a] p-3 pb-24 md:pb-4 lg:p-4 ${
        isLight ? 'tf-channel-live-light' : ''
      }`}
      style={
        {
          '--tf-home-color': homeToneColor,
          '--tf-away-color': awayToneColor,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-28"
        style={{
          background: `radial-gradient(55% 90% at 18% 0%, color-mix(in srgb, ${homeToneColor} 34%, transparent), transparent 72%), radial-gradient(52% 88% at 82% 0%, color-mix(in srgb, ${awayToneColor} 30%, transparent), transparent 74%)`,
        }}
      />
      <div className="pointer-events-none absolute left-4 top-3 z-0 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: `color-mix(in srgb, ${homeToneColor} 28%, transparent)` }} />
      <div className="pointer-events-none absolute right-6 top-4 z-0 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: `color-mix(in srgb, ${awayToneColor} 28%, transparent)` }} />
      <header
        className={`relative z-10 overflow-hidden rounded-xl border p-3 shadow-[0_14px_30px_rgba(2,8,18,0.33),inset_0_1px_0_rgba(125,211,252,0.16)] ${
          isLight ? 'border-[#8fb2d3] bg-[#f6fbff]' : 'border-[#2f5f8f] bg-[#0b2440]'
        }`}
        style={
          status === 'live'
            ? {
                boxShadow: `0 0 0 1px ${homeColor}44, 0 0 24px ${awayColor}30`,
                background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 22%, #0b2440) 0%, #0b2440 42%, color-mix(in srgb, ${awayToneColor} 20%, #0b2440) 100%)`,
              }
            : {
                background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 20%, #0b2440) 0%, #0b2440 40%, color-mix(in srgb, ${awayToneColor} 18%, #0b2440) 100%)`,
              }
        }
      >
        {status === 'live' ? (
          <div className="pointer-events-none absolute inset-0 rounded-xl border border-rose-400/80 animate-pulse" />
        ) : null}
        {status === 'live' ? (
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#0a1a2d]">
            <div
              className="h-full w-full tf-hype-glow"
              style={{ background: `linear-gradient(90deg, ${homeColor}, ${awayColor})` }}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2 md:hidden">
          <div className="flex justify-center">
            <p className="text-3xl font-bold tabular-nums text-white">
              {homeScore} - {awayScore}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo label={homeName} logoUrl={match?.home.logoUrl} />
              <p className="min-w-0 truncate text-sm font-semibold leading-tight text-white">{homeName}</p>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2 text-right">
              <p className="min-w-0 truncate text-sm font-semibold leading-tight text-white">{awayName}</p>
              <TeamLogo label={awayName} logoUrl={match?.away.logoUrl} />
            </div>
          </div>
          <p className="text-center text-sm text-sky-200/80">
            {status === 'live' ? (
              <span className="inline-flex items-center justify-center gap-1">
                <span className="tf-live-badge-dot inline-block h-2 w-2 rounded-full bg-rose-400" />
                {timerText}
              </span>
            ) : (
              timerText
            )}
          </p>
        </div>
        <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4 md:grid">
          <div className="flex min-w-0 items-center gap-3 justify-self-start">
            <TeamLogo label={homeName} logoUrl={match?.home.logoUrl} />
            <p className="truncate text-lg font-semibold text-white">{homeName}</p>
          </div>
          <div className="flex flex-col items-center justify-self-center text-center">
            <p className="text-3xl font-bold text-white">
              {homeScore} - {awayScore}
            </p>
            <p className="text-sm text-sky-200/80">
              {status === 'live' ? (
                <span className="inline-flex items-center gap-1">
                  <span className="tf-live-badge-dot inline-block h-2 w-2 rounded-full bg-rose-400" />
                  {timerText}
                </span>
              ) : (
                timerText
              )}
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3 justify-self-end">
            <p className="truncate text-right text-lg font-semibold text-white">{awayName}</p>
            <TeamLogo label={awayName} logoUrl={match?.away.logoUrl} />
          </div>
        </div>
        {status === 'upcoming' ? (
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-[#3a6690]/55 bg-[#0a2238]/70 p-2.5">
            <div
              className="rounded-md px-2 py-2 text-center"
              style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${homeToneColor} 34%, transparent), transparent)` }}
            >
              <p className="text-[10px] font-black uppercase tracking-wide text-sky-200/80">Domicile</p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-sky-50">{homeFullName}</p>
            </div>
            <div className="rounded-md border border-sky-300/35 bg-[#102f4d]/75 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-sky-100">
              VS
            </div>
            <div
              className="rounded-md px-2 py-2 text-center"
              style={{ background: `linear-gradient(225deg, color-mix(in srgb, ${awayToneColor} 34%, transparent), transparent)` }}
            >
              <p className="text-[10px] font-black uppercase tracking-wide text-sky-200/80">Extérieur</p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-sky-50">{awayFullName}</p>
            </div>
          </div>
        ) : null}
      </header>

      <main
        className={`relative z-10 mt-2 grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[0.5fr_2.5fr_0.5fr] md:items-stretch ${
          status === 'upcoming' ? 'gap-1.5' : 'gap-2'
        }`}
      >
        <div className="tf-live-col hidden min-w-0 space-y-1.5 rounded-xl border border-[#2b5d87]/35 bg-[#071c31]/90 p-1.5 shadow-[0_12px_24px_rgba(2,8,18,0.26),inset_0_1px_0_rgba(255,255,255,0.05)] md:flex md:h-full md:flex-col">
          <Card className="tf-card-prematch !p-3">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Avant-match</SectionTitle>
              <button className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0a223a] transition hover:bg-gray-100">
                {status === 'live' ? 'En direct' : `Coup d’envoi ${kickoffLabel}`}
              </button>
            </div>
            <div className="mt-1.5 space-y-1">
              {status === 'live' && liveStatRows.length > 0 ? (
                liveStatRows.slice(0, 3).map((row) => (
                  <div
                    key={`prematch-live-${row.key}`}
                    className="tf-live-soft-surface flex items-center justify-between rounded-lg bg-[#0a1f35]/70 px-2 py-1.5 text-xs"
                  >
                    <span className="font-bold text-white">{row.home}</span>
                    <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-sky-200/80">
                      {row.label}
                    </span>
                    <span className="font-bold text-white">{row.away}</span>
                  </div>
                ))
              ) : status === 'upcoming' ? (
                <div className="grid grid-cols-1 gap-1">
                  <div className="tf-live-soft-surface rounded-lg bg-[#0a1f35]/70 px-2 py-1.5 text-[11px]">
                    <span className="text-sky-200/75">Ouverture tchat: </span>
                    <span className="font-bold text-white">{chatLocked ? `dans ${chatCountdownText}` : 'ouverte'}</span>
                  </div>
                  <div className="tf-live-soft-surface rounded-lg bg-[#0a1f35]/70 px-2 py-1.5 text-[11px]">
                    <span className="text-sky-200/75">Cotes 1N2: </span>
                    <span className="font-bold text-white">
                      {oddsReady ? 'disponibles' : oddsLoading ? 'chargement' : 'ouverture imminente'}
                    </span>
                  </div>
                  <div className="tf-live-soft-surface rounded-lg bg-[#0a1f35]/70 px-2 py-1.5 text-[11px]">
                    <span className="text-sky-200/75">Compositions: </span>
                    <span className="font-bold text-white">{hasAnyLineup ? 'publiées' : 'en attente'}</span>
                  </div>
                </div>
              ) : (
                <div className="tf-live-soft-surface rounded-lg bg-[#0a1f35]/70 px-2 py-2 text-center text-[11px] font-semibold text-sky-100/85">
                  Aucune stat exploitable pour le moment.
                </div>
              )}
            </div>
          </Card>

          <Card className="tf-card-info !p-3 border border-[#3d78aa]/55 bg-[#10263f]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <SectionTitle>Infos générales</SectionTitle>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <div className="tf-live-soft-surface rounded-lg bg-[#11263d] px-2 py-1.5">
                <p className="text-[10px] leading-none text-sky-200/80">Compétition</p>
                <p className="mt-1 truncate text-[12px] font-extrabold leading-tight text-white">
                  {match?.competition.shortName ?? match?.competition.name ?? 'Ligue 1'}
                </p>
              </div>
              <div className="tf-live-soft-surface rounded-lg bg-[#11263d] px-2 py-1.5">
                <p className="text-[10px] leading-none text-sky-200/80">Coup d’envoi</p>
                <p className="mt-1 text-[12px] font-extrabold leading-tight text-white">{kickoffLabel}</p>
              </div>
              <div className="tf-live-soft-surface rounded-lg bg-[#11263d] px-2 py-1.5">
                <p className="text-[10px] leading-none text-sky-200/80">Statut</p>
                <p className="mt-1 text-[12px] font-extrabold leading-tight text-white">
                  {status === 'live' ? 'Live' : status === 'finished' ? 'Terminé' : 'À venir'}
                </p>
              </div>
              <div className="tf-live-soft-surface rounded-lg bg-[#11263d] px-2 py-1.5">
                <p className="text-[10px] leading-none text-sky-200/80">Minute</p>
                <p className="mt-1 text-[12px] font-extrabold leading-tight text-white">
                  {status === 'live' ? `${liveDisplayedMinute}'` : '—'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="tf-card-community !p-3 border border-[#5f4be2]/45 bg-[#14253c]">
            <SectionTitle>En direct · Matchs</SectionTitle>
            {liveMatches.length > 1 ? (
              <div className="mt-2">
                <select
                  value={selectedLiveMatchId}
                  onChange={(e) => setSelectedLiveMatchId(e.target.value)}
                  className="w-full rounded-lg border border-[#2a5a84] bg-[#0a1f35] px-2 py-1.5 text-xs font-semibold text-sky-50 outline-none focus:border-[#4f7ea8]"
                >
                  {liveMatches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.home.shortName} vs {m.away.shortName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="mt-1.5">
              {selectedLiveMatch ? (
                <MatchRow
                  home={selectedLiveMatch.home.shortName}
                  away={selectedLiveMatch.away.shortName}
                  homeScore={selectedLiveMatch.score?.home ?? 0}
                  awayScore={selectedLiveMatch.score?.away ?? 0}
                />
              ) : (
                <div className="tf-live-soft-surface rounded-lg bg-[#0a1f35]/70 px-2 py-2 text-center text-[11px] font-semibold text-sky-100/85">
                  Aucun autre match en direct
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedLiveMatch) navigate(`/channel/${selectedLiveMatch.id}`)
              }}
              disabled={!selectedLiveMatch}
              className="mt-1.5 w-full rounded-lg border border-[#2a5a84] bg-white px-3 py-1 text-[11px] font-bold text-[#0a223a] transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rejoindre le live
            </button>
          </Card>

          <Card className="tf-card-tribune !p-3 md:flex md:flex-1 md:flex-col">
            <SectionTitle>Tribune supporters</SectionTitle>
            <div className="tf-tribune-canvas mt-1 relative h-[68px] overflow-hidden rounded-lg border border-[#3b7fb1]/45 bg-[#050d17] md:h-auto md:min-h-[94px] md:flex-1">
              <div
                className="tf-tribune-canvas-bg absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse 120% 70% at 50% -10%, rgba(255,255,255,0.14), transparent 46%),
                    radial-gradient(circle at 12% 32%, ${homeColor}55, transparent 35%),
                    radial-gradient(circle at 88% 32%, ${awayColor}55, transparent 35%),
                    linear-gradient(180deg, #0c1a2a 0%, #07111c 55%, #040911 100%)
                  `,
                }}
              />
              <div className="tf-tribune-overlay absolute inset-[4%] rounded-[16px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent" />
              <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[58px] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/12" />
              <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[44px] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/10" />
              <div
                className="absolute left-1/2 top-[52%] h-[30px] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-cyan-200/35"
                style={{
                  background: `linear-gradient(125deg, color-mix(in srgb, ${homeColor} 26%, #0a3b5e) 0%, #0b4b73 45%, color-mix(in srgb, ${awayColor} 24%, #0a3b5e) 100%)`,
                }}
              />
              <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[30px] w-px -translate-x-1/2 -translate-y-1/2 bg-white/25" />
              <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
              <div className="tf-tribune-label absolute left-[7%] top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wide text-sky-100/80">Virage</div>
              <div className="tf-tribune-label absolute right-[7%] top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wide text-sky-100/80">Parcage</div>
              <div className="tf-tribune-footer absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pb-1 pt-4 text-center text-[8px] font-black uppercase tracking-[0.24em] text-white/70">
                Plan stade
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTribuneModalOpen(true)}
              className="mt-1 w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-1 text-[11px] font-extrabold text-[#06242a] shadow-sm transition hover:bg-[#2be0c6]"
            >
              Ouvrir la carte du stade
            </button>
            <p className="mt-0.5 text-[10px] font-semibold text-sky-200/80">
              Tribune actuelle · {tribuneOptions.find((t) => t.id === selectedTribune)?.label ?? 'Aucune'}
              {status === 'live' ? ' · messages filtrés par zone' : ''}
            </p>
          </Card>
        </div>

        <div className="tf-live-col min-w-0 space-y-2 rounded-xl border border-[#3470a0]/35 bg-[#082038]/92 p-2.5 shadow-[0_14px_30px_rgba(2,8,18,0.34),inset_0_1px_0_rgba(125,211,252,0.06)] md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col">
          {!isFinished ? (
          <Card
            className={`tf-card-chat relative shrink-0 overflow-hidden ${
              status === 'upcoming' ? 'min-h-[220px] md:min-h-[260px]' : 'min-h-[280px] md:min-h-[360px]'
            }`}
            style={
              status === 'live'
                ? {
                    borderColor: `${homeColor}88`,
                    boxShadow: `0 0 0 1px ${awayColor}26, 0 0 34px ${homeColor}28`,
                  }
                : undefined
            }
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 left-1/2 h-24 w-[78%] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-2xl" />
              <div className="absolute -left-10 top-[32%] h-24 w-24 rounded-full bg-violet-400/12 blur-2xl" />
              <div className="absolute -right-8 bottom-[20%] h-20 w-20 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
            </div>
            <div className="relative z-10">
            <div className="pointer-events-none absolute -left-4 -right-4 -top-4 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <SectionTitle>Chat live</SectionTitle>
            <div className="mt-0.5 flex items-start justify-end gap-1.5 md:items-center md:justify-between md:gap-2">
              <div className="hidden min-w-0 flex-wrap gap-1 md:flex">
                {['Général', 'Virage', 'Analyse', 'Chill'].map((t, i) => (
                  <span
                    key={t}
                    className={`tf-chat-tab rounded-md border px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide leading-none ${
                      i === 0
                        ? 'border-[#8b7bff]/80 bg-[#8b7bff]/18 text-[#ece8ff]'
                        : i === 1
                          ? 'border-[#c17a67]/70 bg-[#c17a67]/18 text-[#ffd8cf]'
                          : i === 2
                            ? 'border-[#8ea5d6]/70 bg-[#8ea5d6]/16 text-[#dbe8ff]'
                            : 'border-[#74bba0]/70 bg-[#74bba0]/16 text-[#d8fff0]'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="hidden grid-cols-2 gap-1 md:grid">
                <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-2 py-1">
                  <p className="text-[10px] font-semibold leading-none text-sky-100/75">
                    Viewers <span className="ml-1 text-xs font-bold text-white">{viewersDisplay}</span>
                  </p>
                </div>
                <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-2 py-1">
                  <p className="text-[10px] font-semibold leading-none text-sky-100/75">
                    FX actifs <span className="ml-1 text-xs font-bold text-white">{fxActiveCount}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 md:hidden">
              <span className="rounded-md border border-[#8b7bff]/80 bg-[#8b7bff]/18 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ece8ff]">
                Général
              </span>
              <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-1.5 py-0.5">
                <p className="text-[9px] font-semibold leading-none text-sky-100/75">
                  Viewers <span className="ml-1 text-[10px] font-bold text-white">{viewersDisplay}</span>
                </p>
              </div>
              <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-1.5 py-0.5">
                <p className="text-[9px] font-semibold leading-none text-sky-100/75">
                  FX <span className="ml-1 text-[10px] font-bold text-white">{fxActiveCount}</span>
                </p>
              </div>
            </div>
            {animationNotice ? (
              <div className="mt-2 rounded-lg bg-[#8b7bff]/16 px-2 py-1 text-[11px] font-semibold text-[#ece8ff]">
                {animationNotice}
              </div>
            ) : null}
            <div
              className={`tf-chat-scroll mt-1.5 space-y-1.5 overflow-y-auto rounded-lg bg-[#071525] p-1.5 shadow-[inset_0_0_0_1px_rgba(148,184,214,0.18)] ${
                status === 'upcoming' ? 'h-[160px] sm:h-[180px] md:h-[min(42vh,380px)]' : 'h-[200px] sm:h-[240px] md:h-[min(52vh,480px)]'
              }`}
            >
              {chatLocked ? (
                <div className="flex h-full min-h-[150px] items-center justify-center rounded-lg border border-[#3a6690]/60 bg-[#0c2339]/80 p-3 text-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-sky-100">
                      Tchat verrouillé
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-sky-200/80">
                      Ouverture 5 min avant le coup d&apos;envoi
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-200">{chatCountdownText ?? '00:00'}</p>
                  </div>
                </div>
              ) : (
                <>
                  {filteredChatMessages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} onToggleLike={onToggleLikeMessage} />
                  ))}
                  {filteredChatMessages.length === 0 ? (
                    <div className="rounded-lg border border-[#3a6690]/60 bg-[#0c2339]/80 p-3 text-center text-[11px] font-semibold text-sky-200/80">
                      {chatMessages.length === 0
                        ? 'Aucun message réel pour le moment.'
                        : 'Aucun message dans cette tribune pour le moment — change de zone ou attends les autres supporters.'}
                    </div>
                  ) : null}
                  <div ref={chatBottomRef} />
                </>
              )}
            </div>
            <form onSubmit={onSend} className="relative mt-2 flex items-center gap-1.5 md:gap-2">
              {livePanelOpen ? (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-[240px] rounded-lg bg-[#102945] p-1.5 shadow-xl">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-100/85">Live</p>
                    <button
                      type="button"
                      onClick={() => setLivePanelOpen(false)}
                      className="rounded border border-[#5f81a1] px-1.5 py-0.5 text-[10px] font-bold text-sky-100"
                    >
                      X
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setLiveMicEnabled((v) => !v)}
                      className={`rounded-md border px-2 py-1 text-left text-[11px] font-bold ${
                        liveMicEnabled
                          ? 'border-cyan-300/75 bg-cyan-300/16 text-cyan-100'
                          : 'border-[#4b6f90] bg-[#0b2741] text-sky-100'
                      }`}
                    >
                      🎤 {liveMicEnabled ? 'Micro ON' : 'Micro OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveCamEnabled((v) => !v)}
                      className={`rounded-md border px-2 py-1 text-left text-[11px] font-bold ${
                        liveCamEnabled
                          ? 'border-cyan-300/75 bg-cyan-300/16 text-cyan-100'
                          : 'border-[#4b6f90] bg-[#0b2741] text-sky-100'
                      }`}
                    >
                      📷 {liveCamEnabled ? 'Cam ON' : 'Cam OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={startLiveBroadcast}
                      className="rounded-md border border-rose-300/80 bg-rose-500/90 px-2 py-1.5 text-xs font-bold text-white hover:bg-rose-500 active:scale-[0.99]"
                    >
                      Demarrer le live
                    </button>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setLivePanelOpen((v) => !v)}
                className={`tf-live-control rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  livePanelOpen || liveBroadcastActive
                    ? 'border-rose-300/70 bg-rose-500/80 text-white'
                    : 'border-[#3a6690] bg-[#0a1f35] text-sky-100 hover:border-sky-300/70'
                }`}
                title="Live micro + camera"
              >
                {liveBroadcastActive ? 'LIVE ON' : 'LIVE'}
              </button>
              {animationsOpen ? (
                <div className="absolute bottom-[calc(100%+8px)] left-10 z-20 w-[min(280px,calc(100vw-3rem))] rounded-lg bg-[#102945] p-1.5 shadow-xl">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-100/85">Animations</p>
                    <button
                      type="button"
                      onClick={() => setAnimationsOpen(false)}
                      className="rounded border border-[#5f81a1] px-1.5 py-0.5 text-[10px] font-bold text-sky-100"
                    >
                      X
                    </button>
                  </div>
                  <p className="mb-1 px-1 text-[10px] font-semibold text-sky-200/85">
                    Jetons: <span className="text-violet-200">{betting.wallet.tokens}</span>
                  </p>
                  <p className="mb-0.5 px-1 text-[9px] font-bold uppercase tracking-wide text-sky-200/70">
                    Pyro · fumigènes
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerPaidAnimation(paidAnimations[0])}
                    className="rounded-md border border-[#4b6f90] bg-[#0b2741] px-2 py-1.5 text-left transition hover:border-orange-400/60"
                  >
                    <p className="text-[11px] font-bold text-sky-50">
                      {paidAnimations[0].emoji} {paidAnimations[0].label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-sky-200/70">{paidAnimations[0].cost} jetons</p>
                  </button>
                  <p className="mb-0.5 mt-2 px-1 text-[9px] font-bold uppercase tracking-wide text-sky-200/70">
                    Ambiance
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => triggerPaidAnimation(paidAnimations[1])}
                      className="rounded-md border border-[#4b6f90] bg-[#0b2741] px-2 py-1 text-left transition hover:border-[#8b7bff]/75"
                    >
                      <p className="text-[11px] font-bold text-sky-50">
                        {paidAnimations[1].emoji} {paidAnimations[1].label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-sky-200/70">{paidAnimations[1].cost} j.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerPaidAnimation(paidAnimations[2])}
                      className="rounded-md border border-[#4b6f90] bg-[#0b2741] px-2 py-1 text-left transition hover:border-[#8b7bff]/75"
                    >
                      <p className="text-[11px] font-bold text-sky-50">
                        {paidAnimations[2].emoji} {paidAnimations[2].label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-sky-200/70">{paidAnimations[2].cost} j.</p>
                    </button>
                  </div>
                  <div className="mt-1.5 flex gap-1 px-0.5">
                    <button
                      type="button"
                      onClick={() => setTifoCheerSide('home')}
                      className={`min-h-0 flex-1 rounded-md border px-1.5 py-1 text-[10px] font-bold ${
                        tifoCheerSide === 'home'
                          ? 'border-emerald-300/80 bg-emerald-500/25 text-emerald-50'
                          : 'border-[#4b6f90] bg-[#0b2741] text-sky-200'
                      }`}
                    >
                      Tifo · {homeName.slice(0, 12)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTifoCheerSide('away')}
                      className={`min-h-0 flex-1 rounded-md border px-1.5 py-1 text-[10px] font-bold ${
                        tifoCheerSide === 'away'
                          ? 'border-rose-300/80 bg-rose-500/25 text-rose-50'
                          : 'border-[#4b6f90] bg-[#0b2741] text-sky-200'
                      }`}
                    >
                      Tifo · {awayName.slice(0, 12)}
                    </button>
                  </div>
                  <p className="mb-0.5 mt-2 px-1 text-[9px] font-bold uppercase tracking-wide text-sky-200/70">
                    Lumières
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerPaidAnimation(paidAnimations[3])}
                    className="rounded-md border border-[#4b6f90] bg-[#0b2741] px-2 py-1.5 text-left transition hover:border-violet-400/60"
                  >
                    <p className="text-[11px] font-bold text-sky-50">
                      {paidAnimations[3].emoji} {paidAnimations[3].label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-sky-200/70">{paidAnimations[3].cost} jetons</p>
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setAnimationsOpen((v) => !v)}
                className={`tf-live-control rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  animationsOpen
                    ? 'border-[#8b7bff] bg-[#8b7bff]/18 text-[#ece8ff]'
                    : 'border-[#3a6690] bg-[#0a1f35] text-sky-100 hover:border-sky-300/70'
                }`}
                title="Animations payantes"
              >
                FX
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={chatLocked ? 'Le tchat ouvre 5 min avant le match' : 'Écrire un message...'}
                disabled={chatLocked || !isCloudChatConfigured}
                className="min-w-0 flex-1 rounded-lg border border-[#3a6690] bg-white px-2.5 py-2 text-sm text-[#0a223a] outline-none transition focus:border-[#5a86af] md:px-3"
              />
              <button
                type="submit"
                disabled={chatLocked || !isCloudChatConfigured}
                className="shrink-0 rounded-lg border border-[#3a6690] bg-white px-2.5 py-2 text-xs font-semibold text-[#0a223a] transition hover:bg-sky-50 md:px-4 md:text-sm"
              >
                {chatLocked ? 'Bientôt' : !isCloudChatConfigured ? 'Cloud off' : 'Envoyer'}
              </button>
            </form>
            </div>
          </Card>
          ) : null}

          <Card
            className={`tf-card-live shrink-0 md:max-h-[min(260px,34vh)] md:overflow-hidden ${
              status === 'upcoming' ? 'md:min-h-[120px]' : 'md:min-h-[140px]'
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <div className="flex flex-col items-start gap-1.5 md:flex-row md:items-center md:justify-between md:gap-2">
              <SectionTitle>Live</SectionTitle>
              <div className="tf-live-soft-surface min-w-0 w-full rounded-md bg-[#122940] px-2 py-1 text-[10px] text-sky-100/90 md:w-[90%]">
                {latestHighlight ? (
                  <span className="block truncate font-semibold">
                    {latestHighlight.minute}' {latestHighlightText}
                  </span>
                ) : (
                  <span className="block truncate font-semibold text-sky-200/70">Moments forts en attente...</span>
                )}
              </div>
            </div>
            {status === 'live' ? (
              <div className="tf-live-pitch-shell mt-2 flex max-h-[min(200px,28vh)] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg bg-[#101c2a] p-2">
                <div className="tf-live-pitch-field relative min-h-[88px] max-h-[min(168px,24vh)] flex-1 overflow-hidden rounded-md bg-[#124238]">
                <div className="pointer-events-none absolute inset-0 z-10">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[17px] font-black tracking-[0.35em] text-white/10">
                    LIVE
                  </div>
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 text-[28px] font-black transition-all duration-500 ${
                      dangerousLeader === 'home' ? 'left-2 text-emerald-300/95 drop-shadow-[0_0_10px_rgba(16,185,129,0.85)]' : 'left-3 text-white/25'
                    }`}
                  >
                    ←
                  </div>
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 text-[28px] font-black transition-all duration-500 ${
                      dangerousLeader === 'away' ? 'right-2 text-rose-300/95 drop-shadow-[0_0_10px_rgba(251,113,133,0.85)]' : 'right-3 text-white/25'
                    }`}
                  >
                    →
                  </div>
                  <div className="tf-live-tactical-chip absolute left-1/2 top-2 z-[11] flex max-w-[96%] -translate-x-1/2 flex-wrap justify-center gap-1 rounded-md bg-[#0c2034]/92 px-1.5 py-1 text-[9px] font-bold text-sky-100 shadow-[0_6px_18px_rgba(0,0,0,0.3)]">
                    {tacticalPreview.map((row) => (
                      <span key={row.label} className="whitespace-nowrap rounded bg-black/30 px-1.5 py-0.5">
                        <span className="text-sky-200/80">{row.label}</span>{' '}
                        <span>{row.home}</span>
                        <span className="text-sky-200/65">-</span>
                        <span>{row.away}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
                <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                <div
                  className={`absolute left-0 top-[18%] h-[64%] w-12 border-r border-y transition-all ${
                    dangerousLeader === 'home'
                      ? 'border-emerald-200/70 bg-emerald-300/10 shadow-[inset_0_0_18px_rgba(16,185,129,0.35)]'
                      : 'border-white/20'
                  }`}
                />
                <div
                  className={`absolute right-0 top-[18%] h-[64%] w-12 border-l border-y transition-all ${
                    dangerousLeader === 'away'
                      ? 'border-rose-200/70 bg-rose-300/10 shadow-[inset_0_0_18px_rgba(251,113,133,0.35)]'
                      : 'border-white/20'
                  }`}
                />
                <div
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all duration-500"
                  style={{ left: `${ballX}%`, top: `${ballY}%` }}
                />
                {homePlayers.map((p, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 shadow-[0_0_8px_rgba(0,0,0,0.35)]"
                    style={{ left: `${p[0]}%`, top: `${p[1]}%`, backgroundColor: homeColor }}
                  />
                ))}
                {awayPlayers.map((p, i) => (
                  <div
                    key={`a-${i}`}
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 shadow-[0_0_8px_rgba(0,0,0,0.35)]"
                    style={{ left: `${p[0]}%`, top: `${p[1]}%`, backgroundColor: awayColor }}
                  />
                ))}
                </div>
              </div>
            ) : isFinished ? (
              <div className="tf-live-pitch-shell mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-lg bg-[#101c2a] p-3">
                <div className="tf-live-soft-surface rounded-lg border border-[#3a6690]/55 bg-[#0f2740]/85 px-3 py-3 text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-200/80">Match terminé</p>
                  <p className="mt-1 text-sm font-bold text-sky-50">
                    Score final: {homeScore} - {awayScore}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-200/75">
                    Statistiques finales disponibles dans les panneaux du match.
                  </p>
                </div>
              </div>
            ) : (
              <div className="tf-live-pitch-shell mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-lg bg-[#101c2a] p-3">
                <div className="tf-live-soft-surface rounded-lg border border-[#3a6690]/55 bg-[#0f2740]/85 px-3 py-3 text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-200/80">Match en attente</p>
                  <p className="mt-1 text-sm font-bold text-sky-50">
                    Coup d&apos;envoi prévu à {kickoffLabel}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-200/75">
                    Les stats live et la dynamique terrain arrivent au démarrage du match.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="tf-live-col hidden min-w-0 space-y-2 rounded-xl border border-[#2b5d87]/35 bg-[#071c31]/90 p-1.5 shadow-[0_12px_24px_rgba(2,8,18,0.26),inset_0_1px_0_rgba(255,255,255,0.05)] md:flex md:h-full md:flex-col">
          <Card
            className={`tf-card-lineup border-fuchsia-400/45 bg-[#1e2336] ${
              status === 'upcoming' ? 'md:min-h-[250px]' : 'md:min-h-[300px]'
            }`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Compositions</SectionTitle>
              <div className="inline-flex items-center gap-1 rounded-md bg-[#0a1f35]/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    pauseLineupAutoFor3Min()
                    setLineupSide('home')
                  }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                    lineupSide === 'home' ? 'text-white' : 'text-sky-100/80'
                  }`}
                  style={
                    lineupSide === 'home'
                      ? {
                          backgroundColor: homeToneColor,
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${homeToneColor} 74%, white)`,
                        }
                      : undefined
                  }
                >
                  {teamShortChip(homeName)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pauseLineupAutoFor3Min()
                    setLineupSide('away')
                  }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                    lineupSide === 'away' ? 'text-white' : 'text-sky-100/80'
                  }`}
                  style={
                    lineupSide === 'away'
                      ? {
                          backgroundColor: awayToneColor,
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${awayToneColor} 74%, white)`,
                        }
                      : undefined
                  }
                >
                  {teamShortChip(awayName)}
                </button>
              </div>
            </div>
            <div
              className="tf-lineup-pitch relative mt-1.5 h-[250px] overflow-hidden rounded-lg border border-emerald-300/35 bg-[#14543f]"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${homeToneColor} 24%, #14543f) 0%, #14543f 46%, color-mix(in srgb, ${awayToneColor} 22%, #14543f) 100%)`,
              }}
            >
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/15" />
              <div className="absolute left-7 right-7 top-5 h-[41%] rounded-md border border-white/20" />
              <div className="absolute bottom-5 left-7 right-7 h-[41%] rounded-md border border-white/20" />

              {displayedLineupBadges.map((p, i) => (
                <PlayerBadge
                  key={`lineup-badge-${lineupSide}-${i}-${p.name}`}
                  name={p.name}
                  className="-translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.left}%`, top: `${p.top}%` }}
                />
              ))}
            </div>
          </Card>

          <Card
            className={`tf-card-bet-shell md:flex md:flex-1 md:flex-col !p-0 bg-transparent shadow-none ${
              status === 'upcoming' ? 'md:min-h-[180px]' : 'md:min-h-[220px]'
            }`}
          >
            <div className="md:flex-1">
              {isFinished ? (
                <div className="rounded-lg border border-[#3a6690]/55 bg-[#0a1f35]/85 px-3 py-3 text-sm font-semibold text-sky-100">
                  Paris fermés: le match est terminé.
                </div>
              ) : match ? (
                <BetWidget
                  match={match}
                  betting={betting}
                  bookOdds1x2={odds1x2}
                  bookOddsOverUnder25={oddsOverUnder25}
                  bookOddsLoading={oddsLoading}
                  compact
                />
              ) : (
                <div className="rounded-lg bg-[#0a1f35]/80 px-3 py-2 text-sm font-semibold text-sky-100">
                  Match indisponible pour les paris.
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-3 left-1/2 z-[88] grid w-[calc(100%-1rem)] max-w-[440px] -translate-x-1/2 grid-cols-4 gap-1 rounded-xl border border-[#3a6690] bg-[#0a1f35]/92 p-1 shadow-2xl backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => {
            setMobilePanel('match')
            setMobileMatchTab('stats')
          }}
          className="rounded-md border border-[#4f7ea8] bg-[#0e2a45] px-1 py-1.5 text-[9px] font-bold leading-tight text-sky-100"
        >
          Match
        </button>
        <button
          type="button"
          onClick={() => {
            setMobilePanel('match')
            setMobileMatchTab('compo')
          }}
          className="rounded-md border border-[#4f7ea8] bg-[#0e2a45] px-1 py-1.5 text-[9px] font-bold leading-tight text-sky-100"
        >
          Compo
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('paris')}
          className="rounded-md border border-[#4f7ea8] bg-[#0e2a45] px-1 py-1.5 text-[9px] font-bold leading-tight text-sky-100"
        >
          Paris
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('tribune')}
          className="rounded-md border border-[#4f7ea8] bg-[#0e2a45] px-1 py-1.5 text-[9px] font-bold leading-tight text-sky-100"
        >
          Tribune
        </button>
      </div>

      {mobilePanel ? (
        <div className="fixed inset-0 z-[89] flex items-end bg-slate-900/60 p-2 backdrop-blur-[2px] md:hidden">
          <div className="w-full rounded-2xl border border-[#3a6690] bg-[#0b2440] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-sky-100">
                {mobilePanel === 'match' ? 'Match' : mobilePanel === 'paris' ? 'Paris' : 'Tribune'}
              </p>
              <button type="button" onClick={() => setMobilePanel(null)} className="rounded-md border border-[#4f7ea8] px-2 py-1 text-[10px] font-bold text-sky-100">
                Fermer
              </button>
            </div>
            {mobilePanel === 'match' ? (
              <div className="mb-2 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setMobileMatchTab('stats')}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold ${mobileMatchTab === 'stats' ? 'border-sky-300 bg-sky-300/20 text-sky-100' : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/80'}`}
                >
                  Stats
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMatchTab('infos')}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold ${mobileMatchTab === 'infos' ? 'border-sky-300 bg-sky-300/20 text-sky-100' : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/80'}`}
                >
                  Infos
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMatchTab('compo')}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold ${mobileMatchTab === 'compo' ? 'border-sky-300 bg-sky-300/20 text-sky-100' : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/80'}`}
                >
                  Compo
                </button>
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'stats' ? (
              <div className="space-y-1">
                {(liveStatRows.length ? liveStatRows : tacticalRows).slice(0, 5).map((row, i) => (
                  <div key={`mobile-stat-${i}`} className="flex items-center justify-between rounded-md bg-[#0a1f35]/70 px-2 py-1 text-xs">
                    <span className="font-bold text-white">{row.home}</span>
                    <span className="text-sky-200/80">{row.label}</span>
                    <span className="font-bold text-white">{row.away}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'infos' ? (
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-sky-100">Compétition: {match?.competition.shortName ?? 'Ligue 1'}</div>
                <div className="rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-sky-100">Coup d’envoi: {kickoffLabel}</div>
                <div className="rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-sky-100">Statut: {status === 'live' ? 'Live' : status === 'finished' ? 'Terminé' : 'À venir'}</div>
                <div className="rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-sky-100">Minute: {status === 'live' ? `${liveDisplayedMinute}'` : '—'}</div>
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'compo' ? (
              <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-0.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      pauseLineupAutoFor3Min()
                      setLineupSide('home')
                    }}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] font-bold ${
                      lineupSide === 'home' ? 'border-sky-300 bg-sky-300/20 text-sky-50' : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/85'
                    }`}
                  >
                    {teamShortChip(homeName)} · {homeName}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      pauseLineupAutoFor3Min()
                      setLineupSide('away')
                    }}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] font-bold ${
                      lineupSide === 'away' ? 'border-sky-300 bg-sky-300/20 text-sky-50' : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/85'
                    }`}
                  >
                    {teamShortChip(awayName)} · {awayName}
                  </button>
                </div>
                <p className="text-[10px] font-semibold text-sky-200/80">
                  Titulaires ({lineupSide === 'home' ? homeLineupNames.length : awayLineupNames.length})
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {(lineupSide === 'home' ? homeLineupNames : awayLineupNames).map((p, i) => (
                    <div
                      key={`mobile-lineup-full-${lineupSide}-${i}-${p}`}
                      className="rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-[11px] font-medium leading-snug text-sky-100"
                    >
                      <span className="font-black text-sky-200/90">{i + 1}.</span> {p}
                    </div>
                  ))}
                </div>
                {(lineupSide === 'home' ? homeLineupNames : awayLineupNames).length === 0 ? (
                  <p className="text-center text-[11px] font-semibold text-sky-200/75">Composition non disponible.</p>
                ) : null}
              </div>
            ) : null}
            {mobilePanel === 'paris' ? (
              <div className="max-h-[45vh] overflow-y-auto">
                {isFinished ? (
                  <div className="rounded-md border border-[#3a6690]/55 bg-[#0a1f35]/85 px-3 py-2 text-xs font-semibold text-sky-100">
                    Paris fermés: le match est terminé.
                  </div>
                ) : match ? (
                  <BetWidget
                    match={match}
                    betting={betting}
                    bookOdds1x2={odds1x2}
                    bookOddsOverUnder25={oddsOverUnder25}
                    bookOddsLoading={oddsLoading}
                    compact
                  />
                ) : (
                  <div className="rounded-md bg-[#0a1f35]/70 px-2 py-2 text-xs font-semibold text-sky-100">Match indisponible pour les paris.</div>
                )}
              </div>
            ) : null}
            {mobilePanel === 'tribune' ? (
              <div className="space-y-2">
                <p className="text-xs text-sky-200/80">Tribune actuelle: {tribuneOptions.find((t) => t.id === selectedTribune)?.label}</p>
                {isFinished ? (
                  <p className="text-[11px] font-semibold text-sky-200/75">Match terminé — changement de tribune indisponible.</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMobilePanel(null)
                    setTribuneModalOpen(true)
                  }}
                  className="w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2 text-xs font-bold text-[#06242a]"
                >
                  Ouvrir la carte du stade
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tribuneModalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4"
          data-no-swipe="true"
          data-tf-modal="true"
          role="dialog"
          aria-modal="true"
          aria-label="Choix de tribune"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setTribuneModalOpen(false)}
            aria-label="Fermer la carte du stade"
          />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#5d7cff]/45 bg-[#0c2b48] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-sky-100">Carte des tribunes</h3>
              <button
                type="button"
                onClick={() => setTribuneModalOpen(false)}
                className="rounded-md border border-[#5b7da0] bg-[#0a1f35] px-2 py-1 text-xs font-bold text-sky-100"
              >
                Fermer
              </button>
            </div>
            <p className="mt-1 text-[11px] text-sky-200/80">
              Selectionne ta zone pour vivre le match dans le groupe qui te correspond.
              {isFinished ? ' Le match est terminé : consultation seule, sans changement de tribune.' : ''}
            </p>

            <div className="relative mt-3 h-[220px] overflow-hidden rounded-xl border border-[#2a5a84] bg-[#061524]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(125,211,252,0.18),transparent_52%)]" />
              <div className="absolute left-1/2 top-1/2 h-[196px] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/20 bg-gradient-to-b from-[#12324f] to-[#0a2238]" />
              <div className="absolute left-1/2 top-1/2 h-[168px] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/15 bg-gradient-to-b from-[#0f2e49] to-[#0a2136]" />
              <div className="absolute left-1/2 top-1/2 h-[142px] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/20 bg-[#0c2740]" />
              <div className="absolute left-1/2 top-1/2 h-[112px] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-emerald-200/30 bg-gradient-to-b from-[#0f5b3d] to-[#0a3f2b]" />

              <div className="absolute left-1/2 top-[11%] h-[124px] w-px -translate-x-1/2 bg-sky-100/15" />
              <div className="absolute bottom-[11%] left-1/2 h-[124px] w-px -translate-x-1/2 bg-sky-100/15" />
              <div className="absolute left-[11%] top-1/2 h-px w-[124px] -translate-y-1/2 bg-sky-100/15" />
              <div className="absolute right-[11%] top-1/2 h-px w-[124px] -translate-y-1/2 bg-sky-100/15" />

              <div className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
              <div className="absolute left-1/2 top-1/2 h-[70px] w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />
              <div className="absolute left-1/2 top-1/2 h-px w-[98px] -translate-x-1/2 -translate-y-1/2 bg-white/20" />

              {tribuneOptions.map((opt, i) => (
                <button
                  key={`stadium-${opt.id}`}
                  type="button"
                  onClick={() => {
                    if (!isFinished) setSelectedTribune(opt.id)
                  }}
                  disabled={isFinished}
                  className={`absolute border text-[10px] font-bold transition-all duration-300 ${
                    i === 0
                      ? 'left-[14%] right-[14%] top-[5%] h-[17%] rounded-b-[1.2rem] rounded-t-md'
                      : i === 1
                        ? 'left-[14%] right-[14%] bottom-[5%] h-[17%] rounded-t-[1.2rem] rounded-b-md'
                        : i === 2
                          ? 'left-[4%] top-[24%] bottom-[24%] w-[13%] rounded-r-[1.2rem] rounded-l-md'
                          : 'right-[4%] top-[24%] bottom-[24%] w-[13%] rounded-l-[1.2rem] rounded-r-md'
                  } ${
                    selectedTribune === opt.id
                      ? 'border-sky-200 bg-sky-300/28 text-sky-50 shadow-[0_0_20px_rgba(125,211,252,0.35)]'
                      : 'border-white/20 bg-white/[0.06] text-sky-100/90 hover:border-sky-300/70 hover:bg-sky-300/15'
                  } ${isFinished ? 'cursor-not-allowed opacity-55' : ''}`}
                >
                  <span className="flex h-full w-full items-center justify-center px-1 text-center leading-tight">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 rounded-lg bg-[#0e253d]/85 px-3 py-2">
              <p className="text-xs font-bold text-sky-100">
                {tribuneOptions.find((t) => t.id === selectedTribune)?.label}
              </p>
              <p className="mt-0.5 text-[11px] text-sky-200/75">
                {tribuneOptions.find((t) => t.id === selectedTribune)?.vibe}
              </p>
            </div>

            {isFinished ? (
              <p className="mt-3 rounded-lg border border-[#3a6690]/60 bg-[#0a1f35]/90 px-3 py-2 text-center text-xs font-semibold text-sky-200/90">
                Match terminé — tu ne peux plus changer de tribune pour ce live.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setTribuneModalOpen(false)}
                className="mt-3 w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2 text-xs font-bold text-[#06242a] transition hover:bg-[#2be0c6]"
              >
                Rejoindre cette tribune
              </button>
            )}
          </div>
        </div>
      ) : null}
      {!isFinished && activePaidFx ? (
        <div className="pointer-events-none fixed inset-0 z-[94] overflow-hidden">
          {activePaidFx.id === 'stroboscope' ? (
            <>
              <div className="absolute inset-0 animate-pulse bg-white/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.32),transparent_50%),radial-gradient(circle_at_50%_55%,rgba(167,139,250,0.26),transparent_48%)]" />
            </>
          ) : null}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-28 sm:pt-16"
            aria-hidden
          >
            <div className="relative mx-auto flex h-[min(46dvh,360px)] w-full max-w-[min(94vw,22rem)] shrink-0 items-end justify-center sm:h-[min(50dvh,420px)] sm:max-w-lg">
              {activePaidFx.id === 'fumigene' ? (
                <>
                  <div className="absolute bottom-0 left-1/2 h-[58%] w-[40%] max-w-[150px] -translate-x-[calc(100%+10px)] -rotate-6 rounded-t-[50%] bg-gradient-to-t from-orange-600/55 via-rose-500/42 to-transparent blur-2xl sm:-translate-x-[calc(100%+14px)]" />
                  <div className="absolute bottom-0 left-1/2 h-[60%] w-[42%] max-w-[155px] translate-x-[10px] rotate-6 rounded-t-[48%] bg-gradient-to-t from-rose-600/55 via-red-500/45 to-transparent blur-2xl sm:translate-x-[14px]" />
                  <div className="absolute bottom-4 left-1/2 h-24 w-[72px] max-w-[22%] -translate-x-[calc(200%+18px)] rounded-full bg-white/14 blur-lg sm:-translate-x-[calc(200%+24px)]" />
                  <div className="absolute bottom-5 left-1/2 h-28 w-20 max-w-[26%] translate-x-[calc(100%+18px)] rounded-full bg-amber-100/14 blur-lg sm:translate-x-[calc(100%+24px)]" />
                </>
              ) : null}
              {activePaidFx.id === 'ola' ? (
                <div className="absolute bottom-[10%] left-1/2 w-[min(88vw,20rem)] -translate-x-1/2 space-y-2.5 sm:bottom-[14%] sm:w-full sm:max-w-md">
                  <div className="h-2 w-full animate-pulse rounded-full bg-cyan-300/75 shadow-[0_0_20px_rgba(34,211,238,0.35)]" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-violet-300/70 shadow-[0_0_18px_rgba(167,139,250,0.32)]" />
                </div>
              ) : null}
              {activePaidFx.id === 'tifo-geant' ? (
                <div
                  className="absolute left-1/2 top-1/2 w-[min(92vw,20rem)] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2.5 text-center shadow-2xl backdrop-blur-sm sm:w-[min(90vw,24rem)] sm:px-4 sm:py-3"
                  style={{
                    borderColor:
                      activePaidFx.tifoSide === 'away'
                        ? `color-mix(in srgb, ${awayColor} 70%, white)`
                        : `color-mix(in srgb, ${homeColor} 70%, white)`,
                    background:
                      activePaidFx.tifoSide === 'away'
                        ? `linear-gradient(120deg, color-mix(in srgb, ${awayColor} 38%, #0a1f35), #0e2f4d)`
                        : `linear-gradient(120deg, color-mix(in srgb, ${homeColor} 38%, #0a1f35), #0e2f4d)`,
                  }}
                >
                  <p className="text-xs font-black leading-snug tracking-wide text-white sm:text-base sm:tracking-wide">
                    ALLEZ {(activePaidFx.tifoSide === 'away' ? awayName : homeName).toUpperCase()}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-4 max-w-[min(92vw,22rem)] rounded-full border border-white/15 bg-[#041a2d]/90 px-4 py-1.5 text-center text-[11px] font-bold text-sky-100 shadow-lg sm:text-xs">
              FX: {activePaidFx.label}
            </div>
          </div>
        </div>
      ) : null}
      {!isFinished && fullscreenEvent ? (
        <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
          <div className="absolute inset-0 bg-black/46 backdrop-blur-[4px]" />
          <div
            className={`absolute inset-[-16%] animate-[tf-goal-bg_1100ms_ease-out_forwards] ${
              fullscreenEvent.kind === 'goal'
                ? ''
                : fullscreenEvent.kind === 'card'
                  ? ''
                  : fullscreenEvent.kind === 'kickoff'
                    ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.44),rgba(6,17,30,0.12)_55%,transparent_78%)]'
                    : 'bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.44),rgba(6,17,30,0.12)_55%,transparent_78%)]'
            }`}
            style={
              (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                ? {
                    background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${fullscreenAccentColor} 52%, transparent), rgba(6,17,30,0.12) 55%, transparent 78%)`,
                  }
                : undefined
            }
          />
          <div
            className={`absolute inset-0 border-[5px] animate-[tf-live-rim-pulse_850ms_ease-in-out_2] ${
              fullscreenEvent.kind === 'goal'
                ? ''
                : fullscreenEvent.kind === 'card'
                  ? ''
                  : fullscreenEvent.kind === 'kickoff'
                    ? 'border-sky-300/85'
                    : 'border-violet-300/85'
            }`}
            style={
              (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                ? { borderColor: `color-mix(in srgb, ${fullscreenAccentColor} 72%, white)` }
                : undefined
            }
          />

          {fullscreenEvent.kind === 'goal'
            ? [
                ['10%', '18%', 'text-2xl', 0],
                ['26%', '66%', 'text-4xl', 120],
                ['48%', '14%', 'text-6xl', 60],
                ['66%', '62%', 'text-3xl', 180],
                ['80%', '28%', 'text-5xl', 90],
              ].map(([l, t, size, d], i) => (
                <span
                  key={`goal-word-${i}`}
                  className={`absolute font-black uppercase tracking-widest ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{
                    left: l,
                    top: t,
                    animationDelay: `${d}ms`,
                    color: fullscreenAccentColor
                      ? `color-mix(in srgb, ${fullscreenAccentColor} 62%, white)`
                      : undefined,
                  }}
                >
                  GOAL
                </span>
              ))
            : null}

          {fullscreenEvent.kind === 'card'
            ? [
                ['12%', '22%', '🟨', 'text-5xl', 0],
                ['24%', '70%', '🟥', 'text-4xl', 120],
                ['44%', '18%', '🟨', 'text-6xl', 70],
                ['68%', '64%', '🟥', 'text-5xl', 180],
                ['82%', '30%', '🟨', 'text-4xl', 90],
              ].map(([l, t, emoji, size, d], i) => (
                <span
                  key={`card-emoji-${i}`}
                  className={`absolute ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{ left: l, top: t, animationDelay: `${d}ms` }}
                >
                  {emoji}
                </span>
              ))
            : null}
          {fullscreenEvent.kind === 'kickoff'
            ? [
                ['12%', '22%', '🔔', 'text-5xl', 0],
                ['28%', '70%', '📣', 'text-4xl', 120],
                ['48%', '16%', '🎺', 'text-6xl', 70],
                ['70%', '64%', '🔔', 'text-5xl', 180],
                ['84%', '30%', '📣', 'text-4xl', 90],
              ].map(([l, t, emoji, size, d], i) => (
                <span
                  key={`kickoff-emoji-${i}`}
                  className={`absolute ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{ left: l, top: t, animationDelay: `${d}ms` }}
                >
                  {emoji}
                </span>
              ))
            : null}

          <div
            className={`absolute inset-0 flex justify-center px-4 ${
              fullscreenEvent.kind === 'var' ? 'items-start pt-20' : 'items-center'
            }`}
          >
            <div
              className={`w-full max-w-xl rounded-2xl border px-7 py-5 text-center shadow-2xl backdrop-blur-md [transform:translateZ(0)] ${
                fullscreenEvent.kind === 'goal'
                  ? ''
                  : fullscreenEvent.kind === 'card'
                    ? ''
                    : fullscreenEvent.kind === 'kickoff'
                      ? 'border-sky-300/85 bg-[#0b1f35]/84'
                      : 'border-violet-300/85 bg-[#1a1333]/82'
              }`}
              style={{
                borderColor:
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? `color-mix(in srgb, ${fullscreenAccentColor} 72%, white)`
                    : undefined,
                background:
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? `color-mix(in srgb, ${fullscreenAccentColor} 22%, #091425)`
                    : undefined,
                animation:
                  fullscreenEvent.kind === 'var'
                    ? 'tf-commentary-in 380ms ease-out forwards'
                    : 'tf-commentary-in 260ms ease-out forwards',
              }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/75">Ambiance stade</p>
              <p
                className={`mt-1 text-5xl font-black tracking-wider ${
                  fullscreenEvent.kind === 'goal'
                    ? 'animate-[tf-goal-shake_760ms_ease-out_1]'
                    : fullscreenEvent.kind === 'card'
                      ? 'animate-[tf-goal-shake_760ms_ease-out_1]'
                      : fullscreenEvent.kind === 'kickoff'
                        ? 'text-sky-200 animate-[tf-goal-shake_760ms_ease-out_1]'
                        : 'text-violet-200'
                }`}
                style={
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? { color: `color-mix(in srgb, ${fullscreenAccentColor} 75%, white)` }
                    : undefined
                }
              >
                {fullscreenEvent.kind === 'goal'
                  ? '⚽'
                  : fullscreenEvent.kind === 'card'
                    ? '🟨'
                    : fullscreenEvent.kind === 'kickoff'
                      ? '🎺'
                      : '📺'}{' '}
                {fullscreenEvent.title}
              </p>
              {fullscreenEvent.subtitle ? (
                <p className="mt-2 text-base font-semibold text-sky-50">{fullscreenEvent.subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
