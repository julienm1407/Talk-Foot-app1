import { currentUser } from '../data/users'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProfileCharacterThumb } from '../components/profile/ProfileCharacterThumb'
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
import { CharacterLookEditor } from '../components/profile/CharacterLookEditor'
import { EditProfileModal } from '../components/profile/EditProfileModal'
import { UserRankCard } from '../components/profile/UserRankCard'
import { useLocalStorageState } from '../hooks/useLocalStorage'
import { useProfile } from '../hooks/useProfile'
import { useWallet } from '../hooks/useWallet'
import type { Bet } from '../types/bet'
import { useMatches } from '../contexts/MatchesContext'
import { useFanPreferences } from '../contexts/FanPreferencesContext'
import { competitionThemes } from '../data/competitionThemes'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { cn } from '../utils/cn'
import { getAppSectionTheme } from '../theme/appSectionThemes'
import { LIVE_FIL_EQUIPE_COEUR } from '../data/tribunes'

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-amber-400 to-amber-600',
  platinum: 'from-violet-400 to-violet-600',
  diamond: 'from-cyan-400 to-cyan-600',
}

export function ProfilePage() {
  const navigate = useNavigate()
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
  const [editOpen, setEditOpen] = useState(false)
  const { wallet } = useWallet()
  const { profile, tier, xpProgress, creditWonBets } = useProfile()
  const [bets] = useLocalStorageState<Bet[]>('talkfoot.bets.v1', [], Array.isArray)

  useEffect(() => {
    const wonBets = bets.filter((b) => b.status === 'won').map((b) => b.id)
    if (wonBets.length) creditWonBets(wonBets)
  }, [bets, creditWonBets])

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
        className: 'border-blue-200 bg-blue-50 text-blue-700',
      })

    if (stats.accuracy >= 60)
      b.push({
        kind: 'accuracy',
        label: `Précision ${stats.accuracy}%`,
        hint: 'Bon taux de réussite',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      })

    if (stats.streak >= 2)
      b.push({
        kind: 'streak',
        label: `Série x${stats.streak}`,
        hint: 'Victoires consécutives',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      })

    if (stats.fav)
      b.push({
        kind: 'league',
        label: `Fan de ${stats.fav.name}`,
        hint: 'Compétition la plus pronostiquée',
        className: 'border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey',
      })

    return b
  }, [stats])

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
    <div className="space-y-7">
      <header
        className={cn(
          'flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-start sm:justify-between',
          pr.page.borderBottomClass,
        )}
      >
        <div className="space-y-2">
          <div className={cn('text-[11px] font-black tracking-[0.18em]', pr.page.eyebrowClass)}>
            Profil
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight text-tf-dark sm:text-3xl">
            {authUser?.displayName ?? currentUser.username}
          </h1>
          <p className="text-sm font-semibold text-tf-grey">
            {authUser?.email ? (
              <span className="text-tf-grey">{authUser.email} • </span>
            ) : null}
            Badges + historique de tes prédictions
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="shrink-0 self-start rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:self-center"
          aria-label="Se déconnecter"
        >
          Déconnexion
        </Button>
      </header>

      {/* Mode Virage : réglage principal, visible dès l’ouverture du profil */}
      <Card
        id="mode-virage"
        className={cn(
          'scroll-mt-4 overflow-hidden p-0 shadow-[0_12px_40px_rgba(1,30,51,0.08)] transition-shadow',
          virageMode
            ? 'border-2 border-rose-500/50 ring-2 ring-rose-400/25'
            : 'border border-tf-grey-pastel/60',
        )}
        elevation="soft"
      >
        <div
          className={cn(
            'px-5 py-5 sm:px-6 sm:py-6',
            virageMode
              ? 'bg-gradient-to-br from-rose-50/95 via-white to-tf-ice/80'
              : 'bg-gradient-to-br from-tf-white to-tf-grey-pastel/15',
          )}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-black tracking-[0.22em] text-rose-600">
                CHAT LIVE & SALONS
              </p>
              <h2 className="font-display text-xl font-black tracking-tight text-tf-dark sm:text-2xl">
                {LIVE_FIL_EQUIPE_COEUR.label}
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-wide text-tf-grey">
                À ne pas confondre avec la zone stade « Virage » sur un live, ni avec un salon de groupe privé.
              </p>
              <p className="max-w-xl text-sm font-semibold leading-relaxed text-tf-dark/80">
                Quand il est <strong className="text-tf-dark">activé</strong>, tu ne vois (en plus de toi) que les
                messages des personnes qui ont renseigné{' '}
                <strong className="text-tf-dark">un de tes clubs favoris</strong> — sur le live public, dans les salons
                groupe et dans le top commentaires. Le mode supporter (teinte maillot) ne fait pas ce filtrage : c’est
                uniquement ce réglage.
              </p>
              {!preferencesComplete || favoriteClubIds.length === 0 ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-bold text-amber-950">
                  Choisis au moins une ligue et un club avec « Modifier ligue / clubs » pour que le filtrage ait du
                  sens.
                </p>
              ) : (
                <p className="text-xs font-bold text-tf-grey">
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
                  'relative h-16 min-w-[200px] rounded-2xl border-2 px-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/40 focus-visible:ring-offset-2',
                  virageMode
                    ? 'border-tf-dark bg-tf-dark text-white shadow-lg'
                    : 'border-tf-dark/15 bg-white text-tf-dark shadow-sm hover:border-rose-300/60 hover:bg-rose-50/50',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute top-1.5 size-[3.25rem] rounded-xl bg-white shadow-md transition-all duration-300 ease-out',
                    virageMode ? 'left-[calc(100%-3.65rem)]' : 'left-1.5',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'relative z-[1] flex h-full w-full items-center gap-2 text-sm font-black',
                    virageMode ? 'justify-end pr-3.5' : 'justify-start pl-[3.75rem]',
                  )}
                >
                  {virageMode ? (
                    <>
                      <span className="text-lg" aria-hidden>
                        ✓
                      </span>
                      {LIVE_FIL_EQUIPE_COEUR.labelOn}
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
              <p className="text-center text-[11px] font-bold text-tf-grey lg:max-w-[11rem] lg:text-left">
                {virageMode
                  ? 'Raccourci aussi sur le live (bouton à côté du chat).'
                  : 'Un clic : tu vois tout le monde (sauf filtres zone stade sur le live).'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Link
        to="/boutique"
        className="block outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/35 rounded-3xl"
        aria-label="Ouvrir la boutique Talk Foot"
      >
        <Card
          className="tf-card-hover border-tf-electric/25 bg-gradient-to-br from-tf-electric-soft/90 to-white/95 p-5 sm:p-6"
          elevation="soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-tf-electric-deep">
                BOUTIQUE
              </p>
              <h2 className="mt-1 font-display text-xl font-black text-tf-dark">
                Maillots, emotes & cosmétiques
              </h2>
              <p className="mt-1 text-sm font-semibold text-tf-grey">
                La boutique n’est plus dans la barre principale — tout passe par ton profil.
              </p>
            </div>
            <span className="inline-flex rounded-2xl bg-tf-dark px-5 py-2.5 text-sm font-black text-white shadow-sm">
              Ouvrir →
            </span>
          </div>
        </Card>
      </Link>

      {/* Niveau & jetons */}
      <Card className="p-5 sm:p-6" elevation="soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 rounded-2xl bg-gradient-to-br px-4 py-2 ${TIER_COLORS[tier.tier] ?? TIER_COLORS.bronze}`}
            >
              <span className="text-2xl font-black text-white">Niv. {profile.level}</span>
              <span className="text-xs font-bold text-white/90">{tier.label}</span>
            </div>
            <div>
              <div className="text-xs font-bold text-tf-grey">Progression</div>
              <ProgressBar value={xpProgress} tone="blue" className="mt-1 max-w-[140px]" />
              <div className="mt-0.5 text-[10px] font-medium text-tf-grey">
                {xpProgress}% vers le niveau {profile.level + 1} • XP : paris gagnés, pronos
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-2">
              <span className="flex shrink-0" aria-hidden>
                <TokenGlyph className="size-8" />
              </span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-800/80">Pari</div>
                <span className="font-display text-lg font-black text-tf-dark">{wallet.tokens} jetons</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-2">
              <span className="text-lg" aria-hidden>
                🏅
              </span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider text-amber-900/80">Boutique</div>
                <span className="font-display text-lg font-black text-tf-dark">{wallet.medals} médailles</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6" elevation="soft">
        <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
          SUPPORTER
        </div>
        <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
          Club & ligue
        </div>
        <p className="mt-1 text-sm font-semibold text-tf-grey">
          Ta ligue et tes clubs (jusqu’à 3) servent aux titres, couleurs et repères — tu gardes accès à tous les
          salons compatibles (ex. ultras du même club). Seul le{' '}
          <strong className="text-tf-dark">{LIVE_FIL_EQUIPE_COEUR.label}</strong> filtre les messages (live, salons,
          top com.).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/10 px-4 py-3">
            <div className="text-xs font-bold text-tf-grey">Ligue favorite</div>
            <div className="mt-1 text-base font-black text-tf-dark">{leagueName}</div>
          </div>
          <div className="rounded-2xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/10 px-4 py-3">
            <div className="text-xs font-bold text-tf-grey">Clubs favoris (max. 3)</div>
            <div className="mt-1 text-base font-black text-tf-dark">{clubsLabel}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="primary" className="rounded-2xl" onClick={openOnboarding}>
            Modifier ligue / clubs
          </Button>
          <a
            href="#mode-virage"
            className="self-center text-xs font-black text-tf-electric-deep underline decoration-2 underline-offset-2 sm:px-2"
          >
            ↑ {LIVE_FIL_EQUIPE_COEUR.label} (réglage rapide)
          </a>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-tf-grey-pastel/50 bg-tf-white/90 px-4 py-2 text-sm font-bold text-tf-dark">
            <input
              type="checkbox"
              checked={hideRivalSalons}
              onChange={(e) => setHideRivalSalons(e.target.checked)}
              className="size-4 rounded"
            />
            Masquer salons rivaux
          </label>
        </div>
      </Card>

      {/* Classement parieur */}
      <UserRankCard />

      <ProfilePhotoSection usernameLabel={authUser?.displayName ?? currentUser.username} />

      {/* Avatar personnalisable */}
      <CharacterLookEditor />
      <AvatarEditor />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <ProfileCharacterThumb
              profile={profile}
              size="md"
              aria-label={`Personnage de ${currentUser.username}`}
            />
            <div>
              <div className="text-base font-black text-tf-dark">
                @{currentUser.username}
              </div>
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
          </div>

          <Button variant="soft" onClick={() => setEditOpen(true)} aria-label="Modifier le profil">
            Modifier
          </Button>
        </div>

        <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Stat label="Pronos" value={`${stats.total}`} hint="Au total" />
          <Stat
            label="Précision"
            value={`${stats.accuracy}%`}
            hint={`${stats.won}/${stats.decided} validés`}
          />
          <Stat
            label="Série"
            value={`x${stats.streak}`}
            hint="Victoires d’affilée"
          />
          <Stat label="Points" value={`${stats.points}`} hint="Score pronos" />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
              MES PARIS
            </div>
            <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
              En cours & validés
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-tf-grey">
            <Badge className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey">
              En cours: {betsView.open.length}
            </Badge>
            <Badge className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey">
              Validés: {betsView.settled.length}
            </Badge>
          </div>
        </div>

        {bets.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-tf-dark">En cours</div>
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  {betsView.open.length}
                </Badge>
              </div>
              {betsView.lastOpen.length ? (
                <div className="mt-3 divide-y divide-tf-grey-pastel/50 rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90">
                  {betsView.lastOpen.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    return (
                      <div key={b.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-tf-dark">
                              {m.title}
                            </div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-tf-grey">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-tf-dark">
                              {betsView.marketLabel(b.market)} •{' '}
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j • x
                              {b.odds.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                            En cours
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-tf-grey">
                  Aucun pari en cours.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-tf-dark">Validés</div>
                <Badge className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey">
                  {betsView.settled.length}
                </Badge>
              </div>
              {betsView.lastSettled.length ? (
                <div className="mt-3 divide-y divide-tf-grey-pastel/50 rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90">
                  {betsView.lastSettled.map((b) => {
                    const m = betsView.matchLine(b.matchId)
                    const statusBadge =
                      b.status === 'won'
                        ? {
                            cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                            label: `Gagné +${b.payout ?? 0}`,
                          }
                        : b.status === 'lost'
                          ? {
                              cls: 'border-rose-200 bg-rose-50 text-rose-800',
                              label: 'Perdu',
                            }
                          : {
                              cls: 'border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey',
                              label: 'Annulé',
                            }
                    return (
                      <div key={b.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-black text-tf-dark">
                              {m.title}
                            </div>
                            {m.sub ? (
                              <div className="mt-0.5 text-[11px] font-semibold text-tf-grey">
                                {m.sub}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs font-bold text-tf-dark">
                              {betsView.marketLabel(b.market)} •{' '}
                              {betsView.selectionLabel(b, b.matchId)} • {b.stake}j
                            </div>
                          </div>
                          <Badge className={statusBadge.cls}>{statusBadge.label}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-3 text-sm font-semibold text-tf-grey">
                  Aucun pari validé pour le moment.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm font-semibold text-tf-grey">
            Pas encore de paris. Lance un match live et tente un prono.
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
              BADGES PRONOS
            </div>
            <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
              Tes badges
            </div>
          </div>
          <div className="text-xs font-semibold text-tf-grey">
            {badges.length} badges
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.label}
              className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4"
              title={b.hint}
            >
              <div className="flex items-start gap-3">
                <BadgeIllustration kind={b.kind} />
                <div className="min-w-0">
                  <div className="text-sm font-black text-tf-dark">
                    {b.label}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-tf-grey">
                    {b.hint}
                  </div>
                  <div className="mt-2">
                    <Badge
                      tone={b.tone ?? 'neutral'}
                      className={b.className}
                    >
                      Débloqué
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
              PROGRESSION
            </div>
            <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
              Prochains paliers
            </div>
          </div>
          <div className="text-xs font-semibold text-tf-grey">
            Gagne des badges en jouant
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-dark">
                {progress.predictor.label}
              </div>
              <div className="text-xs font-bold text-tf-grey">
                {progress.predictor.cur}/{progress.predictor.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.predictor.pct} tone="blue" />
            </div>
          </div>

          <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-dark">
                {progress.accuracy.label}
              </div>
              <div className="text-xs font-bold text-tf-grey">
                {progress.accuracy.cur}/{progress.accuracy.next}%
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.accuracy.pct} tone="emerald" />
            </div>
          </div>

          <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-tf-dark">
                {progress.streak.label}
              </div>
              <div className="text-xs font-bold text-tf-grey">
                {progress.streak.cur}/{progress.streak.next}
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={progress.streak.pct} tone="amber" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black tracking-[0.18em] text-tf-grey">
              HISTORIQUE
            </div>
            <div className="mt-1 font-display text-lg font-black tracking-tight text-tf-dark">
              Prédictions récentes
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-10 rounded-2xl"
            aria-label="Voir plus (placeholder)"
          >
            Voir plus
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {predictions.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-tf-dark">
                      {p.match.home.shortName} – {p.match.away.shortName}
                    </div>
                    <Badge
                      className={
                        p.outcome === 'won'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : p.outcome === 'lost'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey'
                      }
                    >
                      {p.outcome === 'won'
                        ? 'Gagné'
                        : p.outcome === 'lost'
                          ? 'Perdu'
                          : 'En attente'}
                    </Badge>
                    <Badge tone="upcoming" title={p.match.competition.name}>
                      {p.match.competition.shortName}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-tf-grey">
                    Coup d’envoi {formatKickoff(p.match.kickoffAt)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-dark"
                    title="Score prédit"
                  >
                    Prono {p.predictedScore.home}-{p.predictedScore.away}
                  </Badge>
                  <Badge
                    className="border-tf-grey-pastel/50 bg-tf-white/90 text-tf-dark"
                    title="Score réel (si dispo)"
                  >
                    Réel{' '}
                    {p.actualScore
                      ? `${p.actualScore.home}-${p.actualScore.away}`
                      : '—'}
                  </Badge>
                  <Badge
                    className={
                      p.points > 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-tf-grey-pastel/50 bg-tf-white/90 text-tf-grey'
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

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-3xl border border-tf-grey-pastel/50 bg-tf-white/90 p-4">
      <div className="text-xs font-semibold tracking-wide text-tf-grey">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-black tracking-tight text-tf-dark">
        {value}
      </div>
      <div className="mt-1 text-xs font-semibold text-tf-grey">{hint}</div>
    </div>
  )
}

