import { Link } from 'react-router-dom'
import type { Debate } from '../../data/debates'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import { DebateMessagePreview } from '../debate/DebateMessagePreview'

export function DebateOfTheDayCard({
  debate,
  hubCompact = false,
  className,
}: {
  debate: Debate
  /** Encart rail desktop hub : plus court, sans aperçu du fil */
  hubCompact?: boolean
  className?: string
}) {
  const previews = hubCompact ? [] : debate.previewMessages.slice(0, 2)
  const participants = debate.activeParticipants ?? []

  return (
    <Card
      className={cn(
        hubCompact
          ? 'overflow-hidden border-white/10 bg-white/[0.06] p-0 text-white shadow-none backdrop-blur-md'
          : 'overflow-hidden border-0 p-0 shadow-[0_20px_50px_rgba(1,30,51,0.1)]',
        className,
      )}
      elevation={hubCompact ? 'none' : 'soft'}
    >
      <div
        className={cn(
          'relative',
          hubCompact ? 'min-h-[128px] sm:min-h-[148px]' : 'min-h-[220px] sm:min-h-[240px]',
        )}
      >
        {debate.heroImageUrl ? (
          <>
            <img
              src={debate.heroImageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-tf-dark via-tf-dark/88 to-tf-dark/45"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-tf-dark via-tf-dark-alt to-slate-900"
            aria-hidden
          />
        )}

        <div
          className="absolute left-0 top-0 h-full w-1.5 sm:w-2"
          style={{ backgroundColor: debate.accent }}
          aria-hidden
        />

        <div
          className={cn(
            'relative z-10 flex h-full flex-col justify-between gap-4 px-4 pb-4 sm:flex-row sm:items-end sm:justify-between',
            hubCompact ? 'gap-3 pt-6 sm:px-4 sm:pb-3 sm:pt-7' : 'pt-10 sm:px-6 sm:pb-5 sm:pt-14',
          )}
        >
          <div className={cn('min-w-0 flex-1', hubCompact ? 'space-y-1.5' : 'space-y-2 sm:space-y-3')}>
            <p
              className={cn(
                'font-black uppercase tracking-[0.22em] text-white/90',
                hubCompact ? 'text-[10px]' : 'text-xs',
              )}
            >
              Débat du jour
            </p>
            <h2
              className={cn(
                'font-display font-black uppercase leading-[1.15] tracking-tight text-white',
                hubCompact ? 'text-sm sm:text-base' : 'text-lg sm:text-2xl lg:text-[1.65rem]',
              )}
            >
              {debate.title}
            </h2>
            <p
              className={cn(
                'font-semibold leading-snug text-white/80',
                hubCompact ? 'line-clamp-2 text-[11px]' : 'line-clamp-2 text-xs sm:line-clamp-3 sm:text-sm',
              )}
            >
              {debate.excerpt}
            </p>
            <p className={cn('font-black text-white/75', hubCompact ? 'text-[10px]' : 'text-[11px] sm:text-xs')}>
              👥 {debate.participantsCount.toLocaleString('fr-FR')} · 💬{' '}
              {debate.messagesCount.toLocaleString('fr-FR')} messages
            </p>
            {!hubCompact && participants.length > 0 ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-sky-100/85">Actifs</span>
                <div className="flex -space-x-2">
                  {participants.map((p, i) => (
                    <Avatar
                      key={`${debate.id}-ap-${p.avatarSeed}-${i}`}
                      seed={p.avatarSeed}
                      accent={p.accent}
                      className="size-9 ring-2 ring-white/30 sm:size-10"
                      alt=""
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              'flex shrink-0 flex-col items-stretch sm:items-end',
              hubCompact ? 'gap-1.5' : 'gap-2',
            )}
          >
            <Link
              to={`/group/${debate.groupId}?debate=${encodeURIComponent(debate.id)}`}
              className={cn(
                'tf-interactive-press inline-flex w-full items-center justify-center gap-2 rounded-2xl text-center font-black text-white shadow-lg sm:w-auto',
                hubCompact
                  ? 'rounded-xl px-3 py-2 text-[10px] sm:min-w-[140px] sm:text-[11px]'
                  : 'px-5 py-3 text-xs sm:min-w-[200px] sm:px-6 sm:text-sm',
                'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800',
              )}
            >
              ✍️ Écrire dans le salon
            </Link>
            <Link
              to={`/debate/${debate.id}`}
              className={cn(
                'tf-interactive-press inline-flex w-full items-center justify-center rounded-2xl border border-white/40 bg-white/10 text-center font-black text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto',
                hubCompact ? 'rounded-xl px-3 py-1.5 text-[10px]' : 'px-5 py-2.5 text-[11px] sm:text-xs',
              )}
            >
              Lire le fil du débat
            </Link>
          </div>
        </div>
      </div>

      {previews.length > 0 ? (
        <div className="border-t border-tf-grey-pastel/45 bg-gradient-to-b from-tf-electric-soft/35 to-white px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-tf-grey">Aperçu du fil</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {previews.map((m, i) => (
              <DebateMessagePreview key={`${debate.id}-p-${i}`} message={m} compact />
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
