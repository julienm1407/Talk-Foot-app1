import type { DebatePreviewMessage } from '../../data/debates'
import { ALL_CLUBS_BY_ID } from '../../data/allClubsCatalog'
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
  const club = ALL_CLUBS_BY_ID[message.fanClubId]

  return (
    <div
      className={cn(
        'rounded-xl border border-tf-grey-pastel/50 bg-white px-2.5 py-2 shadow-sm sm:rounded-2xl sm:px-3 sm:py-2.5',
        compact && 'py-1.5 sm:py-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs font-black text-tf-dark sm:text-sm">{message.username}</span>
        {club ? (
          <span className="rounded-full border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-700 sm:px-2 sm:text-[10px]">
            {club.shortName}
          </span>
        ) : (
          <span className="text-[9px] font-bold text-tf-grey sm:text-[10px]">{message.fanClubId}</span>
        )}
      </div>
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
