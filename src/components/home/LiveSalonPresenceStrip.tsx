import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { useLiveMatchSalonStats } from '../../hooks/useLiveMatchSalonStats'
import { getLiveSalonPresenceFromStats } from '../../utils/liveSalonPresence'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../contexts/AuthContext'
import { useTalkFootChatActorId } from '../../hooks/useTalkFootChatActorId'
import { useChatAuthorModularAvatars } from '../../hooks/useChatAuthorModularAvatars'
import { buildChatPeerProfile } from '../../utils/chatPeerProfile'
import { resolveDisplayModularAvatar, isLikelyDefaultModularAvatar } from '../../utils/modularAvatarBackup'
import { resolveProfileModularAvatarForDisplay } from '../../utils/chatAuthorModularAvatar'
import {
  MODULAR_PP_CHAT_COMPACT_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import type { ModularAvatarState } from '../../features/avatar2d/modularAvatarState'
import type { UserProfile } from '../../types/profile'
import { dicebearAvatarUrl } from '../../utils/dicebearAvatar'

const heatFillByTier = {
  calm: 'bg-gradient-to-r from-emerald-400/95 via-teal-400/90 to-cyan-500/85',
  warm: 'bg-gradient-to-r from-amber-400/95 via-yellow-400/90 to-orange-400/85',
  hot: 'bg-gradient-to-r from-orange-500 via-rose-500 to-red-500',
  fire: 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400',
} as const

const tierLabelClass = {
  calm: 'text-emerald-300',
  warm: 'text-amber-200',
  hot: 'text-orange-200',
  fire: 'text-rose-200 drop-shadow-[0_0_12px_rgba(251,113,133,0.55)]',
} as const

function LiveSalonActiveAvatar({
  userId,
  isSelf,
  selfProfile,
  selfUserId,
  modularAvatar,
  profilePhotoUrl,
  shellPx,
  className,
}: {
  userId: string
  isSelf: boolean
  selfProfile: UserProfile
  selfUserId: string
  modularAvatar?: ModularAvatarState
  profilePhotoUrl?: string
  shellPx: number
  className?: string
}) {
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    setPhotoFailed(false)
  }, [profilePhotoUrl])

  const profile = useMemo(() => {
    if (isSelf) {
      return {
        ...selfProfile,
        modularAvatar: resolveDisplayModularAvatar(selfUserId, selfProfile.modularAvatar),
      }
    }
    if (modularAvatar) {
      return buildChatPeerProfile({
        id: userId,
        username: 'Supporter',
        avatarSeed: userId,
        accent: 'violet',
        modularAvatar: resolveProfileModularAvatarForDisplay(modularAvatar),
        ...(profilePhotoUrl ? { profilePhotoDataUrl: profilePhotoUrl } : {}),
      })
    }
    return null
  }, [isSelf, modularAvatar, profilePhotoUrl, selfProfile, selfUserId, userId])

  const customModular = Boolean(modularAvatar?.data) && !isLikelyDefaultModularAvatar(modularAvatar)
  const preferModular = isSelf || customModular
  const photoUrl = profilePhotoUrl?.trim()

  const shellClass = cn(
    'relative isolate block shrink-0 overflow-hidden rounded-full ring-2 ring-white/25',
    className,
  )

  if (preferModular && profile) {
    return (
      <div className={shellClass} aria-hidden>
        <ProfileCharacterThumb
          profile={profile}
          shellPx={shellPx}
          size="xs"
          imagePriority={isSelf}
          {...MODULAR_PP_CHAT_COMPACT_FRAMING}
          className="!h-full !w-full !min-h-0 !min-w-0 rounded-full"
          aria-label=""
        />
      </div>
    )
  }

  if (photoUrl && !photoFailed) {
    return (
      <div className={shellClass} aria-hidden>
        <img
          src={photoUrl}
          alt=""
          className="size-full rounded-full object-cover object-top"
          onError={() => setPhotoFailed(true)}
        />
      </div>
    )
  }

  if (profile) {
    return (
      <div className={shellClass} aria-hidden>
        <ProfileCharacterThumb
          profile={profile}
          shellPx={shellPx}
          size="xs"
          {...MODULAR_PP_CHAT_COMPACT_FRAMING}
          className="!h-full !w-full !min-h-0 !min-w-0 rounded-full"
          aria-label=""
        />
      </div>
    )
  }

  return (
    <div className={shellClass} aria-hidden>
      <img
        src={dicebearAvatarUrl(`${userId}-fan`, 96, 0)}
        alt=""
        className="size-full rounded-full object-cover"
      />
    </div>
  )
}

export function LiveSalonPresenceStrip({
  match,
  compact,
  /** Hub desktop : moins de hauteur, stats + actifs sur une ligne */
  variant = 'default',
}: {
  match: Match
  compact?: boolean
  variant?: 'default' | 'dense'
}) {
  const dense = variant === 'dense'

  const { profile: selfProfile } = useProfile()
  const { user: authUser } = useAuth()
  const chatActorId = useTalkFootChatActorId()
  const selfUserId = chatActorId ?? authUser?.id ?? 'me'
  const selfUserKeys = useMemo(
    () => [...new Set([selfUserId, authUser?.id, 'me'].filter(Boolean))] as string[],
    [authUser?.id, selfUserId],
  )

  const realStats = useLiveMatchSalonStats(match.id)
  const snap = useMemo(
    () =>
      getLiveSalonPresenceFromStats(
        realStats?.messagesCount ?? 0,
        realStats?.participantsCount ?? 0,
      ),
    [realStats],
  )

  const activeUserIds = realStats?.recentParticipantIds ?? []
  const { avatars: modularByUserId, profilePhotos: profilePhotoByUserId } = useChatAuthorModularAvatars(
    activeUserIds,
    selfUserId,
    {
      selfModularAvatar: selfProfile.modularAvatar,
      selfUserKeys,
    },
  )

  const heatPulse = snap.intensity >= 72
  const shineMs = Math.max(900, 2400 - snap.intensity * 16)
  const avatarShellPx = compact ? 28 : dense ? 24 : 32
  const tribuneIdle = snap.messages === 0

  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full',
        compact ? 'space-y-1.5' : dense ? 'space-y-1' : 'space-y-2.5',
      )}
      aria-label="Activité du tribune live"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span
          className={cn(
            'font-black uppercase tracking-[0.14em] text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]',
            compact || dense ? 'text-[8px]' : 'text-[9px] sm:text-[10px]',
          )}
        >
          Intensité tribune
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 font-black tabular-nums',
            compact ? 'text-[9px]' : dense ? 'text-[9px]' : 'text-[10px] sm:text-xs',
            tribuneIdle ? 'text-zinc-400' : tierLabelClass[snap.tier],
          )}
        >
          {snap.tier === 'fire' ? <span aria-hidden>🔥</span> : null}
          {snap.tierLabel}
          {!tribuneIdle ? (
            <>
              <span className="text-white/45">·</span>
              <span className="text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]">{snap.intensity}%</span>
            </>
          ) : null}
        </span>
      </div>

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10',
          dense ? 'h-1' : 'h-2',
          heatPulse && 'tf-salon-heat-pulse',
        )}
      >
        <div
          className={cn(
            'relative h-full rounded-full transition-[width] duration-700 ease-out',
            tribuneIdle ? 'bg-white/10' : cn('bg-gradient-to-r', heatFillByTier[snap.tier]),
          )}
          style={{
            width: `${snap.intensity}%`,
            boxShadow:
              snap.intensity >= 68
                ? '0 0 16px rgba(251, 146, 60, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                : undefined,
          }}
        />
        {snap.intensity >= 38 && !tribuneIdle ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-transparent via-white/35 to-transparent"
            style={{ animation: `tf-salon-heat-shine ${shineMs}ms ease-in-out infinite` }}
            aria-hidden
          />
        ) : null}
      </div>

      <div
        className={cn(
          dense || compact
            ? 'flex flex-wrap items-center justify-between gap-x-2 gap-y-1'
            : 'flex flex-col gap-1.5 sm:gap-2',
          dense && 'text-[9px]',
        )}
      >
        <p
          className={cn(
            'min-w-0 max-w-full font-black text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]',
            compact ? 'text-[10px]' : dense ? 'text-[9px]' : 'text-[11px] sm:text-xs',
            !dense && !compact && 'w-full',
          )}
        >
          <span className="whitespace-nowrap">👥 {snap.viewers.toLocaleString('fr-FR')}</span>
          <span className="text-white/40"> · </span>
          <span className="whitespace-nowrap">💬 {snap.messages.toLocaleString('fr-FR')}</span>
        </p>
        {activeUserIds.length > 0 ? (
          <div
            className={cn(
              'flex min-w-0 max-w-full flex-wrap items-center gap-1.5',
              dense || compact ? '' : 'justify-end',
            )}
          >
            <span
              className={cn(
                'font-bold uppercase tracking-wide text-zinc-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]',
                compact || dense ? 'text-[7px]' : 'text-[9px]',
              )}
            >
              Actifs
            </span>
            <div
              className={cn(
                'flex min-w-0 max-w-full flex-nowrap justify-end overflow-x-auto overflow-y-hidden py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]',
                dense ? '-space-x-1' : '-space-x-1.5 sm:-space-x-2',
              )}
            >
              {activeUserIds.map((userId) => {
                const isSelf = selfUserKeys.includes(userId)
                return (
                  <LiveSalonActiveAvatar
                    key={`${match.id}-live-act-${userId}`}
                    userId={userId}
                    isSelf={isSelf}
                    selfProfile={selfProfile}
                    selfUserId={selfUserId}
                    modularAvatar={modularByUserId[userId]}
                    profilePhotoUrl={profilePhotoByUserId[userId]}
                    shellPx={avatarShellPx}
                    className={cn(
                      snap.tier === 'fire' && 'ring-rose-400/50',
                      compact ? 'size-7' : dense ? 'size-6' : 'size-8 sm:size-9',
                    )}
                  />
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
