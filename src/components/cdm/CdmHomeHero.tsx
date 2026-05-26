import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const KICKOFF_ISO = '2026-06-11T20:00:00-04:00'

function formatCountdown(deltaMs: number) {
  if (deltaMs <= 0) return null
  const days = Math.floor(deltaMs / 86_400_000)
  const hours = Math.floor((deltaMs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((deltaMs % 3_600_000) / 60_000)
  return { days, hours, minutes }
}

/**
 * Hero d'ouverture de la home en mode CDM 2026.
 *
 * Couleurs gérées par les CSS vars `--tf-cdm-*` (voir design-tokens.css).
 * Si le coup d'envoi est passé, le bandeau passe en mode « En cours ».
 */
export function CdmHomeHero() {
  const kickoffMs = useMemo(() => Date.parse(KICKOFF_ISO), [])
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const countdown = formatCountdown(kickoffMs - now)
  const live = countdown == null

  return (
    <section
      aria-label="Coupe du Monde 2026"
      className={cn(
        'relative overflow-hidden rounded-3xl border shadow-tf-elev-3 text-white',
      )}
      style={{
        background: 'var(--tf-cdm-hero-bg)',
        borderColor: 'var(--tf-cdm-hero-border, rgba(255,255,255,0.18))',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'><polygon points='90,8 132,32 132,80 90,104 48,80 48,32'/><polygon points='90,76 132,100 132,148 90,172 48,148 48,100'/></g></svg>\")",
          backgroundSize: '180px 180px',
          opacity: 0.5,
        }}
        aria-hidden
      />
      <div className="relative px-5 py-7 sm:px-9 sm:py-10">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] backdrop-blur-sm"
            style={{ color: 'var(--tf-cdm-gold, #f4c542)' }}
          >
            <span aria-hidden>★</span> Édition Talk Foot
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] backdrop-blur-sm',
              live ? 'bg-rose-500/95 text-white' : 'bg-white/15',
            )}
          >
            {live ? (
              <>
                <span aria-hidden className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/80" />
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                En cours
              </>
            ) : (
              <>USA · Canada · Mexique</>
            )}
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">
          Coupe du Monde
          <br />
          <span style={{ color: 'var(--tf-cdm-gold, #f4c542)' }}>FIFA 2026</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-white/85 sm:text-base">
          48 sélections, un seul stade : Talk Foot. Choisis ton équipe, débats avec les autres tribunes
          du monde et empoche les jetons de tes pronos jusqu'à la finale.
        </p>

        {countdown ? (
          <div className="mt-6 inline-flex flex-wrap items-stretch gap-2 rounded-2xl border border-white/15 bg-black/25 p-2 backdrop-blur-md">
            {(
              [
                { value: countdown.days, label: 'jours' },
                { value: countdown.hours, label: 'heures' },
                { value: countdown.minutes, label: 'min.' },
              ] as const
            ).map((b) => (
              <div
                key={b.label}
                className="min-w-[4.5rem] rounded-xl bg-white/8 px-3 py-2 text-center"
              >
                <div className="font-display text-2xl font-black tabular-nums leading-none">
                  {String(b.value).padStart(2, '0')}
                </div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                  {b.label}
                </div>
              </div>
            ))}
            <div className="grid place-items-center px-3 text-[11px] font-bold uppercase tracking-wider text-white/70">
              avant le coup
              <br /> d'envoi
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to="/nations"
            className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl border-2 border-white/30 bg-white/12 px-5 py-3 text-sm font-black uppercase tracking-wide backdrop-blur-sm transition hover:border-white/55 hover:bg-white/22"
          >
            Choisis ta sélection
          </Link>
          <Link
            to="/match"
            className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wide text-tf-dark shadow-tf-elev-1 transition hover:shadow-tf-elev-2"
            style={{ background: 'var(--tf-cdm-gold, #f4c542)' }}
          >
            Calendrier CDM
          </Link>
          <Link
            to="/boutique"
            className="inline-flex min-h-tf-touch items-center justify-center rounded-2xl border-2 border-white/30 bg-transparent px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white/12"
          >
            Boutique maillots
          </Link>
        </div>
      </div>
    </section>
  )
}
