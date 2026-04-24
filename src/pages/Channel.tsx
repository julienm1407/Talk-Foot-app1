import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { initialMessages } from '../data/messages'
import { useMatches } from '../contexts/MatchesContext'
import { chatPersonasPool, currentUser, mockFriendUsers, mockUsers } from '../data/users'
import type { Message, ReactionEvent, ReactionType } from '../types/chat'
import { Card } from '../components/ui/Card'
import { ChannelHeader } from '../components/channel/ChannelHeader'
import { MatchXGStrip } from '../components/channel/MatchXGStrip'
import { MatchLiveStatsStrip } from '../components/channel/MatchLiveStatsStrip'
import { MatchTrendsStrip } from '../components/channel/MatchTrendsStrip'
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
import { ReactionSummary } from '../components/reaction/ReactionSummary'
import { HypeMeter } from '../components/reaction/HypeMeter'
import { ActiveUsers } from '../components/channel/ActiveUsers'
import { ShareButton } from '../components/ui/ShareButton'
import { LiveCommentator } from '../components/channel/LiveCommentator'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { mockHighlights } from '../data/highlights'
import { BetWidget } from '../components/bet/BetWidget'
import { useBetting } from '../hooks/useBetting'
import { useSportMonksRound1x2Odds } from '../hooks/useSportMonksRound1x2Odds'
import { useSportMonksFixtureXG } from '../hooks/useSportMonksFixtureXG'
import { useSportMonksFixtureLiveStats } from '../hooks/useSportMonksFixtureLiveStats'
import { useSportMonksFixtureTrends } from '../hooks/useSportMonksFixtureTrends'
import { useUnlockedEmotes } from '../hooks/useUnlockedEmotes'
import { useMessageLikes } from '../hooks/useMessageLikes'
import { themeForCompetition } from '../data/competitionThemes'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { StadiumModeEncart, TribuneQuickSwitch } from '../components/channel/StadiumTribunes'
import { Button } from '../components/ui/Button'
import { cn } from '../utils/cn'
import { useMatchTribune } from '../hooks/useMatchTribune'
import { useMatchStadiumGroup } from '../hooks/useMatchStadiumGroup'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { salonsForMatch } from '../utils/matchSalons'
import { aggregateTribuneStats, useTribuneLiveStats } from '../hooks/useTribuneLiveStats'
import { randomTribuneForBot, TRIBUNES } from '../data/tribunes'
import type { TribuneId } from '../types/tribune'
import { useAuth } from '../contexts/AuthContext'
import { useLiveMatchChatSync } from '../hooks/useLiveMatchChatSync'
import { useLiveMatchReactionsSync } from '../hooks/useLiveMatchReactionsSync'
import { shouldSimulateLiveCrowd } from '../config/liveSimulation'
import { MODERATION_REFUSED_MESSAGE_FR, validateOutgoingChatPayload } from '../utils/bannedWords'

const TF_MOBILE_MENU_SUMMARY =
  'flex w-full cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-tf-grey-pastel/60 bg-white/95 px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-tf-dark shadow-sm outline-none transition hover:bg-tf-ice/80 focus-visible:ring-2 focus-visible:ring-tf-electric/35 [&::-webkit-details-marker]:hidden'

export function ChannelPage() {
  const { matchId } = useParams()
  const { user: authUser } = useAuth()
  const selfChatUserId = authUser?.id ?? 'me'
  const livePersonaSelf = useMemo(() => {
    if (!authUser) return currentUser
    return { ...currentUser, id: authUser.id, username: authUser.displayName }
  }, [authUser])
  const channelMatchId = matchId ?? ''
  const { matches } = useMatches()
  const match = useMemo(
    () => matches.find((m) => m.id === matchId) ?? null,
    [matches, matchId],
  )

  const users = useMemo(() => [currentUser, ...mockFriendUsers, ...mockUsers], [])
  const { virageMode, favoriteClubIds } = useFanPreferences()
  const { tribune: activeTribune, setTribune } = useMatchTribune(matchId)
  const { stadiumGroupId, clearStadiumGroup } = useMatchStadiumGroup(matchId)
  const { groups: supporterGroupsAll, joinedGroupIds } = useSupporterGroups()
  const activeStadiumGroup = useMemo(
    () =>
      stadiumGroupId
        ? supporterGroupsAll.find((g) => g.id === stadiumGroupId) ?? null
        : null,
    [stadiumGroupId, supporterGroupsAll],
  )
  const salonPoolGroupIds = useMemo(() => {
    if (!match) return [] as string[]
    return salonsForMatch(match, supporterGroupsAll).map((p) => p.group.id)
  }, [match, supporterGroupsAll])

  const scarfChoices = useMemo(
    () =>
      supporterGroupsAll
        .filter((g) => joinedGroupIds.includes(g.id) && g.scarf)
        .map((g) => ({
          groupId: g.id,
          groupName: g.name,
          text: g.scarf!.label,
          colorA: g.scarf!.colorA,
          colorB: g.scarf!.colorB,
          colorC: g.scarf!.colorC,
        })),
    [supporterGroupsAll, joinedGroupIds],
  )
  const tribuneLiveStats = useTribuneLiveStats()
  const [chatFeedScope, setChatFeedScope] = useState<'general' | 'tribune'>('tribune')

  const usersById = useMemo(() => {
    const base = Object.fromEntries(users.map((u) => [u.id, u]))
    const meClub = favoriteClubIds[0]
    if (meClub && base.me && !base.me.fanClubId) {
      base.me = { ...base.me, fanClubId: meClub }
    }
    if (authUser) {
      const seed =
        authUser.displayName.trim().slice(0, 12).replace(/\s+/g, '-') || 'you'
      base[authUser.id] = {
        id: authUser.id,
        username: authUser.displayName,
        avatarSeed: seed,
        accent: 'emerald',
        ...(meClub ? { fanClubId: meClub } : {}),
      }
    }
    return base
  }, [users, favoriteClubIds, authUser])

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

  useEffect(() => {
    if (!matchId) return
    const seeded = initialMessages.filter((m) => m.matchId === matchId)
    setMessages(
      seeded.length
        ? seeded
        : [
            {
              id: 'msg-welcome',
              matchId,
              userId: 'u-1',
              text: 'Bienvenue dans le live. Balance ton premier avis.',
              createdAt: Date.now() - 25_000,
            },
          ],
    )
  }, [matchId])

  const mergeRemoteMessages = useCallback((incoming: Message[]) => {
    if (!incoming.length) return
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      const next = [...prev]
      for (const m of incoming) {
        if (!seen.has(m.id)) {
          next.push(m)
          seen.add(m.id)
        }
      }
      next.sort((a, b) => a.createdAt - b.createdAt)
      return next.slice(-280)
    })
  }, [])

  const [reactions, setReactions] = useState<ReactionEvent[]>([])
  const [floating, setFloating] = useState<FloatingReaction[]>([])
  const idRef = useRef(0)
  const [simMinute, setSimMinute] = useState<number>(() => match?.minute ?? 0)
  const [simScore, setSimScore] = useState<{ home: number; away: number } | undefined>(
    () => match?.score,
  )
  const simMinuteRef = useRef<number>(match?.minute ?? 0)
  const simScoreRef = useRef<{ home: number; away: number } | undefined>(match?.score)

  const pipContainerRef = useRef<HTMLDivElement | null>(null)
  const chatColumnRef = useRef<HTMLDivElement | null>(null)
  const betting = useBetting(matchId ?? 'unknown')
  const { odds1x2: bookOdds1x2, oddsLoading: bookOddsLoading } = useSportMonksRound1x2Odds(
    match?.sportMonksFixtureId,
    match?.sportMonksRoundId,
    match?.status,
  )
  const { xgTotals, xgLoading } = useSportMonksFixtureXG(
    match?.sportMonksFixtureId,
    match?.status ?? 'upcoming',
  )
  const { liveStatRows, liveStatsLoading, smTimelineHighlights } = useSportMonksFixtureLiveStats(
    match?.sportMonksFixtureId,
    match?.status ?? 'upcoming',
    channelMatchId || undefined,
  )

  const highlights = useMemo(() => {
    if (smTimelineHighlights.length > 0) return smTimelineHighlights
    return mockHighlights.filter((h) => h.matchId === matchId)
  }, [smTimelineHighlights, matchId])

  const lastMoment = useMemo(() => {
    if (match?.status !== 'live' || highlights.length === 0) return null
    const sorted = [...highlights].sort((a, b) => {
      if (b.minute !== a.minute) return b.minute - a.minute
      const ord = (b.order ?? 0) - (a.order ?? 0)
      if (ord !== 0) return ord
      return b.id.localeCompare(a.id)
    })
    return sorted[0] ?? null
  }, [match?.status, highlights])
  const { trendRows, trendsLoading, trendRecentForm } = useSportMonksFixtureTrends(
    match?.sportMonksFixtureId,
    match?.status ?? 'upcoming',
  )
  const { unlockedIds: unlockedEmoteIds, unlock: unlockEmote } = useUnlockedEmotes()
  const messageLikes = useMessageLikes()

  const recentReactions = useMemo(() => {
    const now = Date.now()
    return reactions.filter((r) => now - r.createdAt < 60_000)
  }, [reactions])

  const visibleMessages = useMemo(() => {
    let list = messages
    if (virageMode && favoriteClubIds.length > 0) {
      list = messages.filter((m) => {
        if (m.userId === selfChatUserId) return true
        if (m.authorDisplayName) return true
        const u = usersById[m.userId]
        const fid = u?.fanClubId
        return Boolean(fid && favoriteClubIds.includes(fid))
      })
    }
    if (stadiumGroupId) {
      list = list.filter(
        (m) => m.userId === selfChatUserId || m.supporterGroupId === stadiumGroupId,
      )
    } else if (chatFeedScope === 'tribune') {
      list = list.filter((m) => !m.tribune || m.tribune === activeTribune)
    }
    return list
  }, [
    messages,
    virageMode,
    favoriteClubIds,
    usersById,
    activeTribune,
    chatFeedScope,
    stadiumGroupId,
    selfChatUserId,
  ])

  const crowdMetrics = useMemo(() => {
    if (stadiumGroupId && activeStadiumGroup) {
      const est = Math.round(
        activeStadiumGroup.members * (activeStadiumGroup.intensity / 100) * 0.04,
      )
      return {
        participants: Math.max(28, Math.min(9200, est)),
        activity: activeStadiumGroup.intensity,
      }
    }
    if (chatFeedScope === 'general') {
      return aggregateTribuneStats(tribuneLiveStats)
    }
    return tribuneLiveStats[activeTribune]
  }, [
    activeStadiumGroup,
    chatFeedScope,
    activeTribune,
    stadiumGroupId,
    tribuneLiveStats,
  ])

  const reactionDensity =
    stadiumGroupId && activeStadiumGroup
      ? activeStadiumGroup.intensity < 42
        ? 'minimal'
        : 'full'
      : chatFeedScope === 'general'
        ? 'full'
        : activeTribune === 'analyse'
          ? 'minimal'
          : activeTribune === 'chill'
            ? 'chill'
            : 'full'

  const tribuneAccentClass =
    stadiumGroupId && activeStadiumGroup
      ? 'border-l-transparent'
      : chatFeedScope === 'general'
        ? 'border-l-slate-400/45'
        : activeTribune === 'virage'
          ? 'border-l-rose-400/55'
          : activeTribune === 'analyse'
            ? 'border-l-slate-400/50'
            : 'border-l-teal-400/50'

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

  const { publishMessage, isCloudChatConfigured } = useLiveMatchChatSync({
    matchId: channelMatchId,
    enabled: isLiveOpen,
    onRemoteMessages: mergeRemoteMessages,
  })
  const cloudChatEnabled = isCloudChatConfigured && isLiveOpen

  const [chatModerationHint, setChatModerationHint] = useState<string | null>(null)

  const pushReactionEffects = useCallback((event: ReactionEvent, withFloating: boolean) => {
    setReactions((prev) => {
      if (prev.some((r) => r.id === event.id)) return prev
      return [...prev, event].slice(-80)
    })
    if (!withFloating) return
    setFloating((prev) => {
      if (prev.some((f) => f.id === event.id)) return prev
      const side = Math.random() < 0.5 ? 'left' : 'right'
      const sideJitter = 4 + Math.random() * 6
      const xPct = side === 'left' ? 2 + sideJitter : 98 - sideJitter
      const bottomPx = 18 + Math.random() * 92
      const float: FloatingReaction = {
        id: event.id,
        type: event.type,
        createdAt: event.createdAt,
        xPct,
        bottomPx,
      }
      window.setTimeout(() => {
        setFloating((p) => p.filter((f) => f.id !== event.id))
      }, 950)
      return [...prev, float].slice(-16)
    })
  }, [])

  const mergeHydrateReactions = useCallback(
    (events: ReactionEvent[]) => {
      if (!events.length) return
      setReactions((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        const next = [...prev]
        for (const e of events) {
          if (!seen.has(e.id)) {
            next.push(e)
            seen.add(e.id)
          }
        }
        next.sort((a, b) => a.createdAt - b.createdAt)
        return next.slice(-80)
      })
      /* Après hydratation : rejouer léger effet visuel pour les toutes dernières (fumigène / confettis / emojis). */
      window.setTimeout(() => {
        for (const e of events.slice(-6)) {
          pushReactionEffects(e, true)
        }
      }, 0)
    },
    [pushReactionEffects],
  )

  const emitReaction = useCallback(
    (
      type: ReactionType,
      userId: string,
      preset?: { id: string; createdAt: number },
      withFloating = true,
    ) => {
      const id = preset?.id ?? `rx-${Date.now()}-${idRef.current++}`
      const createdAt = preset?.createdAt ?? Date.now()
      const event: ReactionEvent = {
        id,
        matchId: channelMatchId,
        userId,
        type,
        createdAt,
      }
      pushReactionEffects(event, withFloating)
    },
    [channelMatchId, pushReactionEffects],
  )

  const onLiveInsertReaction = useCallback(
    (event: ReactionEvent) => {
      emitReaction(event.type, event.userId, { id: event.id, createdAt: event.createdAt }, true)
    },
    [emitReaction],
  )

  const { publishReaction: publishLiveReaction, isCloudReactionsConfigured } = useLiveMatchReactionsSync({
    matchId: channelMatchId,
    enabled: isLiveOpen,
    onHydrate: mergeHydrateReactions,
    onLiveInsert: onLiveInsertReaction,
  })
  const cloudReactionsEnabled = isCloudReactionsConfigured && isLiveOpen

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

  const matchView = useMemo(() => {
    if (!match) return null
    if (match.status !== 'live') return match
    return { ...match, minute: simMinute, score: simScore }
  }, [match, simMinute, simScore])

  // Minute / score live : uniquement les valeurs renvoyées par SportMonks (via `MatchesContext`, poll ~45 s).
  useEffect(() => {
    if (!match || match.status !== 'live') return
    setSimMinute(match.minute ?? 0)
    setSimScore(match.score ?? { home: 0, away: 0 })
    simMinuteRef.current = match.minute ?? 0
    simScoreRef.current = match.score ?? { home: 0, away: 0 }
  }, [
    match?.id,
    match?.status,
    match?.minute,
    match?.score?.home,
    match?.score?.away,
  ])

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

  const messageExtras = () =>
    stadiumGroupId
      ? { tribune: activeTribune, supporterGroupId: stadiumGroupId }
      : { tribune: activeTribune }

  const tryCloudThenLocal = useCallback(
    async (msg: Message) => {
      setChatModerationHint(null)
      if (!validateOutgoingChatPayload({ text: msg.text, groupScarf: msg.groupScarf }).ok) {
        setChatModerationHint(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      if (cloudChatEnabled) {
        const r = await publishMessage({
          matchId: msg.matchId,
          text: msg.text,
          tribune: msg.tribune,
          supporterGroupId: msg.supporterGroupId,
          gifUrl: msg.gifUrl,
          emoteId: msg.emoteId,
          groupScarf: msg.groupScarf,
        })
        if (r.ok) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === r.message.id)) return prev
            return [...prev, r.message].sort((a, b) => a.createdAt - b.createdAt).slice(-280)
          })
          return
        }
        if (r.error === 'moderation') {
          setChatModerationHint(MODERATION_REFUSED_MESSAGE_FR)
          return
        }
      }
      setMessages((prev) => [...prev, msg])
    },
    [cloudChatEnabled, publishMessage],
  )

  const onSend = (text: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId: channelMatchId,
      userId: selfChatUserId,
      text,
      createdAt: Date.now(),
      ...messageExtras(),
    }
    void tryCloudThenLocal(msg)
  }

  const onSendGif = (gifUrl: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId: channelMatchId,
      userId: selfChatUserId,
      text: '[GIF]',
      createdAt: Date.now(),
      gifUrl,
      ...messageExtras(),
    }
    void tryCloudThenLocal(msg)
  }

  const onSendEmote = (emoteId: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId: channelMatchId,
      userId: selfChatUserId,
      text: '[Emote]',
      createdAt: Date.now(),
      emoteId,
      ...messageExtras(),
    }
    void tryCloudThenLocal(msg)
  }

  const onSendScarf = (payload: NonNullable<Message['groupScarf']>) => {
    const msg: Message = {
      id: `msg-scarf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      matchId: channelMatchId,
      userId: selfChatUserId,
      text: '',
      createdAt: Date.now(),
      groupScarf: payload,
      ...messageExtras(),
    }
    void tryCloudThenLocal(msg)
  }

  const handleUnlockEmote = (emoteId: string, cost: number): boolean => {
    const result = betting.spendTokens(cost, 'emote')
    if (!result.ok) return false
    unlockEmote(emoteId)
    return true
  }

  const onReact = (type: ReactionType) => {
    const cost = reactionMeta[type].cost
    const result = betting.spendTokens(cost, 'reaction')
    if (!result.ok) return
    void (async () => {
      if (cloudReactionsEnabled) {
        const r = await publishLiveReaction(type)
        if (r.ok) {
          emitReaction(type, selfChatUserId, { id: r.event.id, createdAt: r.event.createdAt })
          return
        }
      }
      emitReaction(type, selfChatUserId)
    })()
  }

  useEffect(() => {
    if (!shouldSimulateLiveCrowd()) return
    if (!match || match.status !== 'live') return
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
      const u = chatPersonasPool[(Math.random() * chatPersonasPool.length) | 0]
      const text = phrases[(Math.random() * phrases.length) | 0]
      const gid = stadiumGroupId
        ? stadiumGroupId
        : salonPoolGroupIds.length > 0
          ? salonPoolGroupIds[(Math.random() * salonPoolGroupIds.length) | 0]
          : undefined
      setMessages((prev) =>
        [
          ...prev,
          {
            id: `msg-bot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            matchId: channelMatchId,
            userId: u.id,
            text,
            createdAt: Date.now(),
            tribune: randomTribuneForBot(),
            ...(gid ? { supporterGroupId: gid } : {}),
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
  }, [match?.status, matchId, stadiumGroupId, salonPoolGroupIds, channelMatchId, emitReaction])

  if (!match || !matchId || !matchView) {
    return (
      <Card className="p-6">
        <div className="font-display text-lg font-black tracking-tight text-tf-dark">
          Canal introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-tf-grey">
          Ce match n’est pas dans le calendrier chargé (SportMonks). Ouvre l’agenda pour en choisir un autre.
        </div>
      </Card>
    )
  }

  return (
    <div
      className={cn(
        'tf-match-page flex w-full min-w-0 flex-col',
        'max-lg:flex-none max-lg:overflow-visible max-lg:pb-2',
        'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
      )}
      style={
        {
          '--tf-match-home': match.home.colors.primary,
          '--tf-match-away': match.away.colors.primary,
          '--tf-match-accent': compTheme?.accent ?? '#0a3dff',
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'relative isolate flex flex-col rounded-2xl border border-tf-grey-pastel/50 bg-tf-white shadow-[0_8px_40px_rgba(1,30,51,0.08)]',
          'max-lg:overflow-visible',
          'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
        )}
      >
        {isLiveOpen ? <LiveEffects events={recentReactions} fullScreen /> : null}
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
        <div
          className={cn(
            'flex flex-col',
            'max-lg:flex-none max-lg:overflow-visible',
            'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
          )}
        >
          {/* Hero header */}
          <div
            className={cn(
              'shrink-0 border-b border-tf-grey-pastel/50 bg-tf-white/95 px-2.5 py-1.5 backdrop-blur-md sm:px-4 sm:py-2 lg:py-2.5',
              isLiveOpen && 'pt-2 sm:pt-2.5 sm:pt-3',
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ChannelHeader match={matchView} />
                {match?.sportMonksFixtureId ? (
                  <div className="flex max-w-xl flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-stretch">
                    <MatchXGStrip
                      match={matchView}
                      xg={xgTotals}
                      loading={xgLoading}
                      className="min-w-0 sm:max-w-[15rem]"
                    />
                    {(match.status === 'live' || match.status === 'finished') && (
                      <MatchLiveStatsStrip
                        match={matchView}
                        rows={liveStatRows}
                        loading={liveStatsLoading}
                        className="min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-md"
                      />
                    )}
                    <MatchTrendsStrip
                      match={matchView}
                      rows={trendRows}
                      loading={trendsLoading}
                      className="min-w-0 sm:max-w-[15rem]"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start sm:justify-start">
                <ShareButton
                  compact
                  path={`/channel/${channelMatchId}`}
                  title={`${match.home.shortName} – ${match.away.shortName}`}
                  text={`Salon live Talk Foot : ${match.home.shortName} – ${match.away.shortName}`}
                />
                <ActiveUsers users={users} />
              </div>
            </div>
            <div className="mt-3 hidden flex-col gap-2 sm:mt-2 sm:flex sm:flex-row sm:flex-wrap">
              <Button
                variant="primary"
                type="button"
                className="min-h-11 w-full shrink-0 sm:min-h-0 sm:w-auto"
                onClick={() =>
                  chatColumnRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  })
                }
              >
                {match.status === 'live'
                  ? 'Rejoindre le live'
                  : match.status === 'upcoming'
                    ? 'Avant-match'
                    : 'Salon match'}
              </Button>
              <Link
                to={`/channel/${match.id}/stade?salons=1`}
                className={cn(
                  'tf-btn-fluid inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-tf-grey-pastel/60 bg-white/95 px-4 py-2 text-sm font-semibold text-[#011e33] font-display outline-none transition',
                  'hover:border-tf-electric/25 hover:bg-tf-ice/80 focus-visible:ring-2 focus-visible:ring-tf-electric/40',
                  'sm:min-h-0 sm:w-auto',
                )}
              >
                Rejoindre un salon
              </Link>
            </div>
            <details className="group mt-2 sm:hidden">
              <summary className={TF_MOBILE_MENU_SUMMARY}>
                <span className="flex items-center gap-2">
                  <span aria-hidden>⚡</span>
                  Accès rapide au live
                </span>
                <span className="text-[10px] text-tf-grey transition group-open:rotate-180" aria-hidden>
                  ▼
                </span>
              </summary>
              <div className="mt-2 flex flex-col gap-2 rounded-xl border border-tf-grey-pastel/40 bg-tf-grey-pastel/10 p-2">
                <Button
                  variant="primary"
                  type="button"
                  className="min-h-11 w-full"
                  onClick={() =>
                    chatColumnRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    })
                  }
                >
                  {match.status === 'live'
                    ? 'Rejoindre le live'
                    : match.status === 'upcoming'
                      ? 'Avant-match'
                      : 'Salon match'}
                </Button>
                <Link
                  to={`/channel/${match.id}/stade?salons=1`}
                  className={cn(
                    'tf-btn-fluid inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-tf-grey-pastel/60 bg-white/95 px-4 py-2 text-sm font-semibold text-[#011e33] font-display outline-none transition',
                    'hover:border-tf-electric/25 hover:bg-tf-ice/80 focus-visible:ring-2 focus-visible:ring-tf-electric/40',
                  )}
                >
                  Rejoindre un salon
                </Link>
              </div>
            </details>
            {isLiveOpen && match.status === 'live' && lastMoment ? (
              <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/20 px-3 py-2 sm:gap-3 sm:px-3.5">
                <span className="text-xs font-black tabular-nums text-tf-grey">
                  {lastMoment.minute > 0 ? `${lastMoment.minute}'` : '—'}
                </span>
                <span className="text-sm font-black text-tf-dark">
                  {lastMoment.title.trim() ||
                    (lastMoment.type === 'Info' ? 'Commentaire' : lastMoment.type)}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-tf-grey">
                  {lastMoment.detail}
                </span>
              </div>
            ) : null}
            {isLiveOpen ? (
              <>
                <details className="group mt-2 lg:hidden">
                  <summary className={TF_MOBILE_MENU_SUMMARY}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden>🏟️</span>
                      Tribunes & vue stade
                    </span>
                    <span className="text-[10px] text-tf-grey transition group-open:rotate-180" aria-hidden>
                      ▼
                    </span>
                  </summary>
                  <div className="mt-1 rounded-xl border border-tf-grey-pastel/40 bg-tf-grey-pastel/10 p-2">
                    <StadiumModeEncart
                      matchId={match.id}
                      activeTribune={activeTribune}
                      stadiumGroupLabel={activeStadiumGroup?.name ?? null}
                      stadiumGroupEmoji={activeStadiumGroup?.emoji ?? null}
                      onClearStadiumGroup={stadiumGroupId ? clearStadiumGroup : undefined}
                    />
                  </div>
                </details>
                <div className="mt-2 hidden lg:block">
                  <StadiumModeEncart
                    matchId={match.id}
                    activeTribune={activeTribune}
                    stadiumGroupLabel={activeStadiumGroup?.name ?? null}
                    stadiumGroupEmoji={activeStadiumGroup?.emoji ?? null}
                    onClearStadiumGroup={stadiumGroupId ? clearStadiumGroup : undefined}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div
            className={cn(
              'flex flex-col gap-2 p-2 sm:gap-3 sm:p-3',
              'max-lg:flex-none max-lg:overflow-visible',
              'lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[1.2fr_0.8fr] lg:grid-rows-1 lg:items-stretch lg:overflow-hidden xl:grid-cols-[1.25fr_0.75fr]',
            )}
          >
            {/* Haut : terrain, moments, pronos — sur mobile tout suit le scroll page */}
            <div
              className={cn(
                'flex w-full min-w-0 flex-col gap-2 sm:gap-3',
                'max-lg:flex-none max-lg:overflow-visible',
                'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
              )}
            >
              <div className="flex min-w-0 max-w-full flex-col overflow-visible rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-tf-grey-pastel/20 to-tf-white/90 shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-hidden">
                <div className="order-2 shrink-0 border-b border-tf-grey-pastel/50 lg:order-1">
                  <details className="group lg:hidden">
                    <summary className={TF_MOBILE_MENU_SUMMARY}>
                      <span className="flex items-center gap-2">
                        <span aria-hidden>🎯</span>
                        Paris & pronos
                      </span>
                      <span className="text-[10px] text-tf-grey transition group-open:rotate-180" aria-hidden>
                        ▼
                      </span>
                    </summary>
                    <div className="border-t border-tf-grey-pastel/40 p-2.5 sm:p-3">
                      <BetWidget
                        match={matchView}
                        betting={betting}
                        bookOdds1x2={bookOdds1x2}
                        bookOddsLoading={bookOddsLoading}
                        compact
                      />
                    </div>
                  </details>
                  <div className="hidden p-2.5 sm:p-3 lg:block">
                    <BetWidget
                      match={matchView}
                      betting={betting}
                      bookOdds1x2={bookOdds1x2}
                      bookOddsLoading={bookOddsLoading}
                      compact
                    />
                  </div>
                </div>
                <div className="order-1 min-h-0 flex-1 p-2.5 sm:p-3 lg:order-2">
                  <div
                    className={cn(
                      'grid min-h-0 gap-2 sm:gap-3',
                      'max-lg:auto-rows-min',
                      isLiveOpen
                        ? 'lg:h-full lg:grid-cols-1 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[1.05fr_0.95fr] xl:grid-rows-none'
                        : 'grid-cols-1 lg:h-full',
                    )}
                  >
                    {isLiveOpen && (
                      <div className="relative flex min-h-[9rem] flex-col overflow-hidden max-lg:max-h-[min(32vh,260px)] max-lg:min-h-[9rem] lg:min-h-0 lg:h-full lg:overflow-visible">
                        <div
                          ref={pipContainerRef}
                          className="absolute top-2 right-2 z-30 h-0 w-0 overflow-visible sm:top-4 sm:right-4"
                          aria-hidden="true"
                        />
                        <LivePitch match={matchView} />
                      </div>
                    )}
                    <details className="group flex min-h-0 flex-col overflow-hidden rounded-xl border border-tf-grey-pastel/50 bg-tf-white/90 shadow-sm lg:hidden">
                      <summary className="shrink-0 list-none border-b border-tf-grey-pastel/50 px-3 py-2 sm:px-3.5 [&::-webkit-details-marker]:hidden">
                        <div className="flex cursor-pointer items-start justify-between gap-2">
                          <div>
                            <h2 className="font-display text-sm font-black text-tf-dark">
                              {match.status === 'live' ? 'Moments forts' : 'Avant-match'}
                            </h2>
                            <p className="mt-0.5 text-xs font-medium text-tf-grey">
                              {match.status === 'live'
                                ? 'Timeline — ouvrir pour tout voir'
                                : 'Compos & infos — ouvrir'}
                            </p>
                          </div>
                          <span
                            className="mt-0.5 text-[10px] font-black text-tf-grey transition group-open:rotate-180"
                            aria-hidden
                          >
                            ▼
                          </span>
                        </div>
                      </summary>
                      <div
                        className={cn(
                          'max-h-[min(42vh,300px)] min-h-0 overflow-y-auto px-3 py-2 sm:px-3.5 [-webkit-overflow-scrolling:touch]',
                          'overscroll-y-auto',
                        )}
                      >
                        {match.status === 'live' ? (
                          <MatchHighlights items={highlights} activeId={lastMoment?.id} />
                        ) : (
                          <MatchPreview
                            match={match}
                            trendRecentForm={trendRecentForm}
                            trendsLoading={trendsLoading}
                          />
                        )}
                        <div className="h-4" />
                      </div>
                    </details>
                    <div className="hidden min-h-[10rem] flex-col overflow-hidden rounded-xl border border-tf-grey-pastel/50 bg-tf-white/90 shadow-sm lg:flex lg:min-h-0 lg:flex-1">
                      <div className="shrink-0 border-b border-tf-grey-pastel/50 px-3 py-2 sm:px-3.5">
                        <h2 className="font-display text-sm font-black text-tf-dark">
                          {match.status === 'live' ? 'Moments forts' : 'Avant-match'}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-tf-grey">
                          {match.status === 'live'
                            ? 'Timeline du match'
                            : 'Compos probables, forme, infos'}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-3.5 [-webkit-overflow-scrolling:touch]',
                          'lg:overscroll-y-contain',
                        )}
                      >
                        {match.status === 'live' ? (
                          <MatchHighlights
                            items={highlights}
                            activeId={lastMoment?.id}
                          />
                        ) : (
                          <MatchPreview
                            match={match}
                            trendRecentForm={trendRecentForm}
                            trendsLoading={trendsLoading}
                          />
                        )}
                        <div className="h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Chat (bloqué avant J-1 min) */}
            <div
              ref={chatColumnRef}
              id="channel-live-chat"
              className={cn(
                'relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-tf-grey-pastel/50 border-l-4 bg-gradient-to-b from-tf-grey-pastel/15 to-tf-white/95 shadow-sm',
                'max-lg:mt-1 max-lg:min-h-0 max-lg:flex-none max-lg:overflow-visible',
                /* Moins de scroll excessif quand on vise le chat depuis « Rejoindre le live » */
                'scroll-mt-[max(4.5rem,env(safe-area-inset-top,0px))]',
                'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
                tribuneAccentClass,
              )}
              style={
                activeStadiumGroup
                  ? { borderLeftColor: activeStadiumGroup.theme.primary }
                  : undefined
              }
            >
              {isLiveOpen ? <FloatingReactions items={floating} /> : null}
              <div
                className={cn(
                  'flex flex-col',
                  'max-lg:flex-none max-lg:overflow-visible',
                  'lg:min-h-0 lg:flex-1 lg:overflow-hidden',
                )}
              >
                <div className="shrink-0 border-b border-tf-grey-pastel/50 px-2 py-1 sm:px-3.5 sm:py-2">
                  <h2 className="font-display text-xs font-black text-tf-dark sm:text-sm">Chat live</h2>
                  {isLiveOpen ? (
                    <div className="mt-1 space-y-1.5 sm:mt-2 sm:space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-x-3">
                        {stadiumGroupId && activeStadiumGroup ? (
                          <>
                            <details className="group min-w-0 w-full lg:hidden">
                              <summary
                                className={cn(
                                  TF_MOBILE_MENU_SUMMARY,
                                  'normal-case tracking-normal',
                                )}
                              >
                                <span className="min-w-0 truncate font-black">
                                  {activeStadiumGroup.emoji} Salon : {activeStadiumGroup.name}
                                </span>
                                <span
                                  className="shrink-0 text-[10px] text-tf-grey transition group-open:rotate-180"
                                  aria-hidden
                                >
                                  ▼
                                </span>
                              </summary>
                              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-tf-grey-pastel/40 bg-tf-grey-pastel/10 p-2">
                                <Button
                                  type="button"
                                  variant="primary"
                                  className="h-8 shrink-0 rounded-xl px-2.5 py-0 text-[10px] font-black sm:h-9 sm:px-3 sm:text-[11px]"
                                  onClick={clearStadiumGroup}
                                >
                                  🏟️ Tout le stade
                                </Button>
                                <Link
                                  to={`/channel/${match.id}/stade`}
                                  className="shrink-0 text-[10px] font-black text-tf-electric underline decoration-2 underline-offset-2"
                                >
                                  Tribunes
                                </Link>
                              </div>
                            </details>
                            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex">
                              <Button
                                type="button"
                                variant="primary"
                                className="h-8 shrink-0 rounded-xl px-2.5 py-0 text-[10px] font-black sm:h-9 sm:px-3 sm:text-[11px]"
                                onClick={clearStadiumGroup}
                              >
                                🏟️ Tout le stade
                              </Button>
                              <span
                                className="max-w-[min(100%,200px)] truncate rounded-xl border border-violet-200/80 bg-violet-50/90 px-2 py-1 text-[10px] font-black text-violet-950"
                                title={activeStadiumGroup.name}
                              >
                                {activeStadiumGroup.emoji} {activeStadiumGroup.name}
                              </span>
                              <Link
                                to={`/channel/${match.id}/stade`}
                                className="shrink-0 text-[10px] font-black text-tf-electric underline decoration-2 underline-offset-2"
                              >
                                Tribunes
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="hidden min-w-0 flex-1 lg:block">
                              <TribuneQuickSwitch
                                feedScope={chatFeedScope}
                                onSelectGeneral={() => setChatFeedScope('general')}
                                selected={activeTribune}
                                onSelect={(id) => {
                                  setTribune(id)
                                  setChatFeedScope('tribune')
                                }}
                              />
                            </div>
                            <div className="w-full min-w-0 lg:hidden">
                              <label htmlFor="tf-channel-tribune" className="sr-only">
                                Zone d&apos;affichage du chat
                              </label>
                              <select
                                id="tf-channel-tribune"
                                className="w-full rounded-lg border border-tf-grey-pastel/60 bg-white px-2 py-1.5 text-[10px] font-black text-tf-dark shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[11px]"
                                value={chatFeedScope === 'general' ? 'general' : activeTribune}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (v === 'general') setChatFeedScope('general')
                                  else {
                                    setTribune(v as TribuneId)
                                    setChatFeedScope('tribune')
                                  }
                                }}
                              >
                                <option value="general">🏟️ Général (toutes tribunes)</option>
                                {TRIBUNES.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.emoji} Tribune {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        <span
                          className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500 max-lg:ml-auto"
                          aria-live="polite"
                          title="Estimation live (démo)"
                        >
                          {crowdMetrics.participants.toLocaleString('fr-FR')} spect. · {crowdMetrics.activity}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Ouvre 1 minute avant le coup d&apos;envoi
                    </p>
                  )}
                  {isLiveOpen && (
                    <>
                      <div className="mt-2 hidden flex-col gap-1.5 border-t border-tf-grey-pastel/40 pt-2 sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <HypeMeter
                            value={ambianceLevel}
                            totalReactions={recentReactions.length}
                            className="w-full max-w-[240px]"
                            homeColor={match.home.colors.primary}
                            awayColor={match.away.colors.primary}
                          />
                          <ReactionBar
                            onReact={onReact}
                            tokens={betting.wallet.tokens}
                            density={reactionDensity}
                          />
                        </div>
                        <div className="shrink-0 border-t border-tf-grey-pastel/40 pt-2 sm:border-t-0 sm:border-l sm:border-tf-grey-pastel/40 sm:pl-3 sm:pt-0">
                          <ReactionSummary reactions={recentReactions} />
                        </div>
                      </div>
                      <details className="mt-2 border-t border-tf-grey-pastel/40 pt-1.5 sm:hidden">
                        <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-wide text-slate-500 [&::-webkit-details-marker]:hidden">
                          Ambiance & réactions
                        </summary>
                        <div className="mt-2 flex flex-col gap-2">
                          <HypeMeter
                            value={ambianceLevel}
                            totalReactions={recentReactions.length}
                            className="w-full max-w-[240px]"
                            homeColor={match.home.colors.primary}
                            awayColor={match.away.colors.primary}
                          />
                          <ReactionBar
                            onReact={onReact}
                            tokens={betting.wallet.tokens}
                            density={reactionDensity}
                          />
                          <ReactionSummary reactions={recentReactions} />
                        </div>
                      </details>
                    </>
                  )}
                </div>

                {isLiveOpen ? (
                  <>
                    <div
                      ref={feedRef}
                      className={cn(
                        'px-2 py-1.5 sm:px-4 sm:py-3',
                        /* Mobile : encart court + scroll interne aux messages */
                        'max-lg:min-h-[5.5rem] max-lg:max-h-[min(28vh,200px)] max-lg:overflow-y-auto max-lg:overscroll-y-contain max-lg:[-webkit-overflow-scrolling:touch]',
                        'lg:min-h-0 lg:flex-1 lg:max-h-none lg:overflow-y-auto lg:overscroll-y-contain lg:[-webkit-overflow-scrolling:touch]',
                      )}
                      role="log"
                      aria-label="Messages en direct"
                      aria-live="polite"
                    >
                      <MessageList
                        messages={visibleMessages}
                        usersById={usersById}
                        selfUserId={selfChatUserId}
                        getLikes={messageLikes.getLikes}
                        hasLiked={(id) => messageLikes.hasLiked(id, selfChatUserId)}
                        onToggleLike={(m) => {
                          if (messageLikes.hasLiked(m.id, 'me')) {
                            messageLikes.unlike(m.id)
                          } else {
                            messageLikes.like(m.id, m, match, usersById[m.userId])
                          }
                        }}
                      />
                      <div className="h-2 sm:h-4" />
                    </div>

                    {isLiveOpen && match.status === 'live' ? (
                      <LiveCommentator
                        pipTargetRef={pipContainerRef}
                        user={livePersonaSelf}
                        onCommentary={(text) => {
                          const msg: Message = {
                            id: `msg-com-${Date.now()}`,
                            matchId: channelMatchId,
                            userId: selfChatUserId,
                            text: `🎙️ ${text}`,
                            createdAt: Date.now(),
                            ...messageExtras(),
                          }
                          void tryCloudThenLocal(msg)
                        }}
                      />
                    ) : null}

                    <div className="shrink-0 border-t border-tf-grey-pastel/50 bg-tf-white/95 px-2 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2.5">
                      {chatModerationHint ? (
                        <p className="mb-2 rounded-xl border border-rose-200/80 bg-rose-50/95 px-3 py-2 text-xs font-semibold text-rose-800">
                          {chatModerationHint}
                        </p>
                      ) : null}
                      <MessageComposer
                        onSend={onSend}
                        onSendGif={onSendGif}
                        onSendEmote={onSendEmote}
                        tokens={betting.wallet.tokens}
                        unlockedEmoteIds={unlockedEmoteIds}
                        onUnlockEmote={handleUnlockEmote}
                        richMedia={reactionDensity !== 'chill'}
                        placeholder={
                          reactionDensity === 'chill'
                            ? 'Message texte (zone Chill)…'
                            : 'Écrire un message…'
                        }
                        scarfChoices={scarfChoices.length > 0 ? scarfChoices : undefined}
                        onSendScarf={scarfChoices.length > 0 ? onSendScarf : undefined}
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
