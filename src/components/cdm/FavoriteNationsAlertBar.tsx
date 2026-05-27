import { Link } from 'react-router-dom'
import { useFavoriteNationsAlerts } from '../../hooks/useFavoriteNationsAlerts'
import { useFanPreferences } from '../../contexts/FanPreferencesContext'
import { getNationByIso } from '../../data/nations'
import { formatHubDayLabel, formatKickoff } from '../../utils/time'
import { cn } from '../../utils/cn'

/**
 * Bandeau in-app pour les nations favorites : affiche le prochain match dans
 * les 24h, propose d'activer les notifications navigateur et le lien direct
 * vers la tribune match. Invisible si aucun favori ou aucun match imminent.
 */
export function FavoriteNationsAlertBar({ className }: { className?: string }) {
  const { favoriteNationIsos } = useFanPreferences()
  const { imminent, permission, supported, requestPermission, now } = useFavoriteNationsAlerts()

  if (favoriteNationIsos.length === 0) return null
  const next = imminent[0]
  if (!next) return null

  const ko = Date.parse(next.match.kickoffAt)
  const diff = ko - now
  const isLive = diff < 0 && next.match.status !== 'finished'
  const minutesUntil = Math.max(0, Math.round(diff / 60_000))
  const hoursUntil = Math.floor(minutesUntil / 60)
  const remainsLabel = isLive
    ? 'En direct'
    : minutesUntil <= 60
      ? `Coup d'envoi dans ${minutesUntil} min`
      : `Coup d'envoi dans ${hoursUntil} h ${minutesUntil % 60}`

  const nation = getNationByIso(next.primaryIso)

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        'relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border border-tf-cdm-gold/60 px-3 py-2.5 text-white shadow-tf-elev-2 sm:gap-4 sm:px-4 sm:py-3',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #06214a 0%, #0a2f5e 60%, #073368 100%)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(244,197,66,0.40), transparent)' }}
      />
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black"
        style={{ background: '#f4c542', color: '#06214a' }}
      >
        <span aria-hidden>{nation?.flag ?? '★'}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/95">
          Ma sélection · {nation?.nameFr ?? 'Mondial 2026'}
        </p>
        <p className="mt-0.5 truncate font-display text-sm font-black tracking-tight sm:text-base">
          {next.match.home.name} <span className="text-white/70">vs</span> {next.match.away.name}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-white/80">
          {remainsLabel} ·{' '}
          <span className="text-amber-200/95">
            {formatHubDayLabel(next.match.kickoffAt)} {formatKickoff(next.match.kickoffAt)}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {supported && permission === 'default' ? (
          <button
            type="button"
            onClick={requestPermission}
            className="hidden rounded-full border border-amber-200/40 bg-white/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-100 transition hover:border-amber-200/70 hover:bg-white/20 sm:inline-flex"
            title="Recevoir une notification navigateur 60 min et 5 min avant le coup d'envoi"
          >
            Activer alertes
          </button>
        ) : null}
        <Link
          to={`/channel/${encodeURIComponent(next.match.id)}`}
          className="inline-flex min-h-tf-touch items-center justify-center rounded-full bg-tf-cdm-gold px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-tf-cdm-deep shadow-tf-elev-1 transition hover:bg-tf-cdm-gold/90"
        >
          {isLive ? 'Rejoindre le live →' : 'Voir la tribune →'}
        </Link>
      </div>
    </aside>
  )
}
