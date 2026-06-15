import type { Highlight } from '../../data/highlights'
import {
  cardColorFromHighlightText,
  cardCoarseDedupeKey,
  formatCardPlayerDisplayName,
  formatGoalScorerLabel,
  isLikelyGeographicFragment,
  isPlausibleCardPlayerName,
} from '../../utils/liveFootballOdds'
import {
  stripSportMonksCommentPrefix,
  translateSportMonksLiveTextToFr,
} from '../../utils/translateSportMonksLiveEnToFr'
import { formatGoalEventMinute } from '../../utils/matchEventMinute'
import { cn } from '../../utils/cn'

export type MatchHighlightTeamLabels = {
  home: string
  away: string
}

const icon: Record<Exclude<Highlight['type'], 'Carton'>, string> = {
  But: '⚽',
  Occasion: '🎯',
  VAR: '📺',
  Arrêt: '🧤',
  Info: '📰',
}

const pillLight: Record<Exclude<Highlight['type'], 'Carton'>, string> = {
  But: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Occasion: 'bg-blue-100 text-blue-800 border-blue-200',
  VAR: 'bg-slate-100 text-slate-700 border-slate-200',
  Arrêt: 'bg-violet-100 text-violet-800 border-violet-200',
  Info: 'bg-slate-100 text-slate-700 border-slate-200',
}

const pillChannel: Record<Exclude<Highlight['type'], 'Carton'>, string> = {
  But: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  Occasion: 'border-sky-400/35 bg-sky-500/15 text-sky-100',
  VAR: 'border-violet-400/35 bg-violet-500/15 text-violet-100',
  Arrêt: 'border-fuchsia-400/35 bg-fuchsia-500/15 text-fuchsia-100',
  Info: 'border-[#4a6f94]/55 bg-[#0e2a45] text-sky-100',
}

const shortTitle: Record<Highlight['type'], string> = {
  But: 'But',
  Occasion: 'Occasion',
  Carton: 'Carton',
  VAR: 'VAR',
  Arrêt: 'Arrêt',
  Info: 'Info',
}

function cardColorForHighlight(h: Highlight): 'yellow' | 'red' {
  return cardColorFromHighlightText(`${h.title ?? ''} ${h.detail ?? ''}`)
}

function cardBadgeLabel(h: Highlight): string {
  return cardColorForHighlight(h) === 'red' ? 'Carton rouge' : 'Carton jaune'
}

function cardPlayerFullName(h: Highlight): string {
  const fromScorer = h.scorerName?.trim()
  if (fromScorer && isPlausibleCardPlayerName(fromScorer) && !isLikelyGeographicFragment(fromScorer)) {
    return formatCardPlayerDisplayName(fromScorer)
  }
  const fromTitle = stripSportMonksCommentPrefix(String(h.title ?? '').trim())
  if (
    fromTitle &&
    fromTitle.toLowerCase() !== 'carton' &&
    isPlausibleCardPlayerName(fromTitle) &&
    !isLikelyGeographicFragment(fromTitle)
  ) {
    return formatCardPlayerDisplayName(fromTitle)
  }
  const fromDetail = stripSportMonksCommentPrefix(String(h.detail ?? '').trim())
  const m = fromDetail.match(/Carton (?:jaune|rouge)\s*·\s*(.+)$/i)
  if (m?.[1]) {
    const parsed = m[1].trim()
    if (isPlausibleCardPlayerName(parsed) && !isLikelyGeographicFragment(parsed)) {
      return formatCardPlayerDisplayName(parsed)
    }
  }
  return ''
}

function cardTimelineLine(h: Highlight, teamLabels?: MatchHighlightTeamLabels): string {
  const colorLabel = cardBadgeLabel(h)
  const player = cardPlayerFullName(h)
  const team = h.side && teamLabels ? teamLabels[h.side] : null
  if (player && team) return `${colorLabel} · ${player} · ${team}`
  if (player) return `${colorLabel} · ${player}`
  return colorLabel
}

function cardHighlightQuality(h: Highlight): number {
  let score = 0
  if (h.id.startsWith('sm-event-')) score += 20
  const name = cardPlayerFullName(h)
  if (name) score += 10 + name.length
  if (h.side) score += 5
  return score
}

function dedupeTimelineCards(items: Highlight[]): Highlight[] {
  const others = items.filter((h) => h.type !== 'Carton')
  const cards = items.filter((h) => h.type === 'Carton')
  const byKey = new Map<string, Highlight>()

  for (const h of cards) {
    const color = cardColorForHighlight(h)
    const mergeKey =
      color === 'red'
        ? `${h.minute}|red`
        : (cardCoarseDedupeKey(h) ?? `${h.minute}|yellow|${h.side ?? '?'}`)
    const prev = byKey.get(mergeKey)
    if (!prev || cardHighlightQuality(h) > cardHighlightQuality(prev)) {
      byKey.set(mergeKey, h)
    }
  }

  return [...others, ...byKey.values()]
}

function translateCombinedParts(text: string): string {
  if (!text.includes(' — ')) return translateSportMonksLiveTextToFr(text)
  return text
    .split(' — ')
    .map((part) => translateSportMonksLiveTextToFr(part.trim()))
    .filter(Boolean)
    .join(' — ')
}

function highlightDetailText(h: Highlight, teamLabels?: MatchHighlightTeamLabels): string {
  const typeLabel = shortTitle[h.type]
  if (h.type === 'But' && h.scorerName) {
    const scorerLine = formatGoalScorerLabel(h.scorerName, h.assistName, { ownGoal: h.ownGoal })
    const raw = stripSportMonksCommentPrefix(String(h.detail ?? '').trim())
    const fr = raw ? translateCombinedParts(raw) : ''
    if (fr && !fr.toLowerCase().includes(scorerLine.toLowerCase())) {
      return `${scorerLine} — ${fr}`
    }
    return scorerLine
  }
  if (h.type === 'Carton') {
    return cardTimelineLine(h, teamLabels)
  }
  const titleRaw = stripSportMonksCommentPrefix(String(h.title ?? '').trim())
  const detailRaw = stripSportMonksCommentPrefix(String(h.detail ?? '').trim())
  let combined = detailRaw || titleRaw
  if (titleRaw && titleRaw.toLowerCase() !== typeLabel.toLowerCase() && detailRaw) {
    combined = `${titleRaw} — ${detailRaw}`
  }
  return translateCombinedParts(combined)
}

function showHighlightHeadline(h: Highlight): boolean {
  return h.type === 'But' || h.type === 'VAR' || h.type === 'Arrêt'
}

function highlightIcon(h: Highlight): string {
  if (h.type === 'Carton') return cardColorForHighlight(h) === 'red' ? '🟥' : '🟨'
  return icon[h.type]
}

function highlightPillClass(h: Highlight, channel: boolean): string {
  if (h.type === 'Carton') return ''
  const palette = channel ? pillChannel : pillLight
  return palette[h.type]
}

export function MatchHighlights({
  items,
  activeId,
  variant = 'light',
  teamLabels,
}: {
  items: Highlight[]
  activeId?: string
  variant?: 'light' | 'channel'
  teamLabels?: MatchHighlightTeamLabels
}) {
  const channel = variant === 'channel'

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed p-5',
          channel ? 'border-[#3a6690]/50 bg-[#0a1f35]/60' : 'border-slate-200/70 bg-slate-50/50',
        )}
      >
        <p className={cn('text-sm font-semibold', channel ? 'text-sky-200/80' : 'text-slate-600')}>
          Aucune action enregistrée pour l&apos;instant.
        </p>
      </div>
    )
  }

  const sorted = dedupeTimelineCards(items).sort((a, b) => {
    if (b.minute !== a.minute) return b.minute - a.minute
    const ord = (b.order ?? 0) - (a.order ?? 0)
    if (ord !== 0) return ord
    return b.id.localeCompare(a.id)
  })

  return (
    <ul className="space-y-2" role="list">
      {sorted.map((h, idx) => {
        const headline = shortTitle[h.type]
        const detail = highlightDetailText(h, teamLabels)
        const isActive = h.id === activeId
        const showHeadline = showHighlightHeadline(h)
        const isCard = h.type === 'Carton'

        return (
          <li key={h.id}>
            <div
              className={cn(
                'tf-timeline-in rounded-xl border px-3 py-2.5 transition-colors sm:px-4 sm:py-3',
                channel
                  ? isActive
                    ? 'border-cyan-400/50 bg-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'border-[#3a6690]/45 bg-[#0a1f35]/80 hover:bg-[#0f2841]'
                  : isActive
                    ? 'border-blue-300/60 bg-blue-50/70 ring-1 ring-blue-200/50'
                    : 'border-slate-200/60 bg-white/80 hover:bg-white',
              )}
              style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base',
                    channel
                      ? isActive
                        ? 'bg-cyan-500/20'
                        : 'bg-[#0e2a45]'
                      : isActive
                        ? 'bg-blue-100'
                        : 'bg-slate-100/80',
                  )}
                >
                  {highlightIcon(h)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-black tabular-nums',
                        channel ? 'text-sky-300/90' : 'text-slate-500',
                      )}
                    >
                      {h.minute > 0
                        ? formatGoalEventMinute(h.minute, { inSecondHalf: h.inSecondHalf }) || `${h.minute}'`
                        : '—'}
                    </span>
                    {!isCard ? (
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold',
                          highlightPillClass(h, channel),
                        )}
                      >
                        {h.type}
                      </span>
                    ) : null}
                  </div>
                  {showHeadline ? (
                    <p
                      className={cn(
                        'mt-1 text-sm font-black',
                        channel ? 'text-sky-50' : 'text-slate-900',
                      )}
                    >
                      {headline}
                    </p>
                  ) : null}
                  <p
                    className={cn(
                      isCard || !showHeadline ? 'mt-1' : 'mt-0.5',
                      'text-xs font-medium leading-relaxed',
                      isCard ? 'text-sm font-bold' : '',
                      channel ? 'text-sky-100/90' : 'text-slate-600',
                      isCard && channel ? 'text-sky-50' : '',
                    )}
                  >
                    {detail}
                  </p>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
