import { useEffect, useMemo, useState } from 'react'
import { activeWcDataSource } from '../api/wc2026'
import type { WcSquad } from '../types/wc2026'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getNationByIso } from '../data/nations'
import { useMatches } from '../contexts/MatchesContext'
import { useOptionalCdm2026Data } from '../contexts/Cdm2026DataContext'
import { cdm2026JerseyByNationIso } from '../data/cdm2026Jerseys'
import { useProfile } from '../hooks/useProfile'
import {
  nationFeaturedMatch,
  nationLiveMatch,
  nationUpcomingMatches,
} from '../utils/resolveMatchNation'
import { NationSquadList } from '../components/cdm/NationSquadList'
import { WcGroupCard } from '../components/cdm/WcGroupCard'
import { NationFavoriteButton } from '../components/cdm/NationFavoriteButton'
import { NationTribuneCard } from '../components/cdm/NationTribuneCard'
import { NationJerseyImage } from '../components/cdm/NationJerseyImage'
import { MatchSpotlightCard } from '../components/match/MatchSpotlightCard'
import { HubStripUpcoming } from '../components/match/HubMatchEncart'

/**
 * Fiche d'une sélection nationale — version minimale CDM 2026.
 *
 * Contenu : hero (drapeau, nom, maillot), prochains matchs CDM filtrés sur la
 * compétition `wc-2026` et le nom de l'équipe (home OU away), placeholders
 * extensibles (effectif, tribune, stats) à compléter ultérieurement.
 */
export function NationPage() {
  const { iso } = useParams<{ iso: string }>()
  const nation = getNationByIso(iso)
  const { matches } = useMatches()
  const { ownsItem } = useProfile()
  const cdm = useOptionalCdm2026Data()

  const featuredMatch = useMemo(
    () => (nation ? nationFeaturedMatch(matches, nation.iso) : null),
    [matches, nation],
  )
  const liveMatch = useMemo(
    () => (nation ? nationLiveMatch(matches, nation.iso) : null),
    [matches, nation],
  )
  const upcomingMatches = useMemo(
    () => (nation ? nationUpcomingMatches(matches, nation.iso) : []),
    [matches, nation],
  )
  const moreUpcoming = useMemo(() => {
    if (!featuredMatch || featuredMatch.status === 'live') {
      return upcomingMatches
    }
    return upcomingMatches.filter((m) => m.id !== featuredMatch.id)
  }, [featuredMatch, upcomingMatches])

  const wcGroup = useMemo(() => {
    if (!nation || !cdm?.dataset) return null
    return cdm.dataset.groups.find((g) => g.teams.some((t) => t.iso === nation.iso)) ?? null
  }, [cdm?.dataset, nation])
  const wcStanding = wcGroup ? (cdm?.dataset?.standings[wcGroup.id] ?? []) : []
  const datasetSquad = useMemo(
    () => (nation && cdm?.dataset ? cdm.dataset.squads.find((s) => s.nationIso === nation.iso) ?? null : null),
    [cdm?.dataset, nation],
  )
  const [wcSquad, setWcSquad] = useState<WcSquad | null>(datasetSquad)
  const [squadLoading, setSquadLoading] = useState(false)

  useEffect(() => {
    setWcSquad(datasetSquad)
    if (!nation) return
    if (datasetSquad && datasetSquad.players.length > 0) return
    if (!activeWcDataSource.loadSquad) return

    let cancelled = false
    setSquadLoading(true)
    void activeWcDataSource
      .loadSquad(nation.iso)
      .then((squad) => {
        if (!cancelled && squad.players.length > 0) setWcSquad(squad)
      })
      .finally(() => {
        if (!cancelled) setSquadLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [nation, datasetSquad])

  if (!nation) {
    return <Navigate to="/nations" replace />
  }

  const jerseyItem = cdm2026JerseyByNationIso[nation.iso]
  const owned = jerseyItem ? ownsItem(jerseyItem.id) : false

  return (
    <div className="mx-auto w-full max-w-tf-content space-y-6 px-3 pt-4 sm:px-5 sm:pt-6">
      <nav aria-label="Fil d'Ariane" className="text-xs font-bold text-tf-app-muted">
        <Link to="/" className="hover:text-tf-app-fg">
          Accueil
        </Link>
        <span aria-hidden> · </span>
        <Link to="/nations" className="hover:text-tf-app-fg">
          Nations
        </Link>
        <span aria-hidden> · </span>
        <span className="text-tf-app-fg">{nation.nameFr}</span>
      </nav>

      <section
        className="relative overflow-hidden rounded-3xl border text-white shadow-tf-elev-3"
        style={{
          background: `linear-gradient(135deg, ${nation.primary} 0%, ${nation.secondary} 60%, ${nation.accent} 130%)`,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(50% 50% at 80% 10%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(40% 40% at 0% 100%, rgba(0,0,0,0.3) 0%, transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative grid gap-6 px-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8 sm:py-9">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/80">
              {nation.confederation} · Coupe du Monde 2026
            </p>
            <h1 className="mt-2 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">
              <span className="mr-2 align-middle text-3xl sm:text-4xl" aria-hidden>
                {nation.flag}
              </span>
              {nation.nameFr}
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-white/85 sm:text-base">
              Suis le parcours de la sélection {nation.nameFr.toLowerCase()} pendant le Mondial 2026 —
              calendrier, tribunes, classement et maillot officiel Talk Foot.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <NationFavoriteButton
                iso={nation.iso}
                nationLabel={nation.nameFr}
                size="lg"
                variant="solid"
              />
              {jerseyItem ? (
                <Link
                  to="/boutique"
                  className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-tf-dark shadow-tf-elev-1 transition hover:shadow-tf-elev-2"
                >
                  {owned ? 'Maillot débloqué — équiper' : `Maillot · ${jerseyItem.cost} 🏅`}
                </Link>
              ) : null}
              <Link
                to="/match"
                className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl border-2 border-white/30 px-5 py-3 text-sm font-black uppercase tracking-wide backdrop-blur-sm transition hover:bg-white/12"
              >
                Calendrier CDM
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <NationJerseyImage nation={nation} variant="hero" />
          </div>
        </div>
      </section>

      <section
        aria-label={liveMatch ? 'Match en direct' : 'Prochain match'}
        className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-4 shadow-tf-elev-1"
      >
        <header className="mb-3 flex items-end justify-between px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-app-muted">
              Coupe du Monde 2026
            </p>
            <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg">
              {liveMatch ? 'En direct' : 'Prochain match'}
            </h2>
          </div>
          <Link
            to="/match"
            className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
          >
            Voir tout →
          </Link>
        </header>
        {!featuredMatch ? (
          <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-4 py-8 text-center text-sm font-bold text-tf-app-muted">
            Aucun match à venir pour la sélection {nation.nameFr.toLowerCase()} pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-tf-cdm-gold/35 bg-gradient-to-br from-tf-night via-tf-dark to-black shadow-tf-elev-2">
              <MatchSpotlightCard match={featuredMatch} className="min-h-0 w-full min-w-0" />
            </div>
            {moreUpcoming.length > 0 ? (
              <div>
                <p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-tf-app-muted">
                  Ensuite
                </p>
                <ul className="grid gap-2">
                  {moreUpcoming.slice(0, 2).map((m) => (
                    <li key={m.id}>
                      <HubStripUpcoming match={m} visualSize="minimal" className="min-w-0" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {wcGroup ? (
        <section aria-label={`Poule ${wcGroup.id}`} className="space-y-3">
          <header className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
              Phase de poules
            </p>
            <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg">
              Poule {wcGroup.id}
            </h2>
            <p className="text-xs font-medium text-tf-app-muted">
              Les 2 premiers + les 8 meilleurs 3es sont qualifiés pour les seizièmes.
            </p>
          </header>
          <WcGroupCard group={wcGroup} standing={wcStanding} />
          <div>
            <Link
              to="/cdm/groupes"
              className="text-xs font-black uppercase tracking-wide text-tf-cdm-gold hover:underline"
            >
              Toutes les poules →
            </Link>
          </div>
        </section>
      ) : null}

      <section aria-label="Effectif" className="space-y-3">
        <header className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
            Sélection {nation.nameFr}
          </p>
          <h2 className="font-display text-xl font-black tracking-tight text-tf-app-fg">
            Le 26
          </h2>
        </header>
        <NationSquadList squad={wcSquad ?? null} loading={squadLoading} />
      </section>

      <section aria-label="Communauté et parcours" className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-tf-xl border border-dashed border-tf-c30-border bg-tf-c30-surface-soft px-4 py-5 text-sm font-medium text-tf-app-muted">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
            Bientôt
          </p>
          <p className="mt-1 font-display text-lg font-black text-tf-app-fg">
            Parcours dans la compétition
          </p>
          <p className="mt-1.5 leading-snug">
            Du 1er match de poule à la finale : tous les résultats, buteurs et stats clés
            agrégés sur cette page.
          </p>
        </article>
        <NationTribuneCard nation={nation} />
      </section>
    </div>
  )
}
