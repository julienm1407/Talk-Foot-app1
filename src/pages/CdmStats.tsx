import { useCdm2026Data } from '../contexts/Cdm2026DataContext'
import { CdmSubNav } from '../components/cdm/CdmSubNav'
import { WcTopScorersTable } from '../components/cdm/WcTopScorersTable'
import { WcVenuesGrid } from '../components/cdm/WcVenuesGrid'

/**
 * Page « Stats CDM » — soulier d'or, meilleurs passeurs, équipes, stades.
 * Tant que l'API n'est pas branchée, les tableaux affichent leur état d'attente.
 */
export function CdmStatsPage() {
  const { dataset, loading } = useCdm2026Data()

  return (
    <div className="mx-auto w-full max-w-tf-ultra space-y-5 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-7">
      <CdmSubNav />

      <header className="px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
          Statistiques compétition
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
          Records, classements et terrains
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-tf-app-muted">
          Tout ce qu'il faut savoir sur le Mondial : meilleurs buteurs, passeurs décisifs, stats
          d'équipes et stades hôtes.
        </p>
      </header>

      {loading || !dataset ? (
        <p className="rounded-tf-xl border border-dashed border-tf-c30-border px-4 py-10 text-center text-sm text-tf-app-muted">
          Chargement des stats…
        </p>
      ) : (
        <>
          <section className="grid gap-3 lg:grid-cols-2">
            <WcTopScorersTable rows={dataset.stats.topScorers} />
            <article className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-4 shadow-tf-elev-1">
              <header className="mb-3 flex items-center justify-between">
                <p className="font-display text-sm font-black uppercase tracking-[0.18em] text-tf-app-fg">
                  Faits marquants
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-tf-cdm-gold">
                  Compétition
                </span>
              </header>
              <ul className="grid grid-cols-2 gap-3">
                <Kpi label="Buts marqués" value={dataset.stats.totals?.goals ?? 0} />
                <Kpi label="Pénaltys" value={dataset.stats.totals?.penalties ?? 0} />
                <Kpi label="Cartons rouges" value={dataset.stats.totals?.redCards ?? 0} accent="rose" />
                <Kpi label="Cartons jaunes" value={dataset.stats.totals?.yellowCards ?? 0} accent="amber" />
              </ul>
              <p className="mt-3 text-[11px] text-tf-app-muted">
                Compteurs alimentés en direct dès les premiers matchs.
              </p>
            </article>
          </section>

          <section className="space-y-3">
            <header className="px-1">
              <h2 className="font-display text-lg font-black tracking-tight text-tf-app-fg">
                Les 16 stades hôtes
              </h2>
              <p className="text-xs font-medium text-tf-app-muted">
                États-Unis · Canada · Mexique — capacités et caractéristiques.
              </p>
            </header>
            <WcVenuesGrid venues={dataset.venues} />
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'rose' | 'amber'
}) {
  return (
    <li className="rounded-lg border border-tf-c30-border bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-tf-app-muted">{label}</p>
      <p
        className={
          accent === 'rose'
            ? 'mt-1 font-display text-2xl font-black tabular-nums text-rose-400'
            : accent === 'amber'
              ? 'mt-1 font-display text-2xl font-black tabular-nums text-amber-400'
              : 'mt-1 font-display text-2xl font-black tabular-nums text-tf-app-fg'
        }
      >
        {value}
      </p>
    </li>
  )
}
