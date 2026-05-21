import { currentUser } from '../data/users'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { TokenGlyph } from '../components/ui/TokenGlyph'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { mockPredictions } from '../data/predictions'
import { useMemo, useEffect, useState } from 'react'
import { formatKickoff } from '../utils/time'
import { ProgressBar } from '../components/ui/ProgressBar'
import { BadgeIllustration } from '../components/profile/BadgeIllustration'
import { AvatarEditor } from '../components/profile/AvatarEditor'
import { ProfilePhotoSection } from '../components/profile/ProfilePhotoSection'
import { CharacterLayerStudio } from '../components/profile/CharacterLayerStudio'
import { EditProfileModal } from '../components/profile/EditProfileModal'
import { UserRankCard } from '../components/profile/UserRankCard'
import { useUserBets } from '../hooks/useUserBets'
import { useProfile } from '../hooks/useProfile'
import { useWallet } from '../hooks/useWallet'
import type { Bet } from '../types/bet'
import { useMatches } from '../contexts/MatchesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { competitionThemes } from '../data/competitionThemes'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { findTeamInAnyLeague } from '../data/allClubsCatalog'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'
import { ProfilePrivacySection } from '../components/legal/ProfilePrivacySection'
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

const PROFILE_SOMMAIRE: { id: string; label: string }[] = [
  { id: 'compte', label: 'Compte' },
  { id: 'mode-virage', label: 'Chat' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'monnaie', label: 'Niveau' },
  { id: 'supporter', label: 'Club' },
  { id: 'classement', label: 'Rang' },
  { id: 'apparence', label: 'Apparence' },
  { id: 'stats-pronos', label: 'Stats' },
  { id: 'paris', label: 'Paris' },
  { id: 'badges-pronos', label: 'Badges' },
  { id: 'progression', label: 'Paliers' },
  { id: 'historique-pronos', label: 'Historique' },
]

function profileNavLink(appearance: Appearance) {
  const L = appearance === 'light'
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-tight transition',
    L
      ? 'border-tf-dark/10 bg-tf-white/60 text-tf-app-fg hover:border-tf-dark/18 hover:bg-white'
      : 'border-white/12 bg-white/5 text-sky-200 hover:border-white/18 hover:bg-white/10',
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { user: authUser, logout } = useAuth()
  const { matches } = useMatches()
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
  const [editOpen, setEditOpen] = useState(false)
  const { wallet } = useWallet()
  const { profile, tier, xpProgress, creditWonBets } = useProfile()
  const [bets] = useUserBets()
  const profilePseudo = authUser?.displayName?.trim() || currentUser.username || 'Supporteur'

  useEffect(() => {
    const wonBets = bets.filter((b) => b.status === 'won').map((b) => b.id)
    if (wonBets.length) creditWonBets(wonBets)
  }, [bets, creditWonBets])

  const firstLiveMatch = useMemo(
    () => matches.find((m) => m.status === 'live') ?? null,
    [matches],
  )

  useEffect(() => {
    if (location.hash !== '#paris') return
    const t = window.setTimeout(() => {
      document.getElementById('paris')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [location.hash, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const predictions = useMemo(() => {
    return [...mockPredictions].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )
  }, [])

  const betsView = useMemo(() => {
    const matchesById = new Map(matches.map((m) => [m.id, m]))
    const open = bets.filter((b) => b.status === 'open')
    const settled = bets.filter((b) => b.status !== 'open')
    const lastOpen = open.slice(0, 8)
    const lastSettled = settled.slice(0, 12)

    const marketLabel = (m: Bet['market']) => {
      if (m === 'next_goal') return 'Prochaine équipe à marquer'
      if (m === 'first_goal') return 'Première équipe à marquer'
      if (m === 'result_1x2') return '1N2'
      if (m === 'over25') return '+2,5 buts'
      if (m === 'exact_score') return 'Score exact'
      if (m === 'anytime_scorer') return 'Buteur'
      return m
    }
    const selectionLabel = (b: Bet, matchId: string) => {
      const match = matchesById.get(matchId)
      const home = match?.home.shortName ?? 'HOME'
      const away = match?.away.shortName ?? 'AWAY'
      const s = b.selection
      if (s === 'home') return home
      if (s === 'away') return away
      if (s === 'draw') return 'Nul'
      if (s === 'over') return 'Over'
      if (s === 'under') return 'Under'
      if (typeof s === 'string' && s.startsWith('scor:')) {
        const slug = s.slice(s.lastIndexOf(':') + 1)
        const pretty = slug.replace(/-/g, ' ')
        return pretty ? `Buteur · ${pretty}` : 'Buteur'
      }
      return s
    }

    const matchLine = (matchId: string) => {
      const m = matchesById.get(matchId)
      if (!m) return { title: 'Match inconnu', sub: '' }
      return {
        title: `${m.home.shortName} — ${m.away.shortName}`,
        sub: `${m.competition.shortName} • ${formatKickoff(m.kickoffAt)}`,
      }
    }

    return { open, settled, lastOpen, lastSettled, marketLabel, selectionLabel, matchLine }
  }, [bets, matches])

  const stats = useMemo(() => {
    const total = predictions.length
    const decided = predictions.filter((p) => p.outcome !== 'pending')
    const won = decided.filter((p) => p.outcome === 'won').length
    const accuracy = decided.length ? Math.round((won / decided.length) * 100) : 0
    const points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)

    let streak = 0
    for (const p of predictions) {
      if (p.outcome !== 'won') break
      streak += 1
    }

    const byComp = new Map<string, { name: string; count: number }>()
    for (const p of predictions) {
      const key = p.match.competition.id
      const existing = byComp.get(key)
      if (existing) existing.count += 1
      else byComp.set(key, { name: p.match.competition.name, count: 1 })
    }
    const fav = Array.from(byComp.values()).sort((a, b) => b.count - a.count)[0]

    return { total, decided: decided.length, won, accuracy, points, streak, fav }
  }, [predictions])

  const badges = useMemo(() => {
    const b: Array<{
      kind:
        | 'starter'
        | 'beta'
        | 'predictor'
        | 'accuracy'
        | 'streak'
        | 'league'
      label: string
      hint: string
      tone?: 'neutral' | 'live' | 'upcoming'
      className?: string
    }> = []

    b.push({
      kind: 'starter',
      label: 'Supporter',
      hint: 'Compte de départ',
      tone: 'neutral',
    })
    b.push({
      kind: 'beta',
      label: 'Beta',
      hint: 'Accès anticipé',
      tone: 'upcoming',
    })

    if (stats.total >= 5)
      b.push({
        kind: 'predictor',
        label: 'Pronostiqueur',
        hint: '5 pronos enregistrés',
        className: L
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-blue-400/30 bg-blue-950/50 text-sky-200',
      })

    if (stats.accuracy >= 60)
      b.push({
        kind: 'accuracy',
        label: `Précision ${stats.accuracy}%`,
        hint: 'Bon taux de réussite',
        className: L
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-emerald-400/30 bg-emerald-950/45 text-emerald-200',
      })

    if (stats.streak >= 2)
      b.push({
        kind: 'streak',
        label: `Série x${stats.streak}`,
        hint: 'Victoires consécutives',
        className: L
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-amber-400/30 bg-amber-950/45 text-amber-200',
      })

    if (stats.fav)
      b.push({
        kind: 'league',
        label: `Fan de ${stats.fav.name}`,
        hint: 'Compétition la plus pronostiquée',
        className: L
          ? 'border-slate-200/80 bg-slate-50 text-slate-800'
          : 'border-white/10 bg-white/[0.06] text-sky-200/95',
      })

    return b
  }, [stats, L])

  const progress = useMemo(() => {
    const nextPredictor = 10
    const predictorPct = Math.round((Math.min(stats.total, nextPredictor) / nextPredictor) * 100)

    const nextAcc = 75
    const accPct = Math.round((Math.min(stats.accuracy, nextAcc) / nextAcc) * 100)

    const nextStreak = 5
    const streakPct = Math.round((Math.min(stats.streak, nextStreak) / nextStreak) * 100)

    return {
      predictor: { label: 'Niveau pronos', cur: stats.total, next: nextPredictor, pct: predictorPct },
      accuracy: { label: 'Précision', cur: stats.accuracy, next: nextAcc, pct: accPct },
      streak: { label: 'Série', cur: stats.streak, next: nextStreak, pct: streakPct },
    }
  }, [stats])

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
          <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
            {profilePseudo}
          </h1>
          <p className="text-sm font-semibold text-tf-app-muted">
            Pseudo affiché sur les salons et le live · Badges, paris, progression et paramètres
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'shrink-0 self-start rounded-2xl sm:self-center',
            L
              ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
              : 'text-rose-300 hover:bg-rose-950/45 hover:text-rose-200',
          )}
          aria-label="Se déconnecter"
        >
          Déconnexion
        </Button>
      </header>

      <nav
        className={cn(
          '-mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1',
          '[scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-x-visible',
        )}
        aria-label="Aller à une section"
      >
        {PROFILE_SOMMAIRE.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={cn('snap-start', profileNavLink(appearance), TF_FOCUS_VISIBLE)}
          >
            {label}
            {id === 'paris' && bets.length > 0 ? (
              <span
                className={cn(
                  'ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[9px] font-black tabular-nums',
                  L ? 'bg-emerald-600 text-white' : 'bg-emerald-400 text-emerald-950',
                )}
              >
                {betsView.open.length || bets.length}
              </span>
            ) : null}
          </a>
        ))}
      </nav>

      <div id="compte" className="scroll-mt-4 space-y-3 sm:space-y-4">
        {authUser?.isAdmin ? (
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
            <span>Administration du site</span>
            <span aria-hidden className="text-lg">
              →
            </span>
          </Link>
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
              <p className="text-[11px] font-bold uppercase tracking-wide text-tf-app-muted">
                Filtrer le chat par tes clubs favoris
              </p>
              <p className="max-w-xl text-sm font-semibold leading-relaxed text-tf-app-fg/90">
                Active ce mode pour voir surtout les messages de supporters qui suivent au moins un de tes clubs
                favoris.
              </p>
              {!preferencesComplete || favoriteClubIds.length === 0 ? (
                <p
                  className={cn(
                    'rounded-xl border px-3 py-2 text-xs font-bold',
                    L
                      ? 'border-amber-200/80 bg-amber-50/90 text-amber-950'
                      : 'border-amber-400/35 bg-amber-950/50 text-amber-100',
                  )}
                >
                  Action requise : ajoute d'abord un club favori via « Modifier ligue / clubs ».
                </p>
              ) : (
                <p className="text-xs font-bold text-tf-app-muted">
                  Clubs pris en compte : {clubsLabel}
                </p>
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
                {virageMode ? 'Mode actif. Tu peux aussi le changer depuis un live.' : 'Action simple : clique sur Activer le fil.'}
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
              <h2 className="font-display text-xl font-black text-tf-app-fg">
                Drop maillots, emotes et packs supporters
              </h2>
              <p className={cn('text-sm font-semibold', L ? 'text-slate-700/90' : 'text-amber-50/85')}>
                Personnalise ton style matchday avec les couleurs de ton club.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px] font-black',
                    L ? 'border-amber-300/70 bg-amber-100/85 text-amber-900' : 'border-amber-400/30 bg-amber-300/10 text-amber-200',
                  )}
                >
                  Nouveautes
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[11px] font-black',
                    L ? 'border-rose-300/70 bg-rose-100/80 text-rose-900' : 'border-rose-400/30 bg-rose-300/10 text-rose-200',
                  )}
                >
                  Editions club
                </span>
              </div>
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
          </div>
        </div>
      </Card>

      <Card id="supporter" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">SUPPORTER</div>
        <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-app-fg">
          Personnalise ton experience
        </div>
        <p className="mt-1 text-sm font-semibold text-tf-app-muted">
          Choisis 1 ligue + jusqu a 3 clubs. Active ensuite le {LIVE_FIL_EQUIPE_COEUR.label} pour filtrer les messages.
        </p>
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
          <a
            href="#mode-virage"
            className="self-center text-center text-xs font-black text-tf-cta underline decoration-2 underline-offset-2 sm:px-2"
          >
            ↑ {LIVE_FIL_EQUIPE_COEUR.label} (réglage rapide)
          </a>
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
            Masquer salons rivaux
          </label>
        </div>
      </Card>

      {/* Classement parieur */}
      <UserRankCard />

      <div id="apparence" className="scroll-mt-4 space-y-3 sm:space-y-5">
        <p className={cn('text-[11px] font-black tracking-[0.18em]', L ? 'text-tf-grey' : 'text-sky-200/80')}>
          APPARENCE & PERSONNALISATION
        </p>
        <nav
          className={cn(
            '-mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-1',
            '[scrollbar-width:thin] sm:mx-0 sm:hidden',
          )}
          aria-label="Sections apparence"
        >
          {(
            [
              ['profil-photo', 'Photo'],
              ['profil-look', 'Perso 3D'],
              ['profil-avatar', 'Look Lego'],
            ] as const
          ).map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn('snap-start', profileNavLink(appearance), TF_FOCUS_VISIBLE)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div id="profil-photo" className="scroll-mt-28 sm:scroll-mt-4">
          <ProfilePhotoSection usernameLabel={profilePseudo} />
        </div>

        <div id="profil-look" className="scroll-mt-28 space-y-3 sm:scroll-mt-4 sm:space-y-4">
          <CharacterLayerStudio />
        </div>
        <div id="profil-avatar" className="scroll-mt-28 sm:scroll-mt-4">
          <AvatarEditor />
        </div>
      </div>

      <Card id="stats-pronos" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="mb-1 text-[11px] font-black tracking-[0.18em] text-tf-app-muted">PRÉDICTIONS</div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-base font-black text-tf-app-fg">{profilePseudo}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {badges.slice(0, 2).map((b) => (
                <Badge
                  key={b.label}
                  tone={b.tone ?? 'neutral'}
                  className={b.className}
                  title={b.hint}
                >
                  {b.label}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            variant="soft"
            className="w-full rounded-2xl sm:w-auto"
            onClick={() => setEditOpen(true)}
            aria-label="Modifier le profil"
          >
            Modifier
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <Stat label="Pronos" value={`${stats.total}`} hint="Au total" />
          <Stat
            label="Précision"
            value={`${stats.accuracy}%`}
            hint={`${stats.won}/${stats.decided} validés`}
          />
          <Stat label="Série" value={`x${stats.streak}`} hint="Victoires d’affilée" />
          <Stat label="Points" value={`${stats.points}`} hint="Score pronos" />
        </div>
      </Card>

      <Card id="paris" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">MES PARIS</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              En cours & validés
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-tf-app-muted">
            <Badge
              className={cn(
                'text-tf-app-fg',
                L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
              )}
            >
              En cours: {betsView.open.length}
            </Badge>
            <Badge
              className={cn(
                'text-tf-app-fg',
                L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
              )}
            >
              Validés: {betsView.settled.length}
            </Badge>
          </div>
        </div>

        {bets.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-tf-app-fg">En cours</div>
                <Badge
                  className={
                    L
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-blue-400/35 bg-blue-950/50 text-sky-200'
                  }
                >
                  {betsView.open.length}
                </Badge>
              </div>
              {betsView.lastOpen.length ? (
                <div
                  className={cn(
                    'mt-3 divide-y overflow-hidden rounded-2xl border',
                    profileIncard(appearance),
                    L ? 'divide-slate-200/60' : 'divide-white/10',
                  )}
                >
                  {betsView.lastOpen.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    return (
                      <Link
                        key={b.id}
                        to={`/channel/${b.matchId}`}
                        className={cn('block p-3 transition', L ? 'hover:bg-slate-50/80' : 'hover:bg-white/5')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-tf-app-fg">{m.title}</div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-tf-app-muted">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-tf-app-fg">
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-blue-500">Ouvrir le match →</div>
                          </div>
                          <Badge
                            className={
                              L
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-blue-400/35 bg-blue-950/50 text-sky-200'
                            }
                          >
                            En cours
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-tf-app-muted">Aucun pari en cours.</div>
              )}
            </div>

            <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-tf-app-fg">Validés</div>
                <Badge
                  className={cn(
                    'text-tf-app-fg',
                    L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                  )}
                >
                  {betsView.settled.length}
                </Badge>
              </div>
              {betsView.lastSettled.length ? (
                <div
                  className={cn(
                    'mt-3 divide-y overflow-hidden rounded-2xl border',
                    profileIncard(appearance),
                    L ? 'divide-slate-200/60' : 'divide-white/10',
                  )}
                >
                  {betsView.lastSettled.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    const statusBadge =
                      b.status === 'won'
                        ? {
                            cls: L
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-emerald-500/30 bg-emerald-950/45 text-emerald-200',
                            label: `Gagné +${b.payout ?? 0}`,
                          }
                        : b.status === 'lost'
                          ? {
                              cls: L
                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                : 'border-rose-500/30 bg-rose-950/45 text-rose-200',
                              label: 'Perdu',
                            }
                          : {
                              cls: cn(
                                'text-tf-app-fg',
                                L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                              ),
                              label: 'Annulé',
                            }
                    return (
                      <Link
                        key={b.id}
                        to={`/channel/${b.matchId}`}
                        className={cn('block p-3 transition', L ? 'hover:bg-slate-50/80' : 'hover:bg-white/5')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-tf-app-fg">{m.title}</div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-tf-app-muted">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-tf-app-fg">
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-blue-500">Ouvrir le match →</div>
                          </div>
                          <Badge className={statusBadge.cls}>{statusBadge.label}</Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-tf-app-muted">
                  Aucun pari validé pour le moment.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'mt-4 rounded-3xl border border-dashed p-5 text-center',
              L ? 'border-slate-200/90 bg-slate-50/60' : 'border-white/15 bg-white/[0.04]',
            )}
          >
            <p className="text-sm font-black text-tf-app-fg">Aucun pari pour l’instant</p>
            <p className="mt-2 text-sm font-semibold text-tf-app-muted">
              Ouvre un match en direct, choisis un prono (1N2, buteur, over…), puis valide — tu le retrouveras ici.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/match"
                className={cn(
                  'inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-tf-cta-hover/40 bg-tf-cta px-5 text-sm font-black text-white shadow-tf-cta transition hover:bg-tf-cta-hover',
                  TF_FOCUS_VISIBLE,
                )}
              >
                Voir les matchs
              </Link>
              {firstLiveMatch ? (
                <Link
                  to={`/channel/${firstLiveMatch.id}`}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center rounded-2xl border border-tf-dark bg-white/95 px-5 text-sm font-bold text-tf-dark shadow-tf-elev-1 transition hover:bg-tf-electric-soft',
                    TF_FOCUS_VISIBLE,
                  )}
                >
                  Parier sur {firstLiveMatch.home.shortName} — {firstLiveMatch.away.shortName}
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </Card>

      <Card id="badges-pronos" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">BADGES PRONOS</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Tes badges
            </div>
          </div>
          <div className="text-xs font-semibold text-tf-app-muted">{badges.length} badges</div>
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
                  <div className="mt-1 text-sm font-semibold text-tf-app-muted">{b.hint}</div>
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">PROGRESSION</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Prochains paliers
            </div>
          </div>
          <div className="text-xs font-semibold text-tf-app-muted">Gagne des badges en jouant</div>
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

      <Card id="historique-pronos" className="scroll-mt-4 p-5 sm:p-6" elevation="soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-app-muted">HISTORIQUE</div>
            <div className="mt-0.5 font-display text-lg font-black tracking-tight text-tf-app-fg">
              Prédictions récentes
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-10 w-full rounded-2xl sm:w-auto"
            aria-label="Voir plus (placeholder)"
          >
            Voir plus
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {predictions.map((p) => (
            <div key={p.id} className={cn('rounded-3xl p-4', profileIncard(appearance))}>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-tf-app-fg">
                      {p.match.home.shortName} – {p.match.away.shortName}
                    </div>
                    <Badge
                      className={
                        p.outcome === 'won'
                          ? L
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-emerald-500/30 bg-emerald-950/50 text-emerald-200'
                          : p.outcome === 'lost'
                            ? L
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-rose-500/30 bg-rose-950/50 text-rose-200'
                            : cn(
                                'text-tf-app-fg',
                                L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                              )
                      }
                    >
                      {p.outcome === 'won' ? 'Gagné' : p.outcome === 'lost' ? 'Perdu' : 'En attente'}
                    </Badge>
                    <Badge tone="upcoming" title={p.match.competition.name}>
                      {p.match.competition.shortName}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-tf-app-muted">
                    Coup d’envoi {formatKickoff(p.match.kickoffAt)}
                  </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                  <Badge
                    className={cn(
                      'text-tf-app-fg',
                      L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                    )}
                    title="Score prédit"
                  >
                    Prono {p.predictedScore.home}-{p.predictedScore.away}
                  </Badge>
                  <Badge
                    className={cn(
                      'text-tf-app-fg',
                      L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                    )}
                    title="Score réel (si dispo)"
                  >
                    Réel {p.actualScore ? `${p.actualScore.home}-${p.actualScore.away}` : '—'}
                  </Badge>
                  <Badge
                    className={
                      p.points > 0
                        ? L
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-emerald-500/30 bg-emerald-950/45 text-emerald-200'
                        : cn(
                            'text-tf-app-fg',
                            L ? 'border-slate-200/80 bg-white/90' : 'border-white/12 bg-white/8',
                          )
                    }
                    title="Points gagnés"
                  >
                    +{p.points}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  const { appearance } = useAppearance()
  return (
    <div className={cn('rounded-3xl p-4', profileIncard(appearance))}>
      <div className="text-xs font-semibold tracking-wide text-tf-app-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-black tracking-tight text-tf-app-fg">{value}</div>
      <div className="mt-1 text-xs font-semibold text-tf-app-muted">{hint}</div>
    </div>
  )
}

