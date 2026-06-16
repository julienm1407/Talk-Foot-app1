import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { cn } from '../../utils/cn'
import { useMatchTifoPixels } from '../../hooks/useMatchTifoPixels'
import { normalizeTifoDisplayColor, TIFO_BOARD_CELL_COUNT, TIFO_ENGAGEMENT_BONUSES } from '../../constants/tifoPixelBoard'
import { useAppearance } from '../../contexts/AppearanceContext'
import { matchInvolvesNation } from '../../utils/resolveMatchNation'
import { isWorldCupCompetitionId } from '../../utils/seasonMode'

const CELL_PX = 11

export function GroupTifoPanel({
  groupId,
  matches,
  groupClubId,
  groupClubLabel,
  groupNationIso,
  groupNationLabel,
  fixedMatchId,
  isGroupAdmin,
  /** Dans un panneau repliable mobile : marges réduites, grille scrollable. */
  embedded = false,
}: {
  groupId: string
  matches: Match[]
  groupClubId?: string | null
  groupClubLabel?: string
  /** Tribunes CDM nation : filtre les matchs de la sélection. */
  groupNationIso?: string | null
  groupNationLabel?: string
  /** Page match : une seule grille, sans sélecteur. */
  fixedMatchId?: string | null
  isGroupAdmin: boolean
  embedded?: boolean
}) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const candidates = useMemo(() => {
    let scoped = matches
    if (groupNationIso) {
      scoped = matches.filter(
        (m) => isWorldCupCompetitionId(m.competition.id) && matchInvolvesNation(m, groupNationIso),
      )
    } else if (groupClubId) {
      scoped = matches.filter((m) => m.home.id === groupClubId || m.away.id === groupClubId)
    }
    const live = scoped.filter((m) => m.status === 'live')
    const up = scoped.filter((m) => m.status === 'upcoming')
    return [...live, ...up].slice(0, 12)
  }, [matches, groupClubId, groupNationIso])

  const fixedMatch = useMemo(
    () => (fixedMatchId ? matches.find((m) => m.id === fixedMatchId) ?? null : null),
    [fixedMatchId, matches],
  )
  const fixedMatchActive =
    fixedMatch != null && (fixedMatch.status === 'live' || fixedMatch.status === 'upcoming')

  const [matchId, setMatchId] = useState<string | null>(() => fixedMatchId ?? candidates[0]?.id ?? null)
  const [moderationMode, setModerationMode] = useState(false)

  const activeId = fixedMatchId
    ? fixedMatchActive
      ? fixedMatchId
      : null
    : matchId && candidates.some((m) => m.id === matchId)
      ? matchId
      : candidates[0]?.id ?? null

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
    dailyLimit,
    bonusAllowance,
    palette,
    boardW,
    boardH,
    notice,
    engagementNotice,
    clearNotice,
    clearEngagementNotice,
    loading,
    isShared,
  } = useMatchTifoPixels({
    groupId,
    matchId: activeId,
    isGroupAdmin,
  })

  useEffect(() => {
    if (!engagementNotice) return
    const t = window.setTimeout(() => clearEngagementNotice(), 4200)
    return () => window.clearTimeout(t)
  }, [engagementNotice, clearEngagementNotice])

  const [color, setColor] = useState(palette[2]!)

  const placedPixelCount = useMemo(() => Object.keys(pixels).length, [pixels])
  const placedPixelsLabel = useMemo(() => {
    const placed = placedPixelCount.toLocaleString('fr-FR')
    const total = TIFO_BOARD_CELL_COUNT.toLocaleString('fr-FR')
    return `${placed} / ${total} pixels placés`
  }, [placedPixelCount])

  if (!activeId) {
    return (
      <div
        className={cn(
          embedded ? 'mt-2' : 'mt-4',
          'rounded-2xl border border-dashed px-3 py-3 text-center text-[11px] font-semibold',
          L
            ? 'border-tf-grey-pastel/60 bg-tf-white/60 text-tf-grey'
            : 'border-white/20 bg-slate-900/60 text-sky-200/80',
        )}
      >
        {groupNationIso
          ? `Aucun match CDM à venir pour ${groupNationLabel ?? 'cette sélection'} : le tifo pixel revient au prochain match.`
          : groupClubId
            ? `Aucun match a venir pour ${groupClubLabel ?? 'ce club'} : le tifo pixel sera disponible au prochain match.`
            : fixedMatchId
              ? 'Le tifo pixel est disponible pendant les matchs à venir et en direct.'
              : 'Aucun match en cours : le tifo pixel revient avec le prochain live.'}
      </div>
    )
  }

  const emptyFill = L ? 'rgb(238, 242, 246)' : 'rgb(30, 41, 59)'

  return (
    <div
      className={cn(
        'tf-tifo-board',
        embedded ? 'mt-2' : 'mt-4 rounded-2xl border p-3 shadow-sm',
        !embedded &&
          (L
            ? 'border-tf-grey-pastel/50 bg-gradient-to-b from-tf-ice/40 to-white/95'
            : 'border-white/15 bg-gradient-to-b from-slate-900/70 to-[#0b1220]/95'),
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={cn('text-[10px] font-black uppercase tracking-[0.2em]', L ? 'text-tf-grey/80' : 'text-sky-200/80')}>
          Tifo pixel{isShared ? ' · cette tribune' : ''}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums',
              L ? 'bg-tf-dark/6 text-tf-grey' : 'bg-slate-800/60 text-sky-100/90',
            )}
          >
            {placedPixelsLabel}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums',
              L ? 'bg-tf-dark/8 text-tf-dark' : 'bg-sky-900/40 text-sky-100',
            )}
          >
            {remaining} / {dailyLimit} px aujourd’hui
            {bonusAllowance > 0 ? ` (+${bonusAllowance} bonus)` : ''}
          </span>
        </div>
      </div>

      {engagementNotice ? (
        <p
          className={cn(
            'mt-2 rounded-lg px-2.5 py-1.5 text-[10px] font-bold',
            L ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-500/15 text-emerald-200',
          )}
        >
          {engagementNotice}
        </p>
      ) : null}

      {isShared && bonusAllowance === 0 ? (
        <p className={cn('mt-2 text-[10px] leading-snug', L ? 'text-tf-grey/75' : 'text-sky-200/65')}>
          Gagne des pixels : message (+{TIFO_ENGAGEMENT_BONUSES.chat_sent}), like (+{TIFO_ENGAGEMENT_BONUSES.message_liked}),
          débat (+{TIFO_ENGAGEMENT_BONUSES.debate_reply}), pari (+{TIFO_ENGAGEMENT_BONUSES.match_bet}),
          10 messages live (+{TIFO_ENGAGEMENT_BONUSES.chat_active_10}) — chaque bonus une fois par jour.
        </p>
      ) : null}

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

      {!fixedMatchId && candidates.length > 1 ? (
        <>
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
        </>
      ) : null}

      {!moderationMode ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              className={cn(
                'tf-tifo-swatch size-7 rounded-lg border-2 transition',
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

      <div
        className={cn(
          'relative mt-3 overflow-auto rounded-xl border p-1.5 shadow-inner',
          embedded && 'max-h-[min(28dvh,12.5rem)]',
          L ? 'border-tf-grey-pastel/50 bg-white' : 'border-white/15 bg-slate-900/80',
        )}
        data-no-swipe="true"
      >
        {loading ? (
          <div
            className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center rounded-xl bg-black/10 backdrop-blur-[1px]"
            aria-hidden
          >
            <span className={cn('rounded-lg px-2 py-1 text-[10px] font-bold', L ? 'bg-white/90 text-tf-grey' : 'bg-slate-900/90 text-sky-100')}>
              Sync…
            </span>
          </div>
        ) : null}
        <div
          className={cn('tf-tifo-grid', L ? 'tf-tifo-grid--light' : 'tf-tifo-grid--dark')}
          style={{
            gridTemplateColumns: `repeat(${boardW}, ${CELL_PX}px)`,
            gridTemplateRows: `repeat(${boardH}, ${CELL_PX}px)`,
          }}
          role="img"
          aria-label="Grille tifo collaborative"
        >
          {Array.from({ length: boardH * boardW }, (_, i) => {
            const x = i % boardW
            const y = (i / boardW) | 0
            const k = `${x},${y}`
            const painted = pixels[k]
            const fill = painted ? normalizeTifoDisplayColor(painted) : emptyFill
            const isPainted = Boolean(painted)
            const canPlace = !moderationMode
            return (
              <button
                key={k}
                type="button"
                className={cn(
                  'tf-tifo-cell',
                  isPainted && 'tf-tifo-cell--painted',
                  canPlace && !isPainted && 'tf-tifo-cell--empty',
                  canPlace && 'cursor-pointer',
                  moderationMode && isPainted && 'tf-tifo-cell--moderate cursor-pointer',
                  moderationMode && !isPainted && 'tf-tifo-cell--empty cursor-default opacity-50',
                )}
                style={{
                  width: CELL_PX,
                  height: CELL_PX,
                  minWidth: CELL_PX,
                  minHeight: CELL_PX,
                  backgroundColor: fill,
                  opacity: 1,
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (moderationMode && isGroupAdmin) {
                    if (isPainted) void deletePixelAsAdmin(x, y)
                    return
                  }
                  void placePixel(x, y, color)
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
