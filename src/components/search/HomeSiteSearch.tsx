import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches } from '../../contexts/MatchesContext'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { getAllDebates } from '../../data/debates'
import { mockNews } from '../../data/news'
import { cn } from '../../utils/cn'
import { useAppearance } from '../../contexts/AppearanceContext'
import { kindLabel, runSiteSearch, type SiteSearchResult } from '../../utils/siteSearch'

type HomeSiteSearchProps = {
  className?: string
  /** id du champ (accessibilité) */
  inputId?: string
  /** `hub` : champ discret (icône, fond léger) pour ne pas doubler visuellement un gros CTA à côté. */
  variant?: 'default' | 'hub'
}

export type HomeSiteSearchHandle = {
  /** Remplit la requête, ouvre le panneau de résultats et focus le champ (ex. tendances 12h). */
  applyQuery: (q: string) => void
}

export const HomeSiteSearch = forwardRef<HomeSiteSearchHandle, HomeSiteSearchProps>(
  function HomeSiteSearch({ className, inputId: inputIdProp, variant = 'default' }, ref) {
  const reactId = useId()
  const inputId = inputIdProp ?? `home-site-search-${reactId}`
  const listId = `${inputId}-list`
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const { matches } = useMatches()
  const { groups } = useSupporterGroups()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      applyQuery: (q: string) => {
        const t = q.trim()
        if (t.length < 2) return
        setQuery(t)
        setOpen(true)
        setHighlight(0)
        requestAnimationFrame(() => inputRef.current?.focus())
      },
    }),
    [],
  )

  const debates = useMemo(() => getAllDebates(), [])

  const results = useMemo(() => {
    return runSiteSearch(query, {
      matches,
      groups,
      debates,
      news: mockNews,
    })
  }, [query, matches, groups, debates])

  useEffect(() => {
    setHighlight(0)
  }, [results])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const go = useCallback(
    (r: SiteSearchResult) => {
      navigate(r.href)
      setOpen(false)
      setQuery('')
    },
    [navigate],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && query.trim().length >= 2) {
      setOpen(true)
      return
    }
    if (!open || results.length === 0) {
      if (e.key === 'Escape') setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[highlight]
      if (r) go(r)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showPanel = open && query.trim().length >= 2
  const hub = variant === 'hub'

  return (
    <div ref={wrapRef} className={cn('relative w-full min-w-0', className)}>
      <label htmlFor={inputId} className="sr-only">
        Rechercher sur Talk Foot (matchs, groupes, débats, actus)
      </label>
      <div className={cn('relative', hub && 'flex items-center')}>
        {hub ? (
          <span
            className={cn(
              'pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-[15px] opacity-55',
              L ? 'text-tf-dark' : 'text-sky-100',
            )}
            aria-hidden
          >
            🔍
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={showPanel ? listId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Rechercher match, club, groupe, débat, actu…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'w-full border text-sm font-semibold backdrop-blur-md focus:outline-none focus:ring-2',
            hub
              ? cn(
                  'rounded-lg py-2 pl-9 pr-3 shadow-none ring-0 focus:border-sky-500/40 focus:ring-sky-500/25',
                  L
                    ? 'border-tf-dark/10 bg-tf-dark/[0.04] text-tf-dark placeholder:text-tf-dark/45'
                    : 'border-white/[0.09] bg-black/25 text-white placeholder:text-sky-200/55',
                )
              : cn(
                  'rounded-tf-xl py-2.5 pl-3 pr-3 focus:border-sky-400/50 focus:ring-sky-500/30',
                  L
                    ? 'border-tf-dark/15 bg-white text-tf-dark placeholder:text-tf-dark/50'
                    : 'border-white/12 bg-black/30 text-white placeholder:text-sky-200/70',
                ),
          )}
        />
      </div>
      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className={cn(
            /* z élevé : rester au-dessus des encarts / cartes (hub, isolate, ombres) */
            'absolute left-0 right-0 top-[calc(100%+6px)] z-[200] max-h-[min(70vh,22rem)] overflow-auto rounded-tf-xl border py-1 shadow-xl',
            L ? 'border-tf-dark/12 bg-white text-tf-dark' : 'border-white/12 bg-[#0a1628] text-white',
          )}
        >
          {results.length === 0 ? (
            <p
              className={cn(
                'px-3 py-3 text-center text-xs font-semibold',
                L ? 'text-tf-grey' : 'text-sky-100/78',
              )}
            >
              Aucun résultat pour « {query.trim()} » — essaie un club, une compétition ou un mot-clé.
            </p>
          ) : (
            <ul className={cn('divide-y', L ? 'divide-tf-dark/10' : 'divide-white/10')}>
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition',
                      i === highlight
                        ? L
                          ? 'bg-sky-500/15'
                          : 'bg-sky-500/20'
                        : L
                          ? 'hover:bg-tf-dark/[0.04]'
                          : 'hover:bg-white/[0.06]',
                    )}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r)}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wide text-sky-500">
                      {kindLabel(r.kind)}
                    </span>
                    <span className="text-sm font-black leading-snug">{r.title}</span>
                    {r.subtitle ? (
                      <span
                        className={cn(
                          'line-clamp-2 text-xs font-semibold leading-snug',
                          L ? 'text-tf-dark/72' : 'text-sky-100/82',
                        )}
                      >
                        {r.subtitle}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
  },
)

HomeSiteSearch.displayName = 'HomeSiteSearch'
