import type { FormResult } from '../../types/standings'

function pointsFor(r: FormResult) {
  if (r === 'W') return 3
  if (r === 'D') return 1
  return 0
}

/** Courbe cumulative des points sur les 5 derniers matchs (mock forme). */
export function FormSparkline({ form, className }: { form: FormResult[]; className?: string }) {
  const cumulative: number[] = []
  let acc = 0
  for (const r of form) {
    acc += pointsFor(r)
    cumulative.push(acc)
  }
  const max = Math.max(9, ...cumulative, 1)
  const w = 72
  const h = 28
  const pad = 4
  const step =
    cumulative.length > 1 ? (w - pad * 2) / (cumulative.length - 1) : 0
  const pts = cumulative.map((v, i) => {
    const x = pad + i * step
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  })
  const d = pts.length ? `M ${pts.join(' L ')}` : ''

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <path
        d={`M ${pad} ${h - pad} L ${w - pad} ${h - pad}`}
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={1}
        fill="none"
      />
      {d ? (
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-tf-electric-deep"
        />
      ) : null}
      {cumulative.map((v, i) => {
        const x = pad + i * step
        const y = h - pad - (v / max) * (h - pad * 2)
        return <circle key={i} cx={x} cy={y} r={2.5} className="fill-tf-dark" />
      })}
    </svg>
  )
}
