import { useSeasonMode, type SeasonModeContextValue } from '../../contexts/SeasonModeContext'
import type { SeasonModeOverride } from '../../utils/seasonMode'
import { cn } from '../../utils/cn'

const OPTIONS: { id: SeasonModeOverride; label: string; hint: string }[] = [
  {
    id: 'auto',
    label: 'Auto',
    hint: 'Historique : activé entre le 1er mai et le 31 juillet 2026. Hors fenêtre = mode standard (championnats + coupes européennes).',
  },
  {
    id: 'on',
    label: 'Forcer ON',
    hint: 'Réactive le chrome CDM pour tests (le site reste centré clubs hors de ce forçage).',
  },
  {
    id: 'off',
    label: 'Forcer OFF',
    hint: 'Mode standard : Big 5 + Ligue des champions, Europa et Conference.',
  },
]

function describeApplied(value: SeasonModeContextValue): string {
  if (value.seasonMode === 'cdm2026') {
    return value.override === 'on'
      ? 'Mode CDM 2026 forcé ON.'
      : value.override === 'auto'
        ? 'Mode CDM 2026 actif (fenêtre auto en cours).'
        : 'Mode CDM 2026 actif.'
  }
  return value.override === 'off'
    ? 'Mode standard forcé OFF (CDM désactivée).'
    : value.autoMode === 'cdm2026'
      ? 'Hors fenêtre auto — mais on est dans la période CDM.'
      : 'Mode standard.'
}

/**
 * Toggle admin du mode saison (CDM 2026).
 *
 * Affichage : 3 boutons radio + texte d'état. Persistance via `localStorage`
 * dans `SeasonModeProvider` (clé `talkfoot.seasonMode.override.v1`).
 */
export function SeasonAdminToggle({ className }: { className?: string }) {
  const season = useSeasonMode()

  return (
    <section
      aria-label="Mode saison CDM 2026"
      className={cn(
        'rounded-2xl border px-4 py-4 shadow-sm',
        season.isCdm2026
          ? 'border-amber-400/70 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 text-amber-950'
          : 'border-tf-c30-border bg-tf-c30-surface',
        className,
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-tf-app-muted">
            Saison · CDM 2026
          </p>
          <h3 className="mt-0.5 font-display text-lg font-black text-tf-app-fg">
            Bascule mode Coupe du Monde
          </h3>
          <p className="mt-1 text-xs font-medium text-tf-app-muted">{describeApplied(season)}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider',
            season.isCdm2026
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-tf-c30-border text-tf-app-fg',
          )}
        >
          {season.isCdm2026 ? 'ON' : 'OFF'}
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const active = season.override === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => season.setOverride(opt.id)}
              className={cn(
                'rounded-xl border-2 px-3 py-2.5 text-xs font-black uppercase tracking-wide transition',
                active
                  ? 'border-tf-cdm-gold bg-tf-cdm-gold text-tf-cdm-deep shadow-tf-elev-1'
                  : 'border-tf-c30-border bg-white/[0.04] text-tf-app-fg hover:border-tf-cdm-gold/55 hover:text-tf-cdm-gold',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] font-medium leading-snug text-tf-app-muted">
        {OPTIONS.find((o) => o.id === season.override)?.hint}
      </p>
    </section>
  )
}
