import { Link } from 'react-router-dom'
import type { SupporterGroup } from '../../types/group'
import { LeaveTribuneButton } from '../group/LeaveTribuneButton'
import { cn } from '../../utils/cn'

type TribuneLimitLeavePickerProps = {
  tribunes: SupporterGroup[]
  maxJoined: number
  onLeave: (groupId: string) => void
  leavingId?: string | null
  className?: string
}

export function TribuneLimitLeavePicker({
  tribunes,
  maxJoined,
  onLeave,
  leavingId,
  className,
}: TribuneLimitLeavePickerProps) {
  if (tribunes.length === 0) return null

  return (
    <div className={cn('mt-5 text-left', className)}>
      <p className="text-center text-sm font-black text-slate-800">
        Libère une place ({tribunes.length}/{maxJoined})
      </p>
      <p className="mt-1 text-center text-xs font-semibold leading-relaxed text-slate-500">
        Choisis une tribune à quitter pour en rejoindre une autre.
      </p>
      <ul className="mt-4 max-h-[min(14rem,38vh)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
        {tribunes.map((g) => {
          const owned = g.createdBy === 'me'
          return (
            <li
              key={g.id}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-2xl text-lg font-black text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${g.theme.primary}, ${g.theme.secondary})`,
                  }}
                  aria-hidden
                >
                  {g.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{g.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {owned ? 'Tribune créée par toi' : 'Tribune rejointe'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                {owned ? (
                  <Link
                    to={`/group/${g.id}`}
                    className={cn(
                      'inline-flex min-h-11 w-full items-center justify-center rounded-2xl border-2 border-slate-200',
                      'bg-white px-4 text-xs font-black text-slate-800 transition hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    Ouvrir pour supprimer
                  </Link>
                ) : (
                  <LeaveTribuneButton
                    groupName={g.name}
                    onLeave={() => onLeave(g.id)}
                    layout="card"
                    busy={leavingId === g.id}
                    disabled={leavingId != null && leavingId !== g.id}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
