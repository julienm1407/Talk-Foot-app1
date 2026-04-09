import { useMemo, useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useMatches } from '../../contexts/MatchesContext'
import { mockFriendUsers } from '../../data/users'
import { hubGlassPanel } from '../../utils/hubSurface'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { teams } from '../../data/teams'
import type { Team } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import { ClubCrest } from '../brand/ClubCrest'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { HomeBoutiqueEncart } from './HomeBoutiqueEncart'
import { Avatar } from '../ui/Avatar'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { cn } from '../../utils/cn'

/**
 * Colonne « Mon espace » (favoris, tribunes, boutique) — desktop rail ou carte pleine largeur mobile.
 */
export function HomeMonEspacePanel({
  myCreatedGroups,
  onCreateTribune,
  className,
  as = 'aside',
  /** Faux quand un titre « Mon espace » existe déjà au-dessus (ex. tiroir logo mobile). */
  showTopHeading = true,
}: {
  myCreatedGroups: SupporterGroup[]
  onCreateTribune: () => void
  className?: string
  as?: 'aside' | 'section'
  showTopHeading?: boolean
}) {
  const { favoriteClubIds } = useFanPreferences()
  const { matches } = useMatches()
  const { appearance } = useAppearance()
  const firstLiveMatch = useMemo(
    () => matches.find((m) => m.status === 'live') ?? null,
    [matches],
  )
  const L = appearance === 'light'
  const [inviteHint, setInviteHint] = useState(false)

  const railSep = L ? 'border-t border-tf-dark/10' : 'border-t border-white/10'
  const hubCaps = L ? 'text-tf-dark/82' : 'text-sky-100'
  const hubSecondary = L ? 'text-tf-dark/72' : 'text-sky-200/95'
  const favRow = cn(
    'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-tf-app-fg transition',
    L ? 'hover:bg-tf-dark/[0.05]' : 'hover:bg-white/[0.08]',
  )

  const favoriteClubs = useMemo((): Team[] => {
    return favoriteClubIds
      .map((id) => {
        const entry = ALL_CLUBS_BY_ID[id]
        if (!entry) return null
        const list = teams[entry.leagueId as keyof typeof teams]
        return list?.find((t) => t.id === id) ?? null
      })
      .filter((t): t is Team => Boolean(t))
  }, [favoriteClubIds])

  const Shell = as as ElementType

  return (
    <Shell
      className={cn(
        'flex flex-col gap-5 overflow-hidden',
        hubGlassPanel(appearance),
        'p-0',
        className,
      )}
      aria-label={showTopHeading ? 'Mon espace' : undefined}
    >
      <HubEncartTopAccent appearance={appearance} preset="personal" />
      <div className="flex flex-col gap-5 p-4">
        {showTopHeading ? (
          <p className={cn('px-1 text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}>Mon espace</p>
        ) : null}

        <div>
          <p className={cn('px-1 text-[10px] font-black uppercase tracking-[0.2em]', hubCaps)}>Mon univers</p>
          <ul className="mt-2 space-y-1" role="list">
            {favoriteClubs.length === 0 ? (
              <li className={cn('rounded-lg px-2 py-2 text-xs font-semibold', hubSecondary)}>
                Ajoute tes clubs dans Profil.
              </li>
            ) : (
              favoriteClubs.slice(0, 6).map((club) => (
                <li key={club.id}>
                  <Link to="/match" className={favRow}>
                    <ClubCrest id={club.id} shortName={club.shortName} colors={club.colors} size={28} />
                    <span className="truncate">{club.shortName}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/profile"
            className={cn(
              'mt-2 block px-2 text-xs font-bold underline-offset-2 hover:underline',
              L ? 'text-sky-700 hover:text-sky-900' : 'text-sky-300/90 hover:text-sky-200',
            )}
          >
            + Plus de favoris
          </Link>
          <button
            type="button"
            onClick={async () => {
              const url = window.location.origin
              const text = 'Rejoins-moi sur Talk Foot — le foot live avec tes potes en tribunes.'
              try {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  await navigator.share({ title: 'Talk Foot', text, url })
                  return
                }
              } catch {
                /* annulation partage ou indisponible */
              }
              try {
                await navigator.clipboard?.writeText(`${text} ${url}`)
                setInviteHint(true)
                window.setTimeout(() => setInviteHint(false), 2500)
              } catch {
                /* presse-papiers refusé */
              }
            }}
            className={cn(
              'mt-3 w-full rounded-xl border px-3 py-2.5 text-left text-xs font-black transition',
              L
                ? 'border-tf-dark/15 bg-white/80 text-tf-dark hover:bg-white'
                : 'border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]',
            )}
          >
            Inviter des amis
          </button>
          {inviteHint ? (
            <p className="mt-1.5 px-1 text-[10px] font-bold text-emerald-500">Lien copié — colle-le où tu veux.</p>
          ) : null}
        </div>

        <div
          className={cn(
            'rounded-xl border px-3 py-2.5',
            L ? 'border-sky-200/90 bg-gradient-to-br from-sky-50 to-white' : 'border-sky-400/30 bg-sky-950/25',
          )}
        >
          <p className={cn('text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}>Tes potes</p>
          <Link
            to={firstLiveMatch ? `/channel/${firstLiveMatch.id}` : '/match'}
            className={cn(
              'mt-2 flex items-center gap-2.5 rounded-lg outline-none transition',
              TF_FOCUS_VISIBLE,
              L ? 'hover:bg-sky-100/60' : 'hover:bg-white/[0.06]',
            )}
          >
            <div className="flex shrink-0 -space-x-2 pl-0.5" aria-hidden>
              {mockFriendUsers.map((f) => (
                <div key={f.id} className="relative ring-2 ring-white rounded-2xl">
                  <Avatar seed={f.avatarSeed} accent={f.accent} className="!size-8 !shadow-md" alt="" />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className={cn('text-xs font-black leading-tight', L ? 'text-tf-dark' : 'text-white')}>
                <span className="tabular-nums">{mockFriendUsers.length}</span> amis actifs
                {firstLiveMatch ? (
                  <>
                    {' '}
                    sur{' '}
                    <span className="whitespace-nowrap">
                      {firstLiveMatch.home.shortName} – {firstLiveMatch.away.shortName}
                    </span>
                  </>
                ) : (
                  <> · voir les matchs</>
                )}
              </p>
            </div>
          </Link>
        </div>

        <div className={cn('pt-1', railSep)}>
          <div className="flex flex-wrap items-end justify-between gap-2 px-1">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', hubCaps)}>Mes tribunes</p>
            <Link
              to="/groups"
              className={cn(
                'text-[10px] font-bold underline-offset-2 hover:underline',
                L ? 'text-sky-700 hover:text-sky-900' : 'text-sky-300/90 hover:text-sky-200',
              )}
            >
              Tous les groupes
            </Link>
          </div>
          <ul className="mt-2 space-y-1" role="list">
            {myCreatedGroups.length === 0 ? (
              <li className={cn('rounded-lg px-2 py-2 text-xs font-semibold leading-snug', hubSecondary)}>
                Tu n’as pas encore créé de tribune. Lance la tienne pour rassembler ton camp.
              </li>
            ) : (
              myCreatedGroups.slice(0, 8).map((g) => (
                <li key={g.id}>
                  <Link
                    to={`/group/${g.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold transition',
                      L ? 'text-tf-app-fg hover:bg-tf-dark/[0.05]' : 'text-tf-app-fg hover:bg-white/[0.08]',
                    )}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {g.emoji}
                    </span>
                    <span className="min-w-0 truncate">{g.name}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            onClick={onCreateTribune}
            className={cn(
              'mt-3 w-full rounded-xl border px-3 py-2.5 text-left text-xs font-black transition',
              L
                ? 'border-tf-dark/15 bg-white/80 text-tf-dark hover:bg-white'
                : 'border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]',
            )}
          >
            <span aria-hidden>➕</span> Créer une tribune
          </button>
        </div>
      </div>

      <div className={cn('p-3 sm:p-3.5', railSep)}>
        <HomeBoutiqueEncart layout="narrow" />
      </div>
    </Shell>
  )
}
