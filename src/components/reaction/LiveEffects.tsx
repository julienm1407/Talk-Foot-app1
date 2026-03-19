import { useEffect, useMemo, useState } from 'react'
import type { ReactionType } from '../../types/chat'

type Fx = {
  id: string
  type: ReactionType
  createdAt: number
  side?: 'left' | 'right'
  x: number
  delay: number
  color: string
}

const confettiColors = ['#0a3dff', '#0b1b3a', '#22c55e', '#f59e0b', '#ef4444']

export function LiveEffects({
  events,
  fullScreen,
}: {
  events: Array<{ id: string; type: ReactionType; createdAt: number }>
  fullScreen?: boolean
}) {
  const [fx, setFx] = useState<Fx[]>([])
  const [ambience, setAmbience] = useState<null | 'confetti' | 'flare'>(null)

  const latest = useMemo(() => events.slice(-6), [events])

  useEffect(() => {
    if (latest.length === 0) return
    const last = latest[latest.length - 1]

    if (last.type === 'confetti') {
      setAmbience('confetti')
      const make = (side: Fx['side']) =>
        Array.from({ length: 24 }).map((_, i) => ({
          id: `${last.id}-${side}-${i}`,
          type: 'confetti' as const,
          createdAt: last.createdAt,
          side,
          x: (Math.random() - 0.5) * 280,
          delay: Math.random() * 180,
          color: confettiColors[(Math.random() * confettiColors.length) | 0],
        }))
      setFx((prev) =>
        [...prev, ...make('left'), ...make('right')].slice(-200),
      )
      const timeout = window.setTimeout(() => {
        setFx((prev) => prev.filter((p) => p.createdAt !== last.createdAt))
        setAmbience(null)
      }, 1200)
      return () => window.clearTimeout(timeout)
    }

    if (last.type === 'flare') {
      setAmbience('flare')
      const smoke = Array.from({ length: 16 }).map((_, i) => ({
        id: `${last.id}-smoke-${i}`,
        type: 'flare' as const,
        createdAt: last.createdAt,
        side: Math.random() < 0.5 ? ('left' as const) : ('right' as const),
        x: (Math.random() - 0.5) * 220,
        delay: Math.random() * 200,
        color: '#ff3b30',
      }))
      setFx((prev) => [...prev, ...smoke].slice(-200))
      const timeout = window.setTimeout(() => {
        setFx((prev) => prev.filter((p) => p.createdAt !== last.createdAt))
        setAmbience(null)
      }, 1200)
      return () => window.clearTimeout(timeout)
    }
  }, [latest])

  return (
    <div
      className={
        fullScreen
          ? 'pointer-events-none fixed inset-0 z-[70] overflow-hidden'
          : 'pointer-events-none absolute inset-0 overflow-hidden'
      }
      aria-hidden="true"
    >
      {ambience && (
        <>
          <div
            className={
              ambience === 'flare'
                ? 'tf-ambience tf-ambience--flare'
                : 'tf-ambience tf-ambience--confetti'
            }
          />
          <div
            className={
              ambience === 'flare'
                ? 'tf-ambience tf-ambience--flare tf-ambience--right'
                : 'tf-ambience tf-ambience--confetti tf-ambience--right'
            }
          />
        </>
      )}
      {fx.map((p) => {
        if (p.type === 'confetti') {
          return (
            <i
              key={p.id}
              className={`tf-confetti tf-confetti--${p.side ?? 'left'}`}
              style={
                {
                  ['--x' as any]: `${p.x}px`,
                  ['--d' as any]: `${p.delay}ms`,
                  ['--c' as any]: p.color,
                } as React.CSSProperties
              }
            />
          )
        }
        return (
          <i
            key={p.id}
            className="tf-smoke"
            style={
              {
                ['--x' as any]: `${p.x}px`,
                ['--d' as any]: `${p.delay}ms`,
                ['--l' as any]: p.side === 'right' ? '92%' : '8%',
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

