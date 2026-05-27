import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { MatchSalonPick } from '../../utils/matchSalons'
import { cn } from '../../utils/cn'

/**
 * Emplacements tribunes autour de la pelouse (vue plongeante type diffuse).
 * Ordre : nord, sud, ouest, est, coins NE/NW pour 5e et 6e tribune — sans chevaucher l’ovale central.
 */
const TRIBUNE_SLOT_CLASS: readonly string[] = [
  'top-[2%] left-[11%] right-[11%] z-[12] h-[19%] rounded-b-[1.75rem] rounded-t-md',
  'bottom-[2%] left-[11%] right-[11%] z-[12] h-[19%] rounded-t-[1.75rem] rounded-b-md',
  'left-[1.5%] top-[23%] bottom-[23%] z-[12] w-[10.5%] rounded-r-2xl rounded-l-md',
  'right-[1.5%] top-[23%] bottom-[23%] z-[12] w-[10.5%] rounded-l-2xl rounded-r-md',
  'top-[2%] left-[2%] z-[11] h-[16%] w-[13%] rounded-br-3xl rounded-tl-xl',
  'top-[2%] right-[2%] z-[11] h-[16%] w-[13%] rounded-bl-3xl rounded-tr-xl',
]

function MiniStadiumMulti({
  home,
  away,
  picks,
  selectedGroupId,
}: {
  home: Match['home']
  away: Match['away']
  picks: MatchSalonPick[]
  selectedGroupId: string | null
}) {
  const hp = home.colors.primary
  const awaySec = away.colors.secondary

  return (
    <div
      className="relative isolate w-full overflow-hidden rounded-[1.35rem] border border-white/12 bg-[#040b14] shadow-[inset_0_0_80px_rgba(0,0,0,0.65),0_24px_48px_rgba(0,0,0,0.35)] sm:rounded-3xl"
      style={{
        aspectRatio: '5 / 3',
        minHeight: 'clamp(11.5rem, 32vw, 20rem)',
      }}
      aria-hidden
    >
      {/* Ciel & projecteurs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 70% at 50% -10%, rgba(255,255,255,0.12), transparent 45%),
            radial-gradient(circle at 8% 25%, ${hp}55, transparent 28%),
            radial-gradient(circle at 92% 30%, ${awaySec}50, transparent 26%),
            radial-gradient(ellipse 90% 65% at 50% 100%, rgba(0,0,0,0.85), transparent 55%),
            linear-gradient(180deg, #0c1929 0%, #050a12 55%, #020509 100%)
          `,
        }}
      />
      {/* Anneau « bowl » suggéré */}
      <div
        className="pointer-events-none absolute inset-[3%] rounded-[2.2rem] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent opacity-80"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 60px ${hp}12`,
        }}
      />

      {/* Tribunes (sous la pelouse au centre, visibles sur pourtour) */}
      {picks.map((p, i) => {
        const active = selectedGroupId === p.group.id
        const cls = TRIBUNE_SLOT_CLASS[i % TRIBUNE_SLOT_CLASS.length]
        return (
          <div
            key={p.group.id}
            className={cn(
              'absolute border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              cls,
              active
                ? 'z-[14] scale-[1.02] border-white/55 bg-gradient-to-b from-white/25 to-white/[0.08] shadow-[0_0_36px_color-mix(in_srgb,var(--g)_50%,transparent),inset_0_1px_0_rgba(255,255,255,0.35)] ring-2 ring-white/25'
                : 'border-white/18 bg-gradient-to-b from-white/[0.12] to-white/[0.03] opacity-[0.72]',
            )}
            style={
              {
                ['--g' as string]: p.group.theme.primary,
                backgroundImage: active
                  ? undefined
                  : `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
              } as React.CSSProperties
            }
          />
        )
      })}

      {/* Pelouse — ovale central, au-dessus du cœur du terrain */}
      <div
        className="absolute left-1/2 top-[21%] z-[20] h-[58%] w-[min(54%,22rem)] -translate-x-1/2 rounded-[50%] border-[2.5px] border-emerald-300/35"
        style={{
          background: `
            repeating-linear-gradient(90deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 5px,
              transparent 5px,
              transparent 22px
            ),
            linear-gradient(125deg, color-mix(in srgb, ${hp} 22%, #0d4a2e) 0%, #14532d 38%, #166534 50%, color-mix(in srgb, ${awaySec} 18%, #14532d) 100%)
          `,
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.12),
            inset 0 -18px 36px rgba(0,0,0,0.35),
            0 12px 40px rgba(0,0,0,0.45),
            0 0 28px ${hp}28
          `,
        }}
      />
      {/* Ligne médiane discrète */}
      <div className="pointer-events-none absolute left-1/2 top-[21%] z-[21] h-[58%] w-px -translate-x-1/2 bg-white/15" />

      {/* Rond central */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[21] size-[9%] min-h-[1.25rem] min-w-[1.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-emerald-900/30" />

      {/* Bandeau légende */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[22] bg-gradient-to-t from-black/75 via-black/35 to-transparent pb-2 pt-10 sm:pb-2.5 sm:pt-12">
        <p className="text-center text-[9px] font-black uppercase tracking-[0.32em] text-white/70 sm:text-[10px]">
          Plan stade · clique une tribune à droite
        </p>
      </div>
    </div>
  )
}

function reasonLabel(r: MatchSalonPick['reason']) {
  if (r === 'home') return 'Tribune domicile'
  if (r === 'away') return 'Tribune extérieur'
  return 'Ligue / neutre'
}

function SupporterTribuneCard({
  pick,
  selected,
  onSelect,
}: {
  pick: MatchSalonPick
  selected: boolean
  onSelect: () => void
}) {
  const g = pick.group
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-2xl border-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40',
        selected
          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-white shadow-lg shadow-violet-500/10'
          : 'border-slate-200/80 bg-white/90 hover:border-violet-300/60 hover:bg-white',
      )}
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${g.theme.primary}, ${g.theme.secondary})`,
        }}
      />
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl" aria-hidden>
              {g.emoji}
            </span>
            <h3 className="mt-0.5 font-display text-sm font-black leading-tight tracking-tight text-slate-900 sm:text-base">
              {g.name}
            </h3>
          </div>
          {selected ? (
            <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
              Sélection
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-600">
          {g.motto}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-700">
            {reasonLabel(pick.reason)}
          </span>
          <span className="rounded-lg bg-violet-100/80 px-2 py-0.5 text-[9px] font-black text-violet-900">
            {g.members.toLocaleString('fr-FR')} membres
          </span>
          <span className="text-[9px] font-bold text-slate-500">{g.intensity}% actif</span>
        </div>
      </div>
    </button>
  )
}

export function StadiumSupporterPicker({
  match,
  salonPicks,
  selectedGroupId,
  onSelectGroup,
}: {
  match: Match
  salonPicks: MatchSalonPick[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string | null) => void
}) {
  return (
    <section
      className="border-0 bg-transparent px-3 py-4 sm:px-5 sm:py-5"
      aria-labelledby="stadium-supporter-heading"
    >
      <div className="mx-auto w-full max-w-tf-article-body min-w-0">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div
            className="relative px-4 py-4 sm:px-6 sm:py-5"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${match.home.colors.primary} 18%, white) 0%, white 42%, color-mix(in srgb, ${match.away.colors.primary} 14%, white) 100%)`,
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-800 shadow-sm ring-1 ring-slate-200/80">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
                Live · tribunes
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {match.home.shortName} — {match.away.shortName}
              </span>
            </div>
            <h2
              id="stadium-supporter-heading"
              className="mt-2 font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl"
            >
              Choisis ta tribune
            </h2>
            <p className="mt-1 max-w-xl text-sm font-semibold leading-snug text-slate-600">
              Chaque carte est une tribune supporter : le chat live ne montre que les personnes présentes dans la
              tribune choisie.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col gap-3">
              <MiniStadiumMulti
                home={match.home}
                away={match.away}
                picks={salonPicks}
                selectedGroupId={selectedGroupId}
              />
              <button
                type="button"
                onClick={() => onSelectGroup(null)}
                className={cn(
                  'w-full rounded-2xl border-2 border-dashed px-4 py-3 text-left transition',
                  selectedGroupId === null
                    ? 'border-sky-400/70 bg-sky-50/90 shadow-inner'
                    : 'border-slate-200/90 bg-slate-50/50 hover:border-sky-300/50 hover:bg-white',
                )}
              >
                <span className="text-sm font-black text-slate-900">🏟️ Tout le stade (public)</span>
                <p className="mt-0.5 text-xs font-semibold text-slate-600">
                  Mélange toutes les tribunes — comme un chat live classique.
                </p>
              </button>
            </div>

            <div className="min-w-0">
              {salonPicks.length === 0 ? (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm font-semibold text-amber-950">
                  <p className="font-black">Aucune tribune tagué pour ce match.</p>
                  <p className="mt-2 text-xs leading-relaxed">
                    Crée ou rejoins un groupe depuis l’onglet Groupes, avec les bons hashtags / clubs.
                  </p>
                  <Link
                    to="/groups"
                    className="mt-3 inline-flex rounded-xl bg-amber-900 px-4 py-2 text-xs font-black text-white"
                  >
                    Ouvrir les groupes
                  </Link>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1" role="list">
                  {salonPicks.map((pick) => (
                    <li key={pick.group.id}>
                      <SupporterTribuneCard
                        pick={pick}
                        selected={selectedGroupId === pick.group.id}
                        onSelect={() => onSelectGroup(pick.group.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="border-t border-slate-100 px-4 py-3 text-center text-[11px] font-semibold text-slate-500 sm:px-5">
            Après choix, tu reviens sur le live avec le fil filtré pour ta tribune.
          </p>
        </div>
      </div>
    </section>
  )
}
