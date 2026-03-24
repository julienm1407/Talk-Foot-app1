import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../ui/Input'
import { cn } from '../../utils/cn'
import {
  type ClubCatalogEntry,
  searchClubsCatalog,
} from '../../data/allClubsCatalog'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onPick: (club: ClubCatalogEntry) => void
  excludeIds: string[]
  maxReached: boolean
  inputId?: string
}

export function ClubSearchCombobox({
  query,
  onQueryChange,
  onPick,
  excludeIds,
  maxReached,
  inputId = 'fan-club-combobox',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 1) return []
    return searchClubsCatalog(q, 24).filter((c) => !excludeIds.includes(c.id))
  }, [query, excludeIds])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showEmpty = open && query.trim().length >= 1 && results.length === 0 && !maxReached

  return (
    <div className="relative" ref={rootRef}>
      <Input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Tape les premières lettres (ex. Par, Real, Liv…)"
        className="rounded-xl"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={`${inputId}-listbox`}
      />
      {open && results.length > 0 && !maxReached ? (
        <ul
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-[220] mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-tf-grey-pastel/70 bg-white py-1 shadow-[0_12px_40px_rgba(1,30,51,0.12)]"
        >
          {results.map((c) => (
            <li key={c.id} role="option">
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-tf-grey-pastel/25"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(c)
                  onQueryChange('')
                  setOpen(false)
                }}
              >
                <span className="font-black text-tf-dark">
                  {c.shortName}{' '}
                  <span className="font-semibold text-tf-grey">— {c.name}</span>
                </span>
                <span className="text-[11px] font-bold text-tf-grey">{c.leagueName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {showEmpty ? (
        <div className="absolute z-[220] mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-3 py-3 text-sm font-semibold text-tf-grey shadow-md">
          Aucun club connu pour « {query.trim()} ». Essaie un autre orthographe ou l’abréviation (ex.
          PSG, RMA).
        </div>
      ) : null}
      {maxReached ? (
        <p className={cn('mt-1 text-xs font-bold text-tf-grey')}>
          Tu as déjà choisi 3 clubs — retire-en un pour en ajouter un autre.
        </p>
      ) : null}
    </div>
  )
}
