import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { initialMessages } from '../data/messages'
import { useMatches, REPLAY_LIVE_ID } from '../contexts/MatchesContext'
import { currentUser, mockUsers } from '../data/users'
import type { Message, ReactionEvent, ReactionType } from '../types/chat'
import { Card } from '../components/ui/Card'
import { ChannelHeader } from '../components/channel/ChannelHeader'
import { LivePitch } from '../components/channel/LivePitch'
import { MatchHighlights } from '../components/channel/MatchHighlights'
import { MatchPreview } from '../components/channel/MatchPreview'
import { MessageList } from '../components/channel/MessageList'
import { MessageComposer } from '../components/channel/MessageComposer'
import { ReactionBar } from '../components/reaction/ReactionBar'
import { reactionMeta } from '../components/reaction/reactions'
import {
  FloatingReactions,
  type FloatingReaction,
} from '../components/reaction/FloatingReactions'
import { LiveEffects } from '../components/reaction/LiveEffects'
import { GoalOverlay } from '../components/reaction/GoalOverlay'
import { EventOverlay } from '../components/reaction/EventOverlay'
import { ReactionSummary } from '../components/reaction/ReactionSummary'
import { HypeMeter } from '../components/reaction/HypeMeter'
import { ActiveUsers } from '../components/channel/ActiveUsers'
import { LiveCommentator } from '../components/channel/LiveCommentator'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { mockHighlights } from '../data/highlights'
import type { Highlight } from '../data/highlights'
import { BetWidget } from '../components/bet/BetWidget'
import { useBetting } from '../hooks/useBetting'
import { useUnlockedEmotes } from '../hooks/useUnlockedEmotes'
import { useMessageLikes } from '../hooks/useMessageLikes'
import { themeForCompetition } from '../data/competitionThemes'
import { RENNES_PSG_REPLAY } from '../data/rennesPsgReplay'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { cn } from '../utils/cn'

const MS_PER_MATCH_MINUTE = 3000

export function ChannelPage() {
  const { matchId } = useParams()
  const { matches } = useMatches()
  const match = useMemo(
    () => matches.find((m) => m.id === matchId) ?? null,
    [matches, matchId],
  )

  const users = useMemo(() => [currentUser, ...mockUsers], [])
  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  )

  const { virageMode, favoriteClubId, preferencesComplete, setVirageMode } =
    useFanPreferences()

  const [messages, setMessages] = useState<Message[]>(() => {
    const seeded = initialMessages.filter((m) => m.matchId === matchId)
    return seeded.length
      ? seeded
      : [
          {
            id: 'msg-welcome',
            matchId: matchId ?? 'unknown',
            userId: 'u-1',
            text: 'Bienvenue dans le live. Balance ton premier avis.',
            createdAt: Date.now() - 25_000,
          },
        ]
  })

  const [reactions, setReactions] = useState<ReactionEvent[]>([])
  const [floating, setFloating] = useState<FloatingReaction[]>([])
  const idRef = useRef(0)
  const hiRef = useRef(0)
  const [showGoal, setShowGoal] = useState(false)
  const [goalScorer, setGoalScorer] = useState<string | undefined>(undefined)
  const [goalMinute, setGoalMinute] = useState<number | undefined>(undefined)
  const [goalColors, setGoalColors] = useState<
    { primary: string; secondary: string } | undefined
  >(undefined)

  const [eventOverlay, setEventOverlay] = useState<{
    show: boolean
    kind: 'yellow' | 'red' | 'save'
    line1?: string
    line2?: string
  }>({ show: false, kind: 'yellow' })

  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    mockHighlights.filter((h) => h.matchId === matchId),
  )
  const [lastMoment, setLastMoment] = useState<Highlight | null>(null)

  const [simMinute, setSimMinute] = useState<number>(() => match?.minute ?? 0)
  const [simScore, setSimScore] = useState<{ home: number; away: number } | undefined>(
    () => match?.score,
  )
  const simMinuteRef = useRef<number>(match?.minute ?? 0)
  const simScoreRef = useRef<{ home: number; away: number } | undefined>(match?.score)
  const overlayCooldownRef = useRef(0)
  const lastGoalShownAtRef = useRef(0)
  const eventQueueRef = useRef<Array<{ kind: 'yellow' | 'red' | 'save'; line1: string; line2: string }>>([])
  const matchEndSettledRef = useRef(false)

  const pipContainerRef = useRef<HTMLDivElement | null>(null)

  const betting = useBetting(matchId ?? 'unknown')
  const { unlockedIds: unlockedEmoteIds, unlock: unlockEmote } = useUnlockedEmotes()
  const messageLikes = useMessageLikes()

  const recentReactions = useMemo(() => {
    const now = Date.now()
    return reactions.filter((r) => now - r.createdAt < 60_000)
  }, [reactions])

  const visibleMessages = useMemo(() => {
    if (!virageMode || !favoriteClubId) return messages
    return messages.filter((m) => {
      if (m.userId === currentUser.id) return true
      const u = usersById[m.userId]
      return u?.fanClubId === favoriteClubId
    })
  }, [messages, virageMode, favoriteClubId, usersById])

  const feedRef = useAutoScroll<HTMLDivElement>([
    visibleMessages.length,
    floating.length,
  ])

  // Le live s'ouvre 1 min avant le coup d'envoi
  const [msUntilKickoff, setMsUntilKickoff] = useState(() =>
    match && match.status === 'upcoming'
      ? new Date(match.kickoffAt).getTime() - Date.now()
      : 0,
  )
  useEffect(() => {
    if (!match || match.status !== 'upcoming') return
    const tick = () => {
      const ms = new Date(match.kickoffAt).getTime() - Date.now()
      setMsUntilKickoff(Math.max(0, ms))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [match?.id, match?.kickoffAt, match?.status])

  const isLiveOpen = match
    ? match.status === 'live' || (match.status === 'upcoming' && msUntilKickoff <= 60_000)
    : false

  // Tick pour faire décroître la barre d'ambiance au fil du temps
  const [ambianceTick, setAmbianceTick] = useState(0)
  useEffect(() => {
    if (!isLiveOpen) return
    const id = setInterval(() => setAmbianceTick((t) => t + 1), 800)
    return () => clearInterval(id)
  }, [isLiveOpen])

  const ambianceLevel = useMemo(() => {
    const now = Date.now()
    const WINDOW_MS = 50_000
    let score = 0
    for (const r of recentReactions) {
      const age = now - r.createdAt
      if (age > WINDOW_MS) continue
      const weight = 1 - age / WINDOW_MS
      score += weight * 18
    }
    return Math.min(100, Math.round(score))
  }, [recentReactions, ambianceTick])

  const compTheme = match ? themeForCompetition(match.competition.id) : null

  if (!match || !matchId) {
    return (
      <Card className="p-6">
        <div className="font-display text-lg font-black tracking-tight text-tf-dark">
          Canal introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-tf-grey">
          Ce canal n'existe pas encore dans les données de test.
        </div>
      </Card>
    )
  }

  const matchView = useMemo(() => {
    if (match.status !== 'live') return match
    return { ...match, minute: simMinute, score: simScore }
  }, [match, simMinute, simScore])

  // Replay Rennes–PSG 8 mars 2025 : données réelles (buts 27',50',53',91',94' + cartons)
  const isReplay = matchId === REPLAY_LIVE_ID
  const processedEventsRef = useRef<Set<number>>(new Set())

  // Simulated match clock + events
  useEffect(() => {
    if (match.status !== 'live') return
    setSimMinute(match.minute ?? 0)
    setSimScore(match.score ?? { home: 0, away: 0 })
    simMinuteRef.current = match.minute ?? 0
    simScoreRef.current = match.score ?? { home: 0, away: 0 }
    processedEventsRef.current = new Set()
    eventQueueRef.current = []
    lastGoalShownAtRef.current = 0
    matchEndSettledRef.current = false

    if (isReplay) {
      const startMs = Date.now()
      const id = window.setInterval(() => {
        const elapsed = Date.now() - startMs
        const currentMinute = Math.min(99, Math.floor(elapsed / MS_PER_MATCH_MINUTE))
        setSimMinute(currentMinute)
        simMinuteRef.current = currentMinute

        RENNES_PSG_REPLAY.forEach((ev, idx) => {
          if (processedEventsRef.current.has(idx)) return
          if (ev.minute > currentMinute) return
          processedEventsRef.current.add(idx)

          if (ev.type === 'goal' && 'scorer' in ev) {
            const cur = simScoreRef.current ?? { home: 0, away: 0 }
            const isFirstGoal = cur.home + cur.away === 0
            const next = {
              home: cur.home + (ev.side === 'home' ? 1 : 0),
              away: cur.away + (ev.side === 'away' ? 1 : 0),
            }
            simScoreRef.current = next
            setSimScore(next)
            lastGoalShownAtRef.current = Date.now()
            betting.settleNextGoal(ev.side)
            if (isFirstGoal) betting.settleFirstGoal(ev.side)
            setGoalScorer(`${ev.side === 'home' ? match.home.shortName : match.away.shortName} — ${ev.scorer}`)
            setGoalMinute(ev.minute)
            setGoalColors(ev.side === 'home' ? match.home.colors : match.away.colors)
            setShowGoal(true)
            pushHighlight({
              matchId: matchId ?? '',
              minute: ev.minute,
              type: 'But',
              title: 'BUT !',
              detail: `${ev.scorer} • ${next.home}-${next.away}`,
            })
          } else if (ev.type === 'yellow' && 'player' in ev) {
            const line1 = `${ev.side === 'home' ? match.home.shortName : match.away.shortName} — ${ev.player}`
            const line2 = `Minute ${ev.minute}'`
            const sinceGoal = Date.now() - lastGoalShownAtRef.current
            if (sinceGoal < 6000) {
              eventQueueRef.current.push({ kind: 'yellow', line1, line2 })
              window.setTimeout(() => flushEventQueue(), 6000 - sinceGoal)
            } else {
              setEventOverlay({ show: true, kind: 'yellow', line1, line2 })
            }
            pushHighlight({
              matchId: matchId ?? '',
              minute: ev.minute,
              type: 'Carton',
              title: 'Carton jaune',
              detail: `${ev.player} — Avertissement`,
            })
          } else if (ev.type === 'red' && 'player' in ev) {
            const line1 = `${ev.side === 'home' ? match.home.shortName : match.away.shortName} — ${ev.player}`
            const line2 = `Minute ${ev.minute}'`
            const sinceGoal = Date.now() - lastGoalShownAtRef.current
            if (sinceGoal < 6000) {
              eventQueueRef.current.push({ kind: 'red', line1, line2 })
              window.setTimeout(() => flushEventQueue(), 6000 - sinceGoal)
            } else {
              setEventOverlay({ show: true, kind: 'red', line1, line2 })
            }
            pushHighlight({
              matchId: matchId ?? '',
              minute: ev.minute,
              type: 'Carton',
              title: 'Carton rouge',
              detail: `${ev.player} — Expulsion`,
            })
          } else if (ev.type === 'save') {
            const line1 = `${match.home.shortName} – ${match.away.shortName}`
            const line2 = `Minute ${ev.minute}'`
            const sinceGoal = Date.now() - lastGoalShownAtRef.current
            if (sinceGoal < 6000) {
              eventQueueRef.current.push({ kind: 'save', line1, line2 })
              window.setTimeout(() => flushEventQueue(), 6000 - sinceGoal)
            } else {
              setEventOverlay({ show: true, kind: 'save', line1, line2 })
            }
            pushHighlight({
              matchId: matchId ?? '',
              minute: ev.minute,
              type: 'Arrêt',
              title: 'Gros arrêt',
              detail: 'Réflexe du gardien — le stade retient son souffle',
            })
          }
        })

        if (currentMinute >= 97 && !matchEndSettledRef.current) {
          matchEndSettledRef.current = true
          window.clearInterval(id)
          const finalScore = simScoreRef.current ?? { home: 0, away: 0 }
          betting.settleMatchResult(finalScore)
        }
      }, 80)
      return () => window.clearInterval(id)
    }

    const id = window.setInterval(() => {
      setSimMinute((m) => {
        const next = Math.min(99, (m || 1) + 1)
        simMinuteRef.current = next
        return next
      })
      const now = Date.now()
      const canOverlay = now - overlayCooldownRef.current > 12_000

      if (canOverlay && Math.random() < 0.02) {
        const side = Math.random() < 0.5 ? 'home' : 'away'
        overlayCooldownRef.current = now
        triggerGoal(side, 'sim')
      }

      if (canOverlay && Math.random() < 0.025) {
        const minute = simMinuteRef.current || (match.minute ?? 0)
        const isRed = Math.random() < 0.22
        setEventOverlay({
          show: true,
          kind: isRed ? 'red' : 'yellow',
          line1: `${match.home.shortName} – ${match.away.shortName}`,
          line2: `Minute ${minute}'`,
        })
        overlayCooldownRef.current = now
        pushHighlight({
          matchId,
          minute,
          type: 'Carton',
          title: isRed ? 'Carton rouge' : 'Carton jaune',
          detail: isRed
            ? 'Geste dangereux — le match peut basculer.'
            : 'Avertissement pour calmer le jeu.',
        })
      } else if (canOverlay && Math.random() < 0.03) {
        const minute = simMinuteRef.current || (match.minute ?? 0)
        setEventOverlay({
          show: true,
          kind: 'save',
          line1: `${match.home.shortName} – ${match.away.shortName}`,
          line2: `Minute ${minute}'`,
        })
        overlayCooldownRef.current = now
        pushHighlight({
          matchId,
          minute,
          type: 'Arrêt',
          title: 'Gros arrêt',
          detail: 'Réflexe incroyable — le stade explose.',
        })
      }
    }, 20_000)
    return () => window.clearInterval(id)
  }, [match.id, match.minute, match.score, match.status, matchId, isReplay])

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  useEffect(() => {
    setHighlights(mockHighlights.filter((h) => h.matchId === matchId))
    setLastMoment(null)
  }, [matchId])

  const pushHighlight = (h: Omit<Highlight, 'id'>) => {
    const id = `h-live-${Date.now()}-${hiRef.current++}`
    const next: Highlight = { ...h, id }
    setHighlights((prev) => [...prev, next].slice(-40))
    setLastMoment(next)
  }

  const flushEventQueue = () => {
    const next = eventQueueRef.current.shift()
    if (next) {
      setEventOverlay({ show: true, kind: next.kind, line1: next.line1, line2: next.line2 })
    } else {
      setEventOverlay((s) => ({ ...s, show: false }))
    }
  }

  const triggerGoal = (side: 'home' | 'away', source: 'sim' | 'reaction') => {
    const minute = simMinuteRef.current || (match.minute ?? 0)
    const scorer =
      side === 'home'
        ? `${match.home.shortName} #9`
        : `${match.away.shortName} #11`

    const cur = simScoreRef.current ?? match.score ?? { home: 0, away: 0 }
    const isFirstGoal = (cur.home ?? 0) + (cur.away ?? 0) === 0
    const next = { ...cur, [side]: (cur as any)[side] + 1 } as {
      home: number
      away: number
    }
    simScoreRef.current = next
    setSimScore(next)

    setGoalScorer(scorer)
    setGoalMinute(minute)
    setGoalColors(side === 'home' ? match.home.colors : match.away.colors)
    setShowGoal(true)

    if (match.status === 'live') {
      betting.settleNextGoal(side)
    }
    if (isFirstGoal) {
      betting.settleFirstGoal(side)
    }

    pushHighlight({
      matchId,
      minute,
      type: 'But',
      title: 'BUT !',
      detail: `${scorer} • Score ${next.home}-${next.away} • ${source === 'reaction' ? 'réaction' : 'action'}`,
    })
  }

  const onSend = (text: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId,
      userId: currentUser.id,
      text,
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, msg])
  }

  const onSendGif = (gifUrl: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId,
      userId: currentUser.id,
      text: '[GIF]',
      createdAt: Date.now(),
      gifUrl,
    }
    setMessages((prev) => [...prev, msg])
  }

  const onSendEmote = (emoteId: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId,
      userId: currentUser.id,
      text: '[Emote]',
      createdAt: Date.now(),
      emoteId,
    }
    setMessages((prev) => [...prev, msg])
  }

  const handleUnlockEmote = (emoteId: string, cost: number): boolean => {
    const result = betting.spendTokens(cost, 'emote')
    if (!result.ok) return false
    unlockEmote(emoteId)
    return true
  }

  const emitReaction = (type: ReactionType, userId: string) => {
    const id = `rx-${Date.now()}-${idRef.current++}`
    const createdAt = Date.now()
    const event: ReactionEvent = {
      id,
      matchId,
      userId,
      type,
      createdAt,
    }
    setReactions((prev) => [...prev, event].slice(-80))
    // Les réactions (goal, confetti, etc.) sont décoratives : elles n'affectent pas le match.
    // Buts, cartons, arrêts viennent uniquement de la simu du match en temps réel.
    const side = Math.random() < 0.5 ? 'left' : 'right'
    const sideJitter = 4 + Math.random() * 6
    const xPct = side === 'left' ? 2 + sideJitter : 98 - sideJitter
    const bottomPx = 18 + Math.random() * 92
    const float: FloatingReaction = { id, type, createdAt, xPct, bottomPx }
    setFloating((prev) => [...prev, float].slice(-16))
    window.setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== id))
    }, 950)
  }

  const onReact = (type: ReactionType) => {
    const cost = reactionMeta[type].cost
    const result = betting.spendTokens(cost, 'reaction')
    if (!result.ok) return
    emitReaction(type, currentUser.id)
  }

  useEffect(() => {
    if (match.status !== 'live') return
    const phrases = [
      'Ça presse très haut là.',
      'On sent que ça peut basculer sur la prochaine action.',
      'Le milieu se fait manger, faut réagir.',
      "C'est chaud dans la surface…",
      "L'arbitre laisse jouer, ça chauffe.",
      "Quelle intensité, c'est un vrai match de stade.",
      'La relance est risquée…',
      'Ça combine bien sur le côté.',
    ]
    const reactionBag: ReactionType[] = ['confetti', 'flare', 'rage', 'goal']
    const schedule = () => 5200 + Math.random() * 5200
    let timeout = 0
    let burst = 0

    const tick = () => {
      const u = mockUsers[(Math.random() * mockUsers.length) | 0]
      const text = phrases[(Math.random() * phrases.length) | 0]
      setMessages((prev) =>
        [
          ...prev,
          {
            id: `msg-bot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            matchId,
            userId: u.id,
            text,
            createdAt: Date.now(),
          },
        ].slice(-220),
      )

      if (Math.random() < 0.18) {
        emitReaction(reactionBag[(Math.random() * reactionBag.length) | 0], u.id)
      }

      burst += 1
      timeout = window.setTimeout(tick, burst < 2 ? 1200 : schedule())
    }

    timeout = window.setTimeout(tick, 900)
    return () => window.clearTimeout(timeout)
  }, [match.status, matchId])

  return (
    <div
      className="tf-match-page h-[calc(100dvh-120px)] min-w-0 overflow-hidden"
      style={
        {
          '--tf-match-home': match.home.colors.primary,
          '--tf-match-away': match.away.colors.primary,
          '--tf-match-accent': compTheme?.accent ?? '#0a3dff',
        } as React.CSSProperties
      }
    >
      <GoalOverlay
        key={showGoal ? `${goalScorer}-${goalMinute}` : 'hidden'}
        show={showGoal}
        scorer={goalScorer}
        minute={goalMinute}
        colors={goalColors}
        onDone={() => setShowGoal(false)}
      />
      <EventOverlay
        key={eventOverlay.show ? `${eventOverlay.kind}-${eventOverlay.line1}` : 'hidden'}
        show={eventOverlay.show}
        kind={eventOverlay.kind}
        line1={eventOverlay.line1}
        line2={eventOverlay.line2}
        ms={5500}
        onDone={flushEventQueue}
      />

      <div className="relative h-full overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-tf-white shadow-[0_8px_40px_rgba(1,30,51,0.08)]">
        {isLiveOpen && match.status === 'live' && (
          <LiveCommentator
            pipTargetRef={pipContainerRef}
            user={currentUser}
            onCommentary={(text) => {
              const msg: Message = {
                id: `msg-com-${Date.now()}`,
                matchId,
                userId: currentUser.id,
                text: `🎙️ ${text}`,
                createdAt: Date.now(),
              }
              setMessages((prev) => [...prev, msg])
            }}
          />
        )}
        <LiveEffects events={recentReactions} fullScreen />
        {isLiveOpen && (
          <div
            className="absolute top-0 left-0 right-0 z-20 h-1 overflow-hidden rounded-t-2xl"
            aria-hidden="true"
          >
            <div className="h-full w-full bg-tf-grey-pastel/40" />
            <div
              className="absolute inset-y-0 left-0 rounded-t-2xl transition-all duration-500 ease-out"
              style={{
                width: `${ambianceLevel}%`,
                background: `linear-gradient(90deg, ${match.home.colors.primary}, ${match.away.colors.primary})`,
              }}
            />
          </div>
        )}
        <div className="flex h-full min-h-0 flex-col">
          {/* Hero header */}
          <div className={cn('shrink-0 border-b border-tf-grey-pastel/50 bg-tf-white/95 px-4 py-3 backdrop-blur-md sm:px-5', isLiveOpen && 'pt-4')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChannelHeader match={matchView} />
              <ActiveUsers users={users} />
            </div>
            {isLiveOpen && match.status === 'live' && lastMoment ? (
              <div className="mt-3 flex items-center gap-3 overflow-hidden rounded-xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/20 px-4 py-2.5">
                <span className="text-xs font-black tabular-nums text-tf-grey">
                  {lastMoment.minute > 0 ? `${lastMoment.minute}'` : '—'}
                </span>
                <span className="text-sm font-black text-tf-dark">
                  {lastMoment.title}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-tf-grey">
                  {lastMoment.detail}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid flex-1 min-h-0 gap-3 p-3 sm:p-4 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
            {/* Left: Pitch + Moments + Bets */}
            <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
              <div className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-tf-grey-pastel/20 to-tf-white/90 shadow-sm">
                <div className="order-2 shrink-0 border-b border-tf-grey-pastel/50 p-4 lg:order-1">
                  <BetWidget match={matchView} betting={betting} />
                </div>
                <div className="order-1 min-h-0 flex-1 p-4 lg:order-2">
                  <div
                    className={cn(
                      'grid h-full min-h-0 gap-4',
                      isLiveOpen ? 'lg:grid-cols-[1.4fr_0.6fr]' : 'grid-cols-1',
                    )}
                  >
                    {isLiveOpen && (
                      <div className="relative min-h-0 overflow-visible">
                        <div
                          ref={pipContainerRef}
                          className="absolute top-3 right-3 z-30 h-0 w-0 overflow-visible sm:top-4 sm:right-4"
                          aria-hidden="true"
                        />
                        <LivePitch match={matchView} />
                      </div>
                    )}
                    <div className="min-h-0 flex flex-col overflow-hidden rounded-xl border border-tf-grey-pastel/50 bg-tf-white/90 shadow-sm">
                      <div className="shrink-0 border-b border-tf-grey-pastel/50 px-4 py-3">
                        <h2 className="font-display text-sm font-black text-tf-dark">
                          {match.status === 'live' ? 'Moments forts' : 'Avant-match'}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-tf-grey">
                          {match.status === 'live'
                            ? 'Timeline du match'
                            : 'Compos probables, forme, infos'}
                        </p>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                        {match.status === 'live' ? (
                          <MatchHighlights
                            items={highlights}
                            activeId={lastMoment?.id}
                          />
                        ) : (
                          <MatchPreview match={match} />
                        )}
                        <div className="h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Chat (bloqué avant J-1 min) */}
            <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-tf-grey-pastel/15 to-tf-white/95 shadow-sm">
              {isLiveOpen && <FloatingReactions items={floating} />}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="shrink-0 border-b border-tf-grey-pastel/50 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-sm font-black text-tf-dark">
                        Chat live
                      </h2>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">
                        {isLiveOpen
                          ? 'Ambiance stade • réagis aux actions'
                          : 'Ouvre 1 minute avant le coup d\'envoi'}
                      </p>
                    </div>
                    {isLiveOpen &&
                    match.status === 'live' &&
                    preferencesComplete &&
                    favoriteClubId ? (
                      <button
                        type="button"
                        onClick={() => setVirageMode(!virageMode)}
                        className={cn(
                          'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition',
                          virageMode
                            ? 'border-tf-dark bg-tf-dark text-white'
                            : 'border-tf-grey-pastel/60 bg-white text-tf-grey hover:bg-tf-grey-pastel/20',
                        )}
                        title="Messages filtrés sur ton club de cœur"
                      >
                        {virageMode ? '🔥 Virage ON' : 'Mode Virage'}
                      </button>
                    ) : null}
                  </div>
                  {isLiveOpen && (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <HypeMeter
                          value={ambianceLevel}
                          totalReactions={recentReactions.length}
                          className="w-full max-w-[260px]"
                          homeColor={match.home.colors.primary}
                          awayColor={match.away.colors.primary}
                        />
                        <ReactionBar
                          onReact={onReact}
                          tokens={betting.wallet.tokens}
                        />
                      </div>
                      <div className="shrink-0 border-t border-tf-grey-pastel/50 pt-3 sm:border-t-0 sm:border-l sm:border-tf-grey-pastel/50 sm:pl-4 sm:pt-0">
                        <ReactionSummary reactions={recentReactions} />
                      </div>
                    </div>
                  )}
                </div>

                {isLiveOpen ? (
                  <>
                    <div
                      ref={feedRef}
                      className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
                      role="log"
                      aria-label="Messages en direct"
                      aria-live="polite"
                    >
                      {virageMode && favoriteClubId ? (
                        <div className="mb-3 rounded-xl border border-tf-dark/20 bg-tf-dark/5 px-3 py-2 text-xs font-bold text-tf-dark">
                          Mode Virage : tu vois surtout les messages des supporters de ton club (+ les
                          tiens).
                        </div>
                      ) : null}
                      <MessageList
                        messages={visibleMessages}
                        usersById={usersById}
                        getLikes={messageLikes.getLikes}
                        hasLiked={(id) => messageLikes.hasLiked(id, 'me')}
                        onToggleLike={(m) => {
                          if (messageLikes.hasLiked(m.id, 'me')) {
                            messageLikes.unlike(m.id)
                          } else {
                            messageLikes.like(m.id, m, match, usersById[m.userId])
                          }
                        }}
                      />
                      <div className="h-4" />
                    </div>

                    <div className="shrink-0 border-t border-tf-grey-pastel/50 bg-tf-white/95 px-4 py-3 backdrop-blur-sm sm:px-5">
                      <MessageComposer
                        onSend={onSend}
                        onSendGif={onSendGif}
                        onSendEmote={onSendEmote}
                        tokens={betting.wallet.tokens}
                        unlockedEmoteIds={unlockedEmoteIds}
                        onUnlockEmote={handleUnlockEmote}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                    <div className="text-4xl opacity-50">💬</div>
                    <p className="text-sm font-bold text-tf-grey">
                      Le chat ouvrira 1 minute avant le coup d'envoi
                    </p>
                    <p className="text-xs font-medium text-tf-grey">
                      {msUntilKickoff > 60_000
                        ? `Dans ${Math.ceil(msUntilKickoff / 60_000)} min`
                        : msUntilKickoff > 0
                          ? `Dans ${Math.ceil(msUntilKickoff / 1000)} s`
                          : "C'est parti !"}
                    </p>
                    <p className="text-xs font-semibold text-tf-grey">
                      En attendant, tu peux placer tes paris ci-dessous
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
