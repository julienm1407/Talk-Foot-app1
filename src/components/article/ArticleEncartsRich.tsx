import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import type {
  BetVolumeSlice,
  DebateSnippet,
  GroupDiscussPreview,
  ReactionSplit,
} from '../../data/articleEncartsPreview'

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const gradId = useId().replace(/:/g, '')
  const w = 100
  const h = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 2
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (w - pad * 2)
    const t = max === min ? 0.5 : (v - min) / (max - min)
    const y = h - pad - t * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradId})`}
        points={`${pad},${h} ${pts.join(' ')} ${w - pad},${h}`}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(' ')}
      />
    </svg>
  )
}

export function StadeDashboardRichBody({
  series,
  splits,
}: {
  series: number[]
  splits: ReactionSplit[]
}) {
  return (
    <div className="mt-3 space-y-4">
      <div className="rounded-xl border border-teal-200/70 bg-white/90 p-3 shadow-sm">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-teal-800">
              Momentum tribune
            </p>
            <p className="mt-0.5 text-lg font-black tabular-nums text-tf-dark">{series[series.length - 1]}%</p>
          </div>
          <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">
            +34% vs mi-temps
          </span>
        </div>
        <Sparkline values={series} stroke="#0d9488" />
        <p className="text-[10px] font-semibold text-tf-grey">Agrégat réactions + bruit tribune</p>
      </div>
      <div className="space-y-2.5">
        {splits.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-[9px] font-bold text-tf-grey">
              <span>{row.label}</span>
              <span className="tabular-nums text-tf-dark">
                {row.home}/{row.away}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full bg-teal-500 transition-all"
                style={{ width: `${row.home}%` }}
              />
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${row.away}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-teal-100 bg-teal-50/40 p-2">
        <div className="text-center">
          <p className="text-[15px] font-black text-tf-dark">2,4k</p>
          <p className="text-[8px] font-bold uppercase tracking-wide text-tf-grey">msg</p>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-black text-tf-dark">18/s</p>
          <p className="text-[8px] font-bold uppercase tracking-wide text-tf-grey">pic</p>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-black text-tf-dark">94%</p>
          <p className="text-[8px] font-bold uppercase tracking-wide text-tf-grey">sync</p>
        </div>
      </div>
    </div>
  )
}

export function DebatesRichBody({
  snippets,
  debatePath,
  tone = 'light',
}: {
  snippets: DebateSnippet[]
  /** Lien vers `/debate/:id` (ou login avec next). */
  debatePath: (id: string) => string
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <div className="mt-3 space-y-2">
      {snippets.map((d) => (
        <Link
          key={d.id}
          to={debatePath(d.id)}
          className={cn(
            'block rounded-xl border p-2.5 shadow-sm outline-none transition focus-visible:ring-2',
            dark
              ? 'border-orange-400/28 bg-orange-950/35 hover:border-orange-400/45 hover:bg-orange-950/45 focus-visible:ring-orange-400/45'
              : 'border-orange-200/80 bg-white/95 hover:border-orange-400 hover:shadow-md focus-visible:ring-orange-400/50',
          )}
          aria-label={`Ouvrir le débat : ${d.title}`}
        >
          <div className="flex items-start gap-2">
            {d.hot ? (
              <span className="shrink-0 text-sm" aria-hidden>
                🔥
              </span>
            ) : (
              <span className="shrink-0 text-sm" aria-hidden>
                💬
              </span>
            )}
            <p
              className={cn(
                'min-w-0 flex-1 text-[11px] font-bold leading-snug',
                dark ? 'text-orange-50/95' : 'text-tf-dark',
              )}
            >
              {d.title}
            </p>
          </div>
          <div
            className={cn(
              'mt-2 flex items-center justify-between gap-2 text-[10px] font-black',
              dark ? 'text-orange-200/90' : 'text-orange-700',
            )}
          >
            <span>
              {d.likes.toLocaleString('fr-FR')} message{d.likes > 1 ? 's' : ''}
            </span>
            <span className="shrink-0 uppercase tracking-wide opacity-90">Ouvrir →</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function BetsRichBody({ slices }: { slices: BetVolumeSlice[] }) {
  return (
    <div className="mt-3 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/80">
        Volume des paris · ce match
      </p>
      <div className="flex h-3 overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-200/80">
        {slices.map((s) => (
          <div
            key={s.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
            title={`${s.label} ${s.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-[10px] font-black">
        {slices.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 tabular-nums text-tf-dark">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} {s.pct}%
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-white p-2.5">
        <p className="text-[10px] font-semibold text-amber-950/80">
          Cotes implicites dérivées du volume — compare avec ton profil et l’historique de tes picks.
        </p>
      </div>
    </div>
  )
}

export function GroupsDiscussRichBody({
  previews,
  groupPath,
  tone = 'light',
}: {
  previews: GroupDiscussPreview[]
  groupPath: (id: string) => string
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'
  return (
    <div className="mt-3 space-y-3">
      {previews.map((g) => (
        <Link
          key={g.groupId}
          to={groupPath(g.groupId)}
          className={cn(
            'block rounded-xl border p-3 shadow-sm outline-none ring-0 transition focus-visible:ring-2',
            dark
              ? 'border-violet-400/28 bg-violet-950/30 hover:border-violet-400/45 hover:bg-violet-950/40 focus-visible:ring-violet-400/45'
              : 'border-violet-200/80 bg-white/95 hover:border-violet-400 hover:shadow-md focus-visible:ring-violet-400/50',
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-solid text-lg shadow-sm',
                dark ? 'bg-white/8' : 'bg-white/90',
              )}
              style={{ borderColor: g.themePrimary, backgroundColor: `${g.themePrimary}18` }}
            >
              {g.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate font-display text-sm font-black',
                  dark ? 'text-violet-50' : 'text-tf-dark',
                )}
              >
                {g.name}
              </p>
              <p
                className={cn(
                  'text-[9px] font-bold',
                  dark ? 'text-violet-200/80' : 'text-violet-700/90',
                )}
              >
                {typeof g.members === 'number'
                  ? `${g.members.toLocaleString('fr-FR')} membres`
                  : 'Tribune supporters'}
                {g.onlineNow != null && g.onlineNow > 0
                  ? ` · ${g.onlineNow} en ligne`
                  : ''}
              </p>
            </div>
          </div>
          {g.previewText ? (
            <p
              className={cn(
                'mt-2.5 line-clamp-3 border-t pt-2.5 text-[10px] font-semibold leading-snug',
                dark ? 'border-violet-400/22 text-violet-50/92' : 'border-violet-100/80 text-tf-dark',
              )}
            >
              {g.previewText}
            </p>
          ) : g.motto ? (
            <p
              className={cn(
                'mt-2.5 line-clamp-2 border-t pt-2.5 text-[10px] font-semibold italic leading-snug',
                dark ? 'border-violet-400/22 text-violet-100/80' : 'border-violet-100/80 text-tf-dark/80',
              )}
            >
              {g.motto}
            </p>
          ) : (
            <p
              className={cn(
                'mt-2.5 border-t pt-2.5 text-[10px] font-bold',
                dark ? 'border-violet-400/22 text-violet-200/85' : 'border-violet-100/80 text-violet-700',
              )}
            >
              Rejoins le fil de la tribune →
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}

export function EncartChrome({
  theme,
  badge,
  hint,
  children,
  className,
}: {
  theme: {
    bar: string
    badge: string
    pathClass: string
  }
  /** Zone fonctionnelle (ex. Matchs, Débats) — pas de nom de couleur. */
  badge: string
  /** Sous-texte court optionnel (ex. hint section). */
  hint?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-10 h-full w-1.5 rounded-l-[0.65rem] sm:w-2',
          theme.bar,
        )}
        aria-hidden
      />
      <div className="relative pl-4 sm:pl-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] sm:text-[10px]',
              theme.badge,
            )}
          >
            {badge}
          </span>
          {hint ? (
            <span className={cn('text-[10px] font-bold sm:text-[11px]', theme.pathClass)}>{hint}</span>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
