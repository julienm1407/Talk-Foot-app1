import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { useSubscription } from '../hooks/useSubscription'
import { canJoinGroup } from '../utils/subscriptionEntitlements'
import { TribuneLimitPopup } from '../components/subscription/TribuneLimitPopup'
import { LeaveTribuneButton } from '../components/group/LeaveTribuneButton'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getGroupAccess } from '../utils/groupAccess'
import { isRivalClub } from '../data/fanRivals'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { getNationByIso } from '../data/nations'
import { useDebates } from '../contexts/DebatesContext'
import { useCustomGroupDebates } from '../hooks/useCustomGroupDebates'
import { MessageList } from '../components/channel/MessageList'
import { MessageComposer } from '../components/channel/MessageComposer'
import {
  MobileChatComposerDock,
  MOBILE_CHAT_COMPOSER_DOCK_HEIGHT,
} from '../components/channel/MobileChatComposerDock'
import { chatPersonasPool, currentUser } from '../data/users'
import {
  useSupporterGroupChannelSync,
  type SupporterGroupRemoteMeta,
  type SupporterGroupRemoteOrigin,
} from '../hooks/useSupporterGroupChannelSync'
import { channelsForSupporterGroup } from '../data/defaultGroupChannels'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { upsertCloudGroupMembership } from '../lib/supabase/groupMembership'
import { ensureCloudRegistryForPublicSystemGroup } from '../lib/supabase/ensureCloudRegistryForPublicSystemGroup'
import { upsertCloudSupporterGroup } from '../lib/supabase/supporterGroupsRegistry'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { ensureTalkFootSupabaseSession, isClerkAuthMode } from '../lib/supabase/talkfootSession'
import type { Message, User } from '../types/chat'
import { useSupporterGroupMessageLikesSync } from '../hooks/useSupporterGroupMessageLikesSync'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { useChatAuthorModularAvatars } from '../hooks/useChatAuthorModularAvatars'
import { useProfile } from '../hooks/useProfile'
import { useCloudFriends } from '../hooks/useCloudFriends'
import { retainStickyChatUserAvatars } from '../utils/stickyChatUserAvatars'
import { resolveChatDisplayLabel } from '../utils/chatDisplayName'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { useChatSendGuard } from '../hooks/useChatSendGuard'
import { cn } from '../utils/cn'
import {
  buildGroupSalonBotUser,
  buildGroupThreadSeed,
  debatePreviewUsersById,
  groupThreadMatchId,
} from '../utils/groupThreadMessages'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { EditGroupModal } from '../components/group/EditGroupModal'
import { GroupIdentityBackdrop } from '../components/group/GroupIdentityBackdrop'
import { GroupJoinWriteFooter } from '../components/group/GroupJoinWriteFooter'
import { DebatePickerModal } from '../components/group/DebatePickerModal'
import { LinkedDebateBanner } from '../components/group/LinkedDebateBanner'
import { useGroupFeaturedDebate } from '../hooks/useGroupFeaturedDebate'
import { mergeDebatesForGroup } from '../utils/mergeGroupDebates'
import { GroupTifoPanel } from '../components/group/GroupTifoPanel'
import { ShareButton } from '../components/ui/ShareButton'
import type { SupporterChannel, SupporterGroup } from '../types/group'
import { useMatches } from '../contexts/MatchesContext'
import { getGroupQuickEmotes, getGroupSalonChatSurfaceStyles } from '../utils/groupSalonStyles'
import {
  isGroupBotSeedMessageId,
  mergeGroupThreadWithOptionalSeed,
} from '../utils/groupBotSeedAck'
import { isUuidMessageId } from '../utils/isUuidMessageId'
import { containsBannedWord, MODERATION_REFUSED_MESSAGE_FR, validateOutgoingChatPayload } from '../utils/bannedWords'
import { useAppearance } from '../contexts/AppearanceContext'
import { isDemoPresentationMedia } from '../utils/groupPresentationMedia'
import {
  TF_TEXT_FG,
  TF_TEXT_MUTED,
  TF_TEXT_SUBTLE,
  tfChipSurface,
  tfGhostOnCard,
  tfIdentityGlass,
  tfSalonHeader,
} from '../theme/appearanceClasses'

const MAX_GROUP_CHANNELS = 14
/** Plafond messages par tribune (seed + cloud, après chargements « plus anciens »). */
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
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const chatActorId = useTalkFootChatActorId()
  const selfChatUserId = chatActorId ?? authUser?.id ?? 'me'
  const { profile: selfProfile } = useProfile()
  const selfAvatarKeys = useMemo(() => {
    const keys = new Set<string>(['me'])
    if (authUser?.id) keys.add(authUser.id)
    if (chatActorId) keys.add(chatActorId)
    if (selfChatUserId) keys.add(selfChatUserId)
    return [...keys]
  }, [authUser?.id, chatActorId, selfChatUserId])
  /** Compte connecté pour mémoriser les messages bot d’accueil (une fois par tribune). */
  const botSeedUserId = authUser?.id && !authUser.isAnonymous ? authUser.id : null
  const botSeedUserIdRef = useRef(botSeedUserId)
  botSeedUserIdRef.current = botSeedUserId
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const debateFromQuery = searchParams.get('debate')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const {
    byId,
    joinGroup,
    leaveGroup,
    isJoined,
    updateGroup,
    deleteGroup,
    joinedGroupIds,
    myJoinedGroups,
    orphanJoinedGroupIds,
    refreshGroupActivity,
    bumpGroupActivity,
    refreshCloudGroups,
    groupLimits,
  } = useSupporterGroups()

  const atJoinLimit =
    groupLimits.maxJoined != null && groupLimits.joined >= groupLimits.maxJoined
  const { matches } = useMatches()
  const group = groupId ? byId(groupId) : null

  const presentationMedia = useMemo(() => {
    const pm = group?.presentationMedia
    if (!pm || isDemoPresentationMedia(pm)) return undefined
    return pm
  }, [group?.presentationMedia])

  useEffect(() => {
    if (!group?.presentationMedia || !isDemoPresentationMedia(group.presentationMedia)) return
    updateGroup(group.id, { presentationMedia: undefined })
  }, [group?.id, group?.presentationMedia, updateGroup])
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [groupId])

  /** Répare les groupes créés avant la colonne `channels` : persiste les tribunes par défaut en cloud. */
  useEffect(() => {
    if (!group || group.createdBy !== 'me' || !isSupabaseConfigured() || !authUser?.id) return
    const channels = channelsForSupporterGroup(group.channels)
    if (channels.length === 0) return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    void (async () => {
      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) return
      await upsertCloudSupporterGroup(
        sb,
        { ...group, channels },
        session.user.id,
        isClerkAuthMode() ? authUser.id : null,
      )
    })()
  }, [group?.id, group?.createdBy, authUser?.id])

  /** Tribunes système publiques (France CDM, etc.) : registre cloud requis pour le chat partagé (RLS). */
  useEffect(() => {
    if (!group || !isSupabaseConfigured() || !authUser?.id || authUser.isAnonymous) return
    if (group.createdBy !== 'system' || (group.groupKind ?? 'public') !== 'public') return
    const sb = getSupabaseBrowserClient()
    if (!sb) return
    void (async () => {
      const session = await ensureTalkFootSupabaseSession(sb)
      if (!session) return
      await ensureCloudRegistryForPublicSystemGroup(sb, group, session.user.id)
    })()
  }, [group?.id, group?.createdBy, group?.groupKind, authUser?.id, authUser?.isAnonymous])
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
    () => (group ? getGroupSalonChatSurfaceStyles(group, { dark: !L }) : null),
    [group, L],
  )
  const quickEmotesList = useMemo(
    () => (group ? getGroupQuickEmotes(group) : []),
    [group],
  )
  const { customForGroup } = useCustomGroupDebates(group?.id)

  const { debates: cloudDebates, getDebateById: resolveDebate, refresh: refreshDebates } = useDebates()
  const groupDebates = useMemo(
    () => (group ? mergeDebatesForGroup(cloudDebates, customForGroup, group.id) : []),
    [cloudDebates, customForGroup, group],
  )
  const isSiteAdmin = Boolean(authUser?.isAdmin)
  const { featuredDebateId, linkDebate, unlinkDebate } = useGroupFeaturedDebate(group?.id)
  const effectiveDebateId = debateFromQuery ?? featuredDebateId ?? null
  const debate =
    effectiveDebateId && group
      ? groupDebates.find((d) => d.id === effectiveDebateId) ??
        resolveDebate(effectiveDebateId) ??
        customForGroup.find((d) => d.id === effectiveDebateId)
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

  /** Pourquoi lecture seule : derby / rivalité détectée entre un de tes clubs et la tribune. */
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

  useEffect(() => {
    if (!group || channel?.id !== 'general') return
    void refreshDebates()
  }, [group?.id, channel?.id, refreshDebates])

  const channelRef = useRef(channel)
  channelRef.current = channel
  const debateRef = useRef(debate)
  debateRef.current = debate

  const activeDebateScope = channel?.id === 'general' ? (debate?.id ?? null) : null
  const threadKey = group && channel ? `${group.id}:${channel.id}:${activeDebateScope ?? 'global'}` : ''
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
          const seenCloud = new Set<string>()
          const cloud = incoming.filter((m) => {
            if (!isUuidMessageId(m.id)) return false
            if (seenCloud.has(m.id)) return false
            seenCloud.add(m.id)
            return true
          })
          const merged = mergeGroupThreadWithOptionalSeed(
            botSeedUserIdRef.current,
            key,
            cloud,
            () =>
              buildGroupThreadSeed(
                g,
                ch.id,
                ch.name,
                d && ch.id === 'general' ? d : null,
              ),
            MAX_GROUP_CHANNEL_MESSAGES,
          )
          return { ...prev, [key]: merged }
        }

        if (origin === 'older') {
          if (!incoming.length) return prev
          const g = groupRef.current
          const ch = channelRef.current
          if (!g || !ch) return prev
          const cur = prev[key] ?? []
          const seedPart = cur.filter((m) => isGroupBotSeedMessageId(m.id))
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

  const isDebateSalon = Boolean(group && channel && channel.id === 'general' && debate)
  /** Tous les débats sont ouverts : participation sans adhésion à la tribune. */
  const isOpenPublicDebateSalon = isDebateSalon

  const isPublicGroup = (group?.groupKind ?? 'public') === 'public'

  const skipCloudMemberUpsert = Boolean(
    isOpenPublicDebateSalon && group && group.createdBy !== 'me' && !isJoined(group.id),
  )

  const groupCloudChatEnabled =
    Boolean(group && channel) &&
    isSupabaseConfigured() &&
    Boolean(authUser && !authUser.isAnonymous) &&
    Boolean(
      group &&
        (group.createdBy === 'me' ||
          isJoined(group.id) ||
          isPublicGroup ||
          isOpenPublicDebateSalon),
    )

  const { publishMessage: publishGroupChannelMessage, loadOlderMessages: loadOlderCloudMessages } =
    useSupporterGroupChannelSync({
      groupId: group?.id ?? '',
      channelId: channel?.id ?? '',
      debateId: activeDebateScope,
      enabled: groupCloudChatEnabled,
      skipMembershipUpsert: skipCloudMemberUpsert,
      onRemoteMessages: mergeRemoteGroupMessages,
    })

  /** Ré-enregistre l’adhésion côté Supabase à l’ouverture de la tribune (répare un « Rejoindre » raté ou hors-ligne). */
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

  /** Dernier débat lié à la tribune « général » — pour re-seeder si ?debate= change. */
  const prevGeneralDebateRef = useRef<string | null | undefined>(undefined)

  const [personalizeOpen, setPersonalizeOpen] = useState(false)
  const [debatePickerOpen, setDebatePickerOpen] = useState(false)
  const [adminDebateLinkError, setAdminDebateLinkError] = useState<string | null>(null)
  const [salonFormOpen, setSalonFormOpen] = useState(false)
  const [newSalonName, setNewSalonName] = useState('')
  const [newSalonDesc, setNewSalonDesc] = useState('')
  const [newSalonEmoji, setNewSalonEmoji] = useState('🔊')
  const [newSalonError, setNewSalonError] = useState<string | null>(null)
  const [groupChatModerationHint, setGroupChatModerationHint] = useState<string | null>(null)
  const [groupChatLimitHint, setGroupChatLimitHint] = useState<string | null>(null)
  const [joinOtherError, setJoinOtherError] = useState<string | null>(null)
  const [tribuneLimitPopup, setTribuneLimitPopup] = useState<'join' | 'debate' | null>(null)
  const [leavingTribuneId, setLeavingTribuneId] = useState<string | null>(null)
  const { tier } = useSubscription()

  const openAdminDebatePicker = useCallback(() => {
    setAdminDebateLinkError(null)
    setTribuneLimitPopup(null)
    window.setTimeout(() => setDebatePickerOpen(true), 50)
  }, [])

  const handleAdminUnlinkDebate = useCallback(async () => {
    setAdminDebateLinkError(null)
    const result = await unlinkDebate()
    if (!result.ok) {
      setAdminDebateLinkError('Impossible de détacher le débat (droits admin requis).')
      return
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('debate')
      return next
    })
  }, [unlinkDebate, setSearchParams])

  const handleAdminPickDebate = useCallback(
    async (debateId: string) => {
      setAdminDebateLinkError(null)
      const result = await linkDebate(debateId)
      if (!result.ok) {
        setAdminDebateLinkError('Impossible de lier ce débat (droits admin requis).')
        return
      }
      setDebatePickerOpen(false)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('debate')
        return next
      })
    },
    [linkDebate, setSearchParams],
  )


  const { check: checkChatSend, recordSend: recordChatSend } = useChatSendGuard()

  const openJoinLimitPopup = useCallback(() => {
    void refreshCloudGroups().finally(() => setTribuneLimitPopup('join'))
  }, [refreshCloudGroups])

  const handleJoinGroup = useCallback(async () => {
    if (!group) return
    const r = await joinGroup(group.id)
    if (!r.ok) {
      if (r.limitKind === 'join') {
        openJoinLimitPopup()
        setJoinOtherError(null)
      } else {
        setJoinOtherError(r.reason)
      }
      return
    }
    setJoinOtherError(null)
    setTribuneLimitPopup(null)
  }, [group, joinGroup, openJoinLimitPopup])

  const onJoinGroupClick = useCallback(() => {
    if (atJoinLimit) {
      openJoinLimitPopup()
      return
    }
    void handleJoinGroup()
  }, [atJoinLimit, handleJoinGroup, openJoinLimitPopup])

  const handleLeaveTribune = useCallback(
    async (id: string, options?: { retryJoin?: boolean }) => {
      setLeavingTribuneId(id)
      leaveGroup(id)
      setLeavingTribuneId(null)

      if (!options?.retryJoin || !group || group.createdBy === 'me' || isJoined(group.id)) {
        return
      }

      const nextCount = joinedGroupIds.filter((gid) => gid !== id).length
      if (!canJoinGroup(tier, nextCount, Boolean(authUser?.isAdmin)).ok) return

      const r = await joinGroup(group.id)
      if (r.ok) {
        setJoinOtherError(null)
        setTribuneLimitPopup(null)
        return
      }
      if (r.limitKind === 'join') {
        setTribuneLimitPopup('join')
      } else {
        setJoinOtherError(r.reason)
      }
    },
    [group, isJoined, joinGroup, joinedGroupIds, leaveGroup, tier],
  )

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
      const merged = mergeGroupThreadWithOptionalSeed(
        botSeedUserId,
        threadKey,
        cloudOnly,
        () =>
          buildGroupThreadSeed(
            group,
            channel.id,
            channel.name,
            debate && channel.id === 'general' ? debate : null,
          ),
        MAX_GROUP_CHANNEL_MESSAGES,
      )
      return { ...prev, [threadKey]: merged }
    })
  }, [group, channel, threadKey, debate, channel?.id, botSeedUserId])

  const messages = threadKey ? messagesByThread[threadKey] ?? [] : []

  useEffect(() => {
    setSalonSearchQuery('')
    setHasOlderOnServer(false)
  }, [threadKey])

  const debateUsers = useMemo(
    () => (debate ? debatePreviewUsersById(debate) : {}),
    [debate],
  )

  const groupSalonBot = useMemo(
    () => (group ? buildGroupSalonBotUser(group) : null),
    [group],
  )

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
  const cloudFriends = useCloudFriends()

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
    const base: Record<string, User> = {
      ...Object.fromEntries(chatPersonasPool.map((u) => [u.id, u])),
      [currentUser.id]: currentUser,
      ...debateUsers,
    }
    if (groupSalonBot) base[groupSalonBot.id] = groupSalonBot
    const meClub = favoriteClubIds[0]
    if (meClub && base.me && !base.me.fanClubId) {
      base.me = { ...base.me, fanClubId: meClub }
    }
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
        ...(meClub ? { fanClubId: meClub } : {}),
      }
      base[authUser.id] = meEntry
      if (chatActorId && chatActorId !== authUser.id) {
        base[chatActorId] = { ...meEntry, id: chatActorId }
      }
    }
    for (const peer of cloudFriends.acceptedPeers) {
      const label = resolveChatDisplayLabel(undefined, peer.displayName)
      if (base[peer.id]) {
        base[peer.id] = { ...base[peer.id], username: label }
      } else {
        base[peer.id] = {
          id: peer.id,
          username: label,
          avatarSeed: peer.id.replace(/-/g, '').slice(0, 12),
          accent: 'violet',
        }
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
      }
    }
    const merged = retainStickyChatUserAvatars(base, usersByIdRef.current)
    usersByIdRef.current = merged
    return merged
  }, [
    debateUsers,
    favoriteClubIds,
    authUser,
    chatActorId,
    groupSalonBot,
    modularByAuthor,
    profilePhotoByAuthor,
    cloudAuthorNames,
    subscriptionTiersByAuthor,
    cloudFriends.acceptedPeers,
    authorNameByUserId,
    selfProfile.modularAvatar,
    tier,
  ])

  const visibleMessages = useMemo(() => {
    if (!virageMode || favoriteClubIds.length === 0) return messages
    return messages.filter((m) => {
      if (m.userId === selfChatUserId) return true
      if (m.userId.startsWith('group-bot:')) return true
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

  const groupMessageLikes = useSupporterGroupMessageLikesSync({
    groupId: group?.id ?? '',
    groupName: group?.name ?? 'Tribune',
    enabled: groupCloudChatEnabled,
    actorDisplayName: authUser?.displayName,
  })
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
          debateId: channel.id === 'general' ? (debate?.id ?? null) : null,
          groupScarf: msg.groupScarf,
          tfPublicDebate: channel.id === 'general' && Boolean(debate?.id),
          displayName: authUser?.displayName,
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
          if (channel.id === 'general' && debate?.id) {
            void refreshDebates()
          }
          bumpGroupActivity(group.id, { messagesToday: 1, onlineNow: 1 })
          refreshGroupActivity()
          return
        }
        if (r.error === 'moderation') {
          setGroupChatModerationHint(MODERATION_REFUSED_MESSAGE_FR)
          return
        }
        setGroupChatModerationHint(
          'Message non envoyé à la tribune partagée. Recharge la page ou réessaie dans quelques secondes.',
        )
        return
      }
      if (group) bumpGroupActivity(group.id, { messagesToday: 1, onlineNow: 1 })
      setMessagesByThread((prev) => ({
        ...prev,
        [threadKey]: [...(prev[threadKey] ?? []), msg],
      }))
    },
    [
      group,
      channel,
      threadKey,
      groupCloudChatEnabled,
      publishGroupChannelMessage,
      isOpenPublicDebateSalon,
      debate?.id,
      authUser?.displayName,
      refreshDebates,
      refreshGroupActivity,
      bumpGroupActivity,
    ],
  )

  const onSend = useCallback(
    (text: string) => {
      if (!group || !channel || !threadKey) return
      if (accessLevel === 'readonly') return
      const chatGate = checkChatSend()
      if (!chatGate.ok) {
        setGroupChatLimitHint(chatGate.reason ?? 'Limite de messages atteinte.')
        return
      }
      recordChatSend()
      setGroupChatLimitHint(null)
      const openDebateToAll = debate != null && channel.id === 'general'
      if (
        !openDebateToAll &&
        group.createdBy !== 'me' &&
        !isJoined(group.id) &&
        (group.groupKind ?? 'public') !== 'public'
      ) {
        return
      }
      const msg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        matchId: groupThreadMatchId(group.id, channel.id),
        userId: selfChatUserId,
        text,
        createdAt: Date.now(),
      }
      void tryCloudGroupThenLocal(msg)
    },
    [
      group,
      channel,
      threadKey,
      isJoined,
      accessLevel,
      debate,
      tryCloudGroupThenLocal,
      selfChatUserId,
      checkChatSend,
      recordChatSend,
    ],
  )

  const onSendScarf = useCallback(
    (payload: NonNullable<Message['groupScarf']>) => {
      if (!group || !channel || !threadKey) return
      if (accessLevel === 'readonly') return
      const chatGate = checkChatSend()
      if (!chatGate.ok) {
        setGroupChatLimitHint(chatGate.reason ?? 'Limite de messages atteinte.')
        return
      }
      recordChatSend()
      setGroupChatLimitHint(null)
      const openDebateToAll = debate != null && channel.id === 'general'
      if (
        !openDebateToAll &&
        group.createdBy !== 'me' &&
        !isJoined(group.id) &&
        (group.groupKind ?? 'public') !== 'public'
      ) {
        return
      }
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
    [
      group,
      channel,
      threadKey,
      isJoined,
      accessLevel,
      debate,
      tryCloudGroupThenLocal,
      selfChatUserId,
      checkChatSend,
      recordChatSend,
    ],
  )

  const isPublicDebateInGeneralForChip = Boolean(
    group &&
      channel != null &&
      channel.id === 'general' &&
      debate != null &&
      (debate.salonAccess ?? 'public') === 'public',
  )

  const groupAccessChip = useMemo(() => {
    if (!group) {
      return { label: 'Tribune', open: false }
    }
    if (group.createdBy === 'me') {
      return { label: 'Ton groupe', open: true }
    }
    if (isPublicDebateInGeneralForChip) {
      return { label: 'Débat ouvert (général)', open: true }
    }
    if ((group.groupKind ?? 'public') === 'public') {
      return { label: 'Tribune publique', open: true }
    }
    return { label: 'Tribune privée', open: false }
  }, [group, isPublicDebateInGeneralForChip])

  if (!group) {
    return (
      <Card className="p-6" elevation="soft">
        <div className="font-display text-lg font-black tracking-tight text-tf-dark">
          Groupe introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-tf-grey">
          Cette tribune n’existe plus ou le lien est invalide.
        </div>
      </Card>
    )
  }

  const isGroupMember = group.createdBy === 'me' || isJoined(group.id)
  /** Créateur / gérant de la tribune (tribune que tu as créée). */
  const canManageGroup = group.createdBy === 'me'
  const canDeleteGroup = group.createdBy === 'me' || isSiteAdmin
  const isPublicDebateInGeneral =
    channel != null &&
    channel.id === 'general' &&
    debate != null &&
    (debate.salonAccess ?? 'public') === 'public'

  const canWriteInTribune =
    accessLevel !== 'readonly' &&
    (isGroupMember || isDebateSalon || isPublicDebateInGeneral || isPublicGroup)
  const groupMainClubId = group.fanTags?.clubIds?.[0] ?? null
  const groupMainClubLabel = groupMainClubId ? ALL_CLUBS_BY_ID[groupMainClubId]?.name ?? groupMainClubId : null
  const groupNationIso = group.fanTags?.nationIso ?? null
  const groupNationLabel = groupNationIso ? getNationByIso(groupNationIso)?.nameFr ?? groupNationIso : null
  const matchedForGroupLogo = groupMainClubId
    ? matches.find(
        (m) =>
          (m.home.id === groupMainClubId && Boolean(m.home.logoUrl)) ||
          (m.away.id === groupMainClubId && Boolean(m.away.logoUrl)),
      )
    : null
  const apiLogoFromMatches =
    matchedForGroupLogo && groupMainClubId
      ? matchedForGroupLogo.home.id === groupMainClubId
        ? matchedForGroupLogo.home.logoUrl
        : matchedForGroupLogo.away.logoUrl
      : null

  return (
    <>
      <div
        className={cn(
          'flex min-w-0 max-w-full flex-col overflow-x-clip',
          'max-lg:h-full max-lg:min-h-0 max-lg:flex-1 max-lg:gap-1 max-lg:overflow-hidden',
          'lg:gap-7',
        )}
        data-no-swipe="true"
      >
      <Card className="order-2 hidden overflow-hidden p-0 lg:order-1 lg:block" elevation="soft">
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
          <GroupIdentityBackdrop
            group={group}
            light={L}
            apiLogoUrl={apiLogoFromMatches}
            widthClass="w-[42%]"
          />
          <Link
            to="/groups"
            className={cn(
              'absolute right-4 top-4 z-[2] px-3 py-2 text-xs font-black sm:right-5 sm:top-5',
              tfGhostOnCard(L),
            )}
          >
            ← Mes groupes
          </Link>
          <div className="relative flex flex-col gap-3">
            <div className="min-w-0 pr-[7.5rem] sm:pr-[8.5rem]">
              <div className={tfIdentityGlass(L)}>
                <div className="flex items-start gap-2">
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-3xl text-xl font-black text-white shadow-sm"
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
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'truncate font-display text-2xl font-black tracking-tight',
                        TF_TEXT_FG,
                      )}
                    >
                      {group.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p
                        className={cn(
                          'min-w-0 flex-1 text-sm font-semibold leading-snug',
                          TF_TEXT_MUTED,
                        )}
                      >
                        {group.location ? `${group.location} • ` : ''}
                        {group.members.toLocaleString('fr-FR')} membres
                        {group.intensity > 0 ? ` • ${group.intensity}% ambiance` : ''}
                      </p>
                      <div
                        className="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
                        role="status"
                        aria-live="polite"
                      >
                        <Badge
                          className={cn(
                            'px-2.5 py-1 text-[11px] font-semibold tracking-wide',
                            groupAccessChip.open
                              ? L
                                ? 'border-emerald-200/90 bg-emerald-50/95 text-emerald-900'
                                : 'border-emerald-400/35 bg-emerald-950/45 text-emerald-100'
                              : L
                                ? 'border-violet-200/90 bg-violet-50/95 text-violet-900'
                                : 'border-violet-400/35 bg-violet-950/45 text-violet-100',
                          )}
                        >
                          <span aria-hidden>{groupAccessChip.open ? '🟢 ' : '🔒 '}</span>
                          {groupAccessChip.label}
                        </Badge>
                        {isSupabaseConfigured() && (!authUser || authUser.isAnonymous) ? (
                          <Link
                            className={cn(
                              'text-[11px] font-black underline underline-offset-2',
                              L
                                ? 'text-violet-700 hover:text-violet-900'
                                : 'text-violet-300 hover:text-violet-100',
                            )}
                            to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                          >
                            Connexion
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShareButton
                path={`/group/${group.id}`}
                title={group.name}
                text={`Rejoins-moi sur Talk Foot — tribune « ${group.name} »`}
                label="Partager la tribune"
              />
              {group.createdBy !== 'me' && !isJoined(group.id) ? (
                <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
                  <Button
                    variant="primary"
                    className="min-h-12 touch-manipulation rounded-2xl text-xs font-black"
                    onClick={onJoinGroupClick}
                  >
                    Rejoindre cette tribune
                  </Button>
                  {joinOtherError ? (
                    <p className="text-xs font-semibold text-amber-200">{joinOtherError}</p>
                  ) : null}
                </div>
              ) : null}
              {group.createdBy !== 'me' && isJoined(group.id) ? (
                <LeaveTribuneButton
                  layout="inline"
                  groupName={group.name}
                  onLeave={() => {
                    void handleLeaveTribune(group.id)
                    navigate('/groups?tab=mine')
                  }}
                />
              ) : null}
              {canManageGroup ? (
                <Button
                  variant="soft"
                  className="rounded-3xl"
                  title="Couleurs, slogan, intensité…"
                  onClick={() => setPersonalizeOpen(true)}
                >
                  Personnaliser
                </Button>
              ) : null}
              {canDeleteGroup ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-3xl text-xs font-black text-rose-700 hover:bg-rose-50"
                  disabled={deleteBusy}
                  onClick={() => {
                    if (deleteBusy) return
                    const ok = window.confirm(
                      isSiteAdmin && group.createdBy !== 'me'
                        ? `Supprimer définitivement la tribune « ${group.name} » (action admin) ?\n\nTous les messages et membres seront effacés. Irréversible.`
                        : `Supprimer définitivement la tribune « ${group.name} » ?\n\nCette action est irréversible. Les membres ne pourront plus y accéder.`,
                    )
                    if (!ok) return
                    setDeleteBusy(true)
                    void (async () => {
                      const result = await deleteGroup(group.id)
                      setDeleteBusy(false)
                      if (!result.ok) {
                        window.alert(
                          result.error === 'admin_only' || result.error === 'not_owner'
                            ? 'Suppression réservée aux administrateurs ou au créateur de la tribune.'
                            : 'Impossible de supprimer la tribune pour le moment. Réessaie dans un instant.',
                        )
                        return
                      }
                      navigate('/groups', { replace: true })
                    })()
                  }}
                >
                  {deleteBusy
                    ? 'Suppression…'
                    : isSiteAdmin && group.createdBy !== 'me'
                      ? 'Supprimer (admin)'
                      : 'Supprimer la tribune'}
                </Button>
              ) : null}
            </div>

            <div className="min-w-0 space-y-3">
              <div
                className={cn(
                  'max-w-[60ch] text-sm font-semibold',
                  TF_TEXT_MUTED,
                )}
              >
                “{group.motto}”
              </div>
              {group.hashtags && group.hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {group.hashtags.map((h) => (
                    <span
                      key={h}
                      className={cn(
                        'px-2.5 py-0.5 text-[11px] font-bold',
                        tfChipSurface(L),
                      )}
                    >
                      #{h}
                    </span>
                  ))}
                </div>
              ) : null}

              {presentationMedia?.moderationStatus === 'approved' ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-sm ring-1 ring-emerald-300/35">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/90 bg-emerald-50/90 px-3 py-2">
                    <Badge className="border-emerald-300 bg-emerald-100 text-emerald-950">
                      Validé plateforme
                    </Badge>
                    <span className="text-[10px] font-bold text-emerald-900/80">
                      {presentationMedia.type === 'video' ? 'Vidéo' : 'Photo'} groupe
                    </span>
                  </div>
                  <div className="relative aspect-video max-h-[min(52vh,320px)] w-full bg-black/5">
                    {presentationMedia.type === 'image' ? (
                      <img
                        src={presentationMedia.url}
                        alt={presentationMedia.caption ?? 'Média du groupe'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={presentationMedia.url}
                        controls
                        className="h-full w-full object-cover"
                        poster={presentationMedia.posterUrl}
                      />
                    )}
                  </div>
                  {presentationMedia.caption ? (
                    <p className="px-3 py-2 text-xs font-semibold text-tf-grey">
                      {presentationMedia.caption}
                    </p>
                  ) : null}
                </div>
              ) : presentationMedia?.moderationStatus === 'pending' ? (
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
                      {presentationMedia.type === 'video' ? 'Vidéo' : 'Photo'} · contrôle auto
                    </span>
                  </div>
                  <div className="relative aspect-video max-h-[min(52vh,320px)] w-full overflow-hidden bg-slate-900/90">
                    {presentationMedia.type === 'image' ? (
                      <img
                        src={presentationMedia.url}
                        alt=""
                        className="h-full w-full scale-105 object-cover opacity-50 blur-md"
                        loading="lazy"
                        aria-hidden="true"
                      />
                    ) : (
                      <video
                        src={presentationMedia.url}
                        muted
                        playsInline
                        preload="metadata"
                        poster={presentationMedia.posterUrl}
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
                        Publication en cours de validation par l&apos;équipe Talk Foot (~
                        {Math.round(DEMO_MODERATION_APPROVE_MS / 1000)}&nbsp;s)
                      </p>
                    </div>
                  </div>
                  {presentationMedia.caption ? (
                    <p className="border-t border-amber-200/70 px-3 py-2 text-[11px] font-semibold text-amber-950/90">
                      {presentationMedia.caption}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="order-3 flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-0 overflow-x-clip max-lg:min-h-0 max-lg:overflow-hidden sm:gap-3 lg:order-2 lg:grid lg:h-[min(92dvh,calc(100dvh-5.5rem))] lg:max-h-[min(92dvh,calc(100dvh-5.5rem))] lg:flex-none lg:grid-cols-[320px_1fr] lg:items-stretch">
        <div className="mb-0 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 max-lg:py-0.5 lg:hidden">
          <div className="flex min-w-0 items-center gap-1">
            <Link
              to="/groups"
              className={cn('shrink-0 rounded-xl px-1.5 py-1 text-[11px] font-black', tfGhostOnCard(L))}
            >
              ←
            </Link>
            <span className={cn('min-w-0 truncate text-xs font-black leading-tight', TF_TEXT_FG)}>
              <span aria-hidden>{group.emoji}</span> {group.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton
              compact
              path={`/group/${group.id}`}
              title={group.name}
              text={`Tribune Talk Foot : ${group.name}`}
            />
            {canManageGroup ? (
              <Button
                type="button"
                variant="soft"
                className="size-8 shrink-0 rounded-xl p-0 text-base"
                title="Personnaliser la tribune"
                onClick={() => setPersonalizeOpen(true)}
              >
                <span aria-hidden>⚙️</span>
              </Button>
            ) : null}
            {canDeleteGroup ? (
              <Button
                type="button"
                variant="ghost"
                className="size-8 shrink-0 rounded-xl p-0 text-base text-rose-700"
                title={isSiteAdmin && group.createdBy !== 'me' ? 'Supprimer (admin)' : 'Supprimer la tribune'}
                disabled={deleteBusy}
                onClick={() => {
                  if (deleteBusy) return
                  const ok = window.confirm(
                    isSiteAdmin && group.createdBy !== 'me'
                      ? `Supprimer « ${group.name} » (admin) ? Action irréversible.`
                      : `Supprimer « ${group.name} » ? Action irréversible.`,
                  )
                  if (!ok) return
                  setDeleteBusy(true)
                  void deleteGroup(group.id).then((result) => {
                    setDeleteBusy(false)
                    if (!result.ok) {
                      window.alert('Suppression impossible. Réessaie plus tard.')
                      return
                    }
                    navigate('/groups', { replace: true })
                  })
                }}
              >
                <span aria-hidden>🗑</span>
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="hidden p-4 sm:p-5 lg:block lg:max-h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain" elevation="soft">
          <div className={cn('text-[11px] font-black tracking-[0.18em]', TF_TEXT_MUTED)}>
            SALONS
          </div>
          <div className="mt-3 space-y-2">
            {group.channels.map((c) => (
              <button
                key={c.id}
                className={
                  channelId === c.id
                    ? cn(
                        'w-full rounded-3xl border-2 px-4 py-3 text-left shadow-sm',
                        L ? 'bg-white' : 'bg-[color:var(--tf-c30-surface-soft)]',
                      )
                    : cn(
                        'w-full rounded-3xl border px-4 py-3 text-left',
                        L
                          ? 'border-tf-grey-pastel/50 bg-tf-white/90 hover:bg-white'
                          : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)] hover:bg-[color:color-mix(in_srgb,var(--tf-c30-surface-soft)_88%,white)]',
                      )
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
                    <div className={cn('truncate text-sm font-black', TF_TEXT_FG)}>
                      {c.emoji} {c.name}
                    </div>
                    <div className={cn('mt-0.5 truncate text-xs font-semibold', TF_TEXT_MUTED)}>
                      {c.description}
                    </div>
                  </div>
                  <span className={cn('text-xs font-black', TF_TEXT_SUBTLE)}>→</span>
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
                      ? `Maximum ${MAX_GROUP_CHANNELS} tribunes`
                      : undefined
                  }
                  onClick={() => {
                    setNewSalonError(null)
                    setSalonFormOpen(true)
                  }}
                >
                  + Nouvelle tribune
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
                      setNewSalonError(`Limite de ${MAX_GROUP_CHANNELS} tribunes atteinte.`)
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
                  <div className={cn('text-xs font-black', TF_TEXT_FG)}>Créer une tribune</div>
                  <Input
                    value={newSalonName}
                    onChange={(e) => setNewSalonName(e.target.value)}
                    placeholder="Nom de la tribune"
                    className="text-sm"
                    aria-label="Nom de la nouvelle tribune"
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
                    aria-label="Emoji de la tribune"
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
            className={cn(
              'mt-4 hidden rounded-2xl border px-3 py-2 lg:block',
              L ? 'border-tf-grey-pastel/40 bg-tf-white/95' : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)]',
            )}
            data-no-swipe="true"
          >
            <summary
              className={cn(
                'cursor-pointer list-none text-[11px] font-black uppercase tracking-wide [&::-webkit-details-marker]:hidden',
                TF_TEXT_MUTED,
              )}
            >
              Tifo pixel (match)
            </summary>
            <GroupTifoPanel
              groupId={group.id}
              matches={matches}
              groupClubId={groupMainClubId}
              groupClubLabel={groupMainClubLabel ?? undefined}
              groupNationIso={groupNationIso}
              groupNationLabel={groupNationLabel ?? undefined}
              isGroupAdmin={group.createdBy === 'me'}
            />
          </details>
        </Card>

        {canManageGroup && salonFormOpen ? (
          <Card className="min-w-0 space-y-2 p-3 lg:hidden" elevation="soft">
            <div className={cn('text-xs font-black', TF_TEXT_FG)}>Créer une tribune</div>
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
                  setNewSalonError(`Limite de ${MAX_GROUP_CHANNELS} tribunes atteinte.`)
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
              <Input
                value={newSalonName}
                onChange={(e) => setNewSalonName(e.target.value)}
                placeholder="Nom de la tribune"
                className="text-sm"
                aria-label="Nom de la nouvelle tribune"
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
                aria-label="Emoji de la tribune"
              />
              {newSalonError ? (
                <p className="text-xs font-semibold text-rose-600">{newSalonError}</p>
              ) : null}
              <Button type="submit" variant="primary" className="w-full rounded-2xl text-xs font-black">
                Ajouter
              </Button>
            </form>
          </Card>
        ) : null}

        <Card
          className={cn(
            'flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden border-2 p-0',
            'max-lg:grid max-lg:h-full max-lg:min-h-0 max-lg:flex-1 max-lg:grid-rows-[auto_minmax(0,1fr)_auto]',
            'lg:min-h-0 lg:h-full lg:max-h-none',
          )}
          elevation="soft"
          style={
            salonSurface
              ? { borderColor: salonSurface.boxBorderColor }
              : undefined
          }
        >
          <div
            className={cn(
              tfSalonHeader(L, 'shrink-0 p-3 sm:p-4 lg:p-5'),
              'max-lg:row-start-1 max-lg:border-b max-lg:p-1.5',
              L ? 'max-lg:border-tf-grey-pastel/40' : 'max-lg:border-white/10',
              isDebateSalon &&
                'max-lg:max-h-[min(28dvh,11.5rem)] max-lg:overflow-y-auto max-lg:overscroll-y-contain',
            )}
          >
            <div
              className="mb-1 flex gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Choisir un salon"
            >
              {group.channels.map((c) => {
                const active = channelId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      'shrink-0 rounded-lg border px-2 py-1 text-left text-[10px] font-black transition',
                      active
                        ? L
                          ? 'border-tf-dark/25 bg-white shadow-sm ring-2 ring-tf-electric/25'
                          : 'border-sky-400/40 bg-white/[0.12] ring-2 ring-sky-400/30'
                        : L
                          ? 'border-tf-grey-pastel/60 bg-tf-white/90'
                          : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)]',
                    )}
                    style={
                      active && salonSurface
                        ? { borderColor: salonSurface.boxBorderColor }
                        : undefined
                    }
                    onClick={() => setChannelId(c.id)}
                  >
                    <span className="whitespace-nowrap">
                      {c.emoji} {c.name}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="hidden flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3 lg:flex">
              <div className="min-w-0 flex-1 sm:min-w-[14rem]">
                <div
                  className={cn(
                    'text-[10px] font-black tracking-[0.16em] sm:text-[11px] sm:tracking-[0.18em]',
                    TF_TEXT_MUTED,
                  )}
                >
                  {channel?.emoji} {channel?.name}
                </div>
                <div
                  className={cn(
                    'mt-0.5 font-display text-base font-black tracking-tight sm:mt-1 sm:text-lg',
                    TF_TEXT_FG,
                  )}
                >
                  Tribune — discussion
                </div>
                <div
                  className={cn(
                    'mt-0.5 line-clamp-2 text-xs font-semibold sm:mt-1 sm:line-clamp-none sm:text-sm',
                    TF_TEXT_MUTED,
                  )}
                >
                  {channel?.description}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2.5 pt-1 sm:w-auto sm:min-w-[min(100%,18rem)] sm:items-stretch sm:pt-0">
                {channel?.id === 'general' && isSiteAdmin ? (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      className={cn(
                        'w-full shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black tracking-tight',
                        'shadow-[0_8px_28px_rgba(255,59,59,0.32)] ring-2 ring-white/20',
                        !L && 'border-orange-400/45 hover:shadow-[0_10px_32px_rgba(255,59,59,0.4)]',
                      )}
                      onClick={openAdminDebatePicker}
                    >
                      <span aria-hidden className="text-base leading-none">
                        {effectiveDebateId ? '↻' : '🗣️'}
                      </span>
                      <span className="max-sm:hidden">
                        {effectiveDebateId ? 'Changer le débat lié' : 'Lier un débat (admin)'}
                      </span>
                      <span className="sm:hidden">
                        {effectiveDebateId ? 'Changer débat' : 'Lier débat'}
                      </span>
                    </Button>
                    {effectiveDebateId ? (
                      <button
                        type="button"
                        className={cn(
                          'w-full shrink-0 whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-bold transition',
                          tfChipSurface(L, 'hover:opacity-95'),
                        )}
                        onClick={() => void handleAdminUnlinkDebate()}
                      >
                        Détacher le débat
                      </button>
                    ) : null}
                    {adminDebateLinkError ? (
                      <p className="text-xs font-semibold text-rose-600">{adminDebateLinkError}</p>
                    ) : null}
                  </>
                ) : null}
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  {preferencesComplete && favoriteClubIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setVirageMode(!virageMode)}
                      className={cn(
                        'shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-black transition sm:px-3 sm:text-[11px]',
                        virageMode
                          ? 'border-tf-dark bg-tf-dark text-white'
                          : tfChipSurface(L, 'hover:opacity-95'),
                      )}
                      title={LIVE_FIL_EQUIPE_COEUR.title}
                    >
                      {virageMode ? `✓ ${LIVE_FIL_EQUIPE_COEUR.labelOn}` : LIVE_FIL_EQUIPE_COEUR.label}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="relative z-[2] flex flex-nowrap touch-manipulation items-center gap-1 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
              {channel?.id === 'general' && isSiteAdmin ? (
                <>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex h-7 shrink-0 touch-manipulation items-center justify-center rounded-lg border-2 border-tf-cta-hover/40 px-2 text-[9px] font-black text-white',
                      'bg-tf-cta shadow-[0_2px_10px_rgba(255,59,59,0.28)] active:scale-[0.98]',
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openAdminDebatePicker()
                    }}
                  >
                    <span aria-hidden className="mr-0.5">
                      {effectiveDebateId ? '↻' : '🗣️'}
                    </span>
                    {effectiveDebateId ? 'Changer' : 'Lier débat'}
                  </button>
                  {effectiveDebateId ? (
                    <button
                      type="button"
                      className={cn(
                        'h-7 shrink-0 rounded-lg border px-1.5 py-0.5 text-[9px] font-bold',
                        tfChipSurface(L, 'hover:opacity-95'),
                      )}
                      onClick={() => void handleAdminUnlinkDebate()}
                    >
                      Détacher
                    </button>
                  ) : null}
                </>
              ) : null}
              {preferencesComplete && favoriteClubIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setVirageMode(!virageMode)}
                  className={cn(
                    'h-7 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-black',
                    virageMode
                      ? 'border-tf-dark bg-tf-dark text-white'
                      : tfChipSurface(L, 'hover:opacity-95'),
                  )}
                  title={LIVE_FIL_EQUIPE_COEUR.title}
                >
                  {virageMode ? '✓ Cœur' : 'Cœur'}
                </button>
              ) : null}
              <details
                className={cn('min-w-[2.25rem] shrink-0', L ? 'text-tf-grey' : 'text-sky-200/90')}
                data-no-swipe="true"
              >
                <summary
                  className={cn(
                    'flex h-7 cursor-pointer list-none items-center justify-center rounded-lg border px-1.5 text-[10px] font-black [&::-webkit-details-marker]:hidden',
                    tfChipSurface(L),
                  )}
                >
                  🎌
                </summary>
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-[min(42dvh,16rem)] overflow-y-auto overscroll-y-contain rounded-xl border bg-white p-2 shadow-lg [-webkit-overflow-scrolling:touch] dark:border-white/10 dark:bg-[#041a2d]">
                  <GroupTifoPanel
                    embedded
                    groupId={group.id}
                    matches={matches}
                    groupClubId={groupMainClubId}
                    groupClubLabel={groupMainClubLabel ?? undefined}
                    groupNationIso={groupNationIso}
                    groupNationLabel={groupNationLabel ?? undefined}
                    isGroupAdmin={group.createdBy === 'me'}
                  />
                </div>
              </details>
              <details
                className={cn('min-w-[2.25rem] shrink-0', L ? 'text-tf-grey' : 'text-sky-200/90')}
                data-no-swipe="true"
              >
                <summary
                  className={cn(
                    'flex h-7 cursor-pointer list-none items-center justify-center rounded-lg border px-1.5 text-[10px] font-black [&::-webkit-details-marker]:hidden',
                    tfChipSurface(L),
                  )}
                >
                  🔍
                </summary>
                <div className="mt-1.5 w-full min-w-[10rem]">
                  <Input
                    type="search"
                    value={salonSearchQuery}
                    onChange={(e) => setSalonSearchQuery(e.target.value)}
                    placeholder="Rechercher…"
                    className="h-9 w-full rounded-xl text-sm font-semibold"
                    aria-label="Rechercher dans les messages"
                  />
                  {salonSearchQuery.trim() ? (
                    <p className="mt-1 text-[10px] font-bold text-tf-grey">
                      {displayMessages.length} résultat{displayMessages.length !== 1 ? 's' : ''}
                    </p>
                  ) : null}
                </div>
              </details>
            </div>

            {debate && channel?.id === 'general' ? (
              <>
                <LinkedDebateBanner
                  debate={debate}
                  debateId={effectiveDebateId}
                  compact
                  className="mt-3 hidden lg:mt-4 lg:block"
                />
                <details
                  className={cn(
                    'mt-1 rounded-lg border lg:hidden',
                    L ? 'border-tf-dark/12 bg-white' : 'border-[color:var(--tf-c30-border)] bg-[color:var(--tf-c30-surface-soft)]',
                  )}
                  data-no-swipe="true"
                >
                  <summary className="cursor-pointer list-none px-2 py-1.5 [&::-webkit-details-marker]:hidden">
                    <p
                      className={cn(
                        'text-[9px] font-black uppercase tracking-[0.14em]',
                        TF_TEXT_MUTED,
                      )}
                    >
                      Débat lié — toucher pour déplier
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 line-clamp-2 text-xs font-black leading-snug',
                        TF_TEXT_FG,
                      )}
                    >
                      {debate.title}
                    </p>
                  </summary>
                  <div
                    className={cn(
                      'border-t px-3 py-2.5',
                      L ? 'border-tf-dark/10' : 'border-white/10',
                    )}
                  >
                    <LinkedDebateBanner debate={debate} debateId={effectiveDebateId} className="!border-0 !bg-transparent !p-0 !shadow-none !ring-0" />
                  </div>
                </details>
              </>
            ) : null}
          </div>

          {accessLevel === 'readonly' ? (
            <div className="mx-3 mt-2 max-lg:row-start-1 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 sm:mx-5 sm:mt-4 sm:px-4 sm:py-3 sm:text-sm">
              <p className="font-black text-amber-900">Lecture seule (tribune « ennemi »)</p>
              <p className="mt-2 leading-relaxed text-amber-900/95">
                Ici, c’est volontaire : dans les <strong>groupes</strong>, une tribune rattachée à un club{' '}
                <strong>rival</strong> de tes favoris (ex. derby) est en{' '}
                <strong>consultation uniquement</strong>, pour éviter les débordements et le spam entre tribunes.
                Sur un <strong>match live</strong>, tu peux toujours écrire : le{' '}
                <strong>{LIVE_FIL_EQUIPE_COEUR.label}</strong> filtre ce que tu <em>vois</em> parmi cette tribune (même
                logique que sur le live public), sans couper ton clavier.
              </p>
              {readonlyRivalExplanation ? (
                <p className="mt-2 text-xs font-bold text-amber-800/90">
                  Détecté : supporter {readonlyRivalExplanation.mine} dans une tribune orientée{' '}
                  {readonlyRivalExplanation.theirs}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mx-3 mt-3 hidden min-w-0 shrink-0 space-y-2 sm:mx-5 lg:block">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                type="search"
                value={salonSearchQuery}
                onChange={(e) => setSalonSearchQuery(e.target.value)}
                placeholder="Rechercher dans cette tribune…"
                className="h-10 min-w-0 flex-1 rounded-xl border-tf-grey-pastel/80 text-sm font-semibold"
                aria-label="Rechercher dans les messages de la tribune"
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
              'min-h-0 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-1.5 [-webkit-overflow-scrolling:touch] sm:px-5 sm:py-4',
              'max-lg:relative max-lg:z-0 max-lg:row-start-2 max-lg:mt-0 max-lg:scroll-pb-28 max-lg:min-h-[min(52dvh,28rem)]',
              'lg:mt-4 lg:flex-1 lg:scroll-pb-3',
              'lg:overscroll-y-contain',
            )}
            style={{
              ...(salonSurface?.backdrop ?? {}),
              scrollPaddingBottom: MOBILE_CHAT_COMPOSER_DOCK_HEIGHT,
            }}
            role="log"
            aria-label="Messages de la tribune"
            aria-live="polite"
          >
            {groupCloudChatEnabled && hasOlderOnServer && oldestCloudIso ? (
              <div className="mb-2 lg:hidden">
                <Button
                  type="button"
                  variant="soft"
                  className="h-8 w-full rounded-xl text-[10px] font-black"
                  disabled={olderLoading}
                  onClick={() => void onLoadOlderCloudMessages()}
                >
                  {olderLoading ? 'Chargement…' : 'Messages plus anciens'}
                </Button>
              </div>
            ) : null}
            <MessageList
              messages={displayMessages}
              usersById={usersById}
              selfUserId={selfChatUserId}
              selfChatActorId={chatActorId}
              selfClerkUserId={authUser?.id}
              salonTone={L ? 'light' : 'dark'}
              getLikes={(id) =>
                isUuidMessageId(id) ? groupMessageLikes.getLikeState(id).likes : 0
              }
              hasLiked={(id) =>
                isUuidMessageId(id) ? groupMessageLikes.getLikeState(id).likedByMe : false
              }
              onToggleLike={
                groupMessageLikes.isConfigured
                  ? (m) => {
                      if (!isUuidMessageId(m.id) || !group) return
                      const liked = groupMessageLikes.getLikeState(m.id).likedByMe
                      if (!liked) bumpGroupActivity(group.id, { reactionsToday: 1 })
                      void groupMessageLikes.toggleLike(m.id).finally(() => refreshGroupActivity())
                    }
                  : undefined
              }
            />
            <div className="h-3" />
          </div>

          {accessLevel === 'readonly' ? (
            <div className="border-t border-tf-grey-pastel/50 bg-tf-grey-pastel/20 px-4 py-4 text-center text-sm font-bold text-tf-grey max-lg:row-start-3 sm:px-5">
              Écriture désactivée sur cette tribune (mode lecture seule).
            </div>
          ) : !canWriteInTribune ? (
            <GroupJoinWriteFooter
              message={
                debate && channel?.id === 'general' && debate.salonAccess === 'members'
                  ? 'Ce débat est réservé aux membres du groupe — rejoins pour participer.'
                  : 'Tu n’as pas rejoint cette tribune — lecture seule jusqu’à adhésion.'
              }
              joinOtherError={joinOtherError}
              onJoin={onJoinGroupClick}
            />
          ) : (
            <MobileChatComposerDock
              gridRowClassName="max-lg:row-start-3"
              className={cn(
                'min-w-0 touch-manipulation backdrop-blur-md',
                L ? 'border-tf-grey-pastel/50 bg-white/95' : 'border-white/12 bg-[#041a2d]/95',
              )}
              ariaLabel={`Écrire dans ${channel?.name ?? 'la tribune'}`}
            >
              {groupChatModerationHint ? (
                <p className="mb-2 rounded-xl border border-rose-200/80 bg-rose-50/95 px-3 py-2 text-xs font-semibold text-rose-800">
                  {groupChatModerationHint}
                </p>
              ) : null}
              {groupChatLimitHint ? (
                <p className="mb-2 rounded-xl border border-amber-200/80 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900">
                  {groupChatLimitHint}{' '}
                  <Link to="/formules" className="underline">
                    Voir les formules
                  </Link>
                </p>
              ) : null}
              <MessageComposer
                onSend={onSend}
                placeholder={`Message dans ${channel?.name ?? 'la tribune'}…`}
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
            </MobileChatComposerDock>
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

      {isSiteAdmin ? (
        <DebatePickerModal
          open={debatePickerOpen}
          adminLinkMode
          groupId={group.id}
          customForGroup={[]}
          onClose={() => setDebatePickerOpen(false)}
          onPick={(debateId) => void handleAdminPickDebate(debateId)}
          onPublishCustom={() => null}
        />
      ) : null}

      <TribuneLimitPopup
        open={tribuneLimitPopup !== null}
        kind={tribuneLimitPopup ?? 'debate'}
        tier={tier}
        onClose={() => setTribuneLimitPopup(null)}
        myTribunes={myJoinedGroups}
        orphanJoinedIds={orphanJoinedGroupIds}
        joinedCount={groupLimits.joined}
        maxJoined={groupLimits.maxJoined ?? 5}
        onLeaveTribune={(id) => void handleLeaveTribune(id, { retryJoin: true })}
        leavingTribuneId={leavingTribuneId}
      />
    </>
  )
}
