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
import { MessageList } from '../channel/MessageList'
import { MessageComposer } from '../channel/MessageComposer'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { debateMessageGroupId } from '../../utils/debateAccess'
import { groupThreadMatchId } from '../../utils/groupThreadMessages'
import { isUuidMessageId } from '../../utils/isUuidMessageId'
import { isSupabaseConfigured } from '../../lib/supabase/isEnabled'
import { MODERATION_REFUSED_MESSAGE_FR, validateOutgoingChatPayload } from '../../utils/bannedWords'
import { cn } from '../../utils/cn'

const MAX_DEBATE_MESSAGES = 2000
const CHANNEL_ID = 'general'

export function DebateSalonPanel({ debate }: { debate: Debate }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { user: authUser } = useAuth()
  const { refresh: refreshDebates } = useDebates()
  const messageGroupId = debateMessageGroupId(debate)
  const selfChatUserId = authUser?.id ?? 'me'
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

  const usersById = useRef({}).current

  return (
    <Card className="flex min-h-[min(70vh,42rem)] flex-col overflow-hidden p-0" elevation="soft">
      <div
        className={cn(
          'border-b px-4 py-3 sm:px-5',
          L ? 'border-tf-grey-pastel/50 bg-white/95' : 'border-white/12 bg-[color:var(--tf-c30-surface-soft)]',
        )}
      >
        <h2 className="font-display text-sm font-black uppercase tracking-[0.16em] text-tf-app-fg">
          Discussion ouverte
        </h2>
        <p className="mt-1 text-xs font-semibold text-tf-app-muted">
          Participe directement — aucune adhésion à une tribune requise.
        </p>
      </div>

      <div
        ref={feedRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4 [-webkit-overflow-scrolling:touch]"
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
      </div>

      <div
        className={cn(
          'border-t px-3 py-3 sm:px-4',
          L ? 'border-tf-grey-pastel/50 bg-white/98' : 'border-white/12 bg-[color:var(--tf-c30-surface-soft)]',
        )}
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
            />
          </>
        )}
      </div>
    </Card>
  )
}
