import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { getGroupAccess } from '../utils/groupAccess'
import { isRivalClub } from '../data/fanRivals'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { getDebateById } from '../data/debates'
import { MessageList } from '../components/channel/MessageList'
import { MessageComposer } from '../components/channel/MessageComposer'
import { currentUser, mockUsers } from '../data/users'
import type { Message } from '../types/chat'
import { useMessageLikes } from '../hooks/useMessageLikes'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { cn } from '../utils/cn'
import { buildGroupThreadSeed, debatePreviewUsersById, groupThreadMatchId } from '../utils/groupThreadMessages'

export function GroupPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debateFromQuery = searchParams.get('debate')
  const debate = debateFromQuery ? getDebateById(debateFromQuery) : undefined

  const { byId, joinGroup, leaveGroup, isJoined } = useSupporterGroups()
  const group = groupId ? byId(groupId) : null

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

  useEffect(() => {
    if (!group || !channel || !threadKey) return
    setMessagesByThread((prev) => {
      if (prev[threadKey]?.length) return prev
      const seed = buildGroupThreadSeed(
        group.id,
        channel.id,
        channel.name,
        debate && channel.id === 'general' ? debate : null,
      )
      return { ...prev, [threadKey]: seed }
    })
  }, [group, channel, threadKey, debate?.id])

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
    <div className="space-y-7">
      <Card className="overflow-hidden p-0" elevation="soft">
        <div
          className="relative px-5 py-5 sm:px-6"
          style={
            {
              ['--p' as string]: group.theme.primary,
              ['--s' as string]: group.theme.secondary,
            } as React.CSSProperties
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
              <Button variant="soft" className="rounded-3xl">
                Personnaliser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <Card className="p-4 sm:p-5" elevation="soft">
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey/70">
            SALONS
          </div>
          <div className="mt-3 space-y-2">
            {group.channels.map((c) => (
              <button
                key={c.id}
                className={
                  channelId === c.id
                    ? 'w-full rounded-3xl border border-tf-grey-pastel/50 bg-white px-4 py-3 text-left shadow-sm'
                    : 'w-full rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 px-4 py-3 text-left hover:bg-white'
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
        </Card>

        <Card className="flex min-h-[min(520px,70vh)] flex-col overflow-hidden p-0" elevation="soft">
          <div className="border-b border-tf-grey-pastel/50 p-4 sm:p-5">
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
                    title="Afficher surtout les messages des supporters de tes clubs favoris"
                  >
                    {virageMode ? '🔥 Virage ON' : 'Mode Virage'}
                  </button>
                ) : null}
                <Badge className="border-tf-dark/15 bg-tf-night/[0.06] text-tf-dark">Live</Badge>
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
            <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 sm:mx-5">
              <p className="font-black text-amber-900">Lecture seule (salon « ennemi »)</p>
              <p className="mt-2 leading-relaxed text-amber-900/95">
                Ici, c’est volontaire : dans les <strong>groupes</strong>, un salon rattaché à un club{' '}
                <strong>rival</strong> de tes favoris (ex. derby) est en{' '}
                <strong>consultation uniquement</strong>, pour éviter les débordements et le spam entre tribunes.
                Sur un <strong>match live</strong>, tu peux toujours écrire : le{' '}
                <strong>Mode Virage</strong> filtre ce que tu <em>vois</em>, sans couper ton clavier.
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
            <div className="mx-4 mt-3 rounded-xl border border-tf-dark/20 bg-tf-dark/5 px-3 py-2 text-xs font-bold text-tf-dark sm:mx-5">
              Mode Virage : tu vois surtout les messages des supporters de tes clubs favoris (+ les
              tiens).
            </div>
          ) : null}

          <div
            ref={feedRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
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
            <div className="shrink-0 border-t border-tf-grey-pastel/50 bg-tf-white/95 px-4 py-3 backdrop-blur-sm sm:px-5">
              <MessageComposer
                onSend={onSend}
                placeholder={`Message dans ${channel?.name ?? 'le salon'}…`}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
