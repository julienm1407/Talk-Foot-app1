import { useCdm2026Data } from '../contexts/Cdm2026DataContext'
import { CdmSubNav } from '../components/cdm/CdmSubNav'
import { WcGroupCard } from '../components/cdm/WcGroupCard'
import { WcMatchSummaryCard } from '../components/cdm/WcMatchSummaryCard'

/**
 * Page « Poules » — vue d'ensemble des 12 poules avec classement et matchs.
 */
export function CdmGroupsPage() {
  const { dataset, loading } = useCdm2026Data()

  return (
    <div className="mx-auto w-full max-w-tf-ultra space-y-5 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-7">
      <CdmSubNav />

      <header className="px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
          Phase de poules
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
          Les 12 poules du Mondial 2026
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-tf-app-muted">
          Les 2 premiers de chaque poule et les 8 meilleurs 3es se qualifient pour les seizièmes
          de finale. Classement mis à jour à la fin de chaque match.
        </p>
      </header>

      {loading || !dataset ? (
        <p className="rounded-tf-xl border border-dashed border-tf-c30-border px-4 py-10 text-center text-sm text-tf-app-muted">
          Chargement des poules…
        </p>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {dataset.groups.map((g) => (
            <WcGroupCard key={g.id} group={g} standing={dataset.standings[g.id] ?? []} />
          ))}
        </section>
      )}

      {dataset ? (
        <section className="space-y-3">
          <header className="px-1">
            <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg">
              Calendrier de la phase de poules
            </h2>
            <p className="text-xs font-medium text-tf-app-muted">
              {dataset.matches.filter((m) => m.round === 'group').length} matchs · 3 journées
            </p>
          </header>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {dataset.matches
              .filter((m) => m.round === 'group')
              .slice(0, 12)
              .map((m) => (
                <WcMatchSummaryCard
                  key={m.id}
                  match={m}
                  venue={m.venueId ? (dataset.venues.find((v) => v.id === m.venueId) ?? null) : null}
                  size="sm"
                />
              ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
