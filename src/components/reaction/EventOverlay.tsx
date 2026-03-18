import { useEffect } from 'react'

type Kind = 'yellow' | 'red' | 'save'

const meta: Record<
  Kind,
  { kicker: string; title: string; accent: string; bg: string }
> = {
  yellow: {
    kicker: 'ARBITRE',
    title: 'CARTON JAUNE',
    accent: 'text-amber-800',
    bg: 'bg-amber-50',
  },
  red: {
    kicker: 'ARBITRE',
    title: 'CARTON ROUGE',
    accent: 'text-rose-800',
    bg: 'bg-rose-50',
  },
  save: {
    kicker: 'GARDIEN',
    title: 'ARRÊT DÉCISIF',
    accent: 'text-blue-800',
    bg: 'bg-blue-50',
  },
}

export function EventOverlay({
  show,
  kind,
  line1,
  line2,
  onDone,
  ms = 2200,
}: {
  show: boolean
  kind: Kind
  line1?: string
  line2?: string
  onDone: () => void
  ms?: number
}) {
  useEffect(() => {
    if (!show) return
    const t = window.setTimeout(onDone, ms)
    return () => window.clearTimeout(t)
  }, [show, ms, onDone])

  if (!show) return null
  const m = meta[kind]

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] grid place-items-center">
      <div className="pointer-events-none absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      <div
        className={`pointer-events-none w-[min(680px,calc(100vw-32px))] rounded-[28px] border border-slate-200/70 ${m.bg} p-6 shadow-[0_30px_90px_rgba(0,0,0,.18)]`}
        style={{
          animation: `tf-goal-pop ${ms}ms cubic-bezier(0.16, 0.9, 0.2, 1) forwards`,
        }}
      >
        <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
          {m.kicker}
        </div>
        <div className={`mt-2 text-4xl font-black tracking-tight ${m.accent}`}>
          {m.title}
        </div>
        {(line1 || line2) && (
          <div className="mt-2 text-sm font-semibold text-slate-700/80">
            {line1 ? <div>{line1}</div> : null}
            {line2 ? <div className="mt-0.5">{line2}</div> : null}
          </div>
        )}
      </div>
    </div>
  )
}

