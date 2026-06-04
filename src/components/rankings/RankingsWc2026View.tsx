import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCdm2026Data } from '../../contexts/Cdm2026DataContext'
import { useAppearance } from '../../contexts/AppearanceContext'
import { CdmSubNav } from '../cdm/CdmSubNav'
import { WcGroupCard } from '../cdm/WcGroupCard'
import { WcMatchSummaryCard } from '../cdm/WcMatchSummaryCard'
import { SectionIntro } from '../ui/SectionIntro'
import { cn } from '../../utils/cn'
import { getSportMonksToken } from '../../utils/apiTokens'
import type { WcGroupId } from '../../types/wc2026'

const WC_GROUP_IDS: WcGroupId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
]

type GroupFilter = 'all' | WcGroupId

/**
 * Classements phase de poules — Mondial 2026 (SportMonks), sans championnats européens.
 */
export function RankingsWc2026View() {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { dataset, loading, error, refresh } = useCdm2026Data()
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const hasToken = Boolean(getSportMonksToken())

  const groups = dataset?.groups ?? []
  const updatedLabel = dataset?.updatedAt
    ? `Mis à jour ${new Date(dataset.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`
    : null

  const filteredGroups = useMemo(() => {
    if (groupFilter === 'all') return groups
    return groups.filter((g) => g.id === groupFilter)
  }, [groups, groupFilter])

  const focusGroupMatches = useMemo(() => {
    if (!dataset || groupFilter === 'all') return []
    return dataset.matches
      .filter((m) => m.round === 'group' && m.groupId === groupFilter)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
  }, [dataset, groupFilter])

  const pouleBtn = (id: GroupFilter, label: string) => {
    const active = groupFilter === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setGroupFilter(id)}
        className={cn(
          'snap-start shrink-0 rounded-full border-2 px-3.5 py-2 text-xs font-black uppercase tracking-wide transition min-h-11 sm:min-h-0',
          active
            ? 'border-tf-cdm-gold/70 bg-tf-cdm-gold/15 text-tf-cdm-gold shadow-sm'
            : L
              ? 'border-tf-grey-pastel/70 bg-white text-tf-dark hover:border-tf-cdm-gold/45'
              : 'border-white/15 bg-white/[0.06] text-sky-100 hover:border-tf-cdm-gold/50',
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionIntro
        section="rankings"
        titleAs="h1"
        uppercaseTitle={false}
        eyebrow="Coupe du Monde 2026"
        title="Classements · Phase de poules"
        description="Les 12 poules du Mondial : points, différence de buts et qualification. Données SportMonks — pas de Ligue 1 ni des championnats européens pendant le Mondial."
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            className={cn(
              'rounded-xl border px-3 py-2 text-xs font-black transition',
              L
                ? 'border-tf-dark/15 bg-white text-tf-dark hover:bg-tf-grey-pastel/40'
                : 'border-white/15 bg-white/10 text-white hover:bg-white/15',
            )}
          >
            Actualiser
          </button>
        }
      />

      <CdmSubNav className="max-w-full" />

      <p className="rounded-2xl border border-tf-electric/25 bg-tf-electric-soft/35 px-4 py-3 text-sm font-semibold text-tf-dark">
        Classement des parieurs :{' '}
        <Link to="/pronostic?vue=classement" className="font-black text-tf-cta underline-offset-2 hover:underline">
          Pronostic → Classement parieurs
        </Link>
        . Phase à élimination :{' '}
        <Link to="/cdm/bracket" className="font-black text-tf-cdm-gold underline-offset-2 hover:underline">
          Arbre du Mondial
        </Link>
        .
      </p>

      {!hasToken ? (
        <p className="rounded-2xl border border-sky-300/50 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-950">
          Clé SportMonks recommandée pour les vrais classements live —{' '}
          <Link to="/settings/donnees#tf-sportmonks-cle" className="underline underline-offset-2">
            configurer
          </Link>
          . Données de démonstration en attendant.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
          {error}. Vérifie la clé SportMonks et l’id saison CDM (
          <code className="rounded bg-black/10 px-1 font-mono text-xs">VITE_SPORTMONKS_WC2026_SEASON_ID</code>
          ).
        </p>
      ) : null}

      <div
        className={cn(
          'sticky top-0 z-20 -mx-1 space-y-2 rounded-2xl px-1 py-2 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
          L ? 'bg-[color:var(--tf-page-bg-light)]/92' : 'bg-[#041424]/90',
        )}
        role="tablist"
        aria-label="Poules du Mondial"
      >
        <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-tf-cdm-gold">
          Choisir une poule
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pouleBtn('all', 'Toutes')}
          {WC_GROUP_IDS.map((id) => pouleBtn(id, id))}
        </div>
        {updatedLabel ? (
          <p className="px-1 text-[10px] font-semibold text-tf-app-muted">{updatedLabel} · SportMonks</p>
        ) : null}
      </div>

      {loading || !dataset ? (
        <p className="rounded-tf-xl border border-dashed border-tf-c30-border px-4 py-12 text-center text-sm font-semibold text-tf-app-muted">
          Chargement des classements des poules…
        </p>
      ) : (
        <>
          <p className="text-xs font-medium leading-relaxed text-tf-app-muted">
            <span className="font-black text-tf-cdm-gold">1er et 2e</span> qualifiés directement ·{' '}
            <span className="font-black text-sky-300">3e</span> parmi les 8 meilleurs · mise à jour après chaque match.
          </p>

          {groupFilter === 'all' ? (
            <section
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Toutes les poules"
            >
              {filteredGroups.map((g) => (
                <WcGroupCard
                  key={g.id}
                  group={g}
                  standing={dataset.standings[g.id] ?? []}
                  compact
                />
              ))}
            </section>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((g) => (
                <WcGroupCard
                  key={g.id}
                  group={g}
                  standing={dataset.standings[g.id] ?? []}
                  className="max-w-xl"
                />
              ))}
              {focusGroupMatches.length > 0 ? (
                <section className="space-y-2" aria-labelledby="rankings-group-matches">
                  <h2
                    id="rankings-group-matches"
                    className="font-display text-sm font-black uppercase tracking-wide text-tf-app-fg"
                  >
                    Matchs · poule {groupFilter}
                  </h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {focusGroupMatches.map((m) => (
                      <li key={m.id}>
                        <WcMatchSummaryCard
                          match={m}
                          venue={
                            m.venueId ? (dataset.venues.find((v) => v.id === m.venueId) ?? null) : null
                          }
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}

          <p className="text-center text-xs font-semibold text-tf-app-muted">
            <Link to="/cdm/groupes" className="font-black text-tf-cdm-gold underline-offset-2 hover:underline">
              Vue complète des poules
            </Link>
            {' · '}
            <Link to="/cdm/stats" className="font-black text-tf-cdm-gold underline-offset-2 hover:underline">
              Stats du tournoi
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
