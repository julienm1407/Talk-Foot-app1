import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { initialMessages } from '../data/messages'
import { upcomingMatches } from '../data/matches'
import { currentUser, mockUsers } from '../data/users'
import type { Message, ReactionEvent, ReactionType } from '../types/chat'
import { Card } from '../components/ui/Card'
import { ChannelHeader } from '../components/channel/ChannelHeader'
import { LivePitch } from '../components/channel/LivePitch'
import { MatchHighlights } from '../components/channel/MatchHighlights'
import { MessageList } from '../components/channel/MessageList'
import { MessageComposer } from '../components/channel/MessageComposer'
import { ReactionBar } from '../components/reaction/ReactionBar'
import {
  FloatingReactions,
  type FloatingReaction,
} from '../components/reaction/FloatingReactions'
import { LiveEffects } from '../components/reaction/LiveEffects'
import { GoalOverlay } from '../components/reaction/GoalOverlay'
import { EventOverlay } from '../components/reaction/EventOverlay'
import { ReactionSummary } from '../components/reaction/ReactionSummary'
import { ActiveUsers } from '../components/channel/ActiveUsers'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { mockHighlights } from '../data/highlights'
import type { Highlight } from '../data/highlights'
import { BetWidget } from '../components/bet/BetWidget'
import { useBetting } from '../hooks/useBetting'

export function ChannelPage() {
  const { matchId } = useParams()
  const match = useMemo(
    () => upcomingMatches.find((m) => m.id === matchId) ?? null,
    [matchId],
  )

  const users = useMemo(() => [currentUser, ...mockUsers], [])
  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  )

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

  const feedRef = useAutoScroll<HTMLDivElement>([messages.length, floating.length])

  const betting = useBetting(matchId ?? 'unknown')

  const recentReactions = useMemo(() => {
    const now = Date.now()
    return reactions.filter((r) => now - r.createdAt < 60_000)
  }, [reactions])

  // (hype meter removed from UI; keeping reactions for effects + summary)

  if (!match || !matchId) {
    return (
      <Card className="p-6">
        <div className="text-lg font-black tracking-tight text-slate-900">
          Canal introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-slate-600">
          Ce canal n’existe pas encore dans les données de test.
        </div>
      </Card>
    )
  }

  // Simulated match clock + occasional score swing
  useEffect(() => {
    if (match.status !== 'live') return
    setSimMinute(match.minute ?? 1)
    setSimScore(match.score)
    simMinuteRef.current = match.minute ?? 1
    simScoreRef.current = match.score
    const id = window.setInterval(() => {
      setSimMinute((m) => {
        const next = Math.min(99, (m || 1) + 1)
        simMinuteRef.current = next
        return next
      })
      // Tempo plus réaliste: peu d'événements, espacés (lisible).
      const now = Date.now()
      const canOverlay = now - overlayCooldownRef.current > 12_000

      // Very rare goal.
      if (canOverlay && Math.random() < 0.02) {
        const side = Math.random() < 0.5 ? 'home' : 'away'
        overlayCooldownRef.current = now
        triggerGoal(side, 'sim')
      }

      // Other big match events (center overlay): cards and saves.
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
  }, [match.id, match.minute, match.score, match.status, matchId])

  // Lock global page scroll on live match view (everything scrolls inside panels).
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

  const matchView = useMemo(() => {
    if (match.status !== 'live') return match
    return { ...match, minute: simMinute, score: simScore }
  }, [match, simMinute, simScore])

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

    // Resolve "next goal" gamified bets in live.
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
    if (type === 'goal') {
      const side = Math.random() < 0.5 ? 'home' : 'away'
      triggerGoal(side, 'reaction')
      return
    }

    // Keep the center clear: spawn floating reactions on the sides.
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

  const onReact = (type: ReactionType) => emitReaction(type, currentUser.id)

  // Simulated live chat flow
  useEffect(() => {
    if (match.status !== 'live') return
    const phrases = [
      'Ça presse très haut là.',
      'On sent que ça peut basculer sur la prochaine action.',
      'Le milieu se fait manger, faut réagir.',
      'C’est chaud dans la surface…',
      'L’arbitre laisse jouer, ça chauffe.',
      'Quelle intensité, c’est un vrai match de stade.',
      'La relance est risquée…',
      'Ça combine bien sur le côté.',
    ]
    const reactionBag: ReactionType[] = ['confetti', 'flare', 'rage', 'goal']

    const schedule = () => 5200 + Math.random() * 5200
    let timeout = 0
    let burst = 0

    const tick = () => {
      const u = mockUsers[(Math.random() * mockUsers.length) | 0]
      const minuteText = simMinuteRef.current ? ` (${simMinuteRef.current}')` : ''
      const text = `${phrases[(Math.random() * phrases.length) | 0]}${minuteText}`
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

      // Sometimes auto-react to make effects visible
      if (Math.random() < 0.18) {
        emitReaction(reactionBag[(Math.random() * reactionBag.length) | 0], u.id)
      }

      // small burst at start so the live feels populated
      burst += 1
      timeout = window.setTimeout(tick, burst < 2 ? 1200 : schedule())
    }

    timeout = window.setTimeout(tick, 900)
    return () => window.clearTimeout(timeout)
  }, [match.status, matchId])

  return (
    <div className="h-[calc(100dvh-120px)] overflow-hidden">
      <GoalOverlay
        show={showGoal}
        scorer={goalScorer}
        minute={goalMinute}
        colors={goalColors}
        onDone={() => setShowGoal(false)}
      />
      <EventOverlay
        show={eventOverlay.show}
        kind={eventOverlay.kind}
        line1={eventOverlay.line1}
        line2={eventOverlay.line2}
        ms={4200}
        onDone={() => setEventOverlay((s) => ({ ...s, show: false }))}
      />
      <div className="h-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white">
        <LiveEffects events={recentReactions} fullScreen />
        <div className="flex h-full min-h-0 flex-col">
          {/* Live HUD (always visible) */}
          <div className="shrink-0 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ChannelHeader match={matchView} />
              <ActiveUsers users={users} />
            </div>
            {lastMoment ? (
              <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2">
                <span className="text-xs font-black text-slate-900">
                  {lastMoment.minute > 0 ? `${lastMoment.minute}'` : '—'}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {lastMoment.title}
                </span>
                <span className="min-w-0 truncate text-xs font-semibold text-slate-600">
                  {lastMoment.detail}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid flex-1 min-h-0 gap-3 p-3 sm:p-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
            {/* LEFT: Live + moments forts (single panel) */}
            <div className="min-h-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/70">
              <div className="min-h-0 flex h-full flex-col">
                <div className="order-2 shrink-0 p-4 sm:p-5 lg:order-1">
                  <BetWidget match={matchView} betting={betting} />
                </div>
                <div className="h-px bg-slate-200/70" />

                {/* Live pitch + Moments forts side-by-side (more visible) */}
                <div className="order-1 min-h-0 flex-1 p-4 sm:p-5 lg:order-2">
                  <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[1.7fr_0.75fr]">
                    <div className="min-h-0">
                      <div className="flex h-full min-h-0 flex-col">
                        <LivePitch match={matchView} />
                      </div>
                    </div>

                    <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70">
                      <div className="border-b border-slate-200/70 bg-white/80 px-4 py-3">
                        <div className="text-sm font-black text-slate-900">
                          Moments forts
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-slate-600">
                          À droite du live • scroll interne
                        </div>
                      </div>
                      <div className="min-h-0 h-full overflow-y-auto px-4 py-4">
                        <MatchHighlights
                          items={highlights}
                          activeId={lastMoment?.id}
                        />
                        <div className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Chat (single panel) */}
            <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/70">
              <FloatingReactions items={floating} />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-slate-200/70 bg-white/80 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        Chat live
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-600">
                        Ambiance stade • remonte l’historique dans ce panneau.
                      </div>
                      <div className="mt-3">
                        <ReactionSummary reactions={recentReactions} />
                      </div>
                    </div>
                    <ReactionBar onReact={onReact} />
                  </div>
                </div>

                <div
                  ref={feedRef}
                  className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
                  role="log"
                  aria-label="Messages en direct"
                  aria-live="polite"
                >
                  <MessageList messages={messages} usersById={usersById} />
                  <div className="h-1" />
                </div>

                <div className="shrink-0 border-t border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur sm:px-5">
                  <MessageComposer onSend={onSend} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

