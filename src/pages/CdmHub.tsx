import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CdmHomeHero } from '../components/cdm/CdmHomeHero'
import { CdmTodayMatches } from '../components/cdm/CdmTodayMatches'
import { NationCard } from '../components/cdm/NationCard'
import { CdmSubNav } from '../components/cdm/CdmSubNav'
import { WcGroupCard } from '../components/cdm/WcGroupCard'
import { WcTopScorersTable } from '../components/cdm/WcTopScorersTable'
import { NATIONS, CONFEDERATIONS } from '../data/nations'
import { useMatches } from '../contexts/MatchesContext'
import { useOptionalCdm2026Data } from '../contexts/Cdm2026DataContext'
import { matchCalendarDayKeyParis, formatHubDayLabel, formatKickoff } from '../utils/time'
import { WC_2026_COMP_ID } from '../utils/seasonMode'
import { cn } from '../utils/cn'

/**
 * Hub Coupe du Monde 2026 — page dédiée, immersive, branchée depuis la TopBar
 * (lien « ★ CDM 2026 »).
 *
 * Différence avec la home : ici on est 100 % CDM, sans le hub clubs ni le fil
 * débats classique. C'est une « mini-app » saisonnière qui doit donner l'impression
 * d'être dans un site parallèle dédié au Mondial.
 */
export function CdmHubPage() {
  const { matches } = useMatches()
  const cdm = useOptionalCdm2026Data()

  const upcomingByDay = useMemo(() => {
    const todayKey = matchCalendarDayKeyParis(new Date())
    const list = matches
      .filter((m) => m.competition.id === WC_2026_COMP_ID)
      .filter((m) => matchCalendarDayKeyParis(m.kickoffAt) >= todayKey)
      .sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt))
      .slice(0, 8)
    const grouped: Record<string, typeof list> = {}
    for (const m of list) {
      const k = matchCalendarDayKeyParis(m.kickoffAt)
      ;(grouped[k] ??= []).push(m)
    }
    return Object.entries(grouped)
  }, [matches])

  const nationsByConf = useMemo(() => {
    return CONFEDERATIONS.map((conf) => ({
      ...conf,
      nations: NATIONS.filter((n) => n.confederation === conf.id),
    })).filter((g) => g.nations.length > 0)
  }, [])

  const previewGroups = useMemo(() => cdm?.dataset?.groups.slice(0, 4) ?? [], [cdm?.dataset?.groups])

  return (
    <div className="mx-auto w-full max-w-tf-ultra space-y-8 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-7">
      <CdmSubNav />
      <CdmHomeHero />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <CdmTodayMatches />

        <section
          aria-label="Prochains matchs CDM"
          className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4"
        >
          <header className="mb-3 flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-app-muted">
                Mondial 2026
              </p>
              <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg sm:text-xl">
                Calendrier à venir
              </h2>
            </div>
            <Link
              to="/match"
              className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
            >
              Voir tout →
            </Link>
          </header>
          {upcomingByDay.length === 0 ? (
            <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-3 py-6 text-center text-sm font-bold text-tf-app-muted">
              Pas encore de matchs CDM dans la fenêtre — ils apparaîtront ici dès la publication par
              SportMonks.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingByDay.map(([day, list]) => (
                <div key={day}>
                  <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-tf-app-muted">
                    {formatHubDayLabel(list[0].kickoffAt)}
                  </p>
                  <ul className="grid gap-2">
                    {list.map((m) => (
                      <li key={m.id}>
                        <Link
                          to={`/channel/${encodeURIComponent(m.id)}`}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-xl border border-tf-c30-border bg-white/[0.04] px-3 py-2.5 transition',
                            'hover:border-tf-cdm-gold/55 hover:bg-white/[0.08]',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-black uppercase tracking-wider text-tf-app-muted">
                              {formatKickoff(m.kickoffAt)}
                            </div>
                            <div className="mt-0.5 truncate font-display text-sm font-black text-tf-app-fg">
                              {m.home.name} <span className="text-tf-app-muted">vs</span> {m.away.name}
                            </div>
                          </div>
                          <div className="text-xs font-black uppercase tracking-wide text-tf-app-muted">
                            →
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section
        aria-label="Toutes les sélections par confédération"
        className="space-y-5"
      >
        <header className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-app-muted">
              {NATIONS.length} sélections en lice
            </p>
            <h2 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
              Choisis ta nation
            </h2>
            <p className="mt-1 max-w-xl text-sm font-medium text-tf-app-muted">
              Clique sur un maillot pour ouvrir la fiche, voir les prochains matchs et porter ses
              couleurs sur ton avatar.
            </p>
          </div>
          <Link
            to="/nations"
            className="rounded-full border-2 border-tf-cdm-gold/35 bg-tf-c30-surface px-4 py-2 text-xs font-black uppercase tracking-wide text-tf-app-fg transition hover:border-tf-cdm-gold/70 hover:text-tf-cdm-gold"
          >
            Recherche & filtres →
          </Link>
        </header>

        {nationsByConf.map((group) => (
          <section
            key={group.id}
            aria-label={group.label}
            className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h3 className="font-display text-sm font-black uppercase tracking-wider text-tf-app-fg sm:text-base">
                {group.label}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-tf-app-muted">
                {group.nations.length} sélections
              </span>
            </header>
            <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
              {group.nations.map((n) => (
                <NationCard key={n.iso} nation={n} variant="jersey" className="snap-start" />
              ))}
            </div>
          </section>
        ))}
      </section>

      <section
        aria-label="Aperçu des poules et tableau final"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="space-y-3">
          <header className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
                Phase de poules
              </p>
              <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg">
                Aperçu des poules
              </h2>
            </div>
            <Link
              to="/cdm/groupes"
              className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
            >
              Voir les 12 →
            </Link>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            {previewGroups.length > 0 && cdm?.dataset
              ? previewGroups.map((g) => (
                  <WcGroupCard
                    key={g.id}
                    group={g}
                    standing={cdm.dataset!.standings[g.id] ?? []}
                    compact
                  />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-tf-xl border border-dashed border-tf-c30-border bg-tf-c30-surface-soft"
                  />
                ))}
          </div>
        </div>

        <div className="space-y-3">
          <header className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
                Compétition
              </p>
              <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg">
                Tableau final & soulier d'or
              </h2>
            </div>
            <Link
              to="/cdm/bracket"
              className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
            >
              Arbre complet →
            </Link>
          </header>
          <article className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-4 shadow-tf-elev-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-tf-cdm-gold">
              Élimination directe
            </p>
            <h3 className="mt-1 font-display text-lg font-black text-tf-app-fg">
              Du R32 à la finale (MetLife Stadium)
            </h3>
            <p className="mt-1.5 text-xs font-medium text-tf-app-muted">
              32 équipes, 6 tours, 1 trophée. Mise à jour en temps réel à chaque résultat.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/cdm/bracket"
                className="rounded-full bg-tf-cdm-gold/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-tf-cdm-gold"
              >
                Voir l'arbre
              </Link>
              <Link
                to="/cdm/stats"
                className="rounded-full border border-tf-c30-border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-tf-app-muted hover:border-tf-cdm-gold/55 hover:text-tf-app-fg"
              >
                Stades & stats
              </Link>
            </div>
          </article>
          <WcTopScorersTable rows={cdm?.stats?.topScorers ?? []} limit={5} />
        </div>
      </section>

      <section
        aria-label="Maillots officiels CDM 2026"
        className="overflow-hidden rounded-3xl border text-white shadow-tf-elev-3"
        style={{
          background: 'var(--tf-cdm-hero-bg)',
          borderColor: 'var(--tf-cdm-hero-border, rgba(255,255,255,0.18))',
        }}
      >
        <div className="grid gap-5 px-5 py-7 sm:grid-cols-2 sm:items-center sm:px-9 sm:py-9">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-200/90">
              Boutique · Collection officielle
            </p>
            <h2 className="mt-1 font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              48 maillots, 48 supporters
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium text-white/85">
              Le maillot de ta sélection se porte sur ton avatar et te place dans la bonne tribune
              pour chaque match. Disponible en médailles ou en jetons.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/boutique"
                className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-tf-dark shadow-tf-elev-1 transition hover:shadow-tf-elev-2"
              >
                Voir la boutique
              </Link>
              <Link
                to="/profile"
                className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl border-2 border-white/30 px-5 py-3 text-sm font-black uppercase tracking-wide backdrop-blur-sm transition hover:bg-white/12"
              >
                Mon avatar
              </Link>
            </div>
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {['FRA', 'ARG', 'BRA', 'DEU', 'MAR', 'PRT', 'USA', 'JPN'].map((iso) => {
              const n = NATIONS.find((x) => x.iso === iso)
              if (!n) return null
              return <NationCard key={iso} nation={n} variant="jersey" className="snap-start" />
            })}
          </div>
        </div>
      </section>

      <section
        aria-label="À venir"
        className="grid gap-3 pb-6 sm:grid-cols-3"
      >
        {(
          [
            { title: 'Effectif officiel', body: 'Le 26 sélectionné(e)s, capitaine et sélectionneur.' },
            { title: 'Tribune par nation', body: 'Une tribune dédié aux supporters de chaque équipe.' },
            { title: 'Classement parieurs CDM', body: 'Top parieurs filtrés sur la compétition.' },
          ] as const
        ).map((card) => (
          <article
            key={card.title}
            className="rounded-tf-xl border border-dashed border-tf-c30-border bg-tf-c30-surface-soft px-4 py-5 text-sm font-medium text-tf-app-muted"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
              Bientôt
            </p>
            <p className="mt-1 font-display text-lg font-black text-tf-app-fg">
              {card.title}
            </p>
            <p className="mt-1.5 leading-snug">{card.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
