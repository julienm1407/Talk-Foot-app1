import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getGroupAccess } from '../utils/groupAccess'
import { isRivalClub } from '../data/fanRivals'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { getDebateById } from '../data/debates'
import { useCustomGroupDebates } from '../hooks/useCustomGroupDebates'
import { MessageList } from '../components/channel/MessageList'
import { MessageComposer } from '../components/channel/MessageComposer'
import { chatPersonasPool, currentUser } from '../data/users'
import {
  useSupporterGroupChannelSync,
  type SupporterGroupRemoteMeta,
  type SupporterGroupRemoteOrigin,
} from '../hooks/useSupporterGroupChannelSync'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { upsertCloudGroupMembership } from '../lib/supabase/groupMembership'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Message, User } from '../types/chat'
import { useMessageLikes } from '../hooks/useMessageLikes'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { cn } from '../utils/cn'
import { buildGroupThreadSeed, debatePreviewUsersById, groupThreadMatchId } from '../utils/groupThreadMessages'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { EditGroupModal } from '../components/group/EditGroupModal'
import { DebatePickerModal } from '../components/group/DebatePickerModal'
import { GroupTifoPanel } from '../components/group/GroupTifoPanel'
import { ShareButton } from '../components/ui/ShareButton'
import type { SupporterChannel, SupporterGroup } from '../types/group'
import { useMatches } from '../contexts/MatchesContext'
import { getGroupQuickEmotes, getGroupSalonChatSurfaceStyles } from '../utils/groupSalonStyles'
import { isUuidMessageId } from '../utils/isUuidMessageId'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR, validateOutgoingChatPayload } from '../utils/bannedWords'

const MAX_GROUP_CHANNELS = 14
/** Plafond messages par salon (seed + cloud, après chargements « plus anciens »). */
const MAX_GROUP_CHANNEL_MESSAGES = 2000

/** Démo : après enregistrement d’un média, passage automatique en « validé » pour montrer le flux. */
const DEMO_MODERATION_APPROVE_MS = 5200

function newChannelIdFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `ch-${slug || 'salon'}-${Date.now().toString(36)}`
}

export function GroupPage() {
  const { groupId } = useParams()
  const location = useLocation()
  const { user: authUser } = useAuth()
  const selfChatUserId = authUser?.id ?? 'me'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const debateFromQuery = searchParams.get('debate')

  const { byId, joinGroup, leaveGroup, isJoined, updateGroup, joinedGroupIds } = useSupporterGroups()
  const { matches } = useMatches()
  const group = groupId ? byId(groupId) : null
  const groupRef = useRef<SupporterGroup | null>(null)
  groupRef.current = group

  /** Simulation modération plateforme → approuvé (même délai que la barre visuelle). */
  useEffect(() => {
    const pm = group?.presentationMedia
    if (!group || !pm || pm.moderationStatus !== 'pending') return
    const gid = group.id
    const pendingUrl = pm.url
    const t = window.setTimeout(() => {
      const g = groupRef.current
      if (!g || g.id !== gid) return
      const cur = g.presentationMedia
      if (!cur || cur.moderationStatus !== 'pending' || cur.url !== pendingUrl) return
      const caption =
        cur.caption === 'Soumis — modération plateforme (démo).' ? undefined : cur.caption
      updateGroup(gid, {
        presentationMedia: { ...cur, moderationStatus: 'approved', caption },
      })
    }, DEMO_MODERATION_APPROVE_MS)
    return () => window.clearTimeout(t)
  }, [group?.id, group?.presentationMedia?.moderationStatus, group?.presentationMedia?.url, updateGroup])

  const salonSurface = useMemo(
    () => (group ? getGroupSalonChatSurfaceStyles(group) : null),
    [group],
  )
  const quickEmotesList = useMemo(
    () => (group ? getGroupQuickEmotes(group) : []),
    [group],
  )
  const { customForGroup, addCustomDebate } = useCustomGroupDebates(group?.id)

  const debate =
    debateFromQuery && group
      ? getDebateById(debateFromQuery, customForGroup)
      : undefined

  const {
    favoriteClubIds,
    favoriteLeagueId,
    hideRivalSalons,
    virageMode,
    setVirageMode,
    preferencesComplete,
  } = useFanPreferences()

  const accessLevel = group
    ? getGroupAccess(group, {
        favoriteClubIds,
        favoriteLeagueId,
        hideRivalSalons,
      })
    : 'full'

  /** Pourquoi lecture seule : derby / rivalité détectée entre un de tes clubs et le salon. */
  const readonlyRivalExplanation = useMemo(() => {
    if (accessLevel !== 'readonly' || !group?.fanTags?.clubIds?.length) return null
    for (const myId of favoriteClubIds) {
      for (const salonClubId of group.fanTags.clubIds) {
        if (isRivalClub(myId, salonClubId)) {
          const mine = ALL_CLUBS_BY_ID[myId]?.shortName ?? myId
          const theirs = ALL_CLUBS_BY_ID[salonClubId]?.shortName ?? salonClubId
          return { mine, theirs }
        }
      }
    }
    return null
  }, [accessLevel, group, favoriteClubIds])

  const [channelId, setChannelId] = useState('general')

  const channel = useMemo(() => {
    if (!group) return null
    return group.channels.find((c) => c.id === channelId) ?? group.channels[0]
  }, [channelId, group])

  const channelRef = useRef(channel)
  channelRef.current = channel
  const debateRef = useRef(debate)
  debateRef.current = debate

  const threadKey = group && channel ? `${group.id}:${channel.id}` : ''
  const threadKeyRef = useRef(threadKey)
  threadKeyRef.current = threadKey

  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({})
  const [salonSearchQuery, setSalonSearchQuery] = useState('')
  const [hasOlderOnServer, setHasOlderOnServer] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)

  const mergeRemoteGroupMessages = useCallback(
    (incoming: Message[], origin: SupporterGroupRemoteOrigin, meta?: SupporterGroupRemoteMeta) => {
      if (origin === 'history' && meta?.hasMoreOlder !== undefined) {
        setHasOlderOnServer(meta.hasMoreOlder)
      }
      setMessagesByThread((prev) => {
        const key = threadKeyRef.current
        if (!key) return prev

        if (origin === 'history') {
          const g = groupRef.current
          const ch = channelRef.current
          if (!g || !ch) return prev
          const d = debateRef.current
          const seed = buildGroupThreadSeed(
            g.id,
            ch.id,
            ch.name,
            d && ch.id === 'general' ? d : null,
          )
          const seenCloud = new Set<string>()
          const cloud = incoming
            .filter((m) => {
              if (!isUuidMessageId(m.id)) return false
              if (seenCloud.has(m.id)) return false
              seenCloud.add(m.id)
              return true
            })
            .sort((a, b) => a.createdAt - b.createdAt)
          const merged = [...seed, ...cloud]
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-MAX_GROUP_CHANNEL_MESSAGES)
          return { ...prev, [key]: merged }
        }

        if (origin === 'older') {
          if (!incoming.length) return prev
          const g = groupRef.current
          const ch = channelRef.current
          if (!g || !ch) return prev
          const cur = prev[key] ?? []
          const seedPart = cur.filter((m) => !isUuidMessageId(m.id))
          const cloudPart = cur.filter((m) => isUuidMessageId(m.id))
          const seen = new Set(cloudPart.map((m) => m.id))
          const added = incoming.filter((m) => !seen.has(m.id))
          const newCloud = [...added, ...cloudPart].sort((a, b) => a.createdAt - b.createdAt)
          const merged = [...seedPart, ...newCloud]
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-MAX_GROUP_CHANNEL_MESSAGES)
          return { ...prev, [key]: merged }
        }

        if (!incoming.length) return prev
        const seen = new Set((prev[key] ?? []).map((m) => m.id))
        const next = [...(prev[key] ?? [])]
        for (const m of incoming) {
          if (!seen.has(m.id)) {
            next.push(m)
            seen.add(m.id)
          }
        }
        next.sort((a, b) => a.createdAt - b.createdAt)
        return { ...prev, [key]: next.slice(-MAX_GROUP_CHANNEL_MESSAGES) }
      })
    },
    [],
  )

  const isOpenPublicDebateSalon = Boolean(
    group &&
      channel &&
      channel.id === 'general' &&
      debate &&
      (debate.salonAccess ?? 'public') === 'public',
  )

  const skipCloudMemberUpsert = Boolean(
    isOpenPublicDebateSalon && group && group.createdBy !== 'me' && !isJoined(group.id),
  )

  const groupCloudChatEnabled =
    Boolean(group && channel) &&
    isSupabaseConfigured() &&
    Boolean(authUser && !authUser.isAnonymous) &&
    Boolean(
      group && (group.createdBy === 'me' || isJoined(group.id) || isOpenPublicDebateSalon),
    )

  const { publishMessage: publishGroupChannelMessage, loadOlderMessages: loadOlderCloudMessages } =
    useSupporterGroupChannelSync({
      groupId: group?.id ?? '',
      channelId: channel?.id ?? '',
      enabled: groupCloudChatEnabled,
      skipMembershipUpsert: skipCloudMemberUpsert,
      onRemoteMessages: mergeRemoteGroupMessages,
    })

  /** Ré-enregistre l’adhésion côté Supabase à l’ouverture du salon (répare un « Rejoindre » raté ou hors-ligne). */
  useEffect(() => {
    if (!isSupabaseConfigured() || !group || !authUser?.id || authUser.isAnonymous) return
    if (!groupCloudChatEnabled || skipCloudMemberUpsert) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    void upsertCloudGroupMembership(sb, group.id)
  }, [
    group?.id,
    groupCloudChatEnabled,
    skipCloudMemberUpsert,
    authUser?.id,
    authUser?.isAnonymous,
    joinedGroupIds,
  ])

  /** Dernier débat lié au salon « général » — pour re-seeder si ?debate= change. */
  const prevGeneralDebateRef = useRef<string | null | undefined>(undefined)

  const [personalizeOpen, setPersonalizeOpen] = useState(false)
  const [debatePickerOpen, setDebatePickerOpen] = useState(false)
  const [salonFormOpen, setSalonFormOpen] = useState(false)
  const [newSalonName, setNewSalonName] = useState('')
  const [newSalonDesc, setNewSalonDesc] = useState('')
  const [newSalonEmoji, setNewSalonEmoji] = useState('🔊')
  const [newSalonError, setNewSalonError] = useState<string | null>(null)
  const [groupChatModerationHint, setGroupChatModerationHint] = useState<string | null>(null)

  useEffect(() => {
    if (!group || !channel || !threadKey) return
    setMessagesByThread((prev) => {
      const existing = prev[threadKey] ?? []
      let shouldReseed = existing.length === 0

      if (channel.id === 'general') {
        const dKey = debate?.id ?? null
        const prevD = prevGeneralDebateRef.current
        if (prevD !== dKey) {
          prevGeneralDebateRef.current = dKey
          shouldReseed = true
        }
      }

      if (!shouldReseed) return prev

      const prevList = prev[threadKey] ?? []
      const cloudOnly = prevList.filter((m) => isUuidMessageId(m.id))
      const seed = buildGroupThreadSeed(
        group.id,
        channel.id,
        channel.name,
        debate && channel.id === 'general' ? debate : null,
      )
      const merged = [...seed, ...cloudOnly]
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-MAX_GROUP_CHANNEL_MESSAGES)
      return { ...prev, [threadKey]: merged }
    })
  }, [group, channel, threadKey, debate, channel?.id])

  const messages = threadKey ? messagesByThread[threadKey] ?? [] : []

  useEffect(() => {
    setSalonSearchQuery('')
    setHasOlderOnServer(false)
  }, [threadKey])

  const debateUsers = useMemo(
    () => (debate ? debatePreviewUsersById(debate) : {}),
    [debate],
  )

  const usersById = useMemo(() => {
    const base: Record<string, User> = {
      ...Object.fromEntries(chatPersonasPool.map((u) => [u.id, u])),
      [currentUser.id]: currentUser,
      ...debateUsers,
    }
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
  }, [debateUsers, favoriteClubIds, authUser])

  const visibleMessages = useMemo(() => {
    if (!virageMode || favoriteClubIds.length === 0) return messages
    return messages.filter((m) => {
      if (m.userId === selfChatUserId) return true
      // Messages cloud (Postgres) : le filtre Virage ne doit jamais les masquer
      // (évite les cas où authorDisplayName est absent ou vide côté client).
      if (isUuidMessageId(m.id)) return true
      if (m.authorDisplayName) return true
      const u = usersById[m.userId]
      const fid = u?.fanClubId
      return Boolean(fid && favoriteClubIds.includes(fid))
    })
  }, [messages, virageMode, favoriteClubIds, usersById, selfChatUserId])

  const displayMessages = useMemo(() => {
    const q = salonSearchQuery.trim().toLowerCase()
    if (!q) return visibleMessages
    return visibleMessages.filter((m) => {
      const text = (m.text ?? '').toLowerCase()
      const author = (m.authorDisplayName ?? usersById[m.userId]?.username ?? '').toLowerCase()
      return text.includes(q) || author.includes(q)
    })
  }, [visibleMessages, salonSearchQuery, usersById])

  const oldestCloudIso = useMemo(() => {
    const cloud = messages.filter((m) => isUuidMessageId(m.id))
    if (!cloud.length) return null
    const minTs = Math.min(...cloud.map((m) => m.createdAt))
    return new Date(minTs).toISOString()
  }, [messages])

  const onLoadOlderCloudMessages = useCallback(async () => {
    if (!oldestCloudIso || olderLoading || !groupCloudChatEnabled) return
    setOlderLoading(true)
    try {
      const r = await loadOlderCloudMessages(oldestCloudIso)
      if (r.ok) {
        if (r.messages.length) mergeRemoteGroupMessages(r.messages, 'older')
        setHasOlderOnServer(r.hasMoreOlder)
      } else {
        setHasOlderOnServer(false)
      }
    } finally {
      setOlderLoading(false)
    }
  }, [
    oldestCloudIso,
    olderLoading,
    groupCloudChatEnabled,
    loadOlderCloudMessages,
    mergeRemoteGroupMessages,
  ])

  const messageLikes = useMessageLikes()
  const feedRef = useAutoScroll<HTMLDivElement>([displayMessages.length])

  const tryCloudGroupThenLocal = useCallback(
    async (msg: Message) => {
      if (!group || !channel || !threadKey) return
      setGroupChatModerationHint(null)
      if (!validateOutgoingChatPayload({ text: msg.text, groupScarf: msg.groupScarf }).ok) {
        setGroupChatModerationHint(MODERATION_REFUSED_MESSAGE_FR)
        return
      }
      if (groupCloudChatEnabled) {
        const r = await publishGroupChannelMessage({
          matchId: msg.matchId,
          text: msg.text,
          userId: msg.userId,
          groupId: group.id,
          channelId: channel.id,
          groupScarf: msg.groupScarf,
          tfPublicDebate: isOpenPublicDebateSalon,
        })
        if (r.ok) {
          setMessagesByThread((prev) => {
            if ((prev[threadKey] ?? []).some((m) => m.id === r.message.id)) return prev
            return {
              ...prev,
              [threadKey]: [...(prev[threadKey] ?? []), r.message]
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(-MAX_GROUP_CHANNEL_MESSAGES),
            }
          })
          return
        }
        if (r.error === 'moderation') {
          setGroupChatModerationHint(MODERATION_REFUSED_MESSAGE_FR)
          return
        }
      }
      setMessagesByThread((prev) => ({
        ...prev,
        [threadKey]: [...(prev[threadKey] ?? []), msg],
      }))
    },
    [group, channel, threadKey, groupCloudChatEnabled, publishGroupChannelMessage, isOpenPublicDebateSalon],
  )

  const onSend = useCallback(
    (text: string) => {
      if (!group || !channel || !threadKey) return
      if (accessLevel === 'readonly') return
      const openDebateToAll =
        debate != null &&
        channel.id === 'general' &&
        (debate.salonAccess ?? 'public') === 'public'
      if (!openDebateToAll && group.createdBy !== 'me' && !isJoined(group.id)) return
      const msg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        matchId: groupThreadMatchId(group.id, channel.id),
        userId: selfChatUserId,
        text,
        createdAt: Date.now(),
      }
      void tryCloudGroupThenLocal(msg)
    },
    [group, channel, threadKey, isJoined, accessLevel, debate, tryCloudGroupThenLocal, selfChatUserId],
  )

  const onSendScarf = useCallback(
    (payload: NonNullable<Message['groupScarf']>) => {
      if (!group || !channel || !threadKey) return
      if (accessLevel === 'readonly') return
      const openDebateToAll =
        debate != null &&
        channel.id === 'general' &&
        (debate.salonAccess ?? 'public') === 'public'
      if (!openDebateToAll && group.createdBy !== 'me' && !isJoined(group.id)) return
      const msg: Message = {
        id: `msg-scarf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        matchId: groupThreadMatchId(group.id, channel.id),
        userId: selfChatUserId,
        text: '',
        createdAt: Date.now(),
        groupScarf: payload,
      }
      void tryCloudGroupThenLocal(msg)
    },
    [group, channel, threadKey, isJoined, accessLevel, debate, tryCloudGroupThenLocal, selfChatUserId],
  )

  if (!group) {
    return (
      <Card className="p-6" elevation="soft">
        <div className="font-display text-lg font-black tracking-tight text-tf-dark">
          Groupe introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-tf-grey">
          Ce salon n’existe plus ou le lien est invalide.
        </div>
      </Card>
    )
  }

  const isGroupMember = group.createdBy === 'me' || isJoined(group.id)
  const isPublicDebateInGeneral =
    channel != null &&
    channel.id === 'general' &&
    debate != null &&
    (debate.salonAccess ?? 'public') === 'public'
  const canWriteInSalon =
    accessLevel !== 'readonly' && (isGroupMember || isPublicDebateInGeneral)

  return (
    <>
      <div className="flex flex-col gap-7" data-no-swipe="true">
      <div
        className="order-2 rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50/95 to-indigo-50/80 px-4 py-3 text-sm font-semibold text-tf-dark shadow-sm sm:px-5 lg:order-1"
        role="status"
      >
        <p className="font-black text-violet-950">Salon de groupe (soirée privée)</p>
        {isPublicDebateInGeneral ? (
          <p className="mt-1 text-[13px] font-medium leading-snug text-tf-dark/85">
            <strong className="font-bold">Fil débat ouvert</strong> (comme sur l’accueil) : tout le monde peut écrire
            dans le salon <strong className="font-bold">Général</strong> tant que ce sujet est affiché. Les autres
            salons (Transferts, Pronos, etc.) restent{' '}
            <strong className="font-bold">réservés aux membres</strong> du groupe.
          </p>
        ) : (
          <p className="mt-1 text-[13px] font-medium leading-snug text-tf-dark/85">
            Ici, seuls les membres de ce groupe voient ce fil — comme une viewing party entre vous. Ce n’est{' '}
            <strong className="font-bold">pas</strong> le chat public du live (zones Virage, Analyse, Chill, Général){' '}
            ni le <strong className="font-bold">{LIVE_FIL_EQUIPE_COEUR.label.toLowerCase()}</strong> du profil.
          </p>
        )}
        {isSupabaseConfigured() && (!authUser || authUser.isAnonymous) ? (
          <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[13px] font-semibold text-amber-950">
            Fil synchronisé : connecte-toi avec un compte (email ou réseau) pour rejoindre le salon côté serveur —
            même expérience sur tous tes appareils.{' '}
            <Link
              className="font-black text-violet-700 underline underline-offset-2 hover:text-violet-900"
              to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
            >
              Connexion
            </Link>
          </p>
        ) : null}
      </div>
      <Card className="order-3 overflow-hidden p-0 lg:order-2" elevation="soft">
        <div
          className="relative px-5 py-5 sm:px-6"
          style={
            {
              ['--p' as string]: group.theme.primary,
              ['--s' as string]: group.theme.secondary,
            } as CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                group.theme.background === 'stripe'
                  ? `linear-gradient(90deg, color-mix(in srgb, var(--p) 22%, transparent), transparent 60%), repeating-linear-gradient(135deg, color-mix(in srgb, var(--p) 14%, transparent) 0 10px, transparent 10px 20px)`
                  : group.theme.background === 'smoke'
                    ? `radial-gradient(900px 240px at 12% 0%, color-mix(in srgb, var(--p) 26%, transparent), transparent 62%), radial-gradient(900px 260px at 88% 0%, color-mix(in srgb, var(--s) 18%, transparent), transparent 64%)`
                    : `linear-gradient(90deg, color-mix(in srgb, var(--p) 18%, transparent), transparent 70%)`,
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="grid size-12 place-items-center rounded-3xl text-xl font-black text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${group.theme.primary}, ${group.theme.secondary})`,
                    ...(group.theme.accent
                      ? { boxShadow: `0 0 0 3px ${group.theme.accent}` }
                      : {}),
                  }}
                  aria-hidden="true"
                >
                  {group.emoji}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-2xl font-black tracking-tight text-tf-dark">
                    {group.name}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-tf-grey/70">
                    {group.location ? `${group.location} • ` : ''}
                    {group.members} membres • {group.intensity}% ambiance
                  </div>
                </div>
              </div>
              <div className="mt-3 max-w-[60ch] text-sm font-semibold text-tf-grey/80">
                “{group.motto}”
              </div>
              {group.hashtags && group.hashtags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-tf-grey-pastel/50 bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-tf-grey"
                    >
                      #{h}
                    </span>
                  ))}
                </div>
              ) : null}

              {group.presentationMedia?.moderationStatus === 'approved' ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-sm ring-1 ring-emerald-300/35">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/90 bg-emerald-50/90 px-3 py-2">
                    <Badge className="border-emerald-300 bg-emerald-100 text-emerald-950">
                      Validé plateforme
                    </Badge>
                    <span className="text-[10px] font-bold text-emerald-900/80">
                      {group.presentationMedia.type === 'video' ? 'Vidéo' : 'Photo'} groupe
                    </span>
                  </div>
                  <div className="relative aspect-video max-h-[min(52vh,320px)] w-full bg-black/5">
                    {group.presentationMedia.type === 'image' ? (
                      <img
                        src={group.presentationMedia.url}
                        alt={group.presentationMedia.caption ?? 'Média du groupe'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={group.presentationMedia.url}
                        controls
                        className="h-full w-full object-cover"
                        poster={group.presentationMedia.posterUrl}
                      />
                    )}
                  </div>
                  {group.presentationMedia.caption ? (
                    <p className="px-3 py-2 text-xs font-semibold text-tf-grey">
                      {group.presentationMedia.caption}
                    </p>
                  ) : null}
                </div>
              ) : group.presentationMedia?.moderationStatus === 'pending' ? (
                <div
                  className="mt-4 overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/95 shadow-sm ring-1 ring-amber-300/30"
                  aria-busy="true"
                  aria-label="Média en cours de vérification"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 bg-amber-100/80 px-3 py-2">
                    <Badge className="border-amber-400/80 bg-amber-200/90 text-amber-950">
                      Vérification en cours
                    </Badge>
                    <span className="text-[10px] font-bold text-amber-950/85">
                      {group.presentationMedia.type === 'video' ? 'Vidéo' : 'Photo'} · contrôle auto
                    </span>
                  </div>
                  <div className="relative aspect-video max-h-[min(52vh,320px)] w-full overflow-hidden bg-slate-900/90">
                    {group.presentationMedia.type === 'image' ? (
                      <img
                        src={group.presentationMedia.url}
                        alt=""
                        className="h-full w-full scale-105 object-cover opacity-50 blur-md"
                        loading="lazy"
                        aria-hidden="true"
                      />
                    ) : (
                      <video
                        src={group.presentationMedia.url}
                        muted
                        playsInline
                        preload="metadata"
                        poster={group.presentationMedia.posterUrl}
                        className="pointer-events-none h-full w-full scale-105 object-cover opacity-50 blur-md"
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-950/25 via-slate-950/45 to-amber-950/35"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-amber-200/20 via-amber-100/25 to-transparent tf-moderation-scan"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                      <div
                        className="size-11 animate-spin rounded-full border-2 border-amber-200 border-t-amber-700 motion-reduce:animate-none motion-reduce:border-amber-400"
                        aria-hidden="true"
                      />
                      <p className="max-w-[20rem] text-[11px] font-bold leading-snug text-amber-50 drop-shadow-sm">
                        Vérification du média en cours…
                      </p>
                      <div
                        className="w-full max-w-[14rem] rounded-full bg-amber-950/35 p-0.5"
                        style={
                          {
                            ['--tf-moderation-ms' as string]: `${DEMO_MODERATION_APPROVE_MS}ms`,
                          } as CSSProperties
                        }
                      >
                        <div className="tf-moderation-bar-run h-1.5 origin-left rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
                      </div>
                      <p className="text-[10px] font-semibold text-amber-100/80">
                        Démo : validation automatique dans ~{Math.round(DEMO_MODERATION_APPROVE_MS / 1000)}&nbsp;s
                      </p>
                    </div>
                  </div>
                  {group.presentationMedia.caption ? (
                    <p className="border-t border-amber-200/70 px-3 py-2 text-[11px] font-semibold text-amber-950/90">
                      {group.presentationMedia.caption}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShareButton
                path={`/group/${group.id}`}
                title={group.name}
                text={`Rejoins-moi sur Talk Foot — salon « ${group.name} »`}
                label="Partager le salon"
              />
              <Link
                to="/groups"
                className="rounded-2xl border border-tf-dark/12 bg-white/90 px-3 py-2 text-xs font-black text-tf-dark shadow-sm transition hover:border-tf-electric/35"
              >
                ← Mes groupes
              </Link>
              <Badge className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-dark">
                {group.createdBy === 'me' ? 'Ton groupe' : 'Groupe public'}
              </Badge>
              {group.createdBy !== 'me' && !isJoined(group.id) ? (
                <Button
                  variant="primary"
                  className="rounded-2xl text-xs font-black"
                  onClick={() => joinGroup(group.id)}
                >
                  Rejoindre ce salon
                </Button>
              ) : null}
              {group.createdBy !== 'me' && isJoined(group.id) ? (
                <Button
                  variant="ghost"
                  className="rounded-2xl text-xs font-black text-tf-grey hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    leaveGroup(group.id)
                    navigate('/groups')
                  }}
                >
                  Retirer de mes groupes
                </Button>
              ) : null}
              <Button
                variant="soft"
                className="rounded-3xl"
                disabled={group.createdBy !== 'me'}
                title={
                  group.createdBy !== 'me'
                    ? 'Réservé aux salons que tu as créés toi-même'
                    : 'Couleurs, slogan, intensité…'
                }
                onClick={() => {
                  if (group.createdBy === 'me') setPersonalizeOpen(true)
                }}
              >
                Personnaliser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="order-1 grid min-h-0 gap-3 lg:order-3 lg:grid lg:h-[min(88dvh,calc(100dvh-7.5rem))] lg:max-h-[min(88dvh,calc(100dvh-7.5rem))] lg:grid-cols-[320px_1fr] lg:items-stretch">
        <div className="col-span-full mb-0 flex min-h-9 items-center justify-between gap-2 lg:hidden">
          <Link
            to="/groups"
            className="shrink-0 rounded-2xl border border-tf-dark/12 bg-white/90 px-2.5 py-1.5 text-[11px] font-black text-tf-dark shadow-sm transition hover:border-tf-electric/35"
          >
            ← Groupes
          </Link>
          <span className="min-w-0 flex-1 truncate text-center text-xs font-black text-tf-dark">
            <span aria-hidden>{group.emoji}</span> {group.name}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton
              compact
              path={`/group/${group.id}`}
              title={group.name}
              text={`Salon Talk Foot : ${group.name}`}
            />
            {group.createdBy === 'me' ? (
              <Button
                type="button"
                variant="soft"
                className="h-8 shrink-0 rounded-2xl px-2.5 text-[10px] font-black"
                onClick={() => setPersonalizeOpen(true)}
              >
                Perso
              </Button>
            ) : null}
          </div>
        </div>
        <Card className="p-4 sm:p-5 lg:max-h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain" elevation="soft">
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey/70">
            SALONS
          </div>
          <div className="mt-3 space-y-2">
            {group.channels.map((c) => (
              <button
                key={c.id}
                className={
                  channelId === c.id
                    ? 'w-full rounded-3xl border-2 bg-white px-4 py-3 text-left shadow-sm'
                    : 'w-full rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 px-4 py-3 text-left hover:bg-white'
                }
                style={
                  channelId === c.id && salonSurface
                    ? { borderColor: salonSurface.boxBorderColor }
                    : undefined
                }
                onClick={() => setChannelId(c.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-tf-dark">
                      {c.emoji} {c.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-tf-grey/70">
                      {c.description}
                    </div>
                  </div>
                  <span className="text-xs font-black text-tf-grey">→</span>
                </div>
              </button>
            ))}
          </div>

          {group.createdBy === 'me' ? (
            <div className="mt-4 border-t border-tf-grey-pastel/50 pt-4">
              {!salonFormOpen ? (
                <Button
                  type="button"
                  variant="soft"
                  className="w-full rounded-2xl text-xs font-black"
                  disabled={group.channels.length >= MAX_GROUP_CHANNELS}
                  title={
                    group.channels.length >= MAX_GROUP_CHANNELS
                      ? `Maximum ${MAX_GROUP_CHANNELS} salons`
                      : undefined
                  }
                  onClick={() => {
                    setNewSalonError(null)
                    setSalonFormOpen(true)
                  }}
                >
                  + Nouveau salon
                </Button>
              ) : (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setNewSalonError(null)
                    const name = newSalonName.trim()
                    if (name.length < 2) {
                      setNewSalonError('Nom d’au moins 2 caractères.')
                      return
                    }
                    const desc = newSalonDesc.trim() || 'Discussion'
                    if (containsBannedWord(name) || containsBannedWord(desc)) {
                      setNewSalonError(MODERATION_REFUSED_MESSAGE_FR)
                      return
                    }
                    if (group.channels.length >= MAX_GROUP_CHANNELS) {
                      setNewSalonError(`Limite de ${MAX_GROUP_CHANNELS} salons atteinte.`)
                      return
                    }
                    const id = newChannelIdFromName(name)
                    if (group.channels.some((c) => c.id === id)) {
                      setNewSalonError('Réessaie avec un autre nom.')
                      return
                    }
                    const ch: SupporterChannel = {
                      id,
                      name: name.slice(0, 48),
                      description: desc.slice(0, 120),
                      emoji: (newSalonEmoji.trim() || '🔊').slice(0, 8),
                    }
                    updateGroup(group.id, { channels: [...group.channels, ch] })
                    setChannelId(ch.id)
                    setNewSalonName('')
                    setNewSalonDesc('')
                    setNewSalonEmoji('🔊')
                    setSalonFormOpen(false)
                  }}
                >
                  <div className="text-xs font-black text-tf-dark">Créer un salon</div>
                  <Input
                    value={newSalonName}
                    onChange={(e) => setNewSalonName(e.target.value)}
                    placeholder="Nom du salon"
                    className="text-sm"
                    aria-label="Nom du nouveau salon"
                  />
                  <Input
                    value={newSalonDesc}
                    onChange={(e) => setNewSalonDesc(e.target.value)}
                    placeholder="Description courte"
                    className="text-sm"
                    aria-label="Description"
                  />
                  <Input
                    value={newSalonEmoji}
                    onChange={(e) => setNewSalonEmoji(e.target.value)}
                    placeholder="Emoji"
                    className="text-sm"
                    aria-label="Emoji du salon"
                  />
                  {newSalonError ? (
                    <p className="text-xs font-semibold text-rose-600">{newSalonError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="primary" className="rounded-2xl text-xs font-black">
                      Ajouter
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-2xl text-xs"
                      onClick={() => {
                        setSalonFormOpen(false)
                        setNewSalonError(null)
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : null}

          <details
            className="mt-4 rounded-2xl border border-tf-grey-pastel/40 bg-tf-white/80 px-3 py-2"
            data-no-swipe="true"
          >
            <summary className="cursor-pointer list-none text-[11px] font-black uppercase tracking-wide text-tf-grey [&::-webkit-details-marker]:hidden">
              Tifo pixel (match)
            </summary>
            <GroupTifoPanel matches={matches} />
          </details>
        </Card>

        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden border-2 p-0',
            /* Mobile : plus de hauteur pour le fil — l’en-tête + débat ne doivent pas le tuer */
            'max-lg:h-[min(92dvh,calc(100dvh-4.25rem))] max-lg:max-h-[min(92dvh,calc(100dvh-4.25rem))]',
            'min-h-[min(50dvh,22rem)] sm:min-h-[min(52dvh,24rem)]',
            'lg:min-h-[18rem] lg:h-full lg:max-h-none',
          )}
          elevation="soft"
          style={
            salonSurface
              ? { borderColor: salonSurface.boxBorderColor }
              : undefined
          }
        >
          <div className="shrink-0 border-b border-tf-grey-pastel/50 bg-tf-white/95 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-black tracking-[0.16em] text-tf-grey/70 sm:text-[11px] sm:tracking-[0.18em]">
                  {channel?.emoji} {channel?.name}
                </div>
                <div className="mt-0.5 font-display text-base font-black tracking-tight text-tf-dark sm:mt-1 sm:text-lg">
                  Salon — discussion
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs font-semibold text-tf-grey/70 sm:mt-1 sm:line-clamp-none sm:text-sm">
                  {channel?.description}
                </div>
              </div>
              <div className="flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:gap-2 sm:pb-0">
                {preferencesComplete && favoriteClubIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setVirageMode(!virageMode)}
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-black transition sm:px-3 sm:text-[11px]',
                      virageMode
                        ? 'border-tf-dark bg-tf-dark text-white'
                        : 'border-tf-grey-pastel/60 bg-white text-tf-grey hover:bg-tf-grey-pastel/20',
                    )}
                    title={LIVE_FIL_EQUIPE_COEUR.title}
                  >
                    {virageMode ? `✓ ${LIVE_FIL_EQUIPE_COEUR.labelOn}` : LIVE_FIL_EQUIPE_COEUR.label}
                  </button>
                ) : null}
                <Badge className="shrink-0 border-tf-dark/15 bg-tf-night/[0.06] text-tf-dark">Live</Badge>
                {channel?.id === 'general' ? (
                  <>
                    <Button
                      type="button"
                      variant="soft"
                      className="shrink-0 rounded-2xl px-2.5 py-1.5 text-[10px] font-black sm:px-3 sm:text-[11px]"
                      onClick={() => setDebatePickerOpen(true)}
                    >
                      {debateFromQuery ? 'Changer le débat' : 'Débat du salon'}
                    </Button>
                    {debateFromQuery ? (
                      <button
                        type="button"
                        className="shrink-0 rounded-2xl border border-tf-grey-pastel/60 bg-white px-2.5 py-1.5 text-[10px] font-bold text-tf-grey transition hover:bg-tf-grey-pastel/20 sm:px-3 sm:text-[11px]"
                        onClick={() => {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev)
                            next.delete('debate')
                            return next
                          })
                        }}
                      >
                        Détacher
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {debate && channel?.id === 'general' ? (
              <>
                <div className="mt-3 hidden rounded-2xl border border-tf-dark/12 bg-gradient-to-r from-tf-night/[0.06] to-tf-ice/80 px-4 py-3 lg:mt-4 lg:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-tf-grey">
                    Débat lié
                  </p>
                  <p className="mt-1 text-sm font-black text-tf-dark">{debate.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {debateFromQuery ? (
                      <Link
                        to={`/debate/${debateFromQuery}`}
                        className="text-xs font-bold text-tf-electric-deep underline"
                      >
                        Voir la fiche débat
                      </Link>
                    ) : null}
                    <span className="text-xs font-semibold text-tf-grey">
                      · Messages ci-dessous dans le salon général
                    </span>
                  </div>
                </div>
                <details
                  className="mt-2 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 to-tf-ice/70 lg:hidden"
                  data-no-swipe="true"
                >
                  <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-tf-grey">
                      Débat lié — toucher pour déplier
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-black leading-snug text-tf-dark">{debate.title}</p>
                    <p className="mt-1 text-[10px] font-bold text-tf-electric-deep">Détails + lien fiche</p>
                  </summary>
                  <div className="space-y-2 border-t border-sky-200/50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-tf-grey/90">{debate.excerpt}</p>
                    <div className="flex flex-wrap gap-2">
                      {debateFromQuery ? (
                        <Link
                          to={`/debate/${debateFromQuery}`}
                          className="text-xs font-bold text-tf-electric-deep underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir la fiche débat
                        </Link>
                      ) : null}
                      <span className="text-[11px] font-semibold text-tf-grey">
                        Les messages restent dans ce salon.
                      </span>
                    </div>
                  </div>
                </details>
              </>
            ) : null}
          </div>

          {accessLevel === 'readonly' ? (
            <div className="mx-4 mt-4 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 sm:mx-5">
              <p className="font-black text-amber-900">Lecture seule (salon « ennemi »)</p>
              <p className="mt-2 leading-relaxed text-amber-900/95">
                Ici, c’est volontaire : dans les <strong>groupes</strong>, un salon rattaché à un club{' '}
                <strong>rival</strong> de tes favoris (ex. derby) est en{' '}
                <strong>consultation uniquement</strong>, pour éviter les débordements et le spam entre tribunes.
                Sur un <strong>match live</strong>, tu peux toujours écrire : le{' '}
                <strong>{LIVE_FIL_EQUIPE_COEUR.label}</strong> filtre ce que tu <em>vois</em> parmi ce salon (même
                logique que sur le live public), sans couper ton clavier.
              </p>
              {readonlyRivalExplanation ? (
                <p className="mt-2 text-xs font-bold text-amber-800/90">
                  Détecté : supporter {readonlyRivalExplanation.mine} dans un salon orienté{' '}
                  {readonlyRivalExplanation.theirs}.
                </p>
              ) : null}
            </div>
          ) : null}

          {virageMode && favoriteClubIds.length > 0 ? (
            <div className="mx-4 mt-3 shrink-0 rounded-xl border border-tf-dark/20 bg-tf-dark/5 px-3 py-2 text-xs font-bold text-tf-dark sm:mx-5">
              {LIVE_FIL_EQUIPE_COEUR.label} : tu vois surtout les messages des supporters de tes clubs favoris (+
              les
              tiens).
            </div>
          ) : null}

          <div className="mx-4 mt-3 shrink-0 space-y-2 sm:mx-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                type="search"
                value={salonSearchQuery}
                onChange={(e) => setSalonSearchQuery(e.target.value)}
                placeholder="Rechercher dans ce salon…"
                className="h-10 flex-1 rounded-xl border-tf-grey-pastel/80 text-sm font-semibold"
                aria-label="Rechercher dans les messages du salon"
              />
              {salonSearchQuery.trim() ? (
                <p className="text-center text-[11px] font-bold text-tf-grey sm:min-w-[7rem] sm:text-left">
                  {displayMessages.length} résultat{displayMessages.length !== 1 ? 's' : ''}
                </p>
              ) : null}
            </div>
            {groupCloudChatEnabled && hasOlderOnServer && oldestCloudIso ? (
              <Button
                type="button"
                variant="soft"
                className="h-9 w-full rounded-xl text-xs font-black sm:w-auto"
                disabled={olderLoading}
                onClick={() => void onLoadOlderCloudMessages()}
              >
                {olderLoading ? 'Chargement…' : 'Messages plus anciens'}
              </Button>
            ) : null}
          </div>

          <div
            ref={feedRef}
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-5 sm:py-4',
              /* Mobile : en bas du fil, le geste continue sur la page (accessibilité). Desktop : isole le bounce. */
              'max-lg:overscroll-y-auto',
              'lg:overscroll-y-contain',
              /* Garde une zone de lecture minimum quand l’en-tête est chargé (débat, etc.) */
              debate && channel?.id === 'general' ? 'max-lg:min-h-[min(42dvh,16rem)]' : 'max-lg:min-h-[min(38dvh,14rem)]',
            )}
            style={salonSurface?.backdrop}
            role="log"
            aria-label="Messages du salon"
            aria-live="polite"
          >
            <MessageList
              messages={displayMessages}
              usersById={usersById}
              selfUserId={selfChatUserId}
              getLikes={messageLikes.getLikes}
              hasLiked={(id) => messageLikes.hasLiked(id, selfChatUserId)}
              onToggleLike={(m) => {
                if (messageLikes.hasLiked(m.id, 'me')) {
                  messageLikes.unlike(m.id)
                } else {
                  messageLikes.like(m.id, m, null, usersById[m.userId] ?? null)
                }
              }}
            />
            <div className="h-3" />
          </div>

          {accessLevel === 'readonly' ? (
            <div className="border-t border-tf-grey-pastel/50 bg-tf-grey-pastel/20 px-4 py-4 text-center text-sm font-bold text-tf-grey sm:px-5">
              Écriture désactivée sur ce salon (mode lecture seule).
            </div>
          ) : !canWriteInSalon ? (
            <div className="shrink-0 border-t border-tf-grey-pastel/50 bg-gradient-to-b from-slate-50/95 to-tf-ice/90 px-4 py-4 sm:px-5">
              <p className="text-center text-sm font-bold text-tf-dark">
                {debate && channel?.id === 'general' && debate.salonAccess === 'members'
                  ? 'Ce débat est réservé aux membres du groupe — rejoins pour participer.'
                  : 'Tu n’as pas rejoint ce salon — lecture seule jusqu’à adhésion.'}
              </p>
              <Button
                type="button"
                variant="primary"
                className="mx-auto mt-3 block w-full max-w-sm rounded-2xl text-sm font-black"
                onClick={() => joinGroup(group.id)}
              >
                Rejoindre pour écrire
              </Button>
            </div>
          ) : (
            <div
              className="shrink-0 border-t border-tf-grey-pastel/50 px-3 py-2 backdrop-blur-sm sm:px-5 sm:py-3"
              style={salonSurface?.backdrop}
            >
              {groupChatModerationHint ? (
                <p className="mb-2 rounded-xl border border-rose-200/80 bg-rose-50/95 px-3 py-2 text-xs font-semibold text-rose-800">
                  {groupChatModerationHint}
                </p>
              ) : null}
              <MessageComposer
                onSend={onSend}
                placeholder={`Message dans ${channel?.name ?? 'le salon'}…`}
                quickEmotes={quickEmotesList}
                onQuickEmote={onSend}
                scarfChoices={
                  group.scarf
                    ? [
                        {
                          groupId: group.id,
                          groupName: group.name,
                          text: group.scarf.label,
                          colorA: group.scarf.colorA,
                          colorB: group.scarf.colorB,
                          colorC: group.scarf.colorC,
                        },
                      ]
                    : []
                }
                onSendScarf={group.scarf ? onSendScarf : undefined}
              />
            </div>
          )}
        </Card>
      </div>
      </div>

      <EditGroupModal
        open={personalizeOpen}
        group={group.createdBy === 'me' ? group : null}
        onClose={() => setPersonalizeOpen(false)}
        onSave={(patch) => updateGroup(group.id, patch)}
      />

      <DebatePickerModal
        open={debatePickerOpen}
        customForGroup={customForGroup}
        onClose={() => setDebatePickerOpen(false)}
        onPick={(debateId) => {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('debate', debateId)
            return next
          })
        }}
        onPublishCustom={(input) => addCustomDebate(input)}
      />
    </>
  )
}
