import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { currentUser } from '../../data/users'
import { useProfile } from '../../hooks/useProfile'
import { useAppearance } from '../../contexts/AppearanceContext'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useMatches } from '../../contexts/MatchesContext'
import { useWallet } from '../../hooks/useWallet'
import { mockFriendUsers } from '../../data/users'
import { hubGlassPanel, hubPillLink } from '../../utils/hubSurface'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { teams } from '../../data/teams'
import type { Team } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import { clubPathForId } from '../../utils/clubRoute'
import { ClubCrest } from '../brand/ClubCrest'
import { HubEncartTopAccent } from '../ui/HubEncartTopAccent'
import { HomeBoutiqueEncart } from './HomeBoutiqueEncart'
import { Avatar } from '../ui/Avatar'
import { ProfileCharacterThumb } from '../profile/ProfileCharacterThumb'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { cn } from '../../utils/cn'
import { TokenGlyph } from '../ui/TokenGlyph'

/** Petites offres mockées pour le rail hub (évite le vide visuel sous les tribunes). */
const RAIL_BOUTIQUE_OFFERS = [
  { id: 'flash-maillot', emoji: '👕', title: 'Maillots third', sub: 'Clubs partenaires', badge: '-15%' },
  { id: 'casq', emoji: '🧢', title: 'Casquettes club', sub: 'Dès 19 €', badge: '-20%' },
  { id: 'med', emoji: '🏅', title: 'Médailles tribune', sub: 'Pack collector', badge: 'Promo' },
] as const

/**
 * Colonne « Mon espace » (favoris, tribunes, boutique) — desktop rail ou carte pleine largeur mobile.
 */
export function HomeMonEspacePanel({
  myCreatedGroups,
  onCreateTribune,
  className,
  as: ShellTag = 'aside',
  /** Faux quand un titre « Mon espace » existe déjà au-dessus (ex. tiroir logo mobile). */
  showTopHeading = true,
  /** Hub desktop : colonne étroite, infos utiles seulement. */
  density = 'full',
  /** Grille accueil : le corps du panneau défile dans la hauteur de la cellule (pas toute la page). */
  railScrollBody = false,
}: {
  myCreatedGroups: SupporterGroup[]
  onCreateTribune: () => void
  className?: string
  as?: 'aside' | 'section'
  showTopHeading?: boolean
  density?: 'full' | 'hubSlim'
  railScrollBody?: boolean
}) {
  const { favoriteClubIds } = useFanPreferences()
  const { matches } = useMatches()
  const { user: authUser } = useAuth()
  const { profile } = useProfile()
  const displayLabel = authUser?.displayName ?? currentUser.username
  const { appearance } = useAppearance()
  const { claimDailyTokenBonus, dailyTokenBonusStatus } = useWallet()
  const firstLiveMatch = useMemo(
    () => matches.find((m) => m.status === 'live') ?? null,
    [matches],
  )
  const L = appearance === 'light'
  const slim = density === 'hubSlim'
  const [inviteHint, setInviteHint] = useState(false)
  const [dailyClaimHint, setDailyClaimHint] = useState<string | null>(null)
  const dailyBonus = dailyTokenBonusStatus()

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

  return (
    <ShellTag
      className={cn(
        'flex flex-col overflow-hidden',
        slim ? 'gap-3' : 'gap-5',
        railScrollBody && 'min-h-0 h-full',
        hubGlassPanel(appearance),
        'p-0',
        className,
      )}
      aria-label={showTopHeading ? 'Mon espace' : undefined}
    >
      {!slim ? <HubEncartTopAccent appearance={appearance} preset="personal" /> : null}
      <div
        className={cn(
          'flex flex-col p-4',
          slim ? 'gap-3.5' : 'gap-5',
          railScrollBody &&
            'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {showTopHeading && !slim ? (
          <p className={cn('px-1 text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}>Mon espace</p>
        ) : null}

        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-3 rounded-xl border px-2.5 py-2.5 outline-none transition',
            slim && 'py-2',
            TF_FOCUS_VISIBLE,
            L
              ? 'border-tf-dark/10 bg-white/90 hover:border-tf-dark/18 hover:bg-white'
              : 'border-white/12 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]',
          )}
        >
          <ProfileCharacterThumb
            profile={profile}
            size="sm"
            className={cn(
              '!shrink-0 !rounded-full !border-0 p-0 ring-2 ring-white/25',
              slim ? '!h-9 !w-9 !min-h-9 !min-w-9' : '!h-10 !w-10 !min-h-10 !min-w-10',
            )}
            aria-label="Mon avatar in-app"
          />
          <div className="min-w-0 flex-1 text-left">
            {!slim ? (
              <p className={cn('text-[9px] font-black uppercase tracking-[0.16em]', hubCaps)}>Mon profil</p>
            ) : null}
            <p className="truncate text-sm font-black text-tf-app-fg">{displayLabel}</p>
            <p className={cn('text-[10px] font-bold', hubSecondary)}>Niv. {profile.level}</p>
          </div>
          <span className={cn('shrink-0 text-lg opacity-60', L ? 'text-tf-dark' : 'text-white')} aria-hidden>
            ›
          </span>
        </Link>

        <div>
          <p className={cn('px-1 text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}>
            {slim ? 'Mes clubs' : 'Mon univers'}
          </p>
          <ul className="mt-2 space-y-1" role="list">
            {favoriteClubs.length === 0 ? (
              <li className={cn('rounded-lg px-2 py-2 text-xs font-semibold', hubSecondary)}>
                {slim ? 'Ajoute des clubs (Profil).' : 'Ajoute tes clubs dans Profil.'}
              </li>
            ) : (
              favoriteClubs.slice(0, slim ? 4 : 6).map((club) => (
                <li key={club.id}>
                  <Link to={clubPathForId(club.id)} className={favRow} title={`Hub ${club.name}`}>
                    <ClubCrest id={club.id} shortName={club.shortName} colors={club.colors} size={slim ? 24 : 28} />
                    <span className="truncate">{club.shortName}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          {!slim ? (
            <>
              <Link to="/profile" className={cn(hubPillLink(appearance, 'sm'), 'mt-2 inline-flex')}>
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
            </>
          ) : null}
        </div>

        {!slim ? (
          <div
            className={cn(
              'rounded-xl border px-3 py-2.5',
              L ? 'border-sky-200/90 bg-gradient-to-br from-sky-50 to-white' : 'border-sky-400/30 bg-sky-950/25',
            )}
          >
            <p className={cn('text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}>Assistant Talk Foot</p>
            <div
              className={cn(
                'mt-2 flex items-center gap-2.5 rounded-lg transition',
                L ? 'hover:bg-sky-100/60' : 'hover:bg-white/[0.06]',
              )}
            >
              <div className="flex shrink-0 pl-0.5" aria-hidden>
                {mockFriendUsers.map((f, i) => (
                  <Link
                    key={f.id}
                    to={`/user/${f.id}`}
                    className={cn(
                      'relative z-[1] rounded-2xl ring-2 ring-white transition hover:z-10 hover:opacity-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-400',
                      TF_FOCUS_VISIBLE,
                      i > 0 && '-ml-2',
                    )}
                    title={`Profil ${f.username}`}
                  >
                    <Avatar seed={f.avatarSeed} accent={f.accent} className="!size-8 !shadow-md" alt="" />
                  </Link>
                ))}
              </div>
              <Link
                to={firstLiveMatch ? `/channel/${firstLiveMatch.id}` : '/match'}
                className={cn(
                  'min-w-0 flex-1 rounded-lg py-0.5 text-left outline-none transition',
                  TF_FOCUS_VISIBLE,
                  L ? 'hover:bg-transparent' : 'hover:bg-transparent',
                )}
              >
                <p className={cn('text-xs font-black leading-tight', L ? 'text-tf-dark' : 'text-white')}>
                  Écris à <span className="font-black">Coach Talk Foot</span> depuis les messages — présent aussi sur le live
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
              </Link>
            </div>
          </div>
        ) : null}

        <div className={cn(!slim && 'pt-1', railSep)}>
          <div className="flex flex-wrap items-end justify-between gap-2 px-1">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em]', hubCaps)}>Mes tribunes</p>
            <Link to="/groups" className={cn(hubPillLink(appearance, slim ? 'xs' : 'sm'))}>
              {slim ? 'Tous' : 'Tous les groupes'}
            </Link>
          </div>
          <ul className="mt-2 space-y-1" role="list">
            {myCreatedGroups.length === 0 ? (
              <li className={cn('rounded-lg px-2 py-2 text-xs font-semibold leading-snug', hubSecondary)}>
                {slim ? 'Aucune tribune — crée la tienne.' : 'Tu n’as pas encore créé de tribune. Lance la tienne pour rassembler ton camp.'}
              </li>
            ) : (
              myCreatedGroups.slice(0, slim ? 3 : 8).map((g) => (
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
              'w-full rounded-xl border px-3 py-2.5 text-left text-xs font-black transition',
              slim ? 'mt-2' : 'mt-3',
              L
                ? 'border-tf-dark/15 bg-white/80 text-tf-dark hover:bg-white'
                : 'border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]',
            )}
          >
            <span aria-hidden>➕</span> {slim ? 'Créer' : 'Créer une tribune'}
          </button>
        </div>

        {slim ? (
          <section className={cn('border-t pt-2', railSep)} aria-labelledby="rail-daily-bonus-title">
            <p
              id="rail-daily-bonus-title"
              className={cn('px-1 text-[9px] font-black uppercase tracking-[0.16em]', hubCaps)}
            >
              Récompense quotidienne
            </p>
            <div
              className={cn(
                'mt-1.5 rounded-lg border p-2',
                L
                  ? 'border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-white'
                  : 'border-emerald-400/30 bg-emerald-500/10',
              )}
            >
              <div className="flex items-start gap-1.5">
                <TokenGlyph className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-tf-app-fg">+{dailyBonus.amount} jetons à 10h</p>
                  <p className={cn('mt-0.5 text-[9px] font-semibold leading-snug', hubSecondary)}>
                    1 récupération / jour.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={cn(
                  'mt-2 w-full rounded-md px-2 py-1.5 text-[10px] font-black transition',
                  dailyBonus.canClaim
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : L
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-white/15 text-white/70',
                )}
                disabled={!dailyBonus.canClaim}
                onClick={() => {
                  const r = claimDailyTokenBonus()
                  if (r.ok) setDailyClaimHint(`+${r.amount} jetons récupérés !`)
                  else if (r.reason === 'already_claimed') setDailyClaimHint('Déjà récupéré pour cette journée.')
                  else if (r.reason === 'not_open_yet') setDailyClaimHint('Le bonus ouvre tous les jours à 10h.')
                  else setDailyClaimHint('Impossible pour le moment.')
                  window.setTimeout(() => setDailyClaimHint(null), 2600)
                }}
              >
                {dailyBonus.canClaim ? 'Récupérer' : dailyBonus.alreadyClaimedToday ? 'Déjà récupéré' : 'À 10h'}
              </button>
              {dailyClaimHint ? (
                <p className={cn('mt-1 text-[9px] font-bold leading-snug', dailyBonus.canClaim ? 'text-emerald-700' : hubSecondary)}>
                  {dailyClaimHint}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {slim ? (
          <section
            className={cn(
              'flex flex-col gap-2 border-t pt-3',
              railSep,
            )}
            aria-labelledby="rail-boutique-offers-title"
          >
            <p
              id="rail-boutique-offers-title"
              className={cn('px-1 text-[10px] font-black uppercase tracking-[0.18em]', hubCaps)}
            >
              Offres boutique
            </p>
            <ul className="space-y-1.5" role="list">
              {RAIL_BOUTIQUE_OFFERS.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/boutique"
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 outline-none transition',
                      TF_FOCUS_VISIBLE,
                      L
                        ? 'border border-tf-dark/[0.08] bg-white/75 hover:border-tf-dark/15 hover:bg-white'
                        : 'border border-white/10 bg-white/[0.05] hover:border-white/18 hover:bg-white/[0.09]',
                    )}
                  >
                    <span className="shrink-0 text-base leading-none" aria-hidden>
                      {o.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-black leading-tight text-tf-app-fg">{o.title}</p>
                      <p className={cn('truncate text-[10px] font-semibold leading-snug', hubSecondary)}>{o.sub}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black tabular-nums',
                        L ? 'bg-amber-100 text-amber-900' : 'bg-amber-500/20 text-amber-200',
                      )}
                    >
                      {o.badge}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {!slim ? (
        <div className={cn('p-3 sm:p-3.5', railSep)}>
          <HomeBoutiqueEncart layout="narrow" />
        </div>
      ) : (
        <div className={cn('border-t px-4 pb-4', L ? 'border-tf-dark/10' : 'border-white/10')}>
          <Link
            to="/boutique"
            className={cn(hubPillLink(appearance, 'sm'), 'w-full justify-center text-center')}
          >
            Boutique
          </Link>
        </div>
      )}
    </ShellTag>
  )
}
