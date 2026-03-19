import { cn } from '../../utils/cn'
import type { SupporterGroup } from '../../types/group'
import { Badge } from '../ui/Badge'

export function GroupCard({
  group,
  className,
}: {
  group: SupporterGroup
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 px-5 py-4',
        className,
      )}
      style={
        {
          ['--p' as any]: group.theme.primary,
          ['--s' as any]: group.theme.secondary,
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
        <div className="min-w-0">
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

          <div className="mt-3 line-clamp-2 text-sm font-semibold text-slate-700/80">
            “{group.motto}”
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge className="border-slate-200 bg-white/80 text-slate-900">
            {group.intensity}% ambiance
          </Badge>
          <div className="text-xs font-bold text-slate-600">
            {group.createdBy === 'me' ? 'Ton serveur' : 'Groupe public'}
          </div>
        </div>
      </div>
    </div>
  )
}

