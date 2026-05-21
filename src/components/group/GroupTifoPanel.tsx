import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { useMatchTifoPixels } from '../../hooks/useMatchTifoPixels'
import { useAppearance } from '../../contexts/AppearanceContext'

const EMPTY_CELL = '#eef2f6'

export function GroupTifoPanel({
  groupId,
  matches,
  groupClubId,
  groupClubLabel,
  isGroupAdmin,
}: {
  groupId: string
  matches: Match[]
  groupClubId?: string | null
  groupClubLabel?: string
  isGroupAdmin: boolean
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
  const [moderationMode, setModerationMode] = useState(false)

  const activeId = matchId && candidates.some((m) => m.id === matchId) ? matchId : candidates[0]?.id ?? null

  useEffect(() => {
    const first = candidates[0]?.id ?? null
    if (first && !matchId) setMatchId(first)
  }, [candidates, matchId])

  useEffect(() => {
    setModerationMode(false)
  }, [groupId, activeId])

  const {
    pixels,
    placePixel,
    deletePixelAsAdmin,
    remaining,
    palette,
    boardW,
    boardH,
    notice,
    clearNotice,
    loading,
    isShared,
  } = useMatchTifoPixels({
    groupId,
    matchId: activeId,
    isGroupAdmin,
  })

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

  const gridLine = L ? 'bg-slate-300/90' : 'bg-slate-600/80'
  const cellDefault = L ? 'bg-slate-100' : 'bg-slate-800/90'

  return (
    <div
      className={cn(
        'mt-4 rounded-2xl border p-3 shadow-sm',
        L
          ? 'border-tf-grey-pastel/50 bg-gradient-to-b from-tf-ice/40 to-white/95'
          : 'border-white/15 bg-gradient-to-b from-slate-900/70 to-[#0b1220]/95',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={cn('text-[10px] font-black uppercase tracking-[0.2em]', L ? 'text-tf-grey/80' : 'text-sky-200/80')}>
          Tifo pixel{isShared ? ' · ce salon' : ''}
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

      {isGroupAdmin ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModerationMode((v) => !v)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide transition',
              moderationMode
                ? L
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500 text-white'
                : L
                  ? 'border border-tf-grey-pastel/60 bg-white text-tf-grey'
                  : 'border border-white/20 bg-slate-900/60 text-sky-100',
            )}
          >
            {moderationMode ? 'Modération active' : 'Modérer le tifo'}
          </button>
          {moderationMode ? (
            <span className={cn('text-[10px] font-semibold', L ? 'text-rose-700' : 'text-rose-300')}>
              Clique un pixel coloré pour le supprimer
            </span>
          ) : null}
        </div>
      ) : null}

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

      {!moderationMode ? (
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
      ) : null}

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
          className={cn('inline-grid gap-px p-px', gridLine)}
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
            const painted = pixels[k]
            const fill = painted ?? EMPTY_CELL
            const isPainted = Boolean(painted)
            return (
              <button
                key={k}
                type="button"
                className={cn(
                  'h-2.5 w-2.5 min-h-[10px] min-w-[10px] p-0 transition',
                  !painted && cellDefault,
                  moderationMode && isPainted
                    ? 'hover:ring-2 hover:ring-rose-500/80'
                    : 'hover:z-[1] hover:ring-2 hover:ring-tf-electric/50',
                  moderationMode && !isPainted && 'cursor-default opacity-70',
                )}
                style={painted ? { backgroundColor: fill } : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (moderationMode && isGroupAdmin) {
                    if (isPainted) void deletePixelAsAdmin(x, y)
                    return
                  }
                  if (!moderationMode) void placePixel(x, y, color)
                }}
                aria-label={
                  moderationMode
                    ? isPainted
                      ? `Supprimer le pixel ${x + 1} ${y + 1}`
                      : `Pixel vide ${x + 1} ${y + 1}`
                    : `Pixel ${x + 1} ${y + 1}`
                }
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
