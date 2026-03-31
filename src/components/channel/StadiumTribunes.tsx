import { Link } from 'react-router-dom'
import type { Match } from '../../types/match'
import type { TribuneId } from '../../types/tribune'
import {
  TRIBUNES,
  TRIBUNE_PROMISE,
  TRIBUNE_TAGLINE,
  tribuneById,
  type TribuneMeta,
} from '../../data/tribunes'
import type { MatchSalonPick } from '../../utils/matchSalons'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { useTribuneLiveStats } from '../../hooks/useTribuneLiveStats'
import { StadiumSupporterPicker } from './StadiumSupporterPicker'

function tribuneZoneStyle(id: TribuneId, active: boolean): string {
  if (!active) return ''
  if (id === 'virage') {
    return 'border-rose-300/80 bg-rose-500/40 shadow-[0_0_36px_rgba(251,113,133,0.55)]'
  }
  if (id === 'analyse') {
    return 'border-sky-300/75 bg-sky-600/35 shadow-[0_0_32px_rgba(56,189,248,0.5)]'
  }
  return 'border-teal-300/75 bg-teal-500/35 shadow-[0_0_32px_rgba(45,212,191,0.5)]'
}

/** Schéma stade : portrait (modal / encarts) ou paysage (page stade — tout visible sans scroll). */
function MiniStadium({
  home,
  away,
  selected,
  orientation = 'portrait',
}: {
  home: Match['home']
  away: Match['away']
  selected: TribuneId
  orientation?: 'portrait' | 'landscape'
}) {
  const zone = (id: TribuneId, cls: string) => {
    const active = selected === id
    return (
      <div
        className={cn(
          'absolute rounded-lg border border-white/25 bg-white/10 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform sm:rounded-xl',
          active
            ? cn('z-[25] animate-tf-stadium-pulse', tribuneZoneStyle(id, true))
            : 'z-[12] scale-[0.98] opacity-[0.38]',
          cls,
        )}
      />
    )
  }

  if (orientation === 'landscape') {
    return (
      <div
        className="relative w-full max-h-[min(42vh,300px)] min-h-[160px] overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 shadow-inner"
        style={{ aspectRatio: '21 / 9' }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            background: `radial-gradient(ellipse 55% 80% at 50% 50%, ${home.colors.primary}55, transparent 65%), radial-gradient(ellipse 50% 75% at 50% 50%, ${away.colors.secondary}44, transparent 62%)`,
          }}
        />
        {/* Virage : zone intense en face caméra */}
        {zone('virage', 'top-[4%] left-[18%] right-[18%] z-[14] h-[18%]')}
        {/* Pelouse — ovale horizontal */}
        <div
          className="absolute left-1/2 top-[26%] z-[10] h-[56%] w-[46%] max-w-[min(72%,420px)] -translate-x-1/2 rounded-[50%] border-2 border-white/30 bg-emerald-700/35 shadow-[inset_0_0_28px_rgba(0,0,0,0.45)]"
          style={{
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 20px ${home.colors.primary}33`,
          }}
        />
        {/* Analyse · Chill : tribunes latérales */}
        {zone('analyse', 'left-[3%] top-[22%] bottom-[6%] z-[12] w-[12%]')}
        {zone('chill', 'right-[3%] top-[22%] bottom-[6%] z-[12] w-[12%]')}
        <p className="pointer-events-none absolute bottom-[5%] left-0 right-0 z-[11] text-center text-[7px] font-bold uppercase tracking-[0.2em] text-white/65 sm:text-[8px]">
          Stade digital
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,300px)] overflow-hidden rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 shadow-inner sm:max-w-[320px]"
      style={{ aspectRatio: '9 / 15' }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 48%, ${home.colors.primary}66, transparent 72%), radial-gradient(ellipse 65% 45% at 50% 52%, ${away.colors.secondary}55, transparent 68%)`,
        }}
      />
      <div className="absolute left-[3%] top-[19%] bottom-[19%] z-[8] w-[10%] rounded-lg bg-white/[0.07] ring-1 ring-white/10" />
      <div className="absolute right-[3%] top-[19%] bottom-[19%] z-[8] w-[10%] rounded-lg bg-white/[0.07] ring-1 ring-white/10" />
      <div
        className="absolute left-1/2 top-[21%] z-[10] h-[48%] w-[64%] -translate-x-1/2 rounded-[44%] border-2 border-white/30 bg-emerald-700/35 shadow-[inset_0_0_36px_rgba(0,0,0,0.45)]"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 28px ${home.colors.primary}33`,
        }}
      />
      {zone('analyse', 'bottom-[5%] left-[9%] h-[12%] w-[39%] rounded-lg')}
      {zone('chill', 'bottom-[5%] right-[9%] h-[12%] w-[39%] rounded-lg')}
      {zone('virage', 'top-[4%] left-[9%] right-[9%] h-[13%]')}
      <p className="pointer-events-none absolute bottom-[17%] left-0 right-0 z-[11] text-center text-[8px] font-bold uppercase tracking-[0.22em] text-white/65">
        Stade digital
      </p>
    </div>
  )
}

function TribuneCard({
  t,
  selected,
  participants,
  activity,
  onSelect,
  compact,
}: {
  t: TribuneMeta
  selected: boolean
  participants: number
  activity: number
  onSelect: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col rounded-xl border-2 text-left transition sm:rounded-2xl',
        compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-electric/40',
        selected
          ? cn('border-tf-dark bg-white shadow-md ring-2', t.ring)
          : 'border-tf-grey-pastel/60 bg-white/80 hover:border-tf-grey-pastel hover:bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={cn('leading-none', compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl')} aria-hidden>
            {t.emoji}
          </span>
          <h3
            className={cn(
              'mt-0.5 font-display font-black tracking-tight',
              compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
              t.text,
            )}
          >
            {compact ? t.label : `Tribune ${t.label}`}
          </h3>
        </div>
        {selected ? (
          <span className="shrink-0 rounded-full bg-tf-dark px-1.5 py-0.5 text-[9px] font-black text-white sm:text-[10px]">
            Ici
          </span>
        ) : null}
      </div>
      <p className={cn('font-semibold text-tf-grey', compact ? 'mt-1 line-clamp-2 text-[10px]' : 'mt-1.5 text-[11px] sm:text-xs')}>
        {t.mood}
      </p>
      {!compact ? (
        <ul className="mt-2 space-y-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px]">
          {t.features.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
      ) : null}
      <div
        className={cn(
          'mt-2 flex flex-wrap items-center gap-1.5 border-t border-tf-grey-pastel/40 pt-2',
          compact && 'mt-1.5 pt-1.5',
        )}
      >
        <span className="rounded-md bg-tf-grey-pastel/25 px-1.5 py-0.5 text-[9px] font-black text-tf-dark sm:text-[10px]">
          {participants.toLocaleString('fr-FR')} présents
        </span>
        <span className="rounded-md bg-tf-electric-soft/80 px-1.5 py-0.5 text-[9px] font-black text-tf-dark sm:text-[10px]">
          {activity}%
        </span>
        <span className="text-[9px] font-bold text-tf-grey sm:text-[10px]">
          {t.dominant === 'vocal' ? '🎤 Vocal' : t.dominant === 'écrit' ? '✍️ Écrit' : '💬 Mixte'}
        </span>
      </div>
    </button>
  )
}

export function StadiumTribunes({
  match,
  selected,
  onSelect,
  layout = 'page',
  salonPicks,
  selectedGroupId,
  onSelectGroup,
}: {
  match: Match
  /** Zones Virage / Analyse / Chill (hors page stade « tribunes groupes »). */
  selected?: TribuneId
  onSelect?: (id: TribuneId) => void
  layout?: 'page' | 'modal' | 'stadiumPage'
  salonPicks?: MatchSalonPick[]
  selectedGroupId?: string | null
  onSelectGroup?: (groupId: string | null) => void
}) {
  const stats = useTribuneLiveStats()
  const tribuneSelected = selected ?? 'virage'
  const meta = tribuneById[tribuneSelected]
  const isStadiumPage = layout === 'stadiumPage'

  if (isStadiumPage && onSelectGroup) {
    return (
      <StadiumSupporterPicker
        match={match}
        salonPicks={salonPicks ?? []}
        selectedGroupId={selectedGroupId ?? null}
        onSelectGroup={onSelectGroup}
      />
    )
  }

  return (
    <section
      className={cn(
        layout === 'page'
          ? 'border-b border-tf-grey-pastel/50 bg-gradient-to-b from-tf-ice/40 via-white to-tf-white px-3 py-4 sm:px-5 sm:py-5'
          : layout === 'stadiumPage'
            ? 'border-0 bg-transparent px-3 py-3 sm:px-4 sm:py-3'
            : 'border-0 bg-transparent px-1 py-2 sm:px-2 sm:py-3',
      )}
      aria-labelledby="stadium-tribunes-heading"
    >
      <div
        className={cn(
          'mx-auto w-full min-w-0',
          isStadiumPage ? 'max-w-tf-article-body' : 'max-w-tf-article-inner',
        )}
      >
        <p
          className={cn(
            'text-center font-black uppercase tracking-[0.2em] text-tf-grey',
            isStadiumPage ? 'text-[9px] sm:text-[10px]' : 'text-[10px] tracking-[0.25em]',
          )}
        >
          {TRIBUNE_TAGLINE}
        </p>
        <h2
          id="stadium-tribunes-heading"
          className={cn(
            'mt-0.5 text-center font-display font-black tracking-tight text-tf-dark',
            isStadiumPage ? 'text-base sm:text-lg' : layout === 'page' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg',
          )}
        >
          Choisis ta zone (stade digital)
        </h2>
        <p
          className={cn(
            'mx-auto max-w-2xl text-center font-semibold text-tf-grey',
            isStadiumPage ? 'mt-1 text-[11px] leading-snug sm:text-xs' : 'mt-2 text-xs sm:text-sm',
          )}
        >
          {TRIBUNE_PROMISE}
        </p>

        <div
          className={cn(
            isStadiumPage
              ? 'mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,340px)] lg:items-start lg:gap-5'
              : 'mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8',
          )}
        >
          <div
            className={cn(
              isStadiumPage ? 'min-w-0' : 'flex justify-center lg:shrink-0 lg:pt-1',
            )}
          >
            <MiniStadium
              home={match.home}
              away={match.away}
              selected={tribuneSelected}
              orientation={isStadiumPage ? 'landscape' : 'portrait'}
            />
          </div>
          <div
            className={cn(
              'grid min-w-0 flex-1',
              isStadiumPage
                ? 'grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2'
                : 'gap-3 sm:grid-cols-3',
            )}
          >
            {TRIBUNES.map((t) => (
              <TribuneCard
                key={t.id}
                t={t}
                selected={tribuneSelected === t.id}
                participants={stats[t.id].participants}
                activity={stats[t.id].activity}
                onSelect={() => onSelect?.(t.id)}
                compact={isStadiumPage}
              />
            ))}
          </div>
        </div>

        <p className={cn('text-center font-bold text-tf-grey', isStadiumPage ? 'mt-2 text-[10px] sm:text-[11px]' : 'mt-4 text-[11px]')}>
          Tribune active : <span className={cn('font-black', meta.text)}>{meta.label}</span>
          {isStadiumPage ? ' — change avec les cartes ci-dessus.' : ' — change à tout moment.'}
        </p>

        <details className={cn('rounded-xl border border-tf-grey-pastel/50 bg-tf-grey-pastel/15 px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3', isStadiumPage ? 'mt-2' : 'mt-4')}>
          <summary className="cursor-pointer list-none text-center text-xs font-black text-tf-dark [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-tf-grey-pastel decoration-2 underline-offset-2">
              Tribunes perso, abonnements & modération (aperçu produit)
            </span>
          </summary>
          <ul className="mt-3 space-y-2 text-[11px] font-semibold text-tf-grey">
            <li>
              · <strong className="text-tf-dark">Tribunes privées</strong> créées par des utilisateurs ou groupes —
              accès par invitation ou abonnement (à venir).
            </li>
            <li>
              · <strong className="text-tf-dark">Salons vocaux</strong> : demande de parole, modérateurs valident qui
              prend la parole.
            </li>
            <li>
              · <strong className="text-tf-dark">Signalement</strong> des abus et <strong className="text-tf-dark">
                réputation
              </strong>{' '}
              pour limiter l’accès vocal aux profils toxiques (mock — règles à brancher côté backend).
            </li>
          </ul>
        </details>
      </div>
    </section>
  )
}

/** Encart sur le live : salon tribune groupe ou zone classique. */
export function StadiumModeEncart({
  matchId,
  activeTribune,
  stadiumGroupLabel,
  stadiumGroupEmoji,
  onClearStadiumGroup,
}: {
  matchId: string
  activeTribune: TribuneId
  stadiumGroupLabel?: string | null
  stadiumGroupEmoji?: string | null
  onClearStadiumGroup?: () => void
}) {
  const m = tribuneById[activeTribune]
  const groupMode = Boolean(stadiumGroupLabel)

  return (
    <div
      className={cn(
        'mt-2 flex flex-col gap-2 rounded-xl border px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5',
        groupMode
          ? 'border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/40'
          : 'border-tf-grey-pastel/55 bg-gradient-to-br from-tf-ice/35 via-white to-tf-grey-pastel/15',
      )}
      role="region"
      aria-label="Mode stade digital"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-grey">
          {groupMode ? 'Salon tribune' : 'Stade digital'}
        </p>
        <p className="mt-0.5 text-xs font-black leading-snug text-tf-dark sm:mt-1 sm:text-sm">
          {groupMode ? (
            <>
              <span aria-hidden>{stadiumGroupEmoji ?? '🏟️'}</span> {stadiumGroupLabel} — chat réservé aux présents
              dans ce salon.
            </>
          ) : (
            <>
              <span aria-hidden>{m.emoji}</span> Zone {m.label} dans le fil — ouvre le plan pour choisir une tribune
              groupe.
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-center">
        {groupMode && onClearStadiumGroup ? (
          <button
            type="button"
            onClick={onClearStadiumGroup}
            className="tf-btn-fluid inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-tf-dark shadow-sm transition hover:bg-slate-50"
          >
            Tout le stade
          </button>
        ) : null}
        <Link
          to={`/channel/${matchId}/stade`}
          className={cn(
            'tf-btn-fluid inline-flex shrink-0 items-center justify-center rounded-2xl border border-tf-grey-pastel/60 bg-white/95 px-4 py-2 text-sm font-semibold text-[#011e33] font-display outline-none transition',
            'hover:border-tf-electric/25 hover:bg-tf-ice/80 focus-visible:ring-2 focus-visible:ring-tf-electric/40',
          )}
        >
          Plan stade
        </Link>
      </div>
    </div>
  )
}

/** Virage / Analyse / Chill + Général — sans texte d’aide au-dessus (gain de place). */
export function TribuneQuickSwitch({
  selected,
  onSelect,
  feedScope,
  onSelectGeneral,
}: {
  selected: TribuneId
  onSelect: (id: TribuneId) => void
  feedScope: 'general' | 'tribune'
  onSelectGeneral: () => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" role="group" aria-label="Zone du chat live">
      <Button
        type="button"
        variant={feedScope === 'general' ? 'primary' : 'soft'}
        className={cn(
          'h-8 rounded-xl px-2.5 py-0 text-[10px] font-black sm:h-9 sm:px-3 sm:text-[11px]',
          feedScope === 'general' && 'ring-2 ring-offset-1 ring-sky-500/45',
        )}
        onClick={onSelectGeneral}
        title="Toutes les tribunes — tous les messages"
      >
        <span aria-hidden>🏟️</span> Général
      </Button>
      {TRIBUNES.map((t) => (
        <Button
          key={t.id}
          type="button"
          variant={feedScope === 'tribune' && selected === t.id ? 'primary' : 'soft'}
          className={cn(
            'h-8 rounded-xl px-2.5 py-0 text-[10px] font-black sm:h-9 sm:px-3 sm:text-[11px]',
            feedScope === 'tribune' &&
              selected === t.id &&
              'ring-2 ring-offset-1',
            feedScope === 'tribune' && selected === t.id && t.id === 'virage' && 'ring-rose-400/50',
            feedScope === 'tribune' && selected === t.id && t.id === 'analyse' && 'ring-slate-400/50',
            feedScope === 'tribune' && selected === t.id && t.id === 'chill' && 'ring-teal-400/50',
          )}
          onClick={() => onSelect(t.id)}
          title={tribuneById[t.id].mood}
        >
          <span aria-hidden>{t.emoji}</span> {t.label}
        </Button>
      ))}
    </div>
  )
}
