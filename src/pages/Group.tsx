import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { currentUser, mockUsers } from '../data/users'
import type { Message } from '../types/chat'
import { useMessageLikes } from '../hooks/useMessageLikes'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { cn } from '../utils/cn'
import { buildGroupThreadSeed, debatePreviewUsersById, groupThreadMatchId } from '../utils/groupThreadMessages'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { EditGroupModal } from '../components/group/EditGroupModal'
import { DebatePickerModal } from '../components/group/DebatePickerModal'
import { GroupTifoPanel } from '../components/group/GroupTifoPanel'
import type { SupporterChannel, SupporterGroup } from '../types/group'
import { useMatches } from '../contexts/MatchesContext'
import { getGroupQuickEmotes, getGroupSalonChatSurfaceStyles } from '../utils/groupSalonStyles'

const MAX_GROUP_CHANNELS = 14

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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const debateFromQuery = searchParams.get('debate')

  const { byId, joinGroup, leaveGroup, isJoined, updateGroup } = useSupporterGroups()
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

  useEffect(() => {
    if (group?.id) joinGroup(group.id)
  }, [group?.id, joinGroup])
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

  const threadKey = group && channel ? `${group.id}:${channel.id}` : ''

  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({})
  /** Dernier débat lié au salon « général » — pour re-seeder si ?debate= change. */
  const prevGeneralDebateRef = useRef<string | null | undefined>(undefined)

  const [personalizeOpen, setPersonalizeOpen] = useState(false)
  const [debatePickerOpen, setDebatePickerOpen] = useState(false)
  const [salonFormOpen, setSalonFormOpen] = useState(false)
  const [newSalonName, setNewSalonName] = useState('')
  const [newSalonDesc, setNewSalonDesc] = useState('')
  const [newSalonEmoji, setNewSalonEmoji] = useState('🔊')
  const [newSalonError, setNewSalonError] = useState<string | null>(null)

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

      const seed = buildGroupThreadSeed(
        group.id,
        channel.id,
        channel.name,
        debate && channel.id === 'general' ? debate : null,
      )
      return { ...prev, [threadKey]: seed }
    })
  }, [group, channel, threadKey, debate, channel?.id])

  const messages = threadKey ? messagesByThread[threadKey] ?? [] : []

  const debateUsers = useMemo(
    () => (debate ? debatePreviewUsersById(debate) : {}),
    [debate],
  )

  const usersById = useMemo(() => {
    const base: Record<string, (typeof mockUsers)[0]> = {
      ...Object.fromEntries(mockUsers.map((u) => [u.id, u])),
      [currentUser.id]: currentUser,
      ...debateUsers,
    }
    const meClub = favoriteClubIds[0]
    if (meClub && base.me && !base.me.fanClubId) {
      base.me = { ...base.me, fanClubId: meClub }
    }
    return base
  }, [debateUsers, favoriteClubIds])

  const visibleMessages = useMemo(() => {
    if (!virageMode || favoriteClubIds.length === 0) return messages
    return messages.filter((m) => {
      if (m.userId === currentUser.id) return true
      const u = usersById[m.userId]
      const fid = u?.fanClubId
      return Boolean(fid && favoriteClubIds.includes(fid))
    })
  }, [messages, virageMode, favoriteClubIds, usersById])

  const messageLikes = useMessageLikes()
  const feedRef = useAutoScroll<HTMLDivElement>([visibleMessages.length])

  const onSend = useCallback(
    (text: string) => {
      if (!group || !channel || !threadKey) return
      const msg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        matchId: groupThreadMatchId(group.id, channel.id),
        userId: currentUser.id,
        text,
        createdAt: Date.now(),
      }
      setMessagesByThread((prev) => ({
        ...prev,
        [threadKey]: [...(prev[threadKey] ?? []), msg],
      }))
    },
    [group, channel, threadKey],
  )

  const onSendScarf = useCallback(
    (payload: NonNullable<Message['groupScarf']>) => {
      if (!group || !channel || !threadKey) return
      const msg: Message = {
        id: `msg-scarf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        matchId: groupThreadMatchId(group.id, channel.id),
        userId: currentUser.id,
        text: '',
        createdAt: Date.now(),
        groupScarf: payload,
      }
      setMessagesByThread((prev) => ({
        ...prev,
        [threadKey]: [...(prev[threadKey] ?? []), msg],
      }))
    },
    [group, channel, threadKey],
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

  return (
    <>
      <div className="flex flex-col gap-7" data-no-swipe="true">
      <div
        className="order-2 rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50/95 to-indigo-50/80 px-4 py-3 text-sm font-semibold text-tf-dark shadow-sm sm:px-5 lg:order-1"
        role="status"
      >
        <p className="font-black text-violet-950">Salon de groupe (soirée privée)</p>
        <p className="mt-1 text-[13px] font-medium leading-snug text-tf-dark/85">
          Ici, seuls les membres de ce groupe voient ce fil — comme une viewing party entre vous. Ce n’est{' '}
          <strong className="font-bold">pas</strong> le chat public du live (zones Virage, Analyse, Chill, Général){' '}
          ni le <strong className="font-bold">{LIVE_FIL_EQUIPE_COEUR.label.toLowerCase()}</strong> du profil.
        </p>
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
                      {group.presentationMedia.type === 'video' ? 'Vidéo' : 'Photo'} · contrôle auto (démo)
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
                        Analyse du fichier (aperçu flouté) — en prod, un modérateur ou l’IA valident le contenu
                        avant publication.
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
              <Link
                to="/groups"
                className="rounded-2xl border border-tf-dark/12 bg-white/90 px-3 py-2 text-xs font-black text-tf-dark shadow-sm transition hover:border-tf-electric/35"
              >
                ← Mes groupes
              </Link>
              <Badge className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-dark">
                {group.createdBy === 'me' ? 'Ton groupe' : 'Groupe public'}
              </Badge>
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
          {group.createdBy === 'me' ? (
            <Button
              type="button"
              variant="soft"
              className="h-8 shrink-0 rounded-2xl px-2.5 text-[10px] font-black"
              onClick={() => setPersonalizeOpen(true)}
            >
              Perso
            </Button>
          ) : (
            <span className="h-8 w-[3.25rem] shrink-0" aria-hidden />
          )}
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
                      description: (newSalonDesc.trim() || 'Discussion').slice(0, 120),
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
            'flex min-h-[18rem] flex-col overflow-hidden border-2 p-0',
            'h-[min(76dvh,40rem)] max-h-[min(76dvh,40rem)] sm:h-[min(78dvh,42rem)] sm:max-h-[min(78dvh,42rem)]',
            'lg:h-full lg:max-h-none lg:min-h-0',
          )}
          elevation="soft"
          style={
            salonSurface
              ? { borderColor: salonSurface.boxBorderColor }
              : undefined
          }
        >
          <div className="shrink-0 border-b border-tf-grey-pastel/50 bg-tf-white/95 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey/70">
                  {channel?.emoji} {channel?.name}
                </div>
                <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
                  Salon — discussion
                </div>
                <div className="mt-1 text-sm font-semibold text-tf-grey/70">
                  {channel?.description}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {preferencesComplete && favoriteClubIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setVirageMode(!virageMode)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition',
                      virageMode
                        ? 'border-tf-dark bg-tf-dark text-white'
                        : 'border-tf-grey-pastel/60 bg-white text-tf-grey hover:bg-tf-grey-pastel/20',
                    )}
                    title={LIVE_FIL_EQUIPE_COEUR.title}
                  >
                    {virageMode ? `✓ ${LIVE_FIL_EQUIPE_COEUR.labelOn}` : LIVE_FIL_EQUIPE_COEUR.label}
                  </button>
                ) : null}
                <Badge className="border-tf-dark/15 bg-tf-night/[0.06] text-tf-dark">Live</Badge>
                {channel?.id === 'general' ? (
                  <>
                    <Button
                      type="button"
                      variant="soft"
                      className="rounded-2xl px-3 py-1.5 text-[11px] font-black"
                      onClick={() => setDebatePickerOpen(true)}
                    >
                      {debateFromQuery ? 'Changer le débat' : 'Débat du salon'}
                    </Button>
                    {debateFromQuery ? (
                      <button
                        type="button"
                        className="rounded-2xl border border-tf-grey-pastel/60 bg-white px-3 py-1.5 text-[11px] font-bold text-tf-grey transition hover:bg-tf-grey-pastel/20"
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
              <div className="mt-4 rounded-2xl border border-tf-dark/12 bg-gradient-to-r from-tf-night/[0.06] to-tf-ice/80 px-4 py-3">
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

          <div
            ref={feedRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-5"
            style={salonSurface?.backdrop}
            role="log"
            aria-label="Messages du salon"
            aria-live="polite"
          >
            <MessageList
              messages={visibleMessages}
              usersById={usersById}
              getLikes={messageLikes.getLikes}
              hasLiked={(id) => messageLikes.hasLiked(id, 'me')}
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
          ) : (
            <div
              className="shrink-0 border-t border-tf-grey-pastel/50 px-4 py-3 backdrop-blur-sm sm:px-5"
              style={salonSurface?.backdrop}
            >
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
