import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TribunePollOption, TribunePollRow } from '../../lib/supabase/tribunePolls'
import { cn } from '../../utils/cn'

export function TribuneLivePoll({
  poll,
  canVote,
  onVote,
  light,
  replay,
}: {
  poll: TribunePollRow
  canVote: boolean
  onVote: (optionId: string) => void
  light: boolean
  replay?: boolean
}) {
  const total = Object.values(poll.counts).reduce((a, b) => a + b, 0)
  const voted = Boolean(poll.myOptionId)
  const showResults = voted || !canVote || replay
  return (
    <div
      className={cn(
        'mb-2 rounded-lg border px-2 py-1.5',
        light ? 'border-slate-200 bg-white/90' : 'border-[#3a6690]/50 bg-[#0c2339]/70',
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-wide text-sky-100">
        {replay ? 'Sondage' : 'Sondage en cours'}
      </p>
      <p className={cn('mt-0.5 text-[12px] font-black', light ? 'text-slate-900' : 'text-sky-50')}>{poll.question}</p>
      <div className="mt-1.5 space-y-1">
        {poll.options.map((opt) => {
          const n = poll.counts[opt.id] ?? 0
          const pct = total > 0 ? Math.round((n / total) * 100) : 0
          const mine = poll.myOptionId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!canVote || voted || replay}
              onClick={() => onVote(opt.id)}
              className={cn(
                'relative w-full overflow-hidden rounded-md border px-2 py-1.5 text-left text-[11px] font-bold',
                light ? 'border-slate-200' : 'border-white/15',
                mine ? 'ring-1 ring-tf-cta' : '',
                !canVote || voted || replay ? 'cursor-default' : 'hover:border-tf-cta/60',
              )}
            >
              {showResults ? (
                <span
                  className="absolute inset-y-0 left-0 bg-tf-cta/25"
                  style={{ width: `${pct}%` }}
                />
              ) : null}
              <span className="relative z-10 flex justify-between gap-2">
                <span>{opt.label}</span>
                {showResults ? <span>{pct}%</span> : null}
              </span>
            </button>
          )
        })}
      </div>
      {!canVote && !voted && !replay ? (
        <p className="mt-1 text-[10px] font-semibold text-sky-200/80">
          Les résultats s’affichent après un vote.{' '}
          <Link to="/login" className="underline">
            Créer un compte pour voter
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export function AdminTribunePollForm({
  light,
  onCreate,
}: {
  light: boolean
  onCreate: (question: string, options: TribunePollOption[]) => void
}) {
  const [q, setQ] = useState('')
  const [opts, setOpts] = useState('Oui, Non')
  return (
    <form
      className={cn(
        'mb-2 space-y-1 rounded-lg border px-2 py-1.5',
        light ? 'border-amber-200 bg-amber-50' : 'border-amber-400/30 bg-amber-950/30',
      )}
      onSubmit={(e) => {
        e.preventDefault()
        const options = opts
          .split(',')
          .map((s, i) => ({ id: `m${i}`, label: s.trim() }))
          .filter((o) => o.label)
        if (!q.trim() || options.length < 2) return
        onCreate(q.trim(), options)
        setQ('')
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-wide text-amber-100">Sondage manuel (admin)</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Question"
        className="w-full rounded-md border border-white/20 bg-black/20 px-2 py-1 text-[11px]"
      />
      <input
        value={opts}
        onChange={(e) => setOpts(e.target.value)}
        placeholder="Options, séparées par des virgules"
        className="w-full rounded-md border border-white/20 bg-black/20 px-2 py-1 text-[11px]"
      />
      <button type="submit" className="rounded-full bg-tf-cta px-2 py-1 text-[10px] font-black text-white">
        Lancer
      </button>
    </form>
  )
}
