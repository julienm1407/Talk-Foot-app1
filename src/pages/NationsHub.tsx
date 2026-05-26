import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NATIONS, CONFEDERATIONS, type Confederation } from '../data/nations'
import { NationCard } from '../components/cdm/NationCard'
import { Input } from '../components/ui/Input'
import { cn } from '../utils/cn'

type FilterId = 'all' | Confederation

/**
 * Index des 48 sélections nationales — vue d'ensemble + recherche + filtres
 * par confédération. Affiche les cartes maillot (PNG) pour rester dans la DA
 * « collection CDM ».
 */
export function NationsHub() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterId>('all')

  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()

  const filtered = useMemo(() => {
    return NATIONS.filter((n) => {
      if (filter !== 'all' && n.confederation !== filter) return false
      if (!normalizedQuery) return true
      const fr = n.nameFr.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
      const en = n.nameEn.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
      return fr.includes(normalizedQuery) || en.includes(normalizedQuery)
    })
  }, [filter, normalizedQuery])

  return (
    <div className="mx-auto w-full max-w-tf-content space-y-5 px-3 pt-4 sm:px-5 sm:pt-6">
      <header className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-tf-cdm-gold">
          Coupe du Monde 2026
        </p>
        <h1 className="font-display text-3xl font-black tracking-tight text-tf-app-fg sm:text-4xl">
          Toutes les sélections
        </h1>
        <p className="max-w-2xl text-sm font-medium text-tf-app-muted">
          {NATIONS.length} sélections en lice. Choisis ton équipe pour découvrir le maillot officiel,
          le calendrier CDM et la tribune dédiée.
        </p>
      </header>

      <section
        aria-label="Filtres nations"
        className="space-y-3 rounded-tf-xl border border-tf-c30-border bg-tf-c30-surface p-3 shadow-tf-elev-1 sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Rechercher une sélection (France, Brazil…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            autoComplete="off"
          />
          <span className="text-xs font-bold text-tf-app-muted">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {([{ id: 'all' as const, label: 'Toutes' }, ...CONFEDERATIONS.map((c) => ({ id: c.id, label: c.label }))]).map(
            (chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id as FilterId)}
                className={cn(
                  'snap-start shrink-0 rounded-full border-2 px-3 py-2 text-xs font-black transition sm:text-sm',
                  filter === chip.id
                    ? 'border-tf-cdm-gold bg-tf-cdm-gold text-tf-cdm-deep shadow-sm'
                    : 'border-tf-c30-border bg-white/[0.04] text-tf-app-fg hover:border-tf-cdm-gold/55 hover:text-tf-cdm-gold',
                )}
              >
                {chip.label}
              </button>
            ),
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-tf-c30-border/80 px-4 py-10 text-center text-sm font-bold text-tf-app-muted">
          Aucune sélection pour ces critères. Essaie un autre filtre ou modifie ta recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((nation) => (
            <NationCard key={nation.iso} nation={nation} variant="jersey" />
          ))}
        </div>
      )}

      <p className="pt-2 text-center text-xs font-medium text-tf-app-muted">
        Tu ne trouves pas une sélection ?{' '}
        <Link to="/profile" className="font-bold underline">
          Envoie-nous le maillot
        </Link>{' '}
        — on l'ajoute à la collection.
      </p>
    </div>
  )
}
