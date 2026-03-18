import { useEffect, useMemo, useRef, useState } from 'react'
import type { Match } from '../../types/match'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function LivePitch({ match }: { match: Match }) {
  const [t, setT] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const rngRef = useRef<(() => number) | null>(null)
  const playRef = useRef<{
    from: { x: number; y: number }
    to: { x: number; y: number }
    startedAt: number
    durationMs: number
  } | null>(null)
  const ballRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })

  useEffect(() => {
    startRef.current = performance.now()
    rngRef.current = mulberry32(
      (match.id.length * 10007 + (match.minute ?? 0) * 97) | 0,
    )

    // init play
    playRef.current = {
      from: { x: 0.5, y: 0.5 },
      to: { x: 0.58, y: 0.52 },
      startedAt: performance.now(),
      durationMs: 1900,
    }
    const tick = (now: number) => {
      // 60fps-ish clock for smooth animation
      setT((now - startRef.current) / 1000)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [match.id, match.minute])

  const sim = useMemo(() => {
    const now = performance.now()
    const rng = rngRef.current ?? (() => 0.5)
    const play = playRef.current

    if (!play) {
      return {
        x: 0.5,
        y: 0.5,
        danger: 0,
        seg: { from: { x: 0.5, y: 0.5 }, to: { x: 0.5, y: 0.5 }, p: 0 },
      }
    }

    const p = clamp01((now - play.startedAt) / play.durationMs)
    const e = easeInOut(p)
    const x = clamp01(lerp(play.from.x, play.to.x, e))
    const y = clamp01(lerp(play.from.y, play.to.y, e))
    ballRef.current = { x, y }

    // Decide next action when segment ends: more "match-like" than circular.
    if (p >= 1) {
      const cur = play.to
      const inAttack = cur.x > 0.62
      const turnover = rng() < (inAttack ? 0.22 : 0.12)
      const longPass = rng() < (inAttack ? 0.18 : 0.26)

      let nx = cur.x
      let ny = cur.y
      if (turnover) {
        // reset a bit back to midfield
        nx = clamp01(0.42 + rng() * 0.18)
        ny = clamp01(0.22 + rng() * 0.56)
      } else if (longPass) {
        // diagonal / vertical pass forward
        nx = clamp01(cur.x + 0.10 + rng() * 0.22)
        ny = clamp01(cur.y + (rng() - 0.5) * 0.32)
      } else {
        // small circulation / build-up
        nx = clamp01(cur.x + (rng() - 0.35) * 0.14)
        ny = clamp01(cur.y + (rng() - 0.5) * 0.18)
      }

      playRef.current = {
        from: { x: cur.x, y: cur.y },
        to: { x: nx, y: ny },
        startedAt: now,
        durationMs: 1200 + rng() * 1600,
      }
    }

    const danger = clamp01((x - 0.62) * 2.2)

    return { x, y, danger, seg: { from: play.from, to: play.to, p } }
  }, [t])

  const players = useMemo(() => {
    // Formation anchors (roughly 4-3-3 vs 4-4-2), then shift towards ball.
    const home = [
      [0.18, 0.52],
      [0.26, 0.22],
      [0.26, 0.40],
      [0.26, 0.64],
      [0.26, 0.82],
      [0.44, 0.30],
      [0.44, 0.52],
      [0.44, 0.74],
      [0.62, 0.30],
      [0.62, 0.52],
      [0.62, 0.74],
    ]
    const away = [
      [0.82, 0.52],
      [0.74, 0.24],
      [0.74, 0.42],
      [0.74, 0.62],
      [0.74, 0.80],
      [0.58, 0.28],
      [0.58, 0.44],
      [0.58, 0.60],
      [0.58, 0.76],
      [0.38, 0.42],
      [0.38, 0.62],
    ]

    const bx = sim.x
    const by = sim.y
    const shift = 0.11

    const mk = (arr: number[][], team: 'home' | 'away') =>
      arr.map((p, i) => {
        const ax = p[0]
        const ay = p[1]
        const dir = team === 'home' ? 1 : -1
        const x = clamp01(ax + (bx - 0.5) * shift * dir)
        const y = clamp01(ay + (by - 0.5) * shift)
        const depth = 0.95 - y * 0.35
        return { id: `${team}-${i}`, x, y, depth, team }
      })

    return [...mk(home, 'home'), ...mk(away, 'away')]
  }, [sim.x, sim.y])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-black text-slate-900">Schéma live</div>
        <div className="text-xs font-semibold text-slate-600">
          Simulation fictive • pression: {Math.round(sim.danger * 100)}%
        </div>
      </div>

      <div className="tf-pitch2d flex-1" role="img" aria-label="Terrain 2D (simulation)">
        <svg viewBox="0 0 100 64" className="block h-full w-full">
          <defs>
            <linearGradient id="grass2d" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#e9fbf2" />
              <stop offset="1" stopColor="#d5f2e2" />
            </linearGradient>
            <linearGradient id="pass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0a3dff" stopOpacity="0.0" />
              <stop offset="0.45" stopColor="#0a3dff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="100" height="64" fill="url(#grass2d)" />

          <g opacity="0.92" stroke="#0b1b3a" strokeOpacity="0.14" strokeWidth="0.8" fill="none">
            <rect x="2.5" y="2.5" width="95" height="59" rx="3" />
            <line x1="50" y1="2.5" x2="50" y2="61.5" />
            <circle cx="50" cy="32" r="7.2" />
            <circle cx="50" cy="32" r="0.8" fill="#0b1b3a" fillOpacity="0.18" stroke="none" />
            <rect x="2.5" y="18" width="14" height="28" rx="2" />
            <rect x="83.5" y="18" width="14" height="28" rx="2" />
            <rect x="2.5" y="24" width="5" height="16" rx="1.5" />
            <rect x="92.5" y="24" width="5" height="16" rx="1.5" />
          </g>

          {/* pressure */}
          <circle
            cx={sim.x * 100}
            cy={sim.y * 64}
            r={8 + sim.danger * 10}
            fill="#0a3dff"
            fillOpacity={0.06 + sim.danger * 0.14}
          />

          {/* pass line for current segment */}
          <line
            x1={sim.seg.from.x * 100}
            y1={sim.seg.from.y * 64}
            x2={sim.seg.to.x * 100}
            y2={sim.seg.to.y * 64}
            stroke="url(#pass)"
            strokeWidth={0.9 + sim.danger * 0.8}
            strokeLinecap="round"
            strokeDasharray="2.2 2.2"
            opacity={0.25 + (1 - Math.abs(sim.seg.p - 0.5) * 2) * 0.35}
          />

          {/* players (home/away) */}
          {players.map((p) => (
            <g key={p.id} opacity={0.9}>
              <circle
                cx={p.x * 100}
                cy={p.y * 64}
                r={1.2 + (p.team === 'home' ? 0.15 : 0)}
                fill={p.team === 'home' ? '#0b1b3a' : '#0ea5e9'}
                filter="url(#glow)"
              />
              <circle
                cx={p.x * 100}
                cy={p.y * 64}
                r={2.1}
                fill="none"
                stroke={p.team === 'home' ? 'rgba(11,27,58,0.18)' : 'rgba(14,165,233,0.18)'}
                strokeWidth="0.5"
              />
            </g>
          ))}

          {/* ball */}
          <g filter="url(#glow)">
            <circle
              cx={sim.x * 100}
              cy={sim.y * 64}
              r="2.3"
              fill="#0b1b3a"
              fillOpacity="0.18"
            />
            <circle cx={sim.x * 100} cy={sim.y * 64} r="1.8" fill="#ffffff" />
            <circle cx={sim.x * 100} cy={sim.y * 64} r="0.65" fill="#0b1b3a" fillOpacity="0.16" />
          </g>
        </svg>

        <div className="tf-pitch2d__score">
          {match.home.shortName} {match.score ? match.score.home : '—'} –{' '}
          {match.score ? match.score.away : '—'} {match.away.shortName}
        </div>
      </div>
    </div>
  )
}

