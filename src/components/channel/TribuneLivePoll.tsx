import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { TribunePollOption, TribunePollRow } from '../../lib/supabase/tribunePolls'
import { cn } from '../../utils/cn'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'

function PollOptions({
  poll,
  canVote,
  replay,
  showResults,
  light,
  onVote,
  stacked,
}: {
  poll: TribunePollRow
  canVote: boolean
  replay?: boolean
  showResults: boolean
  light: boolean
  onVote: (optionId: string) => void
  stacked: boolean
}) {
  const total = Object.values(poll.counts).reduce((a, b) => a + b, 0)
  return (
    <div className={cn(stacked ? 'space-y-1.5' : 'flex gap-1')}>
      {poll.options.map((opt) => {
        const n = poll.counts[opt.id] ?? 0
        const pct = total > 0 ? Math.round((n / total) * 100) : 0
        const mine = poll.myOptionId === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            disabled={!canVote || replay}
            onClick={() => {
              if (!canVote || replay || mine) return
              onVote(opt.id)
            }}
            className={cn(
              'relative overflow-hidden rounded-md border font-bold',
              stacked
                ? 'w-full px-3 py-2.5 text-left text-[13px] leading-snug'
                : 'min-w-0 flex-1 px-1 py-1 text-center text-[10px] leading-tight',
              light ? 'border-slate-200' : 'border-white/15',
              mine ? 'ring-1 ring-tf-cta' : '',
              !canVote || replay ? 'cursor-default' : 'hover:border-tf-cta/60',
            )}
          >
            {showResults ? (
              <span className="absolute inset-y-0 left-0 bg-tf-cta/25" style={{ width: `${pct}%` }} />
            ) : null}
            <span className={cn('relative z-10', stacked ? 'flex items-center justify-between gap-3' : 'block truncate')}>
              <span className={stacked ? 'min-w-0 break-words' : undefined}>{opt.label}</span>
              {showResults ? <span className={cn('shrink-0 opacity-80', stacked ? 'text-[12px]' : 'ml-0.5')}>{pct}%</span> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TribuneLivePoll({
  poll,
  canVote,
  onVote,
  light,
  replay,
  compact,
}: {
  poll: TribunePollRow
  canVote: boolean
  onVote: (optionId: string) => void
  light: boolean
  replay?: boolean
  compact?: boolean
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const voted = Boolean(poll.myOptionId)
  const isReplay = Boolean(replay)
  const showResults = voted || !canVote || isReplay
  const mine = poll.options.find((o) => o.id === poll.myOptionId)
  const portalTarget = sheetOpen ? getModalPortalRoot() : null

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            'mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left',
            light ? 'border-slate-200 bg-white/90' : 'border-[#3a6690]/50 bg-[#0c2339]/70',
          )}
        >
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate text-[10px] font-black', light ? 'text-slate-800' : 'text-sky-50')}>
              Sondage · {poll.question}
            </span>
            <span className={cn('mt-0.5 block truncate text-[10px] font-semibold', light ? 'text-slate-500' : 'text-sky-200/80')}>
              {mine ? `Ton vote : ${mine.label} · tu peux changer` : 'Touche pour voter'}
            </span>
          </span>
          <span className={cn('shrink-0 text-[11px] font-black', light ? 'text-slate-400' : 'text-sky-200/70')} aria-hidden>
            ›
          </span>
        </button>
        {sheetOpen && portalTarget
          ? createPortal(
              <div
                className={cn(
                  'pointer-events-auto fixed inset-0 z-[2147482955] flex touch-manipulation items-end justify-center sm:items-center',
                  'h-[100dvh] max-h-[100dvh] overflow-hidden',
                  'p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,calc(var(--tf-sys-bottom-inset,0px)+0.75rem))]',
                )}
                data-no-swipe="true"
                data-tf-modal="true"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tf-tribune-poll-title"
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                  aria-label="Fermer"
                  onClick={() => setSheetOpen(false)}
                />
                <div
                  className={cn(
                    'relative z-10 flex max-h-[min(88dvh,36rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl',
                    light ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-[#0b2440] text-sky-50',
                  )}
                >
                  <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-[11px] font-black uppercase tracking-[0.16em]',
                          light ? 'text-slate-500' : 'text-sky-200/80',
                        )}
                      >
                        {isReplay ? 'Sondage' : 'Sondage en cours'}
                      </p>
                      <h2 id="tf-tribune-poll-title" className="mt-1 text-base font-black leading-snug">
                        {poll.question}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black',
                        light ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-sky-50',
                      )}
                      onClick={() => setSheetOpen(false)}
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
                    {canVote && !isReplay ? (
                      <p className={cn('mb-2 text-[11px] font-semibold', light ? 'text-slate-500' : 'text-sky-200/80')}>
                        {voted ? 'Touche un autre choix pour changer ton vote.' : 'Un tap pour voter — tu pourras changer ensuite.'}
                      </p>
                    ) : null}
                    <PollOptions
                      poll={poll}
                      canVote={canVote}
                      replay={isReplay}
                      showResults={showResults}
                      light={light}
                      stacked
                      onVote={(id) => {
                        onVote(id)
                      }}
                    />
                    {!canVote && !voted && !isReplay ? (
                      <p className="mt-3 text-[11px] font-semibold text-sky-200/80">
                        Les résultats s’affichent après un vote.{' '}
                        <Link to="/login" className="underline">
                          Créer un compte pour voter
                        </Link>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>,
              portalTarget,
            )
          : null}
      </>
    )
  }

  return (
    <div
      className={cn(
        'mb-2 rounded-lg border px-2 py-1.5',
        light ? 'border-slate-200 bg-white/90' : 'border-[#3a6690]/50 bg-[#0c2339]/70',
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-wide text-sky-100">
        {isReplay ? 'Sondage' : 'Sondage en cours'}
      </p>
      <p className={cn('mt-0.5 text-[12px] font-black', light ? 'text-slate-900' : 'text-sky-50')}>
        {poll.question}
      </p>
      <div className="mt-1.5">
        <PollOptions
          poll={poll}
          canVote={canVote}
          replay={isReplay}
          showResults={showResults}
          light={light}
          stacked
          onVote={onVote}
        />
      </div>
      {!canVote && !voted && !isReplay ? (
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
