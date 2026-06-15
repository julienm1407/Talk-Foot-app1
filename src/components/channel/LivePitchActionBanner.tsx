import type { Highlight } from '../../data/highlights'
import { cn } from '../../utils/cn'
import { resolveLivePitchBanner, type LivePitchBannerTone } from '../../utils/livePitchBanner'

const TONE_LABEL: Record<LivePitchBannerTone, string> = {
  goal: 'text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]',
  danger: 'text-orange-100 drop-shadow-[0_0_16px_rgba(251,146,60,0.5)]',
  corner: 'text-sky-100 drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]',
  card: 'text-yellow-100 drop-shadow-[0_0_14px_rgba(250,204,21,0.4)]',
  var: 'text-violet-100 drop-shadow-[0_0_14px_rgba(167,139,250,0.45)]',
  chance: 'text-cyan-100 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]',
  save: 'text-emerald-100 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]',
  neutral: 'text-white/85',
}

export function LivePitchActionBanner({
  highlight,
  highlightText,
  detectSide,
  dangerousLeader,
  dangerousDelta,
  homeLabel,
  awayLabel,
  homeColor,
  awayColor,
  pitchPressureTint,
  liveClockPaused,
  liveInSecondHalf,
  className,
}: {
  highlight: Highlight | null
  highlightText: string
  detectSide: (raw: string) => 'home' | 'away' | undefined
  dangerousLeader: 'home' | 'away' | 'equal'
  dangerousDelta: number
  homeLabel: string
  awayLabel: string
  homeColor: string
  awayColor: string
  pitchPressureTint: { homeTint: number; awayTint: number }
  liveClockPaused?: boolean
  liveInSecondHalf?: boolean
  className?: string
}) {
  const banner = resolveLivePitchBanner({
    highlight,
    highlightText,
    detectSide,
    dangerousLeader,
    dangerousDelta,
    homeLabel,
    awayLabel,
    liveClockPaused,
    liveInSecondHalf,
  })

  const showHomeArrow = banner.side === 'home'
  const showAwayArrow = banner.side === 'away'
  const labelTone = TONE_LABEL[banner.tone]

  return (
    <div
      className={cn(
        'relative flex min-h-[88px] flex-1 items-stretch overflow-hidden rounded-md bg-[#124238]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={[banner.label, banner.detail].filter(Boolean).join(' — ')}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, ${homeColor} ${Math.max(pitchPressureTint.homeTint, showHomeArrow ? 52 : 18)}%, transparent) 0%, transparent 46%, transparent 54%, color-mix(in srgb, ${awayColor} ${Math.max(pitchPressureTint.awayTint, showAwayArrow ? 52 : 18)}%, transparent) 100%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_68%)]" />
      <div className="absolute left-1/2 top-0 z-[1] h-full w-px -translate-x-1/2 bg-white/10" />

      <div
        className={cn(
          'relative z-[2] flex w-full items-center gap-2 px-3 py-2 sm:px-4',
          showHomeArrow ? 'justify-start' : showAwayArrow ? 'justify-end' : 'justify-center',
        )}
      >
        {showHomeArrow ? (
          <span
            className="shrink-0 text-4xl font-black leading-none text-emerald-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.75)] sm:text-5xl"
            aria-hidden
          >
            ←
          </span>
        ) : (
          <span className="w-8 shrink-0 sm:w-10" aria-hidden />
        )}

        <div
          className={cn(
            'min-w-0 flex-1',
            showHomeArrow ? 'text-left' : showAwayArrow ? 'text-right' : 'text-center',
          )}
        >
          <p
            className={cn(
              'text-lg font-black uppercase leading-none tracking-[0.12em] sm:text-2xl sm:tracking-[0.16em]',
              labelTone,
              banner.tone === 'goal' && 'animate-pulse',
            )}
          >
            {banner.label}
          </p>
          {banner.detail ? (
            <p
              className={cn(
                'mt-1 truncate text-[11px] font-bold text-white/80 sm:text-xs',
                showAwayArrow && 'ml-auto',
              )}
            >
              {banner.detail}
            </p>
          ) : null}
        </div>

        {showAwayArrow ? (
          <span
            className="shrink-0 text-4xl font-black leading-none text-rose-300 drop-shadow-[0_0_14px_rgba(251,113,133,0.75)] sm:text-5xl"
            aria-hidden
          >
            →
          </span>
        ) : (
          <span className="w-8 shrink-0 sm:w-10" aria-hidden />
        )}
      </div>
    </div>
  )
}
