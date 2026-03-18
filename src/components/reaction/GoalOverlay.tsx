import { useEffect, useMemo, useState } from 'react'

export function GoalOverlay({
  show,
  label = 'BUT',
  scorer,
  minute,
  colors,
  onDone,
}: {
  show: boolean
  label?: string
  scorer?: string
  minute?: number
  colors?: { primary: string; secondary: string }
  onDone: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const fireworks = useMemo(() => {
    if (!show) return []
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.round(10 + Math.random() * 80),
      y: Math.round(12 + Math.random() * 55),
      delay: Math.round(Math.random() * 520),
      s: 0.85 + Math.random() * 0.9,
    }))
  }, [show])

  useEffect(() => {
    if (!show) return
    setMounted(true)
    const id = window.setTimeout(() => {
      setMounted(false)
      onDone()
    }, 8000)
    return () => window.clearTimeout(id)
  }, [show, onDone])

  if (!show || !mounted) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
      <div className="tf-goalOverlay">
        <div
          className="tf-goalOverlay__bg"
          style={
            colors
              ? ({
                  ['--p' as any]: colors.primary,
                  ['--s' as any]: colors.secondary,
                } as React.CSSProperties)
              : undefined
          }
        />
        {fireworks.map((f) => (
          <i
            key={f.id}
            className="tf-firework"
            style={
              {
                ['--x' as any]: `${f.x}%`,
                ['--y' as any]: `${f.y}%`,
                ['--d' as any]: `${f.delay}ms`,
                ['--k' as any]: `${f.s}`,
              } as React.CSSProperties
            }
          />
        ))}
        <div className="tf-goalOverlay__shake">
          <div className="tf-goalOverlay__card">
            <div className="tf-goalOverlay__kicker">MOMENT FORT</div>
            <div className="tf-goalOverlay__title">{label}</div>
            <div className="tf-goalOverlay__sub">
              {minute ? `${minute}' • ` : ''}
              {scorer ? `${scorer} • ` : ''}
              Le stade explose • feux d’artifice
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

