import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { useMatchTifoPixels } from '../../hooks/useMatchTifoPixels'

export function GroupTifoPanel({ matches }: { matches: Match[] }) {
  const candidates = useMemo(() => {
    const live = matches.filter((m) => m.status === 'live')
    const up = matches.filter((m) => m.status === 'upcoming')
    return [...live, ...up].slice(0, 12)
  }, [matches])

  const [matchId, setMatchId] = useState<string | null>(() => candidates[0]?.id ?? null)

  const activeId = matchId && candidates.some((m) => m.id === matchId) ? matchId : candidates[0]?.id ?? null

  useEffect(() => {
    const first = candidates[0]?.id ?? null
    if (first && !matchId) setMatchId(first)
  }, [candidates, matchId])
  const {
    pixels,
    placePixel,
    remaining,
    palette,
    boardW,
    boardH,
    notice,
    clearNotice,
  } = useMatchTifoPixels(activeId)

  const [color, setColor] = useState(palette[3]!)

  if (candidates.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-tf-grey-pastel/60 bg-tf-white/60 px-3 py-3 text-center text-[11px] font-semibold text-tf-grey">
        Aucun match en cours : le tifo pixel revient avec le prochain live.
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-tf-grey-pastel/50 bg-gradient-to-b from-tf-ice/40 to-white/95 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-tf-grey/80">
          Tifo pixel
        </div>
        <span className="rounded-full bg-tf-dark/8 px-2 py-0.5 text-[10px] font-black tabular-nums text-tf-dark">
          {remaining} px restants aujourd’hui
        </span>
      </div>
      <label className="mt-2 block text-[10px] font-black uppercase tracking-wide text-tf-grey/70">
        Match cible
      </label>
      <select
        className="mt-1 w-full rounded-xl border border-tf-grey-pastel/60 bg-white px-2 py-1.5 text-xs font-bold text-tf-dark"
        value={activeId ?? ''}
        onChange={(e) => {
          clearNotice()
          setMatchId(e.target.value || null)
        }}
      >
        {candidates.map((m) => (
          <option key={m.id} value={m.id}>
            {m.status === 'live' ? '🔴 ' : ''}
            {m.home.shortName} – {m.away.shortName}
          </option>
        ))}
      </select>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            className={cn(
              'size-7 rounded-lg border-2 transition',
              color === c ? 'border-tf-dark ring-2 ring-tf-electric/30' : 'border-white ring-1 ring-black/10',
            )}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            aria-label={`Couleur ${c}`}
          />
        ))}
      </div>

      {notice ? (
        <p className="mt-2 text-[11px] font-semibold text-amber-700">{notice}</p>
      ) : null}

      <div
        className="mt-3 overflow-x-auto rounded-xl border border-tf-grey-pastel/50 bg-white p-1.5 shadow-inner"
        data-no-swipe="true"
      >
        <div
          className="inline-grid gap-0 border border-slate-200/80 bg-slate-100 p-px"
          style={{
            gridTemplateColumns: `repeat(${boardW}, minmax(0, 10px))`,
            gridTemplateRows: `repeat(${boardH}, minmax(0, 10px))`,
          }}
          role="img"
          aria-label="Grille tifo collaborative"
        >
          {Array.from({ length: boardH * boardW }, (_, i) => {
            const x = i % boardW
            const y = (i / boardW) | 0
            const k = `${x},${y}`
            const fill = pixels[k] ?? '#eef2f6'
            return (
              <button
                key={k}
                type="button"
                className="h-2.5 w-2.5 min-h-[10px] min-w-[10px] border border-slate-300/60 p-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] transition hover:z-[1] hover:ring-2 hover:ring-tf-electric/50"
                style={{ backgroundColor: fill }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  placePixel(x, y, color)
                }}
                aria-label={`Pixel ${x + 1} ${y + 1}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
