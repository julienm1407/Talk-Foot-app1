import { cn } from '../../utils/cn'
import type { SupporterGroup } from '../../types/group'
import type { GroupAccessLevel } from '../../utils/groupAccess'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'

const kindLabel: Record<NonNullable<SupporterGroup['groupKind']>, string> = {
  public: 'Public',
  private: 'Privé',
  club: 'Club',
}

function ThemeBackdrop({ group, subtle }: { group: SupporterGroup; subtle?: boolean }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', subtle ? 'opacity-30' : 'opacity-60')}
      aria-hidden="true"
      style={{
        background:
          group.theme.background === 'stripe'
            ? `linear-gradient(90deg, color-mix(in srgb, var(--p) 16%, transparent), transparent 55%), repeating-linear-gradient(135deg, color-mix(in srgb, var(--p) 10%, transparent) 0 10px, transparent 10px 20px)`
            : group.theme.background === 'smoke'
              ? `radial-gradient(600px 220px at 10% 0%, color-mix(in srgb, var(--p) 18%, transparent), transparent 60%), radial-gradient(500px 220px at 90% 0%, color-mix(in srgb, var(--s) 14%, transparent), transparent 62%)`
              : `linear-gradient(90deg, color-mix(in srgb, var(--p) 14%, transparent), transparent 60%)`,
      }}
    />
  )
}

function ActiveSupportersFacepile({ size }: { size: 'md' | 'sm' }) {
  const avatarCls =
    size === 'sm' ? 'size-6 ring-1 ring-white/90' : 'size-7 ring-1 ring-white/90 shadow-sm'
  const labelCls = size === 'sm' ? 'text-[11px] leading-tight' : 'text-xs leading-snug'
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex shrink-0 -space-x-1.5 sm:-space-x-2" aria-hidden>
        {(['A', 'B', 'C', 'D'] as const).map((seed, i) => (
          <Avatar key={i} seed={seed} accent="violet" className={avatarCls} alt="" />
        ))}
      </div>
      <span className={cn('min-w-0 font-semibold text-slate-600', labelCls)}>Soutiens en ligne</span>
    </div>
  )
}

export function GroupCard({
  group,
  className,
  accessLevel = 'full',
  member = false,
  variant = 'default',
  /** Rail accueil compact : moins de répétition visuelle, colonne droite plus courte */
  dense = false,
}: {
  group: SupporterGroup
  className?: string
  accessLevel?: GroupAccessLevel
  /** Déjà dans « Mes groupes » (rejoint ou créé par toi). */
  member?: boolean
  /** `encart` / `encartRail` : même DA que la page Groupes + facepile façon encart accueil */
  variant?: 'default' | 'encart' | 'encartRail'
  dense?: boolean
}) {
  const kind = group.groupKind ?? 'public'
  const online = group.onlineNow ?? 0
  const msgs = group.messagesToday ?? 0
  const preview = group.lastMessagePreview
  const rail = variant === 'encartRail'
  const encart = variant === 'encart'
  const railDense = rail && dense

  const themeStyle = {
    ['--p' as string]: group.theme.primary,
    ['--s' as string]: group.theme.secondary,
  } as React.CSSProperties

  const shell = cn(
    'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 transition-shadow duration-200 group-hover:shadow-md',
    railDense
      ? 'rounded-2xl border-[color:color-mix(in_srgb,var(--p)_26%,rgb(226_232_240))] bg-gradient-to-b from-white/95 to-white/[0.88] px-2.5 pb-2.5 pl-2.5 pr-2.5 pt-3 shadow-sm ring-1 ring-[color:color-mix(in_srgb,var(--p)_14%,transparent)]'
      : rail
        ? 'px-3 py-3'
        : encart
          ? 'flex h-full min-h-0 flex-col px-4 py-4'
          : 'px-5 py-4',
    className,
  )

  const emojiBox = (sz: 'md' | 'sm') => (
    <div
      className={cn(
        'grid place-items-center rounded-3xl font-black text-white shadow-sm',
        sz === 'sm' ? 'size-9 text-base' : 'size-10 text-lg',
      )}
      style={{
        background: `linear-gradient(135deg, ${group.theme.primary}, ${group.theme.secondary})`,
      }}
      aria-hidden="true"
    >
      {group.emoji}
    </div>
  )

  if (rail) {
    return (
      <div className={shell} style={themeStyle}>
        <ThemeBackdrop group={group} subtle={rail} />
        {railDense ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[3px] rounded-t-[0.65rem]"
            style={{
              background: `linear-gradient(90deg, ${group.theme.primary}, ${group.theme.secondary})`,
            }}
            aria-hidden
          />
        ) : null}
        <div className={cn('relative z-[2]', railDense ? 'space-y-2' : 'space-y-2')}>
          <div className="flex items-start gap-2">
            <div
              className={cn(
                'shrink-0',
                railDense ? 'rounded-2xl ring-2 ring-white/90 shadow-md' : '',
              )}
            >
              {emojiBox('sm')}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'font-black leading-tight text-slate-900',
                  railDense ? 'font-display text-[13px] tracking-tight' : 'truncate text-sm',
                )}
              >
                {railDense ? (
                  <span className="line-clamp-2 text-balance">{group.name}</span>
                ) : (
                  group.name
                )}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold leading-snug text-slate-600">
                {railDense ? (
                  <span className="line-clamp-2">
                    {group.location ? `${group.location} · ` : ''}
                    {group.members.toLocaleString('fr-FR')} membres
                  </span>
                ) : (
                  <>
                    {group.location ? `${group.location} · ` : ''}
                    {group.members} membres
                  </>
                )}
              </div>
            </div>
          </div>

          {railDense ? (
            <>
              <div className="flex flex-wrap items-center gap-1">
                <Badge className="border-amber-200/85 bg-amber-50/95 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">
                  🔥 {online.toLocaleString('fr-FR')} en ligne
                </Badge>
                <Badge className="border-emerald-200/80 bg-emerald-50/90 px-1.5 py-0.5 text-[9px] font-bold text-emerald-950">
                  📈 +{msgs}
                </Badge>
                <Badge className="border-slate-200/90 bg-[color:color-mix(in_srgb,var(--p)_12%,white)] px-1.5 py-0.5 text-[9px] font-bold text-slate-800">
                  {kindLabel[kind]}
                </Badge>
              </div>
              {group.motto ? (
                <p className="line-clamp-1 text-[9px] font-semibold italic leading-tight text-slate-600">
                  « {group.motto} »
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[10px] text-amber-950">
                  🔥 {online} en ligne
                </Badge>
                <Badge className="border-emerald-200/80 bg-emerald-50/90 px-2 py-0.5 text-[10px] text-emerald-950">
                  📈 +{msgs}
                </Badge>
                <Badge className="border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] text-slate-800">
                  {kindLabel[kind]}
                </Badge>
              </div>

              <p className="line-clamp-2 text-xs font-semibold text-slate-700/90">« {group.motto} »</p>

              <ActiveSupportersFacepile size="sm" />
            </>
          )}

          {accessLevel === 'readonly' ? (
            <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-900">Lecture seule</Badge>
          ) : null}

          {!railDense ? (
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-600">
              <span>{group.intensity}% ambiance</span>
              <span>{group.createdBy === 'me' ? 'Ton groupe' : 'Communauté'}</span>
            </div>
          ) : null}

          <span
            className={cn(
              'tf-interactive-press flex w-full items-center justify-center rounded-2xl text-center font-black shadow-sm',
              railDense ? 'rounded-xl px-2 py-1.5 text-[10px]' : 'rounded-2xl px-3 py-2 text-[11px]',
              member
                ? 'border-2 border-emerald-500/40 bg-emerald-50 text-emerald-900'
                : railDense
                  ? 'text-white shadow-[0_6px_14px_-3px_rgba(0,0,0,0.3)]'
                  : 'bg-tf-dark text-white',
            )}
            style={
              !member && railDense
                ? {
                    background: `linear-gradient(135deg, ${group.theme.primary}, ${group.theme.secondary})`,
                  }
                : undefined
            }
          >
            {member ? 'Membre ✓' : 'Rejoindre'}
          </span>
        </div>
      </div>
    )
  }

  /** Encart grille accueil : une colonne, pied fixe en bas → hauteurs alignées entre cartes */
  if (encart) {
    return (
      <div className={shell} style={themeStyle}>
        <ThemeBackdrop group={group} subtle />

        <div className="relative flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-start gap-2.5">
            {emojiBox('md')}
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 break-words text-sm font-black leading-snug text-slate-900 text-balance sm:text-[0.95rem]">
                {group.name}
              </div>
              <div className="mt-1 line-clamp-1 text-xs font-semibold leading-snug text-slate-600 sm:text-sm">
                {group.location ? `${group.location} • ` : ''}
                {group.members} membres
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge className="border-amber-200/80 bg-amber-50/90 text-[11px] font-bold leading-tight text-amber-950 sm:text-xs">
              🔥 {online} en ligne
            </Badge>
            <Badge className="border-emerald-200/80 bg-emerald-50/90 text-[11px] font-bold leading-tight text-emerald-950 sm:text-xs">
              📈 +{msgs} msg
            </Badge>
            <Badge className="border-slate-200 bg-white/90 text-[11px] font-bold text-slate-800 sm:text-xs">
              {kindLabel[kind]}
            </Badge>
          </div>

          <div className="min-h-0">
            <ActiveSupportersFacepile size="md" />
          </div>

          <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-700/90 sm:text-sm">
            « {group.motto} »
          </p>

          {group.hashtags && group.hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {group.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-slate-200/90 bg-white/90 px-2 py-0.5 text-[11px] font-bold leading-tight text-slate-700"
                >
                  #{h}
                </span>
              ))}
            </div>
          ) : null}

          {preview ? (
            <div className="rounded-xl border border-slate-200/70 bg-white/60 px-2.5 py-1.5 backdrop-blur-[2px]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Dernier message
              </span>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-700 sm:text-xs">
                {preview}
              </p>
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 border-t border-slate-200/60 pt-3">
            {accessLevel === 'readonly' ? (
              <Badge className="w-fit border-amber-200 bg-amber-50 text-[11px] text-amber-900">Lecture seule</Badge>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold leading-snug text-slate-600 sm:text-xs">
              <span className="tabular-nums">{group.intensity}% ambiance</span>
              <span>{group.createdBy === 'me' ? 'Ton groupe' : 'Communauté'}</span>
            </div>
            <span
              className={cn(
                'tf-interactive-press flex w-full items-center justify-center rounded-2xl px-3 py-2.5 text-center text-xs font-black leading-tight shadow-sm sm:py-2',
                member ? 'border-2 border-emerald-500/40 bg-emerald-50 text-emerald-900' : 'bg-tf-dark text-white',
              )}
            >
              {member ? 'Membre ✓' : 'Rejoindre'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={shell} style={themeStyle}>
      <ThemeBackdrop group={group} />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {emojiBox('md')}
            <div className="min-w-0">
              <div className="truncate text-base font-black text-slate-900">{group.name}</div>
              <div className="mt-0.5 truncate text-sm font-semibold text-slate-600">
                {group.location ? `${group.location} • ` : ''}
                {group.members} membres
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="border-amber-200/80 bg-amber-50/90 text-amber-950">
              🔥 {online} en ligne
            </Badge>
            <Badge className="border-emerald-200/80 bg-emerald-50/90 text-emerald-950">
              📈 +{msgs} messages aujourd’hui
            </Badge>
            <Badge className="border-slate-200 bg-white/90 text-slate-800">{kindLabel[kind]}</Badge>
          </div>

          <div className="mt-3 line-clamp-2 text-sm font-semibold text-slate-700/80">« {group.motto} »</div>

          {group.hashtags && group.hashtags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {group.hashtags.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-slate-200/90 bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                >
                  #{h}
                </span>
              ))}
            </div>
          ) : null}

          {preview ? (
            <div
              className="mt-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 px-3 py-2 text-xs font-semibold text-slate-600 opacity-0 max-h-0 translate-y-1 transition-all duration-200 group-hover:mt-3 group-hover:max-h-24 group-hover:translate-y-0 group-hover:opacity-100"
              aria-hidden="true"
            >
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Dernier message</span>
              <p className="mt-0.5 line-clamp-2 text-slate-700">{preview}</p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          {accessLevel === 'readonly' ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-900">Lecture seule</Badge>
          ) : null}
          <Badge className="border-slate-200 bg-white/80 text-slate-900">{group.intensity}% ambiance</Badge>
          <div className="text-xs font-bold text-slate-600">
            {group.createdBy === 'me' ? 'Ton groupe' : 'Communauté'}
          </div>
          <span
            className={cn(
              'tf-interactive-press inline-flex items-center justify-center rounded-2xl px-4 py-2 text-center text-xs font-black shadow-sm sm:min-w-[7.5rem]',
              member ? 'border-2 border-emerald-500/40 bg-emerald-50 text-emerald-900' : 'bg-tf-dark text-white',
            )}
          >
            {member ? 'Membre ✓' : 'Rejoindre'}
          </span>
        </div>
      </div>
    </div>
  )
}
