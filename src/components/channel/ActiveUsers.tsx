import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '../../types/chat'
import { ClubCrest } from '../brand/ClubCrest'
import { useProfile } from '../../hooks/useProfile'
import type { UserProfile } from '../../types/profile'
import {
  MODULAR_PP_NAV_FRAMING,
  ProfileCharacterThumb,
} from '../profile/ProfileCharacterThumb'
import { findTeamInAnyLeague } from '../../data/allClubsCatalog'
import { cn } from '../../utils/cn'
import { dicebearAvatarUrl } from '../../utils/dicebearAvatar'

const ACCENT_FALLBACK: Record<User['accent'], string> = {
  violet: 'from-violet-500 to-violet-700',
  emerald: 'from-emerald-500 to-emerald-700',
  rose: 'from-rose-500 to-rose-700',
  amber: 'from-amber-500 to-amber-700',
}

function InitialFallback({ seed, accent }: { seed: string; accent: User['accent'] }) {
  const ch = seed.trim().slice(0, 1).toUpperCase() || '⚽'
  const grad = ACCENT_FALLBACK[accent] ?? ACCENT_FALLBACK.violet
  return (
    <div
      className={cn(
        'grid size-full place-items-center rounded-full bg-gradient-to-br text-sm font-black text-white shadow-inner',
        grad,
      )}
    >
      {ch}
    </div>
  )
}

function livePresenceRank(u: User) {
  if (u.id === 'me') return 0
  if (u.isMockFriend || u.isTalkFootBot) return 1
  return 2
}

function LiveFanFaceRow({
  user,
  stackIndex,
  totalShown,
  meProfile,
}: {
  user: User
  stackIndex: number
  totalShown: number
  meProfile?: UserProfile
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const team = user.fanClubId ? findTeamInAnyLeague(user.fanClubId) : null
  const z = totalShown - stackIndex
  const friendNote = user.isTalkFootBot ? ' · assistant' : user.isMockFriend ? ' · ami' : ''
  const title = team ? `${user.username} · ${team.shortName}${friendNote}` : `${user.username}${friendNote}`

  const shell = (inner: React.ReactNode) => (
    <div
      className={cn(
        'relative size-[2.75rem] shrink-0 rounded-full bg-white shadow-[0_4px_14px_rgba(1,30,51,0.12)] ring-[3px]',
        user.isMockFriend || user.isTalkFootBot
          ? 'ring-sky-400 shadow-[0_4px_16px_rgba(14,165,233,0.25)]'
          : 'ring-white',
        'motion-safe:transition motion-safe:duration-200 motion-safe:ease-out',
        'hover:z-50 motion-safe:hover:scale-[1.08] motion-safe:hover:shadow-[0_8px_22px_rgba(244,63,94,0.18)]',
      )}
      style={{ zIndex: z }}
      title={title}
    >
      <div className="relative size-full overflow-hidden rounded-full">{inner}</div>
      {team ? (
        <div
          className="pointer-events-none absolute -bottom-0.5 -left-0.5 z-10 rounded-full bg-white p-[1px] shadow-sm ring-1 ring-slate-200/80"
          aria-hidden
        >
          <ClubCrest
            id={team.id}
            shortName={team.shortName}
            colors={team.colors}
            size={17}
            className="rounded-full"
          />
        </div>
      ) : null}
      <span
        className="pointer-events-none absolute bottom-0.5 right-0.5 z-10 size-2.5 rounded-full border-[2px] border-white bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.75)] motion-safe:animate-[tf-live-dot_2.4s_ease-in-out_infinite]"
        aria-hidden
      />
    </div>
  )

  if (user.id === 'me') {
    const inner = shell(
      meProfile ? (
        <div className="relative size-full">
          <ProfileCharacterThumb
            profile={meProfile}
            size="sm"
            {...MODULAR_PP_NAV_FRAMING}
            className="!h-full !w-full !min-h-0 !min-w-0 rounded-full border-0 p-0"
            aria-label="Mon avatar in-app"
          />
        </div>
      ) : (
        <InitialFallback seed={user.avatarSeed} accent={user.accent} />
      ),
    )
    return (
      <Link
        to="/profile"
        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        aria-label="Mon profil"
      >
        {inner}
      </Link>
    )
  }

  const inner = shell(
    imgFailed ? (
      <InitialFallback seed={user.avatarSeed} accent={user.accent} />
    ) : (
      <img
        src={dicebearAvatarUrl(`${user.id}-${user.avatarSeed}`, 128, stackIndex)}
        alt=""
        className="size-full object-cover object-top"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    ),
  )
  return (
    <Link
      to={`/user/${user.id}`}
      className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      title={title}
      aria-label={`Profil ${user.username}`}
    >
      {inner}
    </Link>
  )
}

export function ActiveUsers({ users }: { users: User[] }) {
  const { profile } = useProfile()
  const ordered = useMemo(
    () => [...users].sort((a, b) => livePresenceRank(a) - livePresenceRank(b)),
    [users],
  )
  const shown = ordered.slice(0, 6)
  const remaining = Math.max(0, ordered.length - shown.length)
  const friendsInStrip = useMemo(
    () => shown.filter((u) => u.isMockFriend || u.isTalkFootBot).length,
    [shown],
  )

  const clubLine = useMemo(() => {
    const ids = [...new Set(shown.map((u) => u.fanClubId).filter(Boolean) as string[])]
    const names = ids
      .map((id) => findTeamInAnyLeague(id)?.shortName)
      .filter(Boolean) as string[]
    if (names.length === 0) return null
    return names.slice(0, 4).join(' · ')
  }, [shown])

  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div
        className={cn(
          'relative flex w-fit max-w-full items-center rounded-full border border-rose-200/45 bg-gradient-to-r from-white via-rose-50/35 to-emerald-50/30',
          'py-1.5 pl-2 pr-1 shadow-[0_6px_24px_rgba(244,63,94,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]',
          'ring-1 ring-rose-500/10',
        )}
        aria-label={`${ordered.length} personnes suivent ce live${
          friendsInStrip ? ', dont ton assistant Talk Foot' : ''
        }`}
      >
        <span
          className="absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.85)] motion-safe:animate-pulse"
          aria-hidden
        />
        <div className="flex items-center pl-3">
          <div className="flex items-center -space-x-3">
            {shown.map((u, i) => (
              <LiveFanFaceRow
                key={u.id}
                user={u}
                stackIndex={i}
                totalShown={shown.length}
                meProfile={u.id === 'me' ? profile : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0 max-w-full text-left sm:pl-0">
        <p className="text-[13px] font-black leading-tight tracking-tight text-slate-900 sm:text-sm">
          <span className="tabular-nums">{ordered.length}</span>{' '}
          <span className="bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
            en direct
          </span>
        </p>
        {friendsInStrip > 0 ? (
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-sky-700 sm:text-[11px]">
            Assistant Talk Foot dans la pile
          </p>
        ) : null}
        {clubLine ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:max-w-[14rem] sm:truncate sm:text-[11px]">
            Tribunes · {clubLine}
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
            Supporters connectés
          </p>
        )}
        {remaining > 0 ? (
          <p className="mt-0.5 text-[10px] font-bold text-slate-400">+{remaining} autres</p>
        ) : null}
      </div>
    </div>
  )
}
