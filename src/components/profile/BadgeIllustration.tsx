import { cn } from '../../utils/cn'

type Kind =
  | 'starter'
  | 'beta'
  | 'predictor'
  | 'accuracy'
  | 'streak'
  | 'league'

export function BadgeIllustration({
  kind,
  className,
}: {
  kind: Kind
  className?: string
}) {
  const base =
    kind === 'accuracy'
      ? 'from-emerald-600 to-emerald-400'
      : kind === 'streak'
        ? 'from-amber-600 to-amber-400'
        : kind === 'beta'
          ? 'from-sky-600 to-blue-700'
          : kind === 'predictor'
            ? 'from-blue-700 to-sky-400'
            : kind === 'league'
              ? 'from-slate-700 to-slate-500'
              : 'from-violet-700 to-fuchsia-400'

  return (
    <div
      className={cn(
        'relative grid size-12 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br text-white shadow-sm',
        base,
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-7 opacity-95">
        {kind === 'accuracy' ? (
          <path
            fill="currentColor"
            d="M12 2a9 9 0 1 0 9 9a9 9 0 0 0-9-9m0 2a7 7 0 0 1 5.74 11.01l-1.41-1.41A5 5 0 1 0 7.67 16.1l-1.42 1.42A7 7 0 0 1 12 4m.5 3h-1v5l4.25 2.52l.5-.86L12.5 11Z"
          />
        ) : kind === 'streak' ? (
          <path
            fill="currentColor"
            d="M12 2s4 3.5 4 8a4 4 0 0 1-8 0c0-2.2 1.4-4.4 2.3-5.6c.4-.6.7-1 .7-1s.3.4.7 1c.9 1.2 2.3 3.4 2.3 5.6a2 2 0 0 1-4 0H8a4 4 0 0 0 8 0c0-4.5-4-8-4-8"
          />
        ) : kind === 'beta' ? (
          <path
            fill="currentColor"
            d="M12 2l3 6l6 .9l-4.4 4.3l1 6L12 16.9L6.4 19.2l1-6L3 8.9L9 8z"
          />
        ) : kind === 'predictor' ? (
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 8 8a7.9 7.9 0 0 1-1.2 4.2l-2.1-2.1a4.5 4.5 0 0 0-6.4-6.4L8.2 5.2A7.9 7.9 0 0 1 12 4m0 4.5a2.5 2.5 0 0 1 2.5 2.5c0 .6-.2 1.1-.5 1.6l-3.6 3.6A2.5 2.5 0 0 1 9.5 11A2.5 2.5 0 0 1 12 8.5"
          />
        ) : kind === 'league' ? (
          <path
            fill="currentColor"
            d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7m0 9.5A2.5 2.5 0 1 1 14.5 9A2.5 2.5 0 0 1 12 11.5"
          />
        ) : (
          <path
            fill="currentColor"
            d="M12 2l2.2 6.8H21l-5.5 4l2.1 6.7L12 15.7L6.4 19.5l2.1-6.7L3 8.8h6.8Z"
          />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}

