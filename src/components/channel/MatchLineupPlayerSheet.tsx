import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSportMonksPlayerProfile } from '../../hooks/useSportMonksPlayerProfile'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { type PlayerRecentMatch } from '../../api/sportMonks/extractPlayerRecentMatchesFromSm'
import {
  careerSpellLabel,
  type PlayerPitchSlot,
  type PlayerProfile,
  type PlayerTrophyRow,
} from '../../api/sportMonks/extractPlayerProfileFromSm'
import { formatHubDayLabel } from '../../utils/time'
import { formatLineupRating, lineupRatingBackground } from '../../utils/lineupPlayerRatingColor'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'

export type LineupPlayerPick = {
  playerId: number
  name: string
  photoUrl?: string
  number?: string
  teamId?: string
}

const PITCH_POS: Record<PlayerPitchSlot, { top: string; left: string }> = {
  gk: { top: '86%', left: '50%' },
  'def-l': { top: '70%', left: '18%' },
  'def-c': { top: '72%', left: '50%' },
  'def-r': { top: '70%', left: '82%' },
  'mid-l': { top: '48%', left: '18%' },
  'mid-c': { top: '48%', left: '50%' },
  'mid-r': { top: '48%', left: '82%' },
  'att-l': { top: '22%', left: '22%' },
  'att-c': { top: '16%', left: '50%' },
  'att-r': { top: '22%', left: '78%' },
}

function Crest({ src, alt, size = 22 }: { src?: string; alt: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/15 text-[9px] font-black text-white"
        style={{ width: size, height: size }}
      >
        {alt.slice(0, 1)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-white object-contain p-0.5"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

function MiniPitch({ slot, number, light }: { slot: PlayerPitchSlot; number?: string; light?: boolean }) {
  const pos = PITCH_POS[slot]
  return (
    <div
      className={cn(
        'relative h-[148px] w-[108px] shrink-0 overflow-hidden rounded-xl border',
        light ? 'border-emerald-700/30' : 'border-emerald-400/25',
      )}
      style={{
        background:
          'linear-gradient(180deg, #15803d 0%, #166534 48%, #14532d 100%)',
      }}
      aria-hidden
    >
      <div className="absolute inset-1 rounded-lg border border-white/35" />
      <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />
      <div className="absolute inset-x-1 top-1/2 h-px bg-white/35" />
      <div className="absolute left-1/2 top-1 h-[18%] w-[42%] -translate-x-1/2 border border-t-0 border-white/35" />
      <div className="absolute bottom-1 left-1/2 h-[18%] w-[42%] -translate-x-1/2 border border-b-0 border-white/35" />
      <div
        className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e11d2e] text-[11px] font-black text-white shadow-md ring-2 ring-white"
        style={{ top: pos.top, left: pos.left }}
      >
        {number || '•'}
      </div>
    </div>
  )
}

function InfoCell({
  value,
  label,
  light,
}: {
  value?: string | number | null
  label: string
  light?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className={cn('truncate text-[13px] font-black leading-tight', light ? 'text-slate-900' : 'text-white')}>
        {value ?? '—'}
      </p>
      <p className={cn('text-[9px] font-bold uppercase tracking-wide', light ? 'text-slate-500' : 'text-sky-200/65')}>
        {label}
      </p>
    </div>
  )
}

function Card({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-2xl border p-3',
        light ? 'border-slate-200 bg-white shadow-sm' : 'border-white/12 bg-white/[0.06]',
        className,
      )}
    >
      {children}
    </section>
  )
}

function CardTitle({ children, light }: { children: string; light?: boolean }) {
  return (
    <h3 className={cn('mb-2 text-[11px] font-black uppercase tracking-wide', light ? 'text-slate-500' : 'text-sky-300/85')}>
      {children}
    </h3>
  )
}

function trophyChipClass(kind: PlayerTrophyRow['kind'], light?: boolean) {
  if (kind === 'winner') {
    return light ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
  }
  if (kind === 'runner') {
    return light ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-sky-400/40 bg-sky-500/15 text-sky-100'
  }
  return light ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-amber-300/35 bg-amber-400/15 text-amber-100'
}

function trophyKindLabel(kind: PlayerTrophyRow['kind']) {
  if (kind === 'winner') return 'Vainqueur'
  if (kind === 'runner') return 'Finaliste'
  return null
}

function MatchStatRow({ m, light }: { m: PlayerRecentMatch; light?: boolean }) {
  const dateLabel = m.kickoffAt && !Number.isNaN(Date.parse(m.kickoffAt)) ? formatHubDayLabel(m.kickoffAt) : '—'
  return (
    <li
      className={cn(
        'grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 border-b py-2 last:border-b-0',
        light ? 'border-slate-100' : 'border-white/8',
      )}
    >
      <span className={cn('text-[10px] font-semibold', light ? 'text-slate-500' : 'text-sky-200/70')}>{dateLabel}</span>
      <div className="min-w-0">
        <p className={cn('truncate text-[12px] font-black', light ? 'text-slate-900' : 'text-white')}>{m.opponent}</p>
        <p className={cn('text-[10px] font-bold tabular-nums', light ? 'text-slate-500' : 'text-sky-200/70')}>
          {m.scoreHome}-{m.scoreAway}
          {m.minutes != null ? ` · ${m.minutes}′` : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn('w-4 text-center text-[11px] font-black tabular-nums', light ? 'text-slate-800' : 'text-sky-50')}>
          {m.goals || '–'}
        </span>
        <span className={cn('w-4 text-center text-[11px] font-black tabular-nums', light ? 'text-slate-800' : 'text-sky-50')}>
          {m.assists || '–'}
        </span>
        <span className="flex w-5 justify-center gap-0.5">
          {m.yellow > 0 ? <span className="h-3 w-2 rounded-[2px] bg-amber-400" title="Jaune" /> : null}
          {m.red > 0 ? <span className="h-3 w-2 rounded-[2px] bg-rose-500" title="Rouge" /> : null}
        </span>
        {m.rating != null ? (
          <span
            className="min-w-[2.1rem] rounded-md px-1.5 py-0.5 text-center text-[11px] font-black text-white"
            style={{ backgroundColor: lineupRatingBackground(m.rating) }}
          >
            {formatLineupRating(m.rating)}
          </span>
        ) : (
          <span className={cn('min-w-[2.1rem] text-center text-[10px]', light ? 'text-slate-400' : 'text-sky-200/40')}>—</span>
        )}
      </div>
    </li>
  )
}

export function MatchLineupPlayerSheet({
  player,
  matchId,
  excludeFixtureId,
  light,
  onClose,
}: {
  player: LineupPlayerPick
  matchId?: string
  excludeFixtureId?: number | null
  light?: boolean
  onClose: () => void
}) {
  const { profile, loading, error } = useSportMonksPlayerProfile(player.playerId, excludeFixtureId)
  const { isPlayerFavorite, toggleFavoritePlayer, favoritePlayers, maxFavoritePlayers } =
    useFanPreferences()
  const following = isPlayerFavorite(player.playerId)
  const playerFollowFull = !following && favoritePlayers.length >= maxFavoritePlayers
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    setPhotoFailed(false)
  }, [player.playerId, player.photoUrl, profile?.photoUrl])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const photoUrl = profile?.photoUrl ?? player.photoUrl
  const showPhoto = Boolean(photoUrl) && !photoFailed
  const displayName = profile?.name ?? player.name
  const matches = profile?.matches ?? []
  const footShort = profile?.foot?.replace(/^Pied\s+/i, '') ?? profile?.foot

  return createPortal(
    <div className="fixed inset-0 z-[2147482950]" role="dialog" aria-modal="true" aria-labelledby="tf-player-sheet-title">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fermer" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[min(92dvh,52rem)] overflow-y-auto rounded-t-3xl border-t px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-2xl',
          light ? 'border-slate-200 bg-[#eef3f8]' : 'border-white/12 bg-[#061422]',
        )}
      >
        <div className={cn('mx-auto mb-2 h-1 w-10 rounded-full', light ? 'bg-slate-300' : 'bg-white/25')} aria-hidden />

        <div className="mb-3 flex items-start gap-3">
          <div
            className={cn(
              'relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl border bg-white',
              light ? 'border-slate-200' : 'border-white/30',
            )}
          >
            {showPhoto ? (
              <img
                src={photoUrl}
                alt=""
                className="h-full w-full object-cover object-top"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center text-xl font-black',
                  light ? 'bg-sky-100 text-sky-900' : 'bg-[#0a1f35] text-sky-100',
                )}
              >
                {player.number ?? displayName.slice(0, 1)}
              </div>
            )}
            {player.number ? (
              <span className="absolute bottom-1 right-1 rounded-md bg-[#e11d2e] px-1.5 py-0.5 text-[10px] font-black text-white">
                #{player.number}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id="tf-player-sheet-title"
              className={cn('truncate font-display text-[1.35rem] font-black leading-tight', light ? 'text-slate-900' : 'text-white')}
            >
              {displayName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {profile?.currentTeamLogo || profile?.currentTeam ? (
                <span className="inline-flex items-center gap-1">
                  <Crest src={profile.currentTeamLogo} alt={profile.currentTeam ?? ''} size={16} />
                  <span className={cn('truncate text-[11px] font-bold', light ? 'text-slate-600' : 'text-sky-100/90')}>
                    {profile.currentTeam}
                  </span>
                </span>
              ) : null}
              {profile?.country ? (
                <span className="inline-flex items-center gap-1">
                  {profile.countryFlagUrl ? (
                    <img src={profile.countryFlagUrl} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                  ) : null}
                  <span className={cn('text-[11px] font-bold', light ? 'text-slate-600' : 'text-sky-100/90')}>
                    {profile.country}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            {player.teamId ? (
              <button
                type="button"
                disabled={playerFollowFull}
                aria-pressed={following}
                title={
                  following
                    ? 'Ne plus suivre ce joueur'
                    : 'Suivre ce joueur — notif 1 h avant, au coup d’envoi, buts et cartons'
                }
                onClick={() => {
                  if (!player.teamId || playerFollowFull) return
                  toggleFavoritePlayer(
                    { playerId: player.playerId, name: player.name, teamId: player.teamId },
                    matchId,
                  )
                }}
                className={cn(
                  TF_FOCUS_VISIBLE,
                  'rounded-full border px-2.5 py-1 text-[10px] font-black',
                  following
                    ? light
                      ? 'border-amber-400 bg-amber-100 text-amber-800'
                      : 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                    : light
                      ? 'border-slate-300 bg-white text-slate-800'
                      : 'border-white/20 bg-white/10 text-white',
                  playerFollowFull && 'opacity-45',
                )}
              >
                {following ? '★' : '☆'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                TF_FOCUS_VISIBLE,
                'rounded-full border px-2.5 py-1 text-[10px] font-black',
                light ? 'border-slate-300 bg-white text-slate-800' : 'border-white/20 bg-white/10 text-white',
              )}
            >
              Fermer
            </button>
          </div>
        </div>

        {loading ? (
          <p className={cn('py-8 text-center text-sm font-semibold', light ? 'text-slate-600' : 'text-sky-200/80')}>
            Chargement de la fiche…
          </p>
        ) : error ? (
          <p className={cn('py-8 text-center text-sm font-semibold', light ? 'text-rose-700' : 'text-rose-200')}>{error}</p>
        ) : profile ? (
          <div className="space-y-2.5 pb-3">
            <div className="flex gap-2.5">
              <MiniPitch slot={profile.pitchSlot} number={player.number} light={light} />
              <Card light={light} className="min-w-0 flex-1 !p-2.5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                  <InfoCell value={profile.height} label="Taille" light={light} />
                  <InfoCell value={profile.weight} label="Poids" light={light} />
                  <InfoCell value={profile.age != null ? `${profile.age} ans` : undefined} label="Âge" light={light} />
                  <InfoCell value={footShort} label="Pied" light={light} />
                  <InfoCell value={profile.dateOfBirth} label="Naissance" light={light} />
                  <InfoCell value={profile.position} label="Poste" light={light} />
                  <InfoCell value={profile.country} label="Pays" light={light} />
                  <InfoCell value={profile.currentTeam} label="Club" light={light} />
                </div>
              </Card>
            </div>

            {profile.career.length ? (
              <Card light={light}>
                <CardTitle light={light}>Carrière</CardTitle>
                <ul className="space-y-2">
                  {profile.career.map((spell) => (
                    <li key={`${spell.team}-${spell.start ?? ''}-${spell.end ?? ''}`} className="flex items-center gap-2">
                      <Crest src={spell.logoUrl} alt={spell.team} size={26} />
                      <span className={cn('min-w-0 flex-1 truncate text-[13px] font-black', light ? 'text-slate-900' : 'text-white')}>
                        {spell.team}
                      </span>
                      <span className={cn('shrink-0 text-[11px] font-bold', light ? 'text-slate-500' : 'text-sky-200/75')}>
                        {careerSpellLabel(spell)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {profile.seasonStats.length ? (
              <Card light={light}>
                <CardTitle light={light}>{profile.seasonLabel ? profile.seasonLabel : 'Saison'}</CardTitle>
                <div className="grid grid-cols-5 gap-2">
                  {profile.seasonStats.map((s) => (
                    <div key={s.label} className="min-w-0 text-center">
                      <p
                        className={cn(
                          'text-[15px] font-black tabular-nums',
                          s.label === 'Note' ? 'text-emerald-400' : light ? 'text-slate-900' : 'text-white',
                        )}
                      >
                        {s.value}
                      </p>
                      <p className={cn('text-[8px] font-bold uppercase leading-tight tracking-wide', light ? 'text-slate-500' : 'text-sky-200/65')}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {profile.trophyGroups.length ? (
              <Card light={light}>
                <CardTitle light={light}>Palmarès</CardTitle>
                <div className="space-y-3">
                  {profile.trophyGroups.map((g) => (
                    <div key={g.team}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <Crest src={g.logoUrl} alt={g.team} size={22} />
                        <p className={cn('truncate text-[12px] font-black', light ? 'text-slate-900' : 'text-white')}>{g.team}</p>
                        <span className={cn('text-[10px] font-bold', light ? 'text-slate-400' : 'text-sky-200/55')}>
                          {g.items.length}
                        </span>
                      </div>
                      <ul className="grid grid-cols-2 gap-1.5">
                        {g.items.slice(0, 8).map((t, i) => (
                          <li
                            key={`${t.title}-${t.season ?? i}`}
                            className={cn('rounded-lg border px-2 py-1.5', trophyChipClass(t.kind, light))}
                          >
                            {trophyKindLabel(t.kind) ? (
                              <p className="text-[8px] font-black uppercase tracking-wide">{trophyKindLabel(t.kind)}</p>
                            ) : null}
                            <p className="truncate text-[11px] font-black leading-tight">{t.title}</p>
                            {t.season ? <p className="text-[9px] font-semibold opacity-80">{t.season}</p> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card light={light}>
              <CardTitle light={light}>Matchs</CardTitle>
              <div className={cn('mb-1 grid grid-cols-[4.6rem_minmax(0,1fr)_auto] px-0 text-[8px] font-black uppercase tracking-wide', light ? 'text-slate-400' : 'text-sky-200/45')}>
                <span>Date</span>
                <span>Adversaire</span>
                <span className="flex gap-1.5 pr-0.5">
                  <span className="w-4 text-center">B</span>
                  <span className="w-4 text-center">P</span>
                  <span className="w-5 text-center">C</span>
                  <span className="min-w-[2.1rem] text-center">Note</span>
                </span>
              </div>
              {!matches.length ? (
                <p className={cn('py-3 text-center text-sm font-semibold', light ? 'text-slate-600' : 'text-sky-200/80')}>
                  Pas encore de matchs récents.
                </p>
              ) : (
                <ul>
                  {matches.map((m) => (
                    <MatchStatRow key={m.fixtureId} m={m} light={light} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
