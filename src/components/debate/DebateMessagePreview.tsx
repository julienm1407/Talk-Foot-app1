import type { DebatePreviewMessage } from '../../data/debates'
import { cn } from '../../utils/cn'

export function DebateMessagePreview({
  message,
  className,
  compact,
}: {
  message: DebatePreviewMessage
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        /* Fond clair : couleurs slate fixes (pas `text-tf-app-fg` / `tf-dark` hérités du thème → illisible nuit). */
        'isolate rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-slate-900 shadow-sm sm:rounded-2xl sm:px-3 sm:py-2.5',
        compact && 'py-1.5 sm:py-2',
        className,
      )}
    >
      <span className="block text-xs font-black text-slate-900 sm:text-sm">{message.username}</span>
      <p
        className={cn(
          'mt-1 text-xs font-semibold leading-snug text-slate-700 sm:mt-1.5 sm:text-sm',
          compact ? 'line-clamp-2' : 'line-clamp-3',
        )}
      >
        {message.text}
      </p>
    </div>
  )
}
