import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

const KICKOFF_ISO = '2026-06-11T20:00:00-04:00'

function formatDays(deltaMs: number) {
  if (deltaMs <= 0) return null
  return Math.max(0, Math.floor(deltaMs / 86_400_000))
}

/**
 * Bandeau rappel CDM 2026 affiché en haut de la home, juste sous la barre de
 * recherche, avant les matchs live. Compact, fortement contrasté (fond
 * dégradé bleu-doré, texte blanc), et CTAs directs vers l'arbre, les poules
 * et le hub CDM.
 */
export function CdmHomeReminder({ className }: { className?: string }) {
  const kickoffMs = useMemo(() => Date.parse(KICKOFF_ISO), [])
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const daysLeft = formatDays(kickoffMs - now)
  const live = daysLeft == null

  return (
    <Link
      to="/cdm"
      aria-label="Coupe du Monde 2026 — accéder au hub"
      className={cn(
        'group relative isolate flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-white shadow-tf-elev-2 transition sm:gap-4 sm:px-4 sm:py-3',
        'hover:shadow-tf-elev-3',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, #06214a 0%, #0a2f5e 50%, #053258 100%)',
        borderColor: 'rgba(244, 197, 66, 0.42)',
      }}
    >
      {/* Hex pattern subtle */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='rgba(244,197,66,0.18)' stroke-width='1'><polygon points='60,6 102,28 102,72 60,94 18,72 18,28'/></g></svg>\")",
          backgroundSize: '120px 120px',
        }}
      />
      {/* Glow doré */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 -z-10 h-32 w-32 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(244,197,66,0.35), transparent)' }}
      />

      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-inner sm:h-12 sm:w-12 sm:text-lg"
        style={{ background: '#f4c542', color: '#06214a' }}
      >
        <span aria-hidden>★</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/95">
          {live ? 'En cours' : 'Bientôt'} · USA · Canada · Mexique
        </span>
        <span className="mt-0.5 block truncate font-display text-base font-black leading-tight tracking-tight sm:text-lg">
          Coupe du Monde FIFA 2026{' '}
          {daysLeft != null ? (
            <span
              className="ml-1 rounded-full px-2 py-0.5 align-middle text-[11px] font-black tabular-nums text-tf-cdm-deep"
              style={{ background: '#f4c542' }}
            >
              J–{daysLeft}
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 align-middle text-[10px] font-black uppercase tracking-wider text-white">
              LIVE
            </span>
          )}
        </span>
        <span className="mt-0.5 hidden text-xs font-medium text-white/85 sm:block">
          Arbre, poules, stats et fiches nations — tout est ici.
        </span>
      </span>

      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <Pill to="/cdm/bracket" label="Arbre" />
        <Pill to="/cdm/groupes" label="Poules" />
        <Pill to="/cdm/stats" label="Stats" />
      </span>

      <span
        aria-hidden
        className="ml-1 shrink-0 text-base font-black text-amber-200 transition-transform group-hover:translate-x-0.5 sm:text-lg"
      >
        →
      </span>
    </Link>
  )
}

function Pill({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      onClick={(e) => e.stopPropagation()}
      className="rounded-full border border-amber-200/35 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100 backdrop-blur-sm transition hover:border-amber-200/70 hover:bg-white/20"
    >
      {label}
    </Link>
  )
}
