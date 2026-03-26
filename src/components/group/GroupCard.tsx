import { cn } from '../../utils/cn'
import type { SupporterGroup } from '../../types/group'
import type { GroupAccessLevel } from '../../utils/groupAccess'
import { Badge } from '../ui/Badge'

const kindLabel: Record<NonNullable<SupporterGroup['groupKind']>, string> = {
  public: 'Public',
  private: 'Privé',
  club: 'Club',
}

export function GroupCard({
  group,
  className,
  accessLevel = 'full',
  member = false,
}: {
  group: SupporterGroup
  className?: string
  accessLevel?: GroupAccessLevel
  /** Déjà dans « Mes groupes » (rejoint ou créé par toi). */
  member?: boolean
}) {
  const kind = group.groupKind ?? 'public'
  const online = group.onlineNow ?? 0
  const msgs = group.messagesToday ?? 0
  const preview = group.lastMessagePreview

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 px-5 py-4 transition-shadow duration-200 group-hover:shadow-md',
        className,
      )}
      style={
        {
          ['--p' as string]: group.theme.primary,
          ['--s' as string]: group.theme.secondary,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
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

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="grid size-10 place-items-center rounded-3xl text-lg font-black text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${group.theme.primary}, ${group.theme.secondary})`,
              }}
              aria-hidden="true"
            >
              {group.emoji}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-black text-slate-900">
                {group.name}
              </div>
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
            <Badge className="border-slate-200 bg-white/90 text-slate-800">
              {kindLabel[kind]}
            </Badge>
          </div>

          <div className="mt-3 line-clamp-2 text-sm font-semibold text-slate-700/80">
            “{group.motto}”
          </div>

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
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Dernier message
              </span>
              <p className="mt-0.5 line-clamp-2 text-slate-700">{preview}</p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          {accessLevel === 'readonly' ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-900">
              Lecture seule
            </Badge>
          ) : null}
          <Badge className="border-slate-200 bg-white/80 text-slate-900">
            {group.intensity}% ambiance
          </Badge>
          <div className="text-xs font-bold text-slate-600">
            {group.createdBy === 'me' ? 'Ton groupe' : 'Communauté'}
          </div>
          <span
            className={cn(
              'tf-interactive-press inline-flex items-center justify-center rounded-2xl px-4 py-2 text-center text-xs font-black shadow-sm sm:min-w-[7.5rem]',
              member
                ? 'border-2 border-emerald-500/40 bg-emerald-50 text-emerald-900'
                : 'bg-tf-dark text-white',
            )}
          >
            {member ? 'Membre ✓' : 'Rejoindre'}
          </span>
        </div>
      </div>
    </div>
  )
}
