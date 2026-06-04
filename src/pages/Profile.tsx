import { currentUser } from '../data/users'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useEffect } from 'react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { BadgeIllustration } from '../components/profile/BadgeIllustration'
import { ProfilePhotoSection } from '../components/profile/ProfilePhotoSection'
import { AvatarModularStudio } from '../components/profile/AvatarModularStudio'
import { UserRankCard } from '../components/profile/UserRankCard'
import { usePronoStats } from '../hooks/usePronoStats'
import { useUserBets } from '../hooks/useUserBets'
import { useProfile } from '../hooks/useProfile'
import { useWallet } from '../hooks/useWallet'
import { useSubscription } from '../hooks/useSubscription'
import { VerifiedBadge } from '../components/subscription/VerifiedBadge'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { competitionThemes } from '../data/competitionThemes'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { findTeamInAnyLeague } from '../data/allClubsCatalog'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { ProfilePrivacySection } from '../components/legal/ProfilePrivacySection'
import { SeasonAdminToggle } from '../components/admin/SeasonAdminToggle'
import { DisplayNameEditor } from '../components/profile/DisplayNameEditor'
import { useAppearance } from '../contexts/AppearanceContext'
import type { Appearance } from '../contexts/AppearanceContext'
import { LeagueMark } from '../components/brand/LeagueMark'
import { ClubCrest } from '../components/brand/ClubCrest'
import { resolveClubCatalogLogoUrl } from '../utils/catalogLogos'

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-amber-400 to-amber-600',
  platinum: 'from-violet-400 to-violet-600',
  diamond: 'from-cyan-400 to-cyan-600',
}

/** Encart interne à une Card — lisible en clair et en sombre */
function profileIncard(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'border',
    L
      ? 'border-tf-dark/10 bg-white/88 shadow-[0_1px_0_rgba(1,30,51,0.05)]'
      : 'border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { user: authUser, logout } = useAuth()
  const {
    favoriteLeagueId,
    favoriteClubIds,
    virageMode,
    setVirageMode,
    hideRivalSalons,
    setHideRivalSalons,
    openOnboarding,
    preferencesComplete,
  } = useFanPreferences()

  const leagueName =
    favoriteLeagueId && competitionThemes[favoriteLeagueId]
      ? competitionThemes[favoriteLeagueId].name
      : '—'
  const clubsLabel = (() => {
    if (favoriteClubIds.length === 0) return 'Aucun (optionnel)'
    return favoriteClubIds
      .map((id) => {
        const c = ALL_CLUBS_BY_ID[id]
        return c ? `${c.shortName} (${c.leagueName})` : id
      })
      .join(' · ')
  })()
  const leagueTheme = favoriteLeagueId ? competitionThemes[favoriteLeagueId] ?? null : null
  const favoriteClubEntries = favoriteClubIds
    .map((id) => {
      const meta = ALL_CLUBS_BY_ID[id]
      const team = findTeamInAnyLeague(id)
      return { id, meta, team }
    })
    .filter((x) => Boolean(x.meta && x.team))
  const { wallet, monthlyTokenAllowance, claimMonthlySubscriptionTokens } = useWallet()
  const {
    plan: subPlan,
    hasVerifiedBadge,
    canWriteArticles,
    canCreatePrivateLiveMatches,
    canStreamSalon,
  } = useSubscription()
  const mayEditArticles = Boolean(authUser?.isAdmin || canWriteArticles)
  const { badges, progress } = usePronoStats()
  const { profile, tier, xpProgress, creditWonBets } = useProfile()
  const [bets] = useUserBets()
  const profilePseudo = authUser?.displayName?.trim() || currentUser.username || 'Supporteur'

  useEffect(() => {
    const wonBets = bets.filter((b) => b.status === 'won').map((b) => b.id)
    if (wonBets.length) creditWonBets(wonBets)
  }, [bets, creditWonBets])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const pr = getAppSectionTheme('profile')

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-7">
      <header
        className={cn(
          'flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-start sm:justify-between',
          pr.page.borderBottomClass,
        )}
      >
        <div className="min-w-0 space-y-1.5">
          <div className={cn('text-[11px] font-black tracking-[0.18em]', pr.page.eyebrowClass)}>
            Profil
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DisplayNameEditor />
            {hasVerifiedBadge ? <VerifiedBadge /> : null}
          </div>
          <p className="text-sm font-semibold text-tf-app-muted">
            {subPlan.name}
            {hasVerifiedBadge ? ' · compte vérifié' : ''} — visible sur le live et les tribunes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
          <Link
            to="/formules"
            className={cn(
              TF_FOCUS_VISIBLE,
              'inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wide shadow-sm transition',
              L
                ? 'border-violet-300/70 bg-violet-50 text-violet-950 hover:bg-violet-100'
                : 'border-violet-400/35 bg-violet-950/40 text-violet-100 hover:bg-violet-900/50',
            )}
          >
            Formules
          </Link>
          {mayEditArticles ? (
            <Link
              to="/admin"
              className={cn(
                TF_FOCUS_VISIBLE,
                'inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-wide shadow-sm transition',
                L
                  ? 'border-amber-400/60 bg-amber-50 text-amber-950 hover:bg-amber-100'
                  : 'border-amber-400/35 bg-amber-950/40 text-amber-100 hover:bg-amber-900/50',
              )}
              aria-label="Rédaction et administration"
            >
              {authUser?.isAdmin ? 'Admin' : 'Rédaction'}
            </Link>
          ) : null}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'rounded-2xl',
              L
                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                : 'text-rose-300 hover:bg-rose-950/45 hover:text-rose-200',
            )}
            aria-label="Se déconnecter"
          >
            Déconnexion
          </Button>
        </div>
      </header>

      <div id="compte" className="scroll-mt-4 space-y-3 sm:space-y-4">
        {mayEditArticles ? (
          <Link
            to="/admin"
            className={cn(
              TF_FOCUS_VISIBLE,
              'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition',
              L
                ? 'border-amber-400/60 bg-gradient-to-r from-amber-50 to-amber-100/90 text-amber-950 hover:border-amber-500/70 hover:shadow-md'
                : 'border-amber-400/35 bg-amber-950/40 text-amber-100 hover:border-amber-400/55 hover:shadow-md',
            )}
          >
            <span>{authUser?.isAdmin ? 'Administration du site' : 'Rédiger des articles'}</span>
            <span aria-hidden className="text-lg">
              →
            </span>
          </Link>
        ) : null}
        {authUser?.isAdmin ? <SeasonAdminToggle /> : null}
        {canStreamSalon || canCreatePrivateLiveMatches ? (
          <p
            className={cn(
              'rounded-2xl border px-4 py-3 text-xs font-semibold leading-relaxed',
              L ? 'border-violet-200 bg-violet-50/90 text-violet-950' : 'border-violet-500/30 bg-violet-950/35 text-violet-100',
            )}
          >
            {canStreamSalon ? 'Stream tribune live activé (bouton LIVE sur les matchs). ' : ''}
            {canCreatePrivateLiveMatches
              ? 'Tu peux activer un salon privé depuis la tribune d’un match en direct.'
              : ''}
          </p>
        ) : null}

        <ProfilePrivacySection />

      </div>

      {/* Mode Virage : réglage principal, visible dès l’ouverture du profil */}
      <Card
        id="mode-virage"
        className={cn(
          'scroll-mt-4 overflow-hidden p-0 tf-card-hover',
          virageMode
            ? L
              ? 'border-2 border-rose-500/60 bg-gradient-to-br from-rose-50/95 via-white to-tf-ice/80 ring-2 ring-rose-400/25'
              : 'border-2 border-rose-500/50 bg-gradient-to-br from-rose-900/35 via-slate-900/40 to-slate-900/25 ring-2 ring-rose-400/20'
            : L
              ? 'border-tf-electric/25 bg-gradient-to-br from-tf-electric-soft/90 to-white/95'
              : 'border-cyan-500/20 bg-gradient-to-br from-slate-900/50 via-slate-900/35 to-cyan-950/25',
        )}
        elevation="soft"
      >
        <div
          className={cn(
            'px-5 py-5 sm:px-6 sm:py-6',
            !L && !virageMode && 'bg-white/[0.02]',
          )}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <p
                className={cn(
                  'text-[11px] font-black tracking-[0.22em]',
                  L ? 'text-rose-600' : 'text-rose-300/95',
                )}
              >
                CHAT LIVE & SALONS
              </p>
              <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg sm:text-2xl">
                {LIVE_FIL_EQUIPE_COEUR.label}
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-wide text-tf-app-muted">Filtre live par clubs favoris</p>
              {!preferencesComplete || favoriteClubIds.length === 0 ? (
                <p
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs font-bold',
                    L
                      ? 'border-amber-200/80 bg-amber-50/90 text-amber-950'
                      : 'border-amber-400/35 bg-amber-950/50 text-amber-100',
                  )}
                >
                  Ajoute un club favori pour activer ce filtre.
                </p>
              ) : (
                <p className="text-xs font-bold text-tf-app-muted">Clubs : {clubsLabel}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
              <button
                type="button"
                role="switch"
                aria-checked={virageMode}
                aria-label={
                  virageMode
                    ? `Désactiver ${LIVE_FIL_EQUIPE_COEUR.label}`
                    : `Activer ${LIVE_FIL_EQUIPE_COEUR.label}`
                }
                onClick={() => setVirageMode(!virageMode)}
                className={cn(
                  'relative h-16 min-w-[170px] sm:min-w-[200px] rounded-2xl border-2 px-2 transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/40',
                  L ? 'focus-visible:ring-offset-2' : 'focus-visible:ring-offset-0',
                  virageMode
                    ? L
                      ? 'border-rose-600/90 bg-rose-700 text-white shadow-lg'
                      : 'border-rose-500/60 bg-rose-600/90 text-white shadow-lg'
                    : L
                      ? 'border-tf-dark/15 bg-white text-tf-app-fg shadow-sm hover:border-rose-300/60 hover:bg-rose-50/50'
                      : 'border-white/15 bg-white/10 text-tf-app-fg shadow-sm hover:border-rose-400/35 hover:bg-rose-950/30',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute top-1.5 size-[3.25rem] rounded-xl shadow-md transition-all duration-300 ease-out',
                    L ? 'bg-white' : 'bg-slate-900/90',
                    virageMode ? 'left-[calc(100%-3.65rem)]' : 'left-1.5',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'relative z-[1] flex h-full w-full items-center gap-2 text-sm font-black',
                    virageMode ? 'justify-end pr-2.5 sm:pr-3.5' : 'justify-start pl-[3.4rem] sm:pl-[3.75rem]',
                    !L && !virageMode && 'text-sky-100',
                  )}
                >
                  {virageMode ? (
                    <>
                      <span className="text-lg" aria-hidden>
                        ✓
                      </span>
                      <span className="sm:hidden">Fil ON</span>
                      <span className="hidden sm:inline">{LIVE_FIL_EQUIPE_COEUR.labelOn}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg opacity-80" aria-hidden>
                        💬
                      </span>
                      Activer le fil
                    </>
                  )}
                </span>
              </button>
              <p className="text-center text-[11px] font-bold text-tf-app-muted lg:max-w-[11rem] lg:text-left">
                {virageMode ? 'Fil actif' : 'Fil inactif'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Link
        to="/boutique"
        className="block scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 rounded-3xl"
        id="boutique"
        aria-label="Ouvrir la boutique Talk Foot"
      >
        <Card
          className={cn(
            'tf-card-hover relative overflow-hidden p-5 sm:p-6',
            L
              ? 'border-amber-300/45 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80'
              : 'border-amber-400/25 bg-gradient-to-br from-[#2a1a0a]/95 via-[#1e140a]/95 to-[#331a0f]/90',
          )}
          elevation="soft"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
            aria-hidden
            style={{
              background:
                'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(251,191,36,0.08) 42%, rgba(251,191,36,0) 72%)',
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p
                className={cn(
                  'text-[11px] font-black tracking-[0.22em]',
                  L ? 'text-amber-700' : 'text-amber-200/95',
                )}
              >
                BOUTIQUE
              </p>
              <h2 className="font-display text-xl font-black text-tf-app-fg">Maillots, emotes et packs</h2>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-2xl px-5 py-2.5 text-sm font-black text-white shadow-sm',
                L ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-amber-500 to-orange-500',
              )}
            >
              Ouvrir la boutique →
            </span>
          </div>
        </Card>
      </Link>

      <Card id="monnaie" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">NIVEAU & JETONS</div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-2xl bg-gradient-to-br px-4 py-2',
                  TIER_COLORS[tier.tier] ?? TIER_COLORS.bronze,
                )}
              >
                <span className="text-2xl font-black text-white">Niv. {profile.level}</span>
                <span className="text-xs font-bold text-white/90">{tier.label}</span>
              </div>
              <div>
                <div className="text-xs font-bold text-tf-app-muted">Progression</div>
                <ProgressBar value={xpProgress} tone="blue" className="mt-1 max-w-[min(200px,80vw)]" />
                <div className="mt-0.5 text-[10px] font-medium text-tf-app-muted">
                  {xpProgress}% vers le niveau {profile.level + 1} • XP : paris gagnés, pronos
                </div>
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-md sm:justify-end">
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-4 py-2 sm:min-w-[10rem] sm:flex-initial',
                  L
                    ? 'border-emerald-200/60 bg-emerald-50/80'
                    : 'border-emerald-500/30 bg-emerald-950/45',
                )}
              >
                <span className="flex shrink-0" aria-hidden>
                  <TokenGlyph className="size-8" />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-[9px] font-black uppercase tracking-wider',
                      L ? 'text-emerald-800/80' : 'text-emerald-200/80',
                    )}
                  >
                    Pari
                  </div>
                  <span className="font-display text-lg font-black text-tf-app-fg">
                    {wallet.tokens} jetons
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-4 py-2 sm:min-w-[10rem] sm:flex-initial',
                  L
                    ? 'border-amber-200/60 bg-amber-50/80'
                    : 'border-amber-500/30 bg-amber-950/40',
                )}
              >
                <span className="text-lg" aria-hidden>
                  🏅
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-[9px] font-black uppercase tracking-wider',
                      L ? 'text-amber-900/80' : 'text-amber-200/85',
                    )}
                  >
                    Boutique
                  </div>
                  <span className="font-display text-lg font-black text-tf-app-fg">
                    {wallet.medals} médailles
                  </span>
                </div>
              </div>
            </div>
            {monthlyTokenAllowance > 0 ? (
              <p className="mt-2 w-full text-xs font-semibold text-tf-app-muted">
                {subPlan.name} : {monthlyTokenAllowance.toLocaleString('fr-FR')} jetons / mois —{' '}
                <button
                  type="button"
                  className="font-black text-violet-600 underline hover:text-violet-800"
                  onClick={() => {
                    const r = claimMonthlySubscriptionTokens()
                    if (r.ok) window.alert(`+${r.amount} jetons crédités !`)
                    else if (r.reason === 'already_claimed') window.alert('Déjà récupéré ce mois-ci.')
                  }}
                >
                  Récupérer
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card id="supporter" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">SUPPORTER</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className={cn('rounded-2xl border px-4 py-3', profileIncard(appearance))}>
            <div className="text-xs font-bold text-tf-app-muted">Ligue favorite</div>
            <div className="mt-2">
              {leagueTheme ? (
                <LeagueMark theme={leagueTheme} label={leagueTheme.name} />
              ) : (
                <div className="text-base font-black text-tf-app-fg break-words">{leagueName}</div>
              )}
            </div>
          </div>
          <div className={cn('rounded-2xl border px-4 py-3', profileIncard(appearance))}>
            <div className="text-xs font-bold text-tf-app-muted">Clubs favoris (max. 3)</div>
            {favoriteClubEntries.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {favoriteClubEntries.map(({ id, meta, team }) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-xs font-bold text-tf-app-fg"
                  >
                    {team ? (
                      <ClubCrest
                        id={team.id}
                        shortName={team.shortName}
                        colors={team.colors}
                        logoUrl={resolveClubCatalogLogoUrl(id) ?? undefined}
                        size={18}
                        clickable={false}
                        className="rounded-full"
                      />
                    ) : null}
                    {meta?.name ?? id}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-1 break-words text-base font-black text-tf-app-fg">{clubsLabel}</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button variant="primary" className="w-full rounded-2xl sm:w-auto" onClick={openOnboarding}>
            Choisir ligue et clubs
          </Button>
          <label
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold sm:w-auto',
              profileIncard(appearance),
              'text-tf-app-fg',
            )}
          >
            <input
              type="checkbox"
              checked={hideRivalSalons}
              onChange={(e) => setHideRivalSalons(e.target.checked)}
              className="size-4 rounded border-[color:var(--tf-c30-border)]"
            />
            Masquer tribunes rivales
          </label>
        </div>
      </Card>

      {/* Classement parieur */}
      <UserRankCard />

      <div id="apparence" className="scroll-mt-4 space-y-3 sm:space-y-5">
        <p className={cn('text-[11px] font-black tracking-[0.18em]', L ? 'text-tf-grey' : 'text-sky-200/80')}>
          APPARENCE & PERSONNALISATION
        </p>
        <div id="profil-photo" className="scroll-mt-28 sm:scroll-mt-4">
          <ProfilePhotoSection usernameLabel={profilePseudo} />
        </div>

        <div id="profil-look" className="scroll-mt-28 space-y-3 sm:scroll-mt-4 sm:space-y-4">
          <AvatarModularStudio />
        </div>
      </div>

      <Card id="badges-pronos" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div>
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">BADGES PRONOS</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Tes badges
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.label}
              className={cn('rounded-3xl p-4', profileIncard(appearance))}
              title={b.hint}
            >
              <div className="flex items-start gap-3">
                <BadgeIllustration kind={b.kind} />
                <div className="min-w-0">
                  <div className="text-sm font-black text-tf-app-fg">{b.label}</div>
                  <div className="mt-2">
                    <Badge tone={b.tone ?? 'neutral'} className={b.className}>
                      Débloqué
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card id="progression" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div>
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">PROGRESSION</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Prochains paliers
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 sm:space-y-3">
          <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.predictor.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.predictor.cur}/{progress.predictor.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.predictor.pct} tone="blue" />
            </div>
          </div>

          <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.accuracy.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.accuracy.cur}/{progress.accuracy.next}%
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.accuracy.pct} tone="emerald" />
            </div>
          </div>

          <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-app-fg">{progress.streak.label}</div>
              <div className="text-xs font-bold text-tf-app-muted">
                {progress.streak.cur}/{progress.streak.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.streak.pct} tone="amber" />
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}

