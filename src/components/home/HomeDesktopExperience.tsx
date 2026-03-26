/**
 * Hub accueil desktop (≥xl) — inspiration maquette TalkFoot : 3 colonnes, verre sombre,
 * matchs live horizontaux, tribunes, premium, rail droit (calendrier + top débats).
 */
import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAppearance } from '../../contexts/AppearanceContext'
import { hubGlassPanel } from '../../utils/hubSurface'
import type { Match } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import type { Debate } from '../../data/debates'
import { ClubCrest } from '../brand/ClubCrest'
import { LogoMark } from '../../layout/LogoMark'
import { cn } from '../../utils/cn'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { useAuth } from '../../contexts/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
import { HubRailRowUpcoming, HubStripLive, HubStripUpcoming } from '../match/HubMatchEncart'
import { Avatar } from '../ui/Avatar'
import type { Team } from '../../types/match'
import { teams } from '../../data/teams'

/** Unsplash — licence libre */
const IMG = {
  stadium: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=75&auto=format&fit=crop',
  flares: 'https://images.unsplash.com/photo-1522778119026-d647482059dc?w=800&q=75&auto=format&fit=crop',
  tactics: 'https://images.unsplash.com/photo-1517649763962-0c6668665181?w=800&q=75&auto=format&fit=crop',
  bar: 'https://images.unsplash.com/photo-1514939899501-1472842349807?w=800&q=75&auto=format&fit=crop',
  creator: 'https://images.unsplash.com/photo-1492691527719-9d1e07a741bb?w=800&q=75&auto=format&fit=crop',
} as const

const TRIBUNE_UI: Record<
  string,
  { label?: string; image: string; subtitle: string; vip?: boolean }
> = {
  'g-ultras-nuit': {
    label: 'LE PLUS CHAUD',
    image: IMG.flares,
    subtitle: 'Ambiance ultras, chants et énergie de tribune.',
  },
  'g-kop-bleu': {
    image: IMG.tactics,
    subtitle: 'Débats tactiques, stats et décryptage collectif.',
  },
  'g-virage-nord': {
    image: IMG.bar,
    subtitle: 'Discussions détente entre potes — sans prise de tête.',
  },
  'g-tribune-rouge': {
    label: 'CRÉATEUR',
    image: IMG.creator,
    subtitle: 'Live vocal & invités — contenu exclusif.',
    vip: true,
  },
}

function TribuneDesktopCard({ g }: { g: SupporterGroup }) {
  const meta = TRIBUNE_UI[g.id] ?? {
    image: IMG.stadium,
    subtitle: g.motto,
  }
  const vip = meta.vip ?? false

  return (
    <Link
      to={`/group/${g.id}`}
      className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)] outline-none transition hover:border-sky-400/30 hover:shadow-[0_20px_56px_rgba(14,165,233,0.15)] focus-visible:ring-2 focus-visible:ring-sky-400/45"
    >
      <img
        src={meta.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020a14] via-[#020a14]/75 to-transparent" />
      {meta.label ? (
        <span className="absolute left-3 top-3 rounded-md bg-amber-500/95 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-950 shadow">
          {meta.label}
        </span>
      ) : null}
      <div className="relative mt-auto p-4">
        <p className="text-lg font-black text-white drop-shadow-md sm:text-xl">
          <span className="mr-2" aria-hidden>
            {g.emoji}
          </span>
          {g.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs font-semibold text-white/75">{meta.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {['A', 'B', 'C', 'D'].map((seed, i) => (
              <Avatar key={i} seed={seed} accent="violet" className="size-8 ring-2 ring-[#071422]" alt="" />
            ))}
          </div>
          <span className="text-[11px] font-bold text-emerald-300/95">
            {g.onlineNow?.toLocaleString('fr-FR') ?? '—'} en ligne
          </span>
        </div>
        <span
          className={cn(
            'mt-3 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-center text-xs font-black transition',
            vip
              ? 'border border-amber-300/50 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:from-amber-400 hover:to-orange-500'
              : 'bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-[0_6px_20px_rgba(14,165,233,0.35)] hover:from-sky-400 hover:to-blue-500',
          )}
        >
          {vip ? 'Accès VIP' : 'Rejoindre'}
        </span>
      </div>
    </Link>
  )
}

export function HomeDesktopExperience({
  liveMatches,
  upcomingMatches,
  tribuneGroups,
  trendingDebates,
  onCreateTribune,
}: {
  liveMatches: Match[]
  upcomingMatches: Match[]
  tribuneGroups: SupporterGroup[]
  trendingDebates: Debate[]
  onCreateTribune: () => void
}) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const profilePhotoDataUrl = profile.profilePhotoDataUrl
  const { favoriteClubIds } = useFanPreferences()
  const { appearance, setAppearance } = useAppearance()
  const L = appearance === 'light'
  const card = hubGlassPanel(appearance)
  const navClassFn = (active: boolean) =>
    cn(
      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
      active
        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_8px_24px_rgba(14,165,233,0.35)]'
        : cn(
            'text-tf-app-muted hover:text-tf-app-fg',
            L ? 'hover:bg-tf-dark/[0.06]' : 'hover:bg-white/[0.08]',
          ),
    )
  const railSep = L ? 'border-t border-tf-dark/10' : 'border-t border-white/10'
  const railHeadBorder = L ? 'border-b border-tf-dark/10' : 'border-b border-white/10'
  const linkSky = L
    ? 'text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline'
    : 'text-xs font-bold text-sky-300 hover:text-sky-200 hover:underline'
  const linkSkySm = L
    ? 'text-sm font-black text-sky-700 hover:underline'
    : 'text-sm font-black text-sky-300 hover:underline'
  const linkOrange = L
    ? 'mt-3 block text-center text-xs font-black text-orange-700 hover:text-orange-900 hover:underline'
    : 'mt-3 block text-center text-xs font-black text-orange-300/90 hover:text-orange-200 hover:underline'
  const debateRow = L
    ? 'flex gap-3 rounded-xl border border-tf-dark/10 bg-white/85 p-2.5 transition hover:border-orange-400/40 hover:bg-white'
    : 'flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2.5 transition hover:border-orange-400/30 hover:bg-white/[0.07]'
  const favRow = cn(
    'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-tf-app-fg transition',
    L ? 'hover:bg-tf-dark/[0.05]' : 'hover:bg-white/[0.08]',
  )
  const [notifCount] = useState(3)

  const displayName = user?.displayName ?? 'Supporter'
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

  const upcoming = useMemo(() => {
    return [...upcomingMatches]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 5)
  }, [upcomingMatches])

  /** Bandeau central : mêmes cartes que les lives, si aucun live */
  const headerUpcoming = useMemo(() => {
    return [...upcomingMatches]
      .filter((m) => m.status === 'upcoming')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 8)
  }, [upcomingMatches])

  const hasLive = liveMatches.length > 0
  const showUpcomingInHeader = !hasLive && headerUpcoming.length > 0
  const showMixedHeader = hasLive && headerUpcoming.length > 0
  const topDebates = trendingDebates.slice(0, 5)
  const tribunes = tribuneGroups.slice(0, 4)

  return (
    <div className="grid w-full gap-6 xl:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(260px,300px)] xl:gap-8 2xl:gap-10">
      {/* ——— Sidebar ——— */}
      <aside className={cn('flex flex-col gap-5', card, 'p-4')}>
        <Link to="/" className="flex items-center gap-2.5 px-1" aria-label="Talk Foot accueil">
          <LogoMark
            variant="header"
            className={cn('h-9 w-auto', L ? '' : 'brightness-0 invert')}
            decorative={false}
          />
          <span className="font-display text-lg font-black tracking-tight text-tf-app-fg">TalkFoot</span>
        </Link>

        <nav className={cn('flex flex-col gap-1 pt-4', railSep)} aria-label="Navigation principale">
          <NavLink to="/" end className={({ isActive }) => navClassFn(isActive)}>
            <span aria-hidden>🏠</span> Accueil
          </NavLink>
          <NavLink to="/matches" className={({ isActive }) => navClassFn(isActive)}>
            <span aria-hidden>🔴</span> En direct
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => navClassFn(isActive)}>
            <span aria-hidden>🎙️</span> Mes tribunes
          </NavLink>
          <button type="button" onClick={onCreateTribune} className={navClassFn(false)}>
            <span aria-hidden>➕</span> Créer une tribune
          </button>
        </nav>

        <div className={cn('pt-4', railSep)}>
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-tf-app-subtle">Mon univers</p>
          <ul className="mt-2 space-y-1" role="list">
            {favoriteClubs.length === 0 ? (
              <li className="rounded-lg px-2 py-2 text-xs font-semibold text-tf-app-muted">Ajoute tes clubs dans Profil.</li>
            ) : (
              favoriteClubs.slice(0, 6).map((club) => (
                <li key={club.id}>
                  <Link to="/matches" className={favRow}>
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
        </div>

        <div className={cn('mt-auto pt-4', railSep)}>
          <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-tf-app-subtle">Ambiance</p>
          <div
            className={cn(
              'flex gap-1 rounded-xl p-1',
              L ? 'border border-tf-dark/10 bg-tf-dark/[0.04]' : 'bg-white/[0.06]',
            )}
            role="group"
            aria-label="Thème d’affichage"
          >
            <button
              type="button"
              onClick={() => setAppearance('dark')}
              className={cn(
                'flex-1 rounded-lg py-2 text-[11px] font-black transition',
                !L ? 'bg-sky-600 text-white shadow-sm' : 'text-tf-app-muted hover:bg-white/80 hover:text-tf-app-fg',
              )}
            >
              Nuit stade
            </button>
            <button
              type="button"
              onClick={() => setAppearance('light')}
              className={cn(
                'flex-1 rounded-lg py-2 text-[11px] font-black transition',
                L ? 'bg-sky-500 text-white shadow-sm' : 'text-tf-app-muted hover:bg-white/10 hover:text-tf-app-fg',
              )}
            >
              Mode jour
            </button>
          </div>
          <Link
            to="/profile"
            className={cn(
              'mt-3 flex items-center gap-3 rounded-xl border p-2 transition',
              L
                ? 'border-tf-dark/10 bg-white/70 hover:bg-white/90'
                : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]',
            )}
          >
            {profilePhotoDataUrl ? (
              <img src={profilePhotoDataUrl} alt="" className="size-11 shrink-0 rounded-full object-cover ring-2 ring-sky-400/40" />
            ) : (
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-full text-lg ring-2',
                  L ? 'bg-tf-ice/80 ring-tf-dark/10' : 'bg-white/10 ring-white/20',
                )}
              >
                🧢
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-tf-app-fg">{displayName}</p>
              <p className={cn('text-[11px] font-bold', L ? 'text-sky-700' : 'text-sky-300/90')}>Niveau {profile.level}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ——— Centre ——— */}
      <div className="min-w-0 space-y-8">
        <header className={cn('flex flex-col gap-4 p-5 sm:p-6', card)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
                Bienvenue sur TalkFoot <span className="inline-block">💙</span>
              </h1>
              <p className="mt-1.5 max-w-xl text-sm font-semibold text-tf-app-muted">
                Rejoins la communauté des passionnés et vis le football autrement.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={cn(
                  'relative grid size-11 place-items-center rounded-xl border text-lg transition',
                  L
                    ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
                    : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
                )}
                aria-label={`Notifications (${notifCount})`}
              >
                🔔
                <span
                  className={cn(
                    'absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2',
                    L ? 'ring-white' : 'ring-[#071422]',
                  )}
                >
                  {notifCount}
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-black transition',
                  L
                    ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
                    : 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.12]',
                )}
              >
                Inviter des amis
              </button>
              <div className="min-w-[200px] flex-1 sm:min-w-[240px] sm:flex-none">
                <label className="sr-only" htmlFor="home-desktop-search">
                  Rechercher
                </label>
                <input
                  id="home-desktop-search"
                  type="search"
                  placeholder="Rechercher match ou équipe…"
                  className={cn(
                    'w-full rounded-xl border py-2.5 pl-3 pr-3 text-sm font-semibold backdrop-blur-md focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30',
                    L
                      ? 'border-tf-dark/15 bg-white text-tf-dark placeholder:text-tf-dark/40'
                      : 'border-white/12 bg-black/30 text-white placeholder:text-white/40',
                  )}
                />
              </div>
            </div>
          </div>
        </header>

        <section
          aria-labelledby={
            showUpcomingInHeader ? 'desk-upcoming-heading' : showMixedHeader ? 'desk-mixed-heading' : 'desk-live-heading'
          }
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={
                  showUpcomingInHeader
                    ? 'desk-upcoming-heading'
                    : showMixedHeader
                      ? 'desk-mixed-heading'
                      : 'desk-live-heading'
                }
                className="font-display text-lg font-black text-tf-app-fg sm:text-xl"
              >
                {showMixedHeader ? 'En direct & à venir' : hasLive ? 'Matchs en direct' : 'Prochains matchs'}
              </h2>
              {hasLive ? (
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  LIVE
                </span>
              ) : null}
              {showMixedHeader || showUpcomingInHeader ? (
                <span className="rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-black uppercase text-white ring-1 ring-sky-400/45">
                  À venir
                </span>
              ) : null}
            </div>
            <Link to="/matches" className={linkSky}>
              Voir tout
            </Link>
          </div>
          {hasLive || showUpcomingInHeader ? (
            <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
              {liveMatches.map((m) => (
                <HubStripLive key={m.id} match={m} className="min-w-[300px] max-w-[320px]" />
              ))}
              {(hasLive || showUpcomingInHeader) &&
                headerUpcoming.map((m) => (
                  <HubStripUpcoming key={m.id} match={m} className="min-w-[300px] max-w-[320px]" />
                ))}
            </div>
          ) : (
            <div className={cn('p-8 text-center', card)}>
              <p className="text-sm font-semibold text-tf-app-muted">Aucun live pour l’instant.</p>
              <Link to="/matches" className={cn('mt-3 inline-block', linkSkySm)}>
                Voir le calendrier
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="desk-tribunes-heading">
          <h2 id="desk-tribunes-heading" className="font-display text-lg font-black text-tf-app-fg sm:text-xl">
            En direct maintenant
          </h2>
          <p className="mt-1 text-sm font-semibold text-tf-app-muted">Choisis ta tribune et rejoins la conversation.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {tribunes.map((g) => (
              <TribuneDesktopCard key={g.id} g={g} />
            ))}
          </div>
        </section>

        <section
          className="relative overflow-hidden rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-600/90 via-indigo-700/90 to-sky-900/95 p-5 shadow-[0_16px_48px_rgba(99,102,241,0.35)] sm:p-6"
          aria-label="Premium"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="text-3xl" aria-hidden>
                👑
              </span>
              <div>
                <p className="font-display text-lg font-black text-white sm:text-xl">Passe en mode Premium</p>
                <p className="mt-1 max-w-md text-sm font-semibold text-white/80">
                  Accède aux Carrés VIP, priorité vocal et plus encore.
                </p>
              </div>
            </div>
            <Link
              to="/boutique"
              className="shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-6 py-3 text-center text-sm font-black text-white shadow-lg transition hover:brightness-110"
            >
              Découvrir Premium
            </Link>
          </div>
        </section>
      </div>

      {/* ——— Rail droit ——— */}
      <aside className="flex min-w-0 flex-col gap-5">
        <div className={cn('p-4', card)}>
          <h3 className={cn('pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-tf-app-fg', railHeadBorder)}>
            Prochains matchs
          </h3>
          <ul className="mt-3 space-y-2" role="list">
            {upcoming.length === 0 ? (
              <li className="text-xs font-semibold text-tf-app-muted">Rien à afficher.</li>
            ) : (
              upcoming.map((m) => (
                <li key={m.id}>
                  <HubRailRowUpcoming match={m} />
                </li>
              ))
            )}
          </ul>
          <Link to="/calendar" className={cn('mt-3 block text-center', linkSky)}>
            Voir le calendrier complet
          </Link>
        </div>

        <div className={cn('p-4', card)}>
          <h3 className={cn('pb-2 font-display text-xs font-black uppercase tracking-[0.18em] text-tf-app-fg', railHeadBorder)}>
            Top débats
          </h3>
          <ol className="mt-3 space-y-2" role="list">
            {topDebates.map((d, i) => (
              <li key={d.id}>
                <Link to={`/debate/${d.id}`} className={debateRow}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-orange-500 to-rose-600 text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-tf-app-fg">{d.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-tf-app-muted">
                      <span aria-hidden>🔥</span>
                      {d.messagesCount.toLocaleString('fr-FR')} réponses
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link to="/debates" className={linkOrange}>
            Tous les débats
          </Link>
        </div>
      </aside>
    </div>
  )
}
