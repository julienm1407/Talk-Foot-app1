import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Debate } from '../../data/debates'
import type { Message } from '../../types/chat'
import { useAuth } from '../../contexts/AuthContext'
import { useDebates } from '../../contexts/DebatesContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useChatSendGuard } from '../../hooks/useChatSendGuard'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import { useSupporterGroupChannelSync } from '../../hooks/useSupporterGroupChannelSync'
import { useSupporterGroupMessageLikesSync } from '../../hooks/useSupporterGroupMessageLikesSync'
import type { User } from '../../types/chat'
import { useProfile } from '../../hooks/useProfile'
import { useSubscription } from '../../hooks/useSubscription'
import { useTalkFootChatActorId } from '../../hooks/useTalkFootChatActorId'
import { useChatAuthorModularAvatars } from '../../hooks/useChatAuthorModularAvatars'
import { retainStickyChatUserAvatars } from '../../utils/stickyChatUserAvatars'
import { resolveChatDisplayLabel } from '../../utils/chatDisplayName'
import { MessageList } from '../channel/MessageList'
import { MessageComposer } from '../channel/MessageComposer'
import {
  MobileChatComposerDock,
  MOBILE_CHAT_COMPOSER_DOCK_HEIGHT,
} from '../channel/MobileChatComposerDock'
import { DEFAULT_GROUP_QUICK_EMOTES } from '../../data/groupSalonPresets'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { debateMessageGroupId } from '../../utils/debateAccess'
import { groupThreadMatchId } from '../../utils/groupThreadMessages'
import { isUuidMessageId } from '../../utils/isUuidMessageId'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'
import { MODERATION_REFUSED_MESSAGE_FR, validateOutgoingChatPayload } from '../../utils/bannedWords'
import { cn } from '../../utils/cn'
import { requestTifoEngagementSyncForGroup } from '../../utils/tifoEngagementEvents'

const MAX_DEBATE_MESSAGES = 2000
const CHANNEL_ID = 'general'

export function DebateSalonPanel({
  debate,
  className,
}: {
  debate: Debate
  className?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { user: authUser } = useAuth()
  const { refresh: refreshDebates } = useDebates()
  const chatActorId = useTalkFootChatActorId()
  const { profile: selfProfile } = useProfile()
  const { tier } = useSubscription()
  const messageGroupId = debateMessageGroupId(debate)
  const selfChatUserId = chatActorId ?? authUser?.id ?? 'me'
  const selfAvatarKeys = useMemo(() => {
    const keys = new Set<string>(['me'])
    if (authUser?.id) keys.add(authUser.id)
    if (chatActorId) keys.add(chatActorId)
    if (selfChatUserId) keys.add(selfChatUserId)
    return [...keys]
  }, [authUser?.id, chatActorId, selfChatUserId])
  const chatEnabled =
    isSupabaseConfigured() && Boolean(authUser?.id) && !authUser?.isAnonymous

  const [messages, setMessages] = useState<Message[]>([])
  const [hasOlderOnServer, setHasOlderOnServer] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const [moderationHint, setModerationHint] = useState<string | null>(null)
  const [chatLimitHint, setChatLimitHint] = useState<string | null>(null)
  const { check: checkChatSend, recordSend: recordChatSend } = useChatSendGuard()

  const mergeRemote = useCallback(
    (incoming: Message[], origin: 'history' | 'live' | 'older', meta?: { hasMoreOlder?: boolean }) => {
      if (origin === 'history' && meta?.hasMoreOlder !== undefined) {
        setHasOlderOnServer(meta.hasMoreOlder)
      }
      setMessages((prev) => {
        if (origin === 'older') {
          if (!incoming.length) return prev
          const seen = new Set(prev.map((m) => m.id))
          const added = incoming.filter((m) => !seen.has(m.id))
          return [...added, ...prev]
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-MAX_DEBATE_MESSAGES)
        }
        if (origin === 'history') {
          const seen = new Set<string>()
          const cloud = incoming.filter((m) => {
            if (!isUuidMessageId(m.id) || seen.has(m.id)) return false
            seen.add(m.id)
            return true
          })
          return cloud.sort((a, b) => a.createdAt - b.createdAt).slice(-MAX_DEBATE_MESSAGES)
        }
        if (!incoming.length) return prev
        const seen = new Set(prev.map((m) => m.id))
        const next = [...prev]
        for (const m of incoming) {
          if (!seen.has(m.id)) {
            next.push(m)
            seen.add(m.id)
          }
        }
        return next.sort((a, b) => a.createdAt - b.createdAt).slice(-MAX_DEBATE_MESSAGES)
      })
    },
    [],
  )

  const { publishMessage, loadOlderMessages } = useSupporterGroupChannelSync({
    groupId: messageGroupId,
    channelId: CHANNEL_ID,
    debateId: debate.id,
    enabled: chatEnabled,
    skipMembershipUpsert: true,
    onRemoteMessages: mergeRemote,
  })

  const messageLikes = useSupporterGroupMessageLikesSync({
    groupId: messageGroupId,
    groupName: debate.title,
    enabled: chatEnabled,
    actorDisplayName: authUser?.displayName,
  })

  const oldestCloudIso = useMemo(() => {
    const cloud = messages.filter((m) => isUuidMessageId(m.id))
    if (!cloud.length) return null
    return new Date(Math.min(...cloud.map((m) => m.createdAt))).toISOString()
  }, [messages])

  const chatAuthorIds = useMemo(
    () => [...new Set(messages.map((m) => m.userId))],
    [messages],
  )
  const { avatars: modularByAuthor, profilePhotos: profilePhotoByAuthor, displayNames: cloudAuthorNames, subscriptionTiers: subscriptionTiersByAuthor } = useChatAuthorModularAvatars(
    chatAuthorIds,
    selfChatUserId,
    {
      selfModularAvatar: selfProfile.modularAvatar,
      selfSubscriptionTier: tier,
      selfUserKeys: selfAvatarKeys,
    },
  )

  const authorNameByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of messages) {
      const n = m.authorDisplayName?.trim()
      if (n) map.set(m.userId, n)
    }
    return map
  }, [messages])

  const usersByIdRef = useRef<Record<string, User>>({})
  const usersById = useMemo(() => {
    const base: Record<string, User> = {}
    if (authUser) {
      const seed =
        authUser.displayName.trim().slice(0, 12).replace(/\s+/g, '-') || 'you'
      const meEntry: User = {
        id: authUser.id,
        username: authUser.displayName,
        avatarSeed: seed,
        accent: 'emerald',
        modularAvatar: selfProfile.modularAvatar,
        subscriptionTier: tier,
      }
      base[authUser.id] = meEntry
      base.me = { ...meEntry, id: 'me' }
      if (chatActorId && chatActorId !== authUser.id) {
        base[chatActorId] = { ...meEntry, id: chatActorId }
      }
      if (selfChatUserId && !base[selfChatUserId]) {
        base[selfChatUserId] = { ...meEntry, id: selfChatUserId }
      }
    }
    for (const [id, modularAvatar] of Object.entries(modularByAuthor)) {
      const label = resolveChatDisplayLabel(authorNameByUserId.get(id), cloudAuthorNames[id])
      const subscriptionTier = subscriptionTiersByAuthor[id]
      const profilePhotoDataUrl = profilePhotoByAuthor[id]
      if (base[id]) {
        base[id] = {
          ...base[id],
          username: label,
          modularAvatar,
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          ...(subscriptionTier ? { subscriptionTier } : {}),
        }
      } else {
        base[id] = {
          id,
          username: label,
          avatarSeed: id.replace(/-/g, '').slice(0, 12),
          accent: 'violet',
          modularAvatar,
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          ...(subscriptionTier ? { subscriptionTier } : {}),
        }
      }
    }
    for (const [id, profilePhotoDataUrl] of Object.entries(profilePhotoByAuthor)) {
      if (!base[id] || base[id].profilePhotoDataUrl) continue
      base[id] = { ...base[id], profilePhotoDataUrl }
    }
    for (const id of chatAuthorIds) {
      const subscriptionTier = subscriptionTiersByAuthor[id]
      if (!subscriptionTier || !base[id]) continue
      base[id] = { ...base[id], subscriptionTier }
    }
    for (const [userId, name] of authorNameByUserId) {
      if (base[userId]) {
        base[userId] = {
          ...base[userId],
          username: resolveChatDisplayLabel(name, base[userId].username),
        }
      } else {
        base[userId] = {
          id: userId,
          username: resolveChatDisplayLabel(name, cloudAuthorNames[userId]),
          avatarSeed: userId.replace(/-/g, '').slice(0, 12),
          accent: 'violet',
          modularAvatar: modularByAuthor[userId],
        }
      }
    }
    const merged = retainStickyChatUserAvatars(base, usersByIdRef.current)
    usersByIdRef.current = merged
    return merged
  }, [
    authUser,
    authorNameByUserId,
    chatActorId,
    cloudAuthorNames,
    modularByAuthor,
    profilePhotoByAuthor,
    subscriptionTiersByAuthor,
    selfChatUserId,
    selfProfile.modularAvatar,
    tier,
  ])

  const feedRef = useAutoScroll<HTMLDivElement>([messages.length])

  const onSend = useCallback(
    async (text: string) => {
      if (!chatEnabled) return
      const chatGate = checkChatSend()
      if (!chatGate.ok) {
        setChatLimitHint(chatGate.reason ?? 'Limite de messages atteinte.')
        return
      }
      if (!validateOutgoingChatPayload({ text }).ok) {
        setModerationHint(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      recordChatSend()
      setChatLimitHint(null)
      setModerationHint(null)
      const r = await publishMessage({
        matchId: groupThreadMatchId(messageGroupId, CHANNEL_ID),
        text,
        userId: selfChatUserId,
        groupId: messageGroupId,
        channelId: CHANNEL_ID,
        debateId: debate.id,
        tfPublicDebate: true,
        displayName: authUser?.displayName,
      })
      if (r.ok) {
        requestTifoEngagementSyncForGroup(messageGroupId)
        setMessages((prev) => {
          if (prev.some((m) => m.id === r.message.id)) return prev
          return [...prev, r.message].sort((a, b) => a.createdAt - b.createdAt).slice(-MAX_DEBATE_MESSAGES)
        })
        void refreshDebates()
        return
      }
      if (r.error === 'moderation') {
        setModerationHint(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      setModerationHint('Message non envoyé. Recharge la page ou réessaie dans quelques secondes.')
    },
    [
      authUser?.displayName,
      chatEnabled,
      checkChatSend,
      debate.id,
      messageGroupId,
      publishMessage,
      recordChatSend,
      refreshDebates,
      selfChatUserId,
    ],
  )

  const onLoadOlder = useCallback(async () => {
    if (!oldestCloudIso || olderLoading || !chatEnabled) return
    setOlderLoading(true)
    try {
      const r = await loadOlderMessages(oldestCloudIso)
      if (r.ok) {
        if (r.messages.length) mergeRemote(r.messages, 'older')
        setHasOlderOnServer(r.hasMoreOlder)
      } else {
        setHasOlderOnServer(false)
      }
    } finally {
      setOlderLoading(false)
    }
  }, [chatEnabled, loadOlderMessages, mergeRemote, oldestCloudIso, olderLoading])

  const composerShellClass = cn(
    L ? 'border-tf-grey-pastel/50 bg-white/98' : 'border-white/12 bg-[#041a2d]/95',
  )

  return (
    <Card
      className={cn(
        'flex min-h-0 flex-col overflow-hidden p-0',
        'max-lg:grid max-lg:h-full max-lg:min-h-0 max-lg:flex-1 max-lg:grid-rows-[minmax(0,1fr)_auto]',
        'lg:min-h-[min(78dvh,48rem)] lg:flex-1',
        className,
      )}
      elevation="soft"
    >
      <div
        className={cn(
          'shrink-0 border-b px-4 py-3 sm:px-5 max-lg:hidden',
          L ? 'border-tf-grey-pastel/50 bg-white/95' : 'border-white/12 bg-[color:var(--tf-c30-surface-soft)]',
        )}
      >
        <h2 className="font-display text-sm font-black uppercase tracking-[0.16em] text-tf-app-fg max-lg:text-xs">
          Discussion ouverte
        </h2>
        <p className="mt-1 text-xs font-semibold text-tf-app-muted max-lg:line-clamp-1 max-lg:text-[11px]">
          Participe directement — aucune adhésion à une tribune requise.
        </p>
      </div>

      <div
        ref={feedRef}
        className={cn(
          'min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-1.5 [-webkit-overflow-scrolling:touch] sm:px-4 sm:py-3',
          'max-lg:relative max-lg:z-0 max-lg:row-start-1 max-lg:scroll-pb-28 lg:flex-1 lg:scroll-pb-3',
        )}
        style={{ scrollPaddingBottom: MOBILE_CHAT_COMPOSER_DOCK_HEIGHT }}
        role="log"
        aria-label="Messages du débat"
        aria-live="polite"
      >
        {chatEnabled && hasOlderOnServer && oldestCloudIso ? (
          <Button
            type="button"
            variant="soft"
            className="mb-2 h-8 w-full rounded-xl text-[10px] font-black"
            disabled={olderLoading}
            onClick={() => void onLoadOlder()}
          >
            {olderLoading ? 'Chargement…' : 'Messages plus anciens'}
          </Button>
        ) : null}
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-tf-app-muted">
            Sois le premier à donner ton avis sur ce sujet.
          </p>
        ) : (
          <MessageList
            messages={messages}
            usersById={usersById}
            selfUserId={selfChatUserId}
            selfChatActorId={chatActorId}
            selfClerkUserId={authUser?.id}
            salonTone={L ? 'light' : 'dark'}
            getLikes={(id) => (isUuidMessageId(id) ? messageLikes.getLikeState(id).likes : 0)}
            hasLiked={(id) => (isUuidMessageId(id) ? messageLikes.getLikeState(id).likedByMe : false)}
            onToggleLike={
              messageLikes.isConfigured
                ? (m) => {
                    if (!isUuidMessageId(m.id)) return
                    void messageLikes.toggleLike(m.id)
                  }
                : undefined
            }
          />
        )}
        <div className="h-3 lg:hidden" aria-hidden />
      </div>

      <MobileChatComposerDock
        gridRowClassName="max-lg:row-start-2"
        className={cn(composerShellClass, 'min-w-0 touch-manipulation backdrop-blur-md')}
        ariaLabel="Écrire dans le débat"
      >
        {!authUser?.id || authUser.isAnonymous ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-tf-app-muted">Connecte-toi pour voter ton avis dans le fil.</p>
            <Link
              to={`/login?next=${encodeURIComponent(`/debate/${debate.id}`)}`}
              className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-2xl bg-tf-dark px-5 text-sm font-black text-white"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <>
            {chatLimitHint ? (
              <p className="mb-2 text-xs font-semibold text-amber-700">{chatLimitHint}</p>
            ) : null}
            {moderationHint ? (
              <p className="mb-2 text-xs font-semibold text-rose-600">{moderationHint}</p>
            ) : null}
            <MessageComposer
              onSend={(text) => void onSend(text)}
              placeholder="Ton argument, ton avis…"
              richMedia={false}
              quickEmotes={DEFAULT_GROUP_QUICK_EMOTES}
              onQuickEmote={(text) => void onSend(text)}
            />
          </>
        )}
      </MobileChatComposerDock>
    </Card>
  )
}
