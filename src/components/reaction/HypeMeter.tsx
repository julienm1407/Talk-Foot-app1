import { cn } from '../../utils/cn'

export function HypeMeter({
  value,
  className,
}: {
  value: number // 0..100
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const label =
    clamped >= 85
      ? 'MODE STADE'
      : clamped >= 65
        ? 'AMBIANCE'
        : clamped >= 40
          ? 'ÇA MONTE'
          : 'CALME'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide text-slate-600">
          Niveau d’ambiance
        </div>
        <div className="text-xs font-black tracking-wide text-slate-800">
          {label} • {clamped}%
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400"
          style={{ width: `${clamped}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

