import { Link } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import type { ClubPageMock } from '../../data/clubPageMock'

export function ClubDataBar({
  data,
  onOpenInfo,
  matchMode,
  onFire,
  salonChannelCount,
  tribunesHubTo,
  salonClubName,
}: {
  data: ClubPageMock
  onOpenInfo: () => void
  matchMode: boolean
  onFire: boolean
  /** Nombre réel de tribunes (canaux) côté groupes du club + fallback ligue. */
  salonChannelCount: number
  /** Lien vers le hub des tribunes (découverte) pour ce club. */
  tribunesHubTo: string
  /** Pour l’accessibilité du lien. */
  salonClubName: string
}) {
  return (
    <section
      className={cn(
        'border-b border-white/10',
        onFire && 'bg-gradient-to-r from-amber-500/[0.07] via-transparent to-rose-500/[0.06]',
        matchMode && 'ring-1 ring-rose-500/15',
      )}
    >
      <div className="mx-auto max-w-tf-wide px-3 py-3 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
            <div
              className={cn(
                'rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5',
                onFire && 'shadow-[0_0_20px_rgba(251,191,36,0.12)]',
              )}
            >
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-200/90">Popularité</p>
              <p className="mt-0.5 text-sm font-black text-white">{data.popularityLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/80">Activité live</p>
              <p className="mt-0.5 text-sm font-black text-sky-100">{data.liveMsgPerMin}</p>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
            <Link
              to={tribunesHubTo}
              className={cn(
                'block rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition',
                'hover:border-rose-400/35 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50',
                TF_FOCUS_VISIBLE,
                matchMode && 'ring-1 ring-rose-500/30',
              )}
              aria-label={`Ouvrir les tribunes supporters de ${salonClubName} (${salonChannelCount} tribune${salonChannelCount === 1 ? '' : 's'})`}
            >
              <p className="text-[9px] font-black uppercase tracking-wider text-rose-200/90">Tribunes (live)</p>
              <p className="mt-0.5 text-sm font-black text-white">
                {salonChannelCount} tribune{salonChannelCount === 1 ? '' : 's'}
                {salonChannelCount > 0 ? (
                  <span className="font-bold text-rose-100/90"> — voir</span>
                ) : null}
              </p>
            </Link>
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-2.5">
              <p className="text-[9px] font-black uppercase tracking-wider text-violet-200/90">Pic d’activité</p>
              <p className="mt-0.5 text-sm font-black text-violet-100">{data.activitySpike}</p>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-2 sm:grid-cols-2 sm:gap-3 lg:max-w-md">
            <div className="col-span-2 rounded-2xl border border-amber-400/15 bg-amber-500/[0.08] px-3 py-2.5 sm:col-span-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-200/80">Rang global</p>
              <p className="mt-0.5 text-sm font-black text-amber-50">{data.globalRank}</p>
            </div>
            <div className="col-span-2 flex min-h-[4.5rem] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:col-span-1 sm:min-h-0">
              <Avatar seed={data.topFan.seed} accent="amber" className="!size-11 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-tf-app-muted">Top fan</p>
                <p className="truncate text-sm font-black text-white">{data.topFan.name}</p>
                <p className="truncate text-xs font-semibold text-sky-200/80">{data.topFan.handle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={onOpenInfo}
            className={cn(
              'min-h-tf-touch w-full min-w-0 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-tf-app-fg transition hover:bg-white/[0.15] sm:w-auto',
              TF_FOCUS_VISIBLE,
            )}
          >
            + Infos club
          </button>
        </div>
      </div>
    </section>
  )
}
