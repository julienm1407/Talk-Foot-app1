import { cn } from '../../utils/cn'

type Props = {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'
  message: string | null
  suggestions: string[]
  onPickSuggestion?: (name: string) => void
  className?: string
}

export function DisplayNameAvailabilityHint({
  status,
  message,
  suggestions,
  onPickSuggestion,
  className,
}: Props) {
  if (status === 'idle' || !message) return null

  return (
    <div className={cn('mt-1.5 space-y-1.5', className)}>
      <p
        className={cn(
          'text-xs font-semibold leading-snug',
          status === 'available' && 'text-emerald-700',
          status === 'checking' && 'text-tf-grey',
          (status === 'taken' || status === 'invalid' || status === 'error') && 'text-rose-600',
        )}
      >
        {message}
      </p>
      {status === 'taken' && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPickSuggestion?.(s)}
              className="rounded-lg border border-emerald-300/80 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
