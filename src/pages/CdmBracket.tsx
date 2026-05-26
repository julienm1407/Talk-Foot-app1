import { useCdm2026Data } from '../contexts/Cdm2026DataContext'
import { CdmSubNav } from '../components/cdm/CdmSubNav'
import { WcBracketTree } from '../components/cdm/WcBracketTree'
import { WcMatchSummaryCard } from '../components/cdm/WcMatchSummaryCard'

/**
 * Page « Arbre de la compétition » — tableau final de la CDM 2026.
 */
export function CdmBracketPage() {
  const { dataset, loading } = useCdm2026Data()

  const koMatches = dataset?.matches.filter((m) => m.round !== 'group') ?? []
  const final = koMatches.find((m) => m.round === 'final')
  const thirdPlace = koMatches.find((m) => m.round === 'third-place')

  return (
    <div className="mx-auto w-full max-w-tf-ultra space-y-5 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-7">
      <CdmSubNav />

      <header className="px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-tf-cdm-gold">
          Tableau final
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight text-tf-app-fg sm:text-3xl">
          L'arbre de la compétition
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-medium text-tf-app-muted">
          De la phase à élimination directe à 32 jusqu'à la finale au MetLife Stadium. Tous les
          parcours possibles, mis à jour à chaque résultat.
        </p>
      </header>

      {loading || !dataset ? (
        <p className="rounded-tf-xl border border-dashed border-tf-c30-border px-4 py-10 text-center text-sm text-tf-app-muted">
          Chargement du tableau…
        </p>
      ) : (
        <WcBracketTree bracket={dataset.bracket} matches={koMatches} />
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {final ? (
          <FocusCard title="La finale" subtitle="19 juillet 2026 · MetLife Stadium">
            <WcMatchSummaryCard
              match={final}
              venue={dataset?.venues.find((v) => v.id === 'metlife') ?? null}
            />
          </FocusCard>
        ) : null}
        {thirdPlace ? (
          <FocusCard title="Petite finale" subtitle="18 juillet 2026">
            <WcMatchSummaryCard match={thirdPlace} />
          </FocusCard>
        ) : null}
      </section>
    </div>
  )
}

function FocusCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <article className="rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-4 shadow-tf-elev-1">
      <header className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-cdm-gold">
          {title}
        </p>
        <p className="font-display text-sm font-black text-tf-app-fg">{subtitle}</p>
      </header>
      {children}
    </article>
  )
}
