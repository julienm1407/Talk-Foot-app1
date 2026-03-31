import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  articlePreviewLiveMatch,
  debateSnippetsForArticle,
  getGroupDiscussPreviewsForArticle,
} from '../data/articleEncartsPreview'
import { footballImageUrl, getArticleBySlug } from '../data/news'
import { REPLAY_LIVE_ID } from '../contexts/MatchesContext'
import { useArticleSeo } from '../hooks/useArticleSeo'
import { LogoMark } from '../layout/LogoMark'
import {
  DebatesRichBody,
  EncartChrome,
  GroupsDiscussRichBody,
  LiveMatchRichPreview,
} from '../components/article/ArticleEncartsRich'
import {
  getAppSectionTheme,
  getArticleEncartMeta,
  type ArticleEncartKey,
} from '../theme/appSectionThemes'
import { cn } from '../utils/cn'
import { useAppearance } from '../contexts/AppearanceContext'
import { ThemeAppearanceToggle } from '../components/ui/ThemeAppearanceToggle'

const tagStyles: Record<string, string> = {
  Breaking: 'bg-rose-500/15 text-rose-800 ring-rose-300/50',
  Analyse: 'bg-sky-500/12 text-sky-900 ring-sky-300/45',
  Rumeurs: 'bg-amber-500/15 text-amber-900 ring-amber-300/50',
  Débrief: 'bg-slate-500/10 text-slate-800 ring-slate-300/40',
}

function loginWithNext(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`
}

function encartBlock(key: ArticleEncartKey) {
  const m = getArticleEncartMeta(key)
  return {
    wrap: m.encart.wrap,
    cta: m.encart.cta,
    ctaBar: m.encart.ctaBar,
    pillButton: m.encart.pillButton,
    chrome: {
      bar: m.encart.bar,
      badge: m.encart.badge,
      pathClass: m.encart.pathClass,
    },
    label: m.label,
    hint: m.hint,
  }
}

export function ArticlePage() {
  const { slug } = useParams()
  const article = slug ? getArticleBySlug(slug) : undefined
  const { user, isReady } = useAuth()
  const { appearance } = useAppearance()
  const isLight = appearance === 'light'

  const encarts = useMemo(
    () => ({
      live: encartBlock('live'),
      debates: encartBlock('debates'),
      groups: encartBlock('groups'),
      stade: encartBlock('stade'),
      bets: encartBlock('bets'),
    }),
    [],
  )

  const seoPayload = useMemo(() => {
    if (!article) return null
    return {
      title: article.title,
      description: article.excerpt,
      canonicalPath: `/article/${article.slug}`,
      ogImage: footballImageUrl(article.id, 'og'),
      publishedAt: article.publishedAt ?? new Date().toISOString(),
      section: article.tag,
    }
  }, [article])

  useArticleSeo(seoPayload)

  const livePath = `/channel/${REPLAY_LIVE_ID}`
  const stadePath = `/channel/${REPLAY_LIVE_ID}/stade`
  const debatesPath = '/debates'
  const groupsPath = '/groups'

  if (!isReady) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="tf-page-backdrop" aria-hidden />
        <p className={cn('relative text-sm font-semibold', isLight ? 'text-tf-grey' : 'text-slate-400')}>
          Chargement…
        </p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="relative min-h-dvh overflow-x-hidden text-tf-dark">
        <div className="tf-page-backdrop" aria-hidden />
        <header
          className={cn(
            'relative border-b px-4 py-4 backdrop-blur-xl sm:px-6',
            isLight
              ? 'border-tf-dark/12 bg-gradient-to-b from-white via-tf-ice/90 to-[#e2eef6]'
              : 'border-white/10 bg-tf-night/80',
          )}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Link
              to="/login"
              className={cn(
                'shrink-0 rounded-2xl border px-2 py-1.5 opacity-95 transition hover:opacity-100 sm:px-2.5 sm:py-2',
                isLight
                  ? 'border-tf-dark/12 bg-white/95 hover:bg-white'
                  : 'border-white/10 bg-white/[0.07] hover:border-white/20 hover:bg-white/[0.1]',
              )}
            >
              <LogoMark
                variant="header"
                className={cn(!isLight && 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]')}
                decorative={false}
              />
            </Link>
            <Link
              to="/login"
              className={cn(
                'rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wide backdrop-blur-sm transition',
                isLight
                  ? 'border-tf-dark/12 bg-white/90 text-tf-dark hover:bg-white'
                  : 'border-white/15 bg-white/10 text-white hover:bg-white/15',
              )}
            >
              Connexion
            </Link>
          </div>
        </header>
        <div className="relative mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
          <h1
            className={cn(
              'font-display text-2xl font-black tracking-tight',
              isLight ? 'text-tf-dark' : 'text-white',
            )}
          >
            Article introuvable
          </h1>
          <p className={cn('mt-3 text-sm font-semibold', isLight ? 'text-tf-grey' : 'text-slate-200')}>
            Ce lien n’est plus valide ou l’article a été déplacé.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 px-8 py-3 text-sm font-black text-white shadow-[0_8px_24px_rgba(14,165,233,0.3)] outline-none transition hover:from-sky-400 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            Découvrir Talk Foot
          </Link>
        </div>
      </div>
    )
  }

  const leadImageSrc = footballImageUrl(article.id, 'articleLead')
  const published = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(Date.now() - article.minutesAgo * 60_000)

  const toLive = user ? livePath : loginWithNext(livePath)
  const toStade = user ? stadePath : loginWithNext(stadePath)
  const toDebates = user ? debatesPath : loginWithNext(debatesPath)
  const toGroups = user ? groupsPath : loginWithNext(groupsPath)
  const toMatches = user ? '/match' : loginWithNext('/match')
  const toRankingsBets = user ? '/rankings' : loginWithNext('/rankings')
  const appHome = user ? '/' : '/login'

  const groupDiscussPreviews = useMemo(() => getGroupDiscussPreviewsForArticle(article), [article])
  const debateSnippets = useMemo(() => debateSnippetsForArticle(article), [article])
  const sidebarDebateSnippets = useMemo(() => debateSnippets.slice(0, 1), [debateSnippets])
  const sidebarGroupPreviews = useMemo(
    () =>
      groupDiscussPreviews.slice(0, 1).map((g) => ({
        ...g,
        messages: g.messages.slice(0, 1),
      })),
    [groupDiscussPreviews],
  )

  const toGroup = (id: string) => (user ? `/group/${id}` : loginWithNext(`/group/${id}`))

  const liveEnc = encarts.live
  const D = encarts.debates
  const G = encarts.groups
  const S = encarts.stade
  const B = encarts.bets
  const matchesEncart = getAppSectionTheme('matches').encart

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-tf-dark">
      <div className="tf-page-backdrop pointer-events-none" aria-hidden />

      <header
        className={cn(
          'sticky top-0 z-50 border-b backdrop-blur-xl',
          isLight
            ? 'border-tf-dark/12 bg-gradient-to-b from-white via-tf-ice/90 to-[#e2eef6] shadow-[0_12px_40px_rgba(1,30,51,0.08)]'
            : 'border-white/10 bg-gradient-to-b from-tf-void via-tf-night to-[#071422] shadow-[0_16px_48px_rgba(0,0,0,0.35)]',
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent',
            isLight ? 'from-orange-500/[0.04]' : 'from-orange-500/[0.06]',
          )}
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-tf-content min-w-0 items-center justify-between gap-3 px-[var(--tf-page-gutter)] py-3 sm:gap-4">
          <Link
            to={appHome}
            className={cn(
              'shrink-0 rounded-2xl border px-2 py-1.5 transition sm:px-2.5 sm:py-2',
              isLight
                ? 'border-tf-dark/12 bg-white/95 hover:border-tf-dark/18 hover:bg-white'
                : 'border-white/10 bg-white/[0.07] hover:border-white/20 hover:bg-white/[0.1]',
            )}
          >
            <LogoMark
              variant="header"
              className={cn(!isLight && 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]')}
              decorative={false}
            />
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <ThemeAppearanceToggle variant="floating" className="shadow-sm" />
            <Link to={toLive} className="shrink-0">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-2 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm sm:px-3 sm:text-[11px]',
                  isLight
                    ? 'border-tf-dark/12 bg-white/90 text-tf-dark'
                    : 'border-white/15 bg-white/10 text-white',
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                Live
              </span>
            </Link>
            <Link
              to={user ? '/' : '/login'}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 px-3 py-2 text-[11px] font-black text-white shadow-[0_6px_20px_rgba(14,165,233,0.28)] outline-none transition hover:from-sky-400 hover:to-blue-500 focus-visible:ring-2 focus-visible:ring-sky-400/45 sm:px-4 sm:text-xs"
            >
              {user ? 'Accueil' : 'Rejoindre'}
            </Link>
          </div>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-tf-electric to-cyan-400 opacity-95" aria-hidden />
      </header>

      <main className="relative mx-auto w-full min-w-0 max-w-tf-article-body px-[var(--tf-page-gutter)] pb-10 pt-4 sm:pb-14 sm:pt-6">
        <div className="tf-panel rounded-[22px] p-4 sm:rounded-[28px] sm:p-5 md:p-6">
          <div className="mx-auto flex w-full min-w-0 max-w-tf-article-inner flex-col gap-8 sm:gap-10">
            {/* Ligne 1 : image ~30 % | live compact ~70 % */}
            <section aria-label="Illustration et match en direct">
              <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-10 lg:gap-5">
                <figure className="min-h-0 lg:col-span-3">
                  <div className="h-full overflow-hidden rounded-2xl border border-white/55 bg-white/90 p-1 shadow-md ring-1 ring-tf-dark/[0.06] sm:rounded-3xl sm:p-1.5">
                    <img
                      src={leadImageSrc}
                      alt={article.title}
                      className="aspect-[4/5] w-full rounded-[14px] object-cover sm:aspect-[3/4] lg:aspect-auto lg:min-h-[200px] lg:max-h-[min(100%,320px)]"
                      width={560}
                      height={720}
                      fetchPriority="high"
                    />
                  </div>
                  <figcaption className="mt-2 text-[9px] font-semibold leading-snug text-tf-grey sm:text-[10px]">
                    Photo Unsplash — licence libre (usage éditorial).
                  </figcaption>
                </figure>

                <div className="flex min-h-0 flex-col lg:col-span-7">
                  <div className="tf-home-block flex h-full flex-col rounded-2xl p-2.5 sm:rounded-[22px] sm:p-3">
                    <Link
                      to={toLive}
                      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-sky-400/45 bg-white/95 shadow-[0_8px_28px_rgba(14,165,233,0.1)] ring-1 ring-sky-300/30 outline-none transition hover:border-sky-500/55 hover:shadow-md focus-visible:ring-2 focus-visible:ring-sky-400/45 sm:rounded-2xl"
                    >
                      <div className="relative shrink-0 border-b border-sky-100/90 px-3 pb-2 pt-2.5 sm:px-4 sm:pt-3">
                        <div
                          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-400/12 blur-2xl"
                          aria-hidden
                        />
                        <EncartChrome theme={liveEnc.chrome} badge={liveEnc.label} hint={liveEnc.hint}>
                          <p className="mt-1 font-display text-base font-black leading-tight text-tf-dark sm:text-lg">
                            Salon live
                          </p>
                          <p className="mt-0.5 max-w-xl text-[10px] font-semibold leading-snug text-tf-grey sm:text-xs">
                            Ouvre le canal — démo synchronisée avec l’accueil.
                          </p>
                        </EncartChrome>
                      </div>
                      <div className="min-h-0 flex-1 px-2 pb-2 pt-1.5 sm:px-3 sm:pb-2.5">
                        <LiveMatchRichPreview match={articlePreviewLiveMatch} compact className="h-full" />
                      </div>
                      <div
                        className={cn(
                          'flex shrink-0 items-center justify-center px-3 py-2 sm:py-2.5',
                          liveEnc.ctaBar,
                        )}
                      >
                        <span className="text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-sm">
                          Entrer dans le salon →
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Ligne 2 : article ~70 % | encarts ~30 % */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-10 lg:gap-8 lg:gap-y-0">
              <article className="min-w-0 lg:col-span-7">
                <header>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1',
                        tagStyles[article.tag] ?? tagStyles.Débrief,
                      )}
                    >
                      {article.tag}
                    </span>
                    <time
                      dateTime={published.toISOString()}
                      className="text-[11px] font-bold text-tf-grey"
                    >
                      {published.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  <h1 className="mt-4 font-display text-2xl font-black leading-[1.12] tracking-tight text-tf-dark sm:text-3xl">
                    {article.title}
                  </h1>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-tf-dark/80 sm:text-base">
                    {article.excerpt}
                  </p>
                </header>

                <div className="mt-8 border-t border-tf-dark/10 pt-8">
                  <div className="space-y-5 text-base font-semibold leading-[1.75] tracking-tight text-tf-dark/90 sm:text-[1.0625rem]">
                    {article.body.map((p, i) => (
                      <p key={`${article.id}-p-${i}`}>{p}</p>
                    ))}
                  </div>
                </div>
              </article>

              <aside
                aria-label="En lien avec cet article"
                className="min-w-0 space-y-4 lg:col-span-3 lg:space-y-5"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-tf-electric-deep sm:text-[11px]">
                    Dans l’app
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-tf-grey">À lire à côté de l’article.</p>
                </div>

                <Link
                  to={toDebates}
                  className={cn(
                    D.wrap,
                    'relative block overflow-hidden rounded-2xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/45 sm:p-4',
                  )}
                >
                  <EncartChrome theme={D.chrome} badge={D.label} hint={D.hint}>
                    <p className="mt-1.5 font-display text-sm font-black text-tf-dark">Débats</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-tf-grey">Fil le plus chaud (extrait).</p>
                    <DebatesRichBody snippets={sidebarDebateSnippets} />
                    <span className={cn('mt-2 inline-block text-[11px] font-black', D.cta)}>Tout voir →</span>
                  </EncartChrome>
                </Link>

                <div className={cn(G.wrap, 'relative overflow-hidden rounded-2xl p-3 sm:p-4')}>
                  <EncartChrome theme={G.chrome} badge={G.label} hint={G.hint}>
                    <p className="mt-1.5 font-display text-sm font-black text-tf-dark">Groupes</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-tf-grey">Un salon sur ce thème.</p>
                    <GroupsDiscussRichBody previews={sidebarGroupPreviews} groupPath={toGroup} />
                    <Link to={toGroups} className={cn('mt-3 block w-full text-center', G.pillButton)}>
                      Hub →
                    </Link>
                  </EncartChrome>
                </div>
              </aside>
            </div>

            {/* Clôture : mises en bouche des autres encarts */}
            <section
              aria-label="Pour aller plus loin"
              className="border-t border-tf-dark/10 pt-6 sm:pt-8"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-grey sm:text-[11px]">
                Poursuivre
              </p>
              <h2 className="mt-1 font-display text-lg font-black text-tf-dark sm:text-xl">
                Encarts restants
              </h2>
              <p className="mt-1 text-xs font-semibold text-tf-grey">
                Stade, paris et calendrier — accès rapide avant de quitter la page.
              </p>

              <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <li>
                  <Link
                    to={toStade}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 border-teal-400/40 bg-gradient-to-r from-teal-50/90 to-white px-3 py-2.5 transition hover:border-teal-500/60 hover:shadow-sm',
                    )}
                  >
                    <span className="text-lg" aria-hidden>
                      🏟️
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-teal-950">Mode stade</p>
                      <p className="truncate text-[9px] font-semibold text-tf-grey">Courbe tribune · mock</p>
                    </div>
                    <span className={cn('shrink-0 text-[10px] font-black', S.cta)}>→</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to={toRankingsBets}
                    className="flex items-center gap-3 rounded-xl border-2 border-amber-400/45 bg-gradient-to-r from-amber-50/90 to-white px-3 py-2.5 transition hover:border-amber-500/60 hover:shadow-sm"
                  >
                    <span className="text-lg" aria-hidden>
                      🏆
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-amber-950">Classements & paris</p>
                      <p className="truncate text-[9px] font-semibold text-tf-grey">Volume 1-N-2</p>
                    </div>
                    <span className={cn('shrink-0 text-[10px] font-black', B.cta)}>→</span>
                  </Link>
                </li>
                <li className="sm:col-span-2 lg:col-span-1">
                  <Link
                    to={toMatches}
                    className={cn(
                      'flex h-full items-center gap-3 rounded-xl border-2 border-sky-400/45 bg-gradient-to-r from-sky-50/90 to-white px-3 py-2.5 transition hover:border-sky-500/55 hover:shadow-sm',
                    )}
                  >
                    <span className="text-lg" aria-hidden>
                      📅
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-sky-950">Matchs & salons</p>
                      <p className="truncate text-[9px] font-semibold text-tf-grey">Calendrier complet</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-sky-900">→</span>
                  </Link>
                </li>
                <li className="sm:col-span-2 lg:col-span-1">
                  <Link
                    to={toDebates}
                    className="flex h-full items-center gap-3 rounded-xl border-2 border-orange-400/40 bg-gradient-to-r from-orange-50/90 to-white px-3 py-2.5 transition hover:border-orange-500/55 hover:shadow-sm"
                  >
                    <span className="text-lg" aria-hidden>
                      💬
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-orange-950">Tous les débats</p>
                      <p className="truncate text-[9px] font-semibold text-tf-grey">Fils & polémiques</p>
                    </div>
                    <span className={cn('shrink-0 text-[10px] font-black', D.cta)}>→</span>
                  </Link>
                </li>
              </ul>

              <Link
                to={toMatches}
                className={cn(
                  'tf-interactive-press mt-4 flex w-full flex-col items-center justify-center gap-0.5 text-center sm:mt-5',
                  matchesEncart.pillButton,
                  'py-3.5 sm:py-4',
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/90">Calendrier</span>
                <span className="block text-sm font-black text-white">Tous les matchs & salons</span>
              </Link>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] font-semibold text-slate-500">
          © {new Date().getFullYear()} Talk Foot — données article mock.
        </p>
      </main>
    </div>
  )
}
