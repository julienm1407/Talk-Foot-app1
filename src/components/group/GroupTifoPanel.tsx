import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { useMatchTifoPixels } from '../../hooks/useMatchTifoPixels'
import { useAppearance } from '../../contexts/AppearanceContext'

export function GroupTifoPanel({
  matches,
  groupClubId,
  groupClubLabel,
}: {
  matches: Match[]
  groupClubId?: string | null
  groupClubLabel?: string
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const candidates = useMemo(() => {
    const scoped = groupClubId
      ? matches.filter((m) => m.home.id === groupClubId || m.away.id === groupClubId)
      : matches
    const live = scoped.filter((m) => m.status === 'live')
    const up = scoped.filter((m) => m.status === 'upcoming')
    return [...live, ...up].slice(0, 12)
  }, [matches, groupClubId])

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
    loading,
    isShared,
  } = useMatchTifoPixels(activeId)

  const [color, setColor] = useState(palette[3]!)

  if (candidates.length === 0) {
    return (
      <div
        className={cn(
          'mt-4 rounded-2xl border border-dashed px-3 py-3 text-center text-[11px] font-semibold',
          L
            ? 'border-tf-grey-pastel/60 bg-tf-white/60 text-tf-grey'
            : 'border-white/20 bg-slate-900/60 text-sky-200/80',
        )}
      >
        {groupClubId
          ? `Aucun match a venir pour ${groupClubLabel ?? 'ce club'} : le tifo pixel sera disponible au prochain match.`
          : 'Aucun match en cours : le tifo pixel revient avec le prochain live.'}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mt-4 rounded-2xl border p-3 shadow-sm',
        L
          ? 'border-tf-grey-pastel/50 bg-gradient-to-b from-tf-ice/40 to-white/95'
          : 'border-white/15 bg-gradient-to-b from-slate-900/70 to-[#0b1220]/95',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={cn('text-[10px] font-black uppercase tracking-[0.2em]', L ? 'text-tf-grey/80' : 'text-sky-200/80')}>
          Tifo pixel{isShared ? ' · communautaire' : ''}
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums',
            L ? 'bg-tf-dark/8 text-tf-dark' : 'bg-sky-900/40 text-sky-100',
          )}
        >
          {remaining} px restants aujourd’hui
        </span>
      </div>
      <label className={cn('mt-2 block text-[10px] font-black uppercase tracking-wide', L ? 'text-tf-grey/70' : 'text-sky-200/75')}>
        Match cible
      </label>
      <select
        className={cn(
          'mt-1 w-full rounded-xl border px-2 py-1.5 text-xs font-bold',
          L
            ? 'border-tf-grey-pastel/60 bg-white text-tf-dark'
            : 'border-white/20 bg-slate-900/75 text-sky-100',
        )}
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
        <p className={cn('mt-2 text-[11px] font-semibold', L ? 'text-amber-700' : 'text-amber-300')}>
          {notice}
        </p>
      ) : null}

      {loading ? (
        <p className={cn('mt-2 text-[11px] font-semibold', L ? 'text-tf-grey/70' : 'text-sky-200/70')}>
          Chargement du tifo…
        </p>
      ) : null}

      <div
        className={cn(
          'mt-3 overflow-x-auto rounded-xl border p-1.5 shadow-inner',
          L ? 'border-tf-grey-pastel/50 bg-white' : 'border-white/15 bg-slate-900/80',
        )}
        data-no-swipe="true"
      >
        <div
          className={cn(
            'inline-grid gap-0 p-px',
            L ? 'border border-slate-200/80 bg-slate-100' : 'border border-white/15 bg-slate-950/80',
          )}
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
                className={cn(
                  'h-2.5 w-2.5 min-h-[10px] min-w-[10px] border p-0 transition hover:z-[1] hover:ring-2 hover:ring-tf-electric/50',
                  L
                    ? 'border-slate-300/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                    : 'border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
                )}
                style={{ backgroundColor: fill }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void placePixel(x, y, color)
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
