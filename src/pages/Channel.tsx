import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { teamHubPathForMatch } from '../utils/teamHubRoute'
import { resolveNationForTeam } from '../utils/resolveMatchNation'
import { tifoGroupIdForMatchChannel } from '../utils/tifoGroupScope'
import { requestTifoEngagementSync } from '../utils/tifoEngagementEvents'
import { nationFlagUrl } from '../utils/nationFlagUrl'
import { useMatches } from '../contexts/MatchesContext'
import { useSportMonksFixtureLineups } from '../hooks/useSportMonksFixtureLineups'
import {
  teamAttackIndicesFromNations,
  teamAttackIndicesFromStandings,
  useTalkFootInternalOdds,
} from '../hooks/useTalkFootInternalOdds'
import { useSportMonksTeamLatestFormPair } from '../hooks/useSportMonksTeamLatestFormPair'
import { extractSidelinedCountsFromSmFixture } from '../api/sportMonks/extractSidelinedFromSm'
import { useSportMonksFixtureLiveStats } from '../hooks/useSportMonksFixtureLiveStats'
import { BetWidget } from '../components/bet/BetWidget'
import { GroupTifoPanel } from '../components/group/GroupTifoPanel'
import { MatchHighlights } from '../components/channel/MatchHighlights'
import { LivePitchActionBanner } from '../components/channel/LivePitchActionBanner'
import { MatchLineupPitch } from '../components/channel/MatchLineupPitch'
import { MatchLineupSubstitutes } from '../components/channel/MatchLineupSubstitutes'
import { LiveMatchStandingsPanel } from '../components/channel/LiveMatchStandingsPanel'
import { WcGroupCard } from '../components/cdm/WcGroupCard'
import { BIG_FIVE_LEAGUE_IDS, type BigFiveLeagueId } from '../data/leagueStandings'
import { useSportMonksLeagueStandings } from '../hooks/useSportMonksLeagueStandings'
import {
  projectStandingsWithLiveMatch,
  projectWcStandingsWithLiveMatch,
} from '../utils/liveStandingsProjection'
import { useOptionalCdm2026Data } from '../contexts/Cdm2026DataContext'
import { isWorldCupCompetitionId } from '../utils/seasonMode'
import { useBetting } from '../hooks/useBetting'
import { writeBetMatchCacheEntry } from '../utils/betMatchResolve'
import { useChannelRouteMatch } from '../hooks/useChannelRouteMatch'
import { useChatSendGuard } from '../hooks/useChatSendGuard'
import { useSubscription } from '../hooks/useSubscription'
import {
  ChannelPrivateSalonGate,
  ChannelSubscriptionExtras,
} from '../components/channel/ChannelSubscriptionExtras'
import {
  LiveMatchChatMessage,
  type LiveMatchChatMessageItem,
} from '../components/channel/LiveMatchChatMessage'
import { ChatPeerMenuHost } from '../components/chat/ChatPeerMenuHost'
import { useChatPeerMenu } from '../hooks/useChatPeerMenu'
import { useChatAuthorModularAvatars, invalidateChatAuthorAvatars } from '../hooks/useChatAuthorModularAvatars'
import { useTalkFootCloudSession } from '../hooks/useTalkFootCloudSession'
import { syncClerkProfileToChatActor } from '../lib/supabase/chatActorProfile'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { useProfile } from '../hooks/useProfile'
import { useTalkFootChatActorId } from '../hooks/useTalkFootChatActorId'
import { useDirectMessagesOptional } from '../contexts/DirectMessagesContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { buildChatPeerMenuTarget } from '../utils/chatPeerSocial'
import { resolveChatDisplayLabel } from '../utils/chatDisplayName'
import { retainStickyChatUserAvatars } from '../utils/stickyChatUserAvatars'
import type { User } from '../types/chat'
import { useAppearanceOptional } from '../contexts/AppearanceContext'
import { useIsMobileTouchViewport } from '../hooks/useIsMobileTouchViewport'
import { useLiveMatchClockLabel } from '../hooks/useLiveMatchClockLabel'
import { useLiveMatchForClock } from '../hooks/useLiveMatchForClock'
import { useLinearDisplayedLiveMinute } from '../hooks/useLinearDisplayedLiveMinute'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { formatGoalEventMinute } from '../utils/matchEventMinute'
import { translateSportMonksLiveTextToFr } from '../utils/translateSportMonksLiveEnToFr'
import { useLiveMatchChatSync } from '../hooks/useLiveMatchChatSync'
import { deriveBettingSuspension } from '../utils/bettingSuspension'
import {
  stadiumAmbiancePercentFromFxCount,
  stadiumAmbianceTierLabel,
} from '../utils/stadiumAmbianceFromFx'
import { useLiveMatchMessageLikesSync } from '../hooks/useLiveMatchMessageLikesSync'
import { useLiveMatchReactionsSync } from '../hooks/useLiveMatchReactionsSync'
import { useLiveMatchSalonStats } from '../hooks/useLiveMatchSalonStats'
import type { FlareColor, Message, ReactionType, MatchTribuneZone } from '../types/chat'
import type { Highlight } from '../data/highlights'
import {
  extractLiveCardDisplayRowsFromSmFixture,
  extractLiveGoalDisplayRowsFromSmFixture,
  extractLiveMinuteFromSmFixture,
  fetchSportMonksFixtureEventsWeather,
  highlightFullscreenDedupeKey,
  goalSemanticKey,
  type SmFixture,
  type SmStartingXiPlayer,
} from '../api/sportMonks'
import { useTalkFootLiveBundle } from '../hooks/useTalkFootLiveBundle'
import { cn } from '../utils/cn'
import {
  enrichLineupOverlaysFromMatchFeed,
  extractPlayerMatchOverlaysFromSmFixture,
  resolveLineupPlayerOverlay,
} from '../api/sportMonks/extractPlayerMatchOverlaysFromSmFixture'
import { extractSubstitutesFromSmFixture, extractSubbedOffPlayerKeys } from '../api/sportMonks/extractSubstitutesFromSmFixture'
import type { LineupSubstituteWithOverlay } from '../components/channel/MatchLineupSubstitutes'
import { attachLineupOverlaysToLayout, computeLineupPitchLayout } from '../utils/lineupPitchPositions'
import { getSportMonksToken } from '../utils/apiTokens'
import { MODERATION_REFUSED_MESSAGE_FR, moderateChatText } from '../utils/bannedWords'
import { resolveTeamLogoUrl } from '../utils/catalogLogos'
import {
  clampLiveGoalRowsToScore,
  cardCoarseDedupeKey,
  extractScorerEventsFromHighlights,
  formatGoalScorerLabel,
  isPlausibleGoalScorerName,
  parseLiveGoalRowsFromHighlights,
  parseLiveCardRowsFromHighlights,
} from '../utils/liveFootballOdds'
import {
  isPostMatchDebriefOpen,
  postMatchDebriefMinutesLeft,
  resolveMatchFinishedAtMs,
} from '../utils/matchDebriefWindow'

/** Ouverture du tchat tribune avant coup d'envoi. */
const MATCH_CHAT_OPEN_BEFORE_KICKOFF_MS = 60 * 60 * 1000

type ChannelMatchTab = 'stats' | 'infos' | 'compo' | 'actions' | 'classement'

function isBigFiveLeagueId(id: string): id is BigFiveLeagueId {
  return (BIG_FIVE_LEAGUE_IDS as readonly string[]).includes(id)
}

type ChatMessageItem = LiveMatchChatMessageItem

type PaidAnimation = {
  id: 'fumigene' | 'ola' | 'tifo-geant' | 'stroboscope'
  label: string
  cost: number
  emoji: string
}

type ActivePaidFx = {
  id: PaidAnimation['id']
  label: string
  tifoSide?: 'home' | 'away'
  flareColor?: FlareColor
}

type PaidFxLayer = {
  layerId: string
  fx: ActivePaidFx
  seed: number
}

const PAID_FX_LAYER_MS = 4200
const MAX_PAID_FX_LAYERS = 16

const FLARE_COLOR_OPTIONS: { id: FlareColor; label: string; swatch: string }[] = [
  { id: 'red', label: 'Rouge', swatch: '#ef4444' },
  { id: 'blue', label: 'Bleu', swatch: '#3b82f6' },
  { id: 'green', label: 'Vert', swatch: '#22c55e' },
  { id: 'yellow', label: 'Jaune', swatch: '#eab308' },
]

const FLARE_COLOR_LABELS: Record<FlareColor, string> = {
  red: 'rouge',
  blue: 'bleu',
  green: 'vert',
  yellow: 'jaune',
}


const CHANNEL_DESKTOP_GRID =
  'gap-2 md:grid-cols-[minmax(14rem,0.86fr)_minmax(22rem,2.12fr)_minmax(14.5rem,0.95fr)] md:gap-2.5'

/** Grille 2 colonnes : compo/paris via sheet mobile (évite colonne droite écrasée sur tablette). */
const CHANNEL_TOUCH_GRID =
  'gap-2 md:grid-cols-[minmax(14rem,0.86fr)_minmax(0,1fr)] lg:grid-cols-[minmax(14rem,0.86fr)_minmax(22rem,2.12fr)_minmax(18rem,0.95fr)] lg:gap-2.5'

function flareSmokeLayers(color: FlareColor) {
  const layers: Record<
    FlareColor,
    { plumeA: string; plumeB: string; mistA: string; mistB: string }
  > = {
    red: {
      plumeA: 'linear-gradient(to top, rgba(234,88,12,0.55), rgba(244,63,94,0.42), transparent)',
      plumeB: 'linear-gradient(to top, rgba(225,29,72,0.55), rgba(239,68,68,0.45), transparent)',
      mistA: 'rgba(255,255,255,0.14)',
      mistB: 'rgba(254,243,199,0.14)',
    },
    blue: {
      plumeA: 'linear-gradient(to top, rgba(37,99,235,0.55), rgba(56,189,248,0.42), transparent)',
      plumeB: 'linear-gradient(to top, rgba(29,78,216,0.55), rgba(14,165,233,0.45), transparent)',
      mistA: 'rgba(191,219,254,0.16)',
      mistB: 'rgba(224,242,254,0.14)',
    },
    green: {
      plumeA: 'linear-gradient(to top, rgba(22,163,74,0.55), rgba(52,211,153,0.42), transparent)',
      plumeB: 'linear-gradient(to top, rgba(21,128,61,0.55), rgba(34,197,94,0.45), transparent)',
      mistA: 'rgba(187,247,208,0.16)',
      mistB: 'rgba(220,252,231,0.14)',
    },
    yellow: {
      plumeA: 'linear-gradient(to top, rgba(234,179,8,0.58), rgba(250,204,21,0.44), transparent)',
      plumeB: 'linear-gradient(to top, rgba(202,138,4,0.55), rgba(253,224,71,0.45), transparent)',
      mistA: 'rgba(254,249,195,0.18)',
      mistB: 'rgba(255,255,255,0.14)',
    },
  }
  return layers[color]
}

const CONFETTI_BURST_COLORS = ['#0a3dff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f472b6']

function PaidConfettiBurst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(seed * 9999 + n * 12345) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 58 }, (_, i) => ({
      id: i,
      side: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
      x: (rand(i) - 0.5) * 320,
      delay: rand(i + 50) * 220,
      color: CONFETTI_BURST_COLORS[i % CONFETTI_BURST_COLORS.length],
    }))
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <i
          key={p.id}
          className={`tf-confetti tf-confetti--${p.side}`}
          style={
            {
              ['--x' as string]: `${p.x}px`,
              ['--d' as string]: `${p.delay}ms`,
              ['--c' as string]: p.color,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function flareParticleGradient(color: FlareColor): string {
  const map: Record<FlareColor, string> = {
    red: 'radial-gradient(circle at 35% 35%, rgba(255,90,70,0.92), rgba(239,68,68,0.55) 45%, rgba(255,59,48,0.18) 68%, transparent 78%)',
    blue: 'radial-gradient(circle at 35% 35%, rgba(96,165,250,0.92), rgba(59,130,246,0.55) 45%, rgba(37,99,235,0.18) 68%, transparent 78%)',
    green: 'radial-gradient(circle at 35% 35%, rgba(74,222,128,0.92), rgba(34,197,94,0.55) 45%, rgba(22,163,74,0.18) 68%, transparent 78%)',
    yellow: 'radial-gradient(circle at 35% 35%, rgba(253,224,71,0.95), rgba(234,179,8,0.58) 45%, rgba(202,138,4,0.2) 68%, transparent 78%)',
  }
  return map[color]
}

function flareScreenTint(color: FlareColor): string {
  const map: Record<FlareColor, string> = {
    red: 'radial-gradient(circle at 50% 85%, rgba(239,68,68,0.42), rgba(220,38,38,0.12) 42%, transparent 72%)',
    blue: 'radial-gradient(circle at 50% 85%, rgba(59,130,246,0.4), rgba(37,99,235,0.1) 42%, transparent 72%)',
    green: 'radial-gradient(circle at 50% 85%, rgba(34,197,94,0.38), rgba(22,163,74,0.1) 42%, transparent 72%)',
    yellow: 'radial-gradient(circle at 50% 85%, rgba(234,179,8,0.4), rgba(202,138,4,0.12) 42%, transparent 72%)',
  }
  return map[color]
}

function PaidFlareBurst({ seed, color }: { seed: number; color: FlareColor }) {
  const smoke = flareSmokeLayers(color)
  const particles = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(seed * 8888 + n * 24680) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${6 + rand(i) * 88}%`,
      x: (rand(i + 17) - 0.5) * 260,
      delay: rand(i + 31) * 520,
    }))
  }, [seed])

  return (
    <div
      className="tf-paid-flare-stack pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="tf-flare-screen-pulse"
        style={{ background: flareScreenTint(color) }}
      />
      <div
        className="tf-flare-plume tf-flare-plume--left"
        style={{ background: smoke.plumeA }}
      />
      <div
        className="tf-flare-plume tf-flare-plume--right"
        style={{ background: smoke.plumeB }}
      />
      <div
        className="tf-flare-plume tf-flare-plume--center"
        style={{
          background: `linear-gradient(to top, ${smoke.mistA}, ${smoke.mistB}, transparent)`,
        }}
      />
      {particles.map((p) => (
        <i
          key={p.id}
          className="tf-flare-particle"
          style={
            {
              left: p.left,
              ['--x' as string]: `${p.x}px`,
              ['--d' as string]: `${p.delay}ms`,
              ['--flare-bg' as string]: flareParticleGradient(color),
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

function PaidPhoneFlashBurst({ seed }: { seed: number }) {
  const flashes = useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(seed * 7777 + n * 54321) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 54 }, (_, i) => ({
      id: i,
      left: rand(i) * 100,
      top: 12 + rand(i + 11) * 78,
      size: 7 + rand(i + 22) * 14,
      delay: rand(i + 33) * 1200,
      beam: rand(i + 44) > 0.68,
    }))
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black/10" aria-hidden>
      {flashes.map((f) => (
        <span key={f.id}>
          <span
            className="tf-phone-flash"
            style={
              {
                left: `${f.left}%`,
                top: `${f.top}%`,
                ['--w' as string]: `${f.size}px`,
                ['--d' as string]: `${f.delay}ms`,
              } as React.CSSProperties
            }
          />
          {f.beam ? (
            <span
              className="tf-phone-flash-beam"
              style={
                {
                  left: `${f.left}%`,
                  top: `${f.top}%`,
                  ['--d' as string]: `${f.delay + 35}ms`,
                } as React.CSSProperties
              }
            />
          ) : null}
        </span>
      ))}
    </div>
  )
}

function Card({
  className = '',
  children,
  style,
}: {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <section
      className={`tf-live-card relative overflow-hidden rounded-xl border border-[#2d5f8a]/55 bg-[#0b2440] p-4 text-sky-50 shadow-[0_10px_28px_rgba(2,8,18,0.3),inset_0_1px_0_rgba(125,211,252,0.14)] ${className}`}
      style={style}
    >
      {children}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const appearance = useAppearanceOptional()
  const light = appearance?.appearance === 'light'
  return (
    <h3
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold tracking-wide',
        light ? 'text-[#023458]' : 'text-sky-100',
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#32d4ff] shadow-[0_0_8px_rgba(50,212,255,0.45)]" />
      {children}
    </h3>
  )
}

function SideInfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[3.5rem] flex-col justify-center rounded-lg border border-[#4a7faa]/50 bg-[#0c2d4a] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p className="text-[11px] font-semibold leading-snug text-sky-100/95">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold leading-tight text-white">{children}</p>
    </div>
  )
}

/** Ligne label / valeur — colonne latérale pré-match */
function SideEncartRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#4a7faa]/55 bg-[#0c2d4a] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-[11px] font-semibold leading-snug text-sky-100/95">{label}</p>
      <p className="mt-1 text-sm font-bold leading-snug text-white">{value}</p>
    </div>
  )
}

function TeamLogo({ label, logoUrl }: { label: string; logoUrl?: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#d9e6f3] text-xs font-bold text-[#0a223a]">
      {logoUrl ? (
        <img src={logoUrl} alt={`Logo ${label}`} className="h-[78%] w-[78%] object-contain" loading="lazy" />
      ) : (
        label.slice(0, 3).toUpperCase()
      )}
    </div>
  )
}

function teamShortChip(label: string) {
  const cleaned = label.replace(/[^A-Za-z0-9 ]/g, ' ').trim()
  if (!cleaned) return '---'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}${parts[0][1] ?? ''}`.toUpperCase()
  }
  return parts[0].slice(0, 3).toUpperCase()
}

function fullscreenKindFromHighlight(h: Highlight): 'goal' | 'card' | 'var' | null {
  const t = String(h.type || '').trim()
  if (t === 'But') return 'goal'
  if (t === 'Carton') return 'card'
  if (t === 'VAR') return 'var'
  return null
}

function fullscreenEventDedupeKey(h: Highlight, kind: 'goal' | 'card' | 'var'): string {
  if (kind === 'goal') {
    const semantic = goalSemanticKey(h)
    if (semantic) return `goal|${semantic}`
    if (h.side && h.minute > 0) return `goal|${h.minute}|${h.side}`
  }
  if (kind === 'card') {
    const coarse = cardCoarseDedupeKey(h)
    if (coarse) return `card|${coarse}`
  }
  return highlightFullscreenDedupeKey(h)
}

function highlightWithDetectedSide(
  h: Highlight,
  detect: (raw: string) => 'home' | 'away' | undefined,
): Highlight {
  const side = h.side ?? detect(`${h.title ?? ''} ${h.detail ?? ''}`)
  return side ? { ...h, side } : h
}

function preferFullscreenHighlight(a: Highlight, b: Highlight): Highlight {
  if (a.id.startsWith('sm-event-') && !b.id.startsWith('sm-event-')) return a
  if (b.id.startsWith('sm-event-') && !a.id.startsWith('sm-event-')) return b
  if (a.scorerName?.trim() && !b.scorerName?.trim()) return a
  if (b.scorerName?.trim() && !a.scorerName?.trim()) return b
  if (a.type === 'But' && b.type === 'But') {
    const aPlausible = a.minute > 0 && a.minute <= 90
    const bPlausible = b.minute > 0 && b.minute <= 90
    if (aPlausible && !bPlausible) return a
    if (bPlausible && !aPlausible) return b
    if (aPlausible && bPlausible && a.minute !== b.minute) {
      return a.minute <= b.minute ? a : b
    }
  }
  return a
}

function highlightMinuteLabel(h: Pick<Highlight, 'minute' | 'inSecondHalf'>): string {
  const label = formatGoalEventMinute(h.minute, { inSecondHalf: h.inSecondHalf })
  return label || (h.minute > 0 ? `${h.minute}'` : '')
}

const FULLSCREEN_SEEN_KEYS_MAX = 200

function fullscreenSeenStorageKey(matchId: string): string {
  return `tf-fs-seen-${matchId}`
}

function loadFullscreenSeenKeys(matchId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(fullscreenSeenStorageKey(matchId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((k): k is string => typeof k === 'string' && k.length > 0))
  } catch {
    return new Set()
  }
}

function persistFullscreenSeenKeys(matchId: string, keys: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      fullscreenSeenStorageKey(matchId),
      JSON.stringify([...keys].slice(-FULLSCREEN_SEEN_KEYS_MAX)),
    )
  } catch {
    /* private mode */
  }
}

function rememberFullscreenSeenKey(matchId: string | undefined, keys: Set<string>, key: string): void {
  keys.add(key)
  if (matchId) persistFullscreenSeenKeys(matchId, keys)
}

/** Buteurs uniquement, sous le camp qui a marqué. */
function LiveHeaderScorers({
  goals,
  align,
  light,
}: {
  goals: { name: string; minute: number; inSecondHalf?: boolean; ownGoal?: boolean }[]
  align: 'left' | 'right'
  light: boolean
}) {
  if (!goals.length) return null
  return (
    <ul
      className={cn(
        'mt-1 flex w-full flex-col gap-0.5',
        align === 'right' ? 'items-end text-right' : 'items-start text-left',
      )}
      aria-label={align === 'right' ? 'Buteurs extérieur' : 'Buteurs domicile'}
    >
      {goals.map((g, i) => (
        <li
          key={`${g.name}-${g.minute}-${i}`}
          className={cn(
            'flex max-w-[min(100%,11rem)] items-baseline gap-1 text-[10px] font-bold leading-tight sm:max-w-[min(100%,14rem)] sm:text-[11px]',
            align === 'right' ? 'flex-row-reverse' : 'flex-row',
            light ? 'text-emerald-800' : 'text-cyan-100',
          )}
        >
          <span
            className={cn(
              'min-w-0 truncate',
              g.ownGoal && (light ? 'text-red-700' : 'text-red-400'),
            )}
          >
            ⚽ {formatGoalScorerLabel(g.name, null, { ownGoal: g.ownGoal })}
          </span>
          <span className={cn('shrink-0 tabular-nums opacity-90', light ? 'text-emerald-900/75' : 'text-cyan-200/80')}>
            {formatGoalEventMinute(g.minute, { inSecondHalf: g.inSecondHalf }) || `${g.minute}'`}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Cartons jaunes / rouges sous le camp concerné (style Flashscore). */
function LiveHeaderCards({
  cards,
  align,
  light,
}: {
  cards: { name: string; minute: number; inSecondHalf?: boolean; color: 'yellow' | 'red' }[]
  align: 'left' | 'right'
  light: boolean
}) {
  if (!cards.length) return null
  return (
    <ul
      className={cn(
        'mt-0.5 flex w-full flex-col gap-0.5',
        align === 'right' ? 'items-end text-right' : 'items-start text-left',
      )}
      aria-label={align === 'right' ? 'Cartons extérieur' : 'Cartons domicile'}
    >
      {cards.map((c, i) => (
        <li
          key={`${c.color}-${c.name}-${c.minute}-${i}`}
          className={cn(
            'flex max-w-[min(100%,11rem)] items-baseline gap-1 text-[10px] font-bold leading-tight sm:max-w-[min(100%,14rem)] sm:text-[11px]',
            align === 'right' ? 'flex-row justify-end' : 'flex-row',
            light
              ? c.color === 'red'
                ? 'text-rose-800'
                : 'text-amber-900'
              : c.color === 'red'
                ? 'text-rose-200'
                : 'text-amber-200',
          )}
        >
          <span className="shrink-0" aria-hidden>
            {c.color === 'red' ? '🟥' : '🟨'}
          </span>
          <span className="min-w-0 truncate">{c.name}</span>
          <span
            className={cn(
              'shrink-0 tabular-nums opacity-90',
              light ? 'text-slate-700/80' : 'text-slate-200/75',
            )}
          >
            {formatGoalEventMinute(c.minute, { inSecondHalf: c.inSecondHalf }) || `${c.minute}'`}
          </span>
        </li>
      ))}
    </ul>
  )
}

function LiveHeaderTeamEvents({
  goals,
  cards,
  align,
  light,
}: {
  goals: { name: string; minute: number }[]
  cards: { name: string; minute: number; color: 'yellow' | 'red' }[]
  align: 'left' | 'right'
  light: boolean
}) {
  if (!goals.length && !cards.length) return null
  return (
    <div className="w-full">
      <LiveHeaderScorers goals={goals} align={align} light={light} />
      <LiveHeaderCards cards={cards} align={align} light={light} />
    </div>
  )
}

function cloudMessageToUi(m: Message): ChatMessageItem {
  const created = new Date(m.createdAt)
  const time = Number.isFinite(created.getTime())
    ? created.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  return {
    id: m.id,
    userId: m.userId,
    username: m.authorDisplayName?.trim() || 'Supporteur',
    text: m.text,
    time,
    avatarSeed: m.userId || m.authorDisplayName || m.id,
    avatarAccent: 'violet',
    likes: 0,
    emoteId: m.emoteId,
    matchTribune: m.matchTribune,
    createdAtMs: m.createdAt,
    clerkActorKey: m.clerkActorKey,
  }
}

function liveChatVisibleInTribune(msg: ChatMessageItem, zone: MatchTribuneZone): boolean {
  if (!msg.matchTribune) return zone === 'neutres' || zone === 'analystes'
  return msg.matchTribune === zone
}

function paidAnimationToReactionType(id: PaidAnimation['id']): ReactionType {
  if (id === 'fumigene') return 'flare'
  if (id === 'ola') return 'confetti'
  if (id === 'tifo-geant') return 'goal'
  return 'rage'
}

function reactionTypeToPaidFx(
  type: ReactionType,
  opts?: { tifoSide?: 'home' | 'away'; flareColor?: FlareColor },
): ActivePaidFx {
  if (type === 'flare') {
    const flareColor = opts?.flareColor ?? 'red'
    return {
      id: 'fumigene',
      label: `Fumigène ${FLARE_COLOR_LABELS[flareColor]}`,
      flareColor,
    }
  }
  if (type === 'confetti') return { id: 'ola', label: 'Confettis' }
  if (type === 'goal') {
    return {
      id: 'tifo-geant',
      label: 'Tifo géant',
      ...(opts?.tifoSide ? { tifoSide: opts.tifoSide } : {}),
    }
  }
  return { id: 'stroboscope', label: 'Flash téléphones' }
}

function TeamLogoLink({
  to,
  label,
  logoUrl,
  clubId,
  sportMonksTeamId,
  nationFlagSrc,
}: {
  to?: string | null
  label: string
  logoUrl?: string
  clubId?: string
  sportMonksTeamId?: number
  nationFlagSrc?: string
}) {
  const resolved =
    nationFlagSrc ??
    (clubId != null
      ? resolveTeamLogoUrl(clubId, { apiLogoUrl: logoUrl, sportMonksTeamId }) ?? logoUrl
      : logoUrl)
  const inner = <TeamLogo label={label} logoUrl={resolved} />
  if (!to) return inner
  return (
    <Link
      to={to}
      className="shrink-0 rounded-full outline-none ring-offset-2 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400/80"
      aria-label={`Page ${label}`}
    >
      {inner}
    </Link>
  )
}

function ChannelLiveStatBar({
  row,
}: {
  row: { label: string; home: number; away: number }
}) {
  const total = (row.home ?? 0) + (row.away ?? 0)
  const homePct =
    total > 0 ? Math.max(8, Math.round(((row.home ?? 0) / total) * 100)) : 50
  const awayPct =
    total > 0 ? Math.max(8, Math.round(((row.away ?? 0) / total) * 100)) : 50
  return (
    <div className="rounded-lg border border-white/12 bg-[#0a1f35]/80 px-2.5 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-black tabular-nums text-white">{row.home}</span>
        <span className="text-[11px] font-bold text-sky-100">{row.label}</span>
        <span className="text-sm font-black tabular-nums text-white">{row.away}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-black/35 ring-1 ring-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/90 to-emerald-400/70"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-rose-500/90 to-rose-400/70"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  )
}

function MatchRow({
  home,
  away,
  homeScore,
  awayScore,
}: {
  home: string
  away: string
  homeScore: number
  awayScore: number
}) {
  return (
    <div className="tf-live-soft-surface flex items-center justify-between rounded-lg bg-[#0a233d] px-3 py-2">
      <div className="flex items-center gap-2">
        <TeamLogo label={home} />
        <span className="text-sm font-semibold text-sky-50">{home}</span>
      </div>
      <span className="text-lg font-bold text-white">
        {homeScore} - {awayScore}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-sky-50">{away}</span>
        <TeamLogo label={away} />
      </div>
    </div>
  )
}

export function ChannelPage() {
  const appearance = useAppearanceOptional()
  const isLight = appearance?.appearance === 'light'
  const L = isLight
  /** Barre d’onglets mobile + surfaces qui doivent rester lisibles avec les overrides CSS du mode jour */
  const chDockShell = L
    ? 'border-slate-200/90 bg-white/95 shadow-[0_10px_28px_rgba(15,40,70,0.1)] backdrop-blur-sm'
    : 'border-[#3a6690] bg-[#0a1f35]/92 shadow-2xl backdrop-blur-sm'
  const chDockBtn = (active: boolean, accent?: 'paris') =>
    cn(
      'min-h-11 rounded-lg border px-1.5 py-2 text-[10px] font-black leading-tight transition active:scale-[0.97]',
      'touch-manipulation select-none [-webkit-tap-highlight-color:transparent]',
      'max-[360px]:min-h-10 max-[360px]:px-1 max-[360px]:text-[9px]',
      accent === 'paris' && !active
        ? L
          ? 'border-emerald-500/70 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-400/35'
          : 'border-emerald-400/55 bg-emerald-500/15 text-emerald-100'
        : null,
      L
        ? active
          ? 'border-sky-500 bg-sky-200 text-[#023458] shadow-sm ring-2 ring-sky-400/40'
          : accent === 'paris'
            ? null
            : 'border-slate-200 bg-sky-50 text-[#023458] shadow-sm'
        : active
          ? 'border-sky-300 bg-sky-400/25 text-white ring-2 ring-sky-300/35'
          : accent === 'paris'
            ? null
            : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-100',
    )
  const chSheetTitle = L ? 'text-[#023458]' : 'text-sky-100'
  const chSideInset =
    'rounded-lg border border-[#4a7faa]/55 bg-[#0c2d4a] text-center text-xs font-semibold leading-snug text-sky-100'
  const chSideSelect =
    'tf-live-control w-full rounded-lg border border-[#4a7faa]/60 bg-[#0c2d4a] px-2.5 py-2 text-xs font-semibold text-white outline-none focus:border-cyan-300/60'
  const chSideActionBtn =
    'tf-live-control mt-2 w-full rounded-lg border border-[#4a7faa]/55 bg-[#1a3d5c] px-2.5 py-2 text-xs font-bold text-sky-100 transition hover:bg-[#234d6d] disabled:cursor-not-allowed disabled:border-[#3a5a78]/50 disabled:bg-[#0a1f35] disabled:text-sky-200/80'
  const chSheetBackdrop = L ? 'bg-slate-900/30 backdrop-blur-[2px]' : 'bg-slate-900/60 backdrop-blur-[2px]'
  const chSheetPanel = L ? 'border-slate-200 bg-white' : 'border-[#3a6690] bg-[#0b2440]'
  const chSheetGhostBtn = L
    ? 'rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-[#023458]'
    : 'rounded-md border border-[#4f7ea8] bg-[#0e2a45] px-2 py-1 text-[10px] font-bold text-sky-100'
  const chSheetTabActive = L
    ? 'border-sky-400 bg-sky-100 text-[#023458]'
    : 'border-sky-300 bg-sky-300/20 text-sky-100'
  const chSheetTabIdle = L
    ? 'border-slate-200 bg-slate-100 text-[#2a4f68]'
    : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/80'
  const chInfoCell = L ? 'rounded-md bg-slate-100 px-2 py-1.5 text-[#0a223a]' : 'rounded-md bg-[#0a1f35]/70 px-2 py-1.5 text-sky-100'
  const chLineupTabActive = L
    ? 'border-sky-400 bg-sky-100 text-[#023458]'
    : 'border-sky-300 bg-sky-300/20 text-sky-50'
  const chLineupTabIdle = L
    ? 'border-slate-200 bg-slate-100 text-[#2a4f68]'
    : 'border-[#4f7ea8] bg-[#0e2a45] text-sky-200/85'
  const chAlertBox = L
    ? 'rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-[#0a223a]'
    : 'rounded-md border border-[#3a6690]/55 bg-[#0a1f35]/85 px-3 py-2 text-xs font-semibold text-sky-100'
  const chAlertBoxPlain = L
    ? 'rounded-md bg-slate-100 px-2 py-2 text-xs font-semibold text-[#0a223a]'
    : 'rounded-md bg-[#0a1f35]/70 px-2 py-2 text-xs font-semibold text-sky-100'
  /** Panneau FX (chat) : scroll + fond lisible en mode jour */
  const chFxPanelShell = L
    ? 'rounded-xl border border-slate-200 bg-white shadow-xl'
    : 'rounded-xl bg-[#102945] shadow-xl'
  const chFxSectionLabel = L ? 'text-[#3a5872]' : 'text-sky-200/70'
  const chFxMuted = L ? 'text-[#3d5670]' : 'text-sky-200/85'
  const chFxTitle = L ? 'text-[#023458]' : 'text-sky-100/85'
  const chFxPanelBtn = L
    ? 'rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-left transition hover:border-sky-300/60 hover:bg-sky-50'
    : 'rounded-md border border-[#4b6f90] bg-[#0b2741] px-2 py-1.5 text-left transition hover:border-orange-400/60'
  const chFxCloseBtn = L
    ? 'rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#023458]'
    : 'rounded border border-[#5f81a1] px-1.5 py-0.5 text-[10px] font-bold text-sky-100'
  const navigate = useNavigate()
  const { matchId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user: authUser } = useAuth()
  const { check: checkChatSend, recordSend: recordChatSend } = useChatSendGuard()
  const {
    tier,
    hasVerifiedBadge,
    canStreamSalon,
    canJoinVoiceSalons,
  } = useSubscription()
  const mayStreamSalon = canStreamSalon || Boolean(authUser?.isAdmin)
  const chatActorId = useTalkFootChatActorId()
  const { ensureCloudSession } = useTalkFootCloudSession()
  const selfChatUserId = chatActorId ?? authUser?.id ?? 'me'
  const selfUserId = selfChatUserId
  const { profile: selfProfile } = useProfile()
  const selfAvatarKeys = useMemo(() => {
    const keys = new Set<string>(['me'])
    if (authUser?.id) keys.add(authUser.id)
    if (chatActorId) keys.add(chatActorId)
    if (selfChatUserId) keys.add(selfChatUserId)
    return [...keys]
  }, [authUser?.id, chatActorId, selfChatUserId])
  const dm = useDirectMessagesOptional()
  const chatPeerMenu = useChatPeerMenu()
  const chatSocialEnabled = isSupabaseConfigured() && Boolean(dm)
  const { matches } = useMatches()
  const cdm = useOptionalCdm2026Data()
  const { routeMatch, hasRouteMatchId, waitingRouteResolution, routeNotFound } =
    useChannelRouteMatch(matchId)
  const fallbackMatch = useMemo(
    () => matches.find((m) => m.status === 'live') ?? matches[0] ?? null,
    [matches],
  )
  /** Avec `:matchId` dans l’URL : uniquement ce match (jamais un fallback type Mexique–AFS). */
  const match = hasRouteMatchId
    ? waitingRouteResolution
      ? null
      : routeMatch
    : fallbackMatch
  useEffect(() => {
    if (hasRouteMatchId || !fallbackMatch) return
    navigate(`/channel/${fallbackMatch.id}`, { replace: true })
  }, [hasRouteMatchId, fallbackMatch, navigate])
  useEffect(() => {
    if (!hasRouteMatchId || !routeMatch || !matchId) return
    writeBetMatchCacheEntry(routeMatch, matchId)
  }, [hasRouteMatchId, routeMatch, matchId])

  const homeName = match?.home.name ?? match?.home.shortName ?? 'Paris SG'
  const awayName = match?.away.name ?? match?.away.shortName ?? 'Nantes'
  const homeFullName = match?.home.name ?? homeName
  const awayFullName = match?.away.name ?? awayName
  /** Libellés courts pour les boutons FX tifo (évite la troncature sur mobile). */
  const tifoFxHomeLabel = match?.home.shortName ?? homeName
  const tifoFxAwayLabel = match?.away.shortName ?? awayName
  const initialHomeScore = match?.score?.home ?? 0
  const initialAwayScore = match?.score?.away ?? 0
  const [displayScore, setDisplayScore] = useState({ home: initialHomeScore, away: initialAwayScore })
  const status = match?.status ?? 'upcoming'
  const isUpcoming = status === 'upcoming'
  const { liveBundleFixture } = useTalkFootLiveBundle(match?.sportMonksFixtureId, status)
  const matchForClock = useLiveMatchForClock(match) ?? match
  useEffect(() => {
    const fromClock = matchForClock?.score
    const fromMatch = match?.score
    const home = fromClock?.home ?? fromMatch?.home ?? initialHomeScore
    const away = fromClock?.away ?? fromMatch?.away ?? initialAwayScore
    setDisplayScore({ home, away })
  }, [match?.id, matchForClock?.score?.home, matchForClock?.score?.away, match?.score?.home, match?.score?.away, initialHomeScore, initialAwayScore])
  const homeScore = displayScore.home
  const awayScore = displayScore.away
  const goalTeamHints = useMemo(() => {
    if (!match) return null
    const homeNation = resolveNationForTeam(match.home, match.competition.id)
    const awayNation = resolveNationForTeam(match.away, match.competition.id)
    return {
      home: {
        shortName: match.home.shortName,
        name: match.home.name,
        sportMonksTeamId: match.home.sportMonksTeamId,
        aliases: [homeNation?.nameEn, homeNation?.nameFr].filter(Boolean) as string[],
      },
      away: {
        shortName: match.away.shortName,
        name: match.away.name,
        sportMonksTeamId: match.away.sportMonksTeamId,
        aliases: [awayNation?.nameEn, awayNation?.nameFr].filter(Boolean) as string[],
      },
    }
  }, [match])
  const homeHeaderLabel = match?.home.shortName ?? homeName
  const awayHeaderLabel = match?.away.shortName ?? awayName
  const homeNation = match ? resolveNationForTeam(match.home, match.competition.id) : null
  const awayNation = match ? resolveNationForTeam(match.away, match.competition.id) : null
  const highlightTeamLabels = useMemo(
    () =>
      match
        ? {
            home: homeNation?.nameFr ?? match.home.name,
            away: awayNation?.nameFr ?? match.away.name,
          }
        : undefined,
    [match, homeNation, awayNation],
  )
  const homeTeamPath = match ? teamHubPathForMatch(match.home, match.competition.id) : null
  const awayTeamPath = match ? teamHubPathForMatch(match.away, match.competition.id) : null
  const homeFlagSrc = homeNation ? (nationFlagUrl(homeNation.iso, 40) ?? undefined) : undefined
  const awayFlagSrc = awayNation ? (nationFlagUrl(awayNation.iso, 40) ?? undefined) : undefined
  const isFinished = status === 'finished'
  const { starters, bench, formations } = useSportMonksFixtureLineups(match?.sportMonksFixtureId)
  const betting = useBetting(match?.id ?? '', match ?? null)
  const { liveStatRows, liveStatsLoading, smTimelineHighlights } = useSportMonksFixtureLiveStats(
    match?.sportMonksFixtureId,
    status,
    match?.id,
  )
  const timelineHighlightsRef = useRef(smTimelineHighlights)
  timelineHighlightsRef.current = smTimelineHighlights

  const standingsLeagueId = match && isBigFiveLeagueId(match.competition.id) ? match.competition.id : null
  const { standingsRows, standingsSource, standingsLoading, standingsError } =
    useSportMonksLeagueStandings(standingsLeagueId ?? 'ligue-1')
  const standingsSourceLabel = useMemo(() => {
    if (standingsSource === 'live') return 'SportMonks · classement live'
    if (standingsSource === 'season') return 'SportMonks · saison en cours'
    if (standingsSource === 'teamsSeason') return 'SportMonks · stats équipes'
    return undefined
  }, [standingsSource])
  const displayedStandingsRows = useMemo(() => {
    if (!standingsLeagueId || !standingsRows.length || !match) return []
    if (status !== 'live') return standingsRows
    return projectStandingsWithLiveMatch(standingsRows, {
      homeTeamId: match.home.id,
      awayTeamId: match.away.id,
      homeScore,
      awayScore,
    })
  }, [standingsLeagueId, standingsRows, match, status, homeScore, awayScore])

  const matchWcGroup = useMemo(() => {
    if (!match || !isWorldCupCompetitionId(match.competition.id) || !cdm?.dataset) return null
    const isos = new Set([homeNation?.iso, awayNation?.iso].filter(Boolean) as string[])
    if (!isos.size) return null
    return cdm.dataset.groups.find((g) => g.teams.some((t) => isos.has(t.iso))) ?? null
  }, [match, cdm?.dataset, homeNation?.iso, awayNation?.iso])
  const wcStandingsBase = matchWcGroup ? (cdm?.getStanding(matchWcGroup.id) ?? []) : []
  const displayedWcStandings = useMemo(() => {
    if (!matchWcGroup || !wcStandingsBase.length || !homeNation || !awayNation) return wcStandingsBase
    if (status !== 'live') return wcStandingsBase
    return projectWcStandingsWithLiveMatch(wcStandingsBase, {
      homeIso: homeNation.iso,
      awayIso: awayNation.iso,
      homeScore,
      awayScore,
    })
  }, [matchWcGroup, wcStandingsBase, homeNation, awayNation, status, homeScore, awayScore])
  const hasChannelStandings = Boolean(standingsLeagueId || matchWcGroup)

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'live' && m.id !== match?.id),
    [matches, match?.id],
  )
  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState<string>('')
  useEffect(() => {
    if (!liveMatches.length) {
      setSelectedLiveMatchId('')
      return
    }
    setSelectedLiveMatchId((prev) =>
      liveMatches.some((m) => m.id === prev) ? prev : liveMatches[0].id,
    )
  }, [liveMatches])
  const selectedLiveMatch = useMemo(
    () => liveMatches.find((m) => m.id === selectedLiveMatchId) ?? null,
    [liveMatches, selectedLiveMatchId],
  )

  const [nowMs, setNowMs] = useState(() => Date.now())
  const liveDisplayedMinute = useLinearDisplayedLiveMinute(matchForClock)
  const liveClockLabel = useLiveMatchClockLabel(matchForClock)
  const livePeriodTicking = matchForClock?.livePeriodTicking !== false
  const bettingSuspension = useMemo(
    () =>
      deriveBettingSuspension({
        status,
        liveClockPaused: matchForClock?.liveClockPaused,
        minute: liveDisplayedMinute,
        periodTicking: livePeriodTicking,
        highlights: smTimelineHighlights,
      }),
    [status, matchForClock?.liveClockPaused, liveDisplayedMinute, livePeriodTicking, smTimelineHighlights],
  )

  const sidelinedCounts = useMemo(
    () => extractSidelinedCountsFromSmFixture(liveBundleFixture),
    [liveBundleFixture],
  )
  const formMatch = match ?? fallbackMatch
  const { teamPairForm } = useSportMonksTeamLatestFormPair(
    formMatch,
    Boolean(formMatch && status === 'upcoming'),
  )
  const { odds1x2, oddsOverUnder25, oddsLoading, oddsMeta } = useTalkFootInternalOdds({
    match,
    standingsRows: displayedStandingsRows.length ? displayedStandingsRows : standingsRows,
    standingsLoading,
    homeFormOverride: teamPairForm?.home,
    awayFormOverride: teamPairForm?.away,
    homeAbsences: sidelinedCounts.home,
    awayAbsences: sidelinedCounts.away,
    liveStatRows,
    liveScore: { home: homeScore, away: awayScore },
    liveMinute: liveDisplayedMinute,
    homeNationIso: homeNation?.iso ?? null,
    awayNationIso: awayNation?.iso ?? null,
  })
  const attackIndices = useMemo(
    () => {
      if (!match) return { home: 50, away: 50 }
      if (homeNation?.iso && awayNation?.iso) {
        return teamAttackIndicesFromNations(homeNation.iso, awayNation.iso)
      }
      return teamAttackIndicesFromStandings(
        displayedStandingsRows.length ? displayedStandingsRows : standingsRows,
        match.home.id,
        match.away.id,
      )
    },
    [match, homeNation?.iso, awayNation?.iso, displayedStandingsRows, standingsRows],
  )
  const hasAnyLineup = (starters?.home?.length ?? 0) > 0 || (starters?.away?.length ?? 0) > 0
  const oddsReady = Boolean(
    odds1x2 && odds1x2.home >= 1.01 && odds1x2.draw >= 1.01 && odds1x2.away >= 1.01,
  )

  useEffect(() => {
    if (status === 'live') return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [status])
  const [witnessedFinishedAtMs, setWitnessedFinishedAtMs] = useState<number | null>(null)
  const prevMatchStatusRef = useRef(status)
  useEffect(() => {
    setWitnessedFinishedAtMs(null)
    prevMatchStatusRef.current = status
  }, [match?.id])
  useEffect(() => {
    if (prevMatchStatusRef.current === 'live' && status === 'finished') {
      setWitnessedFinishedAtMs(Date.now())
    }
    if (status !== 'finished') {
      setWitnessedFinishedAtMs(null)
    }
    prevMatchStatusRef.current = status
  }, [status, match?.id])
  const finishedAtMs = useMemo(
    () =>
      resolveMatchFinishedAtMs({
        match: match ?? null,
        fixture: liveBundleFixture,
        witnessedFinishedAtMs,
      }),
    [match, liveBundleFixture, witnessedFinishedAtMs],
  )
  const chatDebriefOpen = isFinished && isPostMatchDebriefOpen(finishedAtMs, nowMs)
  const chatClosedAfterMatch = isFinished && !chatDebriefOpen
  const debriefMinutesLeft = postMatchDebriefMinutesLeft(finishedAtMs, nowMs)
  const showLiveChat = !chatClosedAfterMatch
  const timerText = useMemo(() => {
    const kickoffTs = match?.kickoffAt ? new Date(match.kickoffAt).getTime() : null
    if (status === 'upcoming' && kickoffTs != null) {
      const remaining = Math.max(0, kickoffTs - nowMs)
      const totalSec = Math.floor(remaining / 1000)
      const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0')
      const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
      const ss = String(totalSec % 60).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }
    if (status === 'live') {
      return liveClockLabel || '—'
    }
    return 'Terminé'
  }, [match?.kickoffAt, nowMs, status, liveClockLabel])
  const kickoffMs = useMemo(
    () => (match?.kickoffAt ? new Date(match.kickoffAt).getTime() : null),
    [match?.kickoffAt],
  )
  const chatOpenAtMs = kickoffMs != null ? kickoffMs - MATCH_CHAT_OPEN_BEFORE_KICKOFF_MS : null
  const chatLocked = status === 'upcoming' && chatOpenAtMs != null && nowMs < chatOpenAtMs
  const chatCountdownText = useMemo(() => {
    if (!chatLocked || chatOpenAtMs == null) return null
    const remainingMs = Math.max(0, chatOpenAtMs - nowMs)
    const totalSec = Math.floor(remainingMs / 1000)
    if (totalSec >= 3600) {
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      if (days > 0) return `${days}j ${hours}h ${mins}min`
      return `${hours}h ${mins}min`
    }
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const ss = String(totalSec % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [chatLocked, chatOpenAtMs, nowMs])

  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([])
  const chatDraftRef = useRef('')
  const chatInputRef = useRef<HTMLInputElement>(null)
  const [selectedTribune, setSelectedTribune] = useState<MatchTribuneZone>('neutres')
  const [tifoCheerSide, setTifoCheerSide] = useState<'home' | 'away'>('home')
  const [flareColor, setFlareColor] = useState<FlareColor>('red')
  const [tribuneModalOpen, setTribuneModalOpen] = useState(false)
  const [standingsModalOpen, setStandingsModalOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<'match' | 'paris' | 'tribune' | null>(null)
  const showMobileChannelChrome = useIsMobileTouchViewport()
  const channelDesktopGrid = showMobileChannelChrome ? CHANNEL_TOUCH_GRID : CHANNEL_DESKTOP_GRID
  const betCardRef = useRef<HTMLDivElement | null>(null)
  const [mobileMatchTab, setMobileMatchTab] = useState<ChannelMatchTab>('stats')
  const [desktopFeedTab, setDesktopFeedTab] = useState<'actions' | 'classement'>('actions')
  const [animationsOpen, setAnimationsOpen] = useState(false)
  const [animationNotice, setAnimationNotice] = useState<string | null>(null)
  const [paidFxLayers, setPaidFxLayers] = useState<PaidFxLayer[]>([])
  const [stadiumFxTotal, setStadiumFxTotal] = useState(0)
  const seenReactionIdsRef = useRef(new Set<string>())
  const lastLocalFxAtRef = useRef(0)
  const pushPaidFxLayer = useCallback((fx: ActivePaidFx, seed = Date.now()) => {
    const layerId = `fx-${seed}-${Math.random().toString(16).slice(2)}`
    setStadiumFxTotal((n) => n + 1)
    setPaidFxLayers((prev) => {
      const next = [...prev, { layerId, fx, seed }]
      return next.length > MAX_PAID_FX_LAYERS ? next.slice(-MAX_PAID_FX_LAYERS) : next
    })
    window.setTimeout(() => {
      setPaidFxLayers((prev) => prev.filter((l) => l.layerId !== layerId))
    }, PAID_FX_LAYER_MS)
  }, [])
  const [livePanelOpen, setLivePanelOpen] = useState(false)
  const [liveMicEnabled, setLiveMicEnabled] = useState(true)
  const [liveCamEnabled, setLiveCamEnabled] = useState(false)
  const [liveBroadcastActive, setLiveBroadcastActive] = useState(false)
  const { publishMessage, isCloudChatConfigured } = useLiveMatchChatSync({
    matchId: match?.id ?? '',
    enabled: Boolean(match?.id),
    getChatSession: ensureCloudSession,
    onRemoteMessages: (msgs) => {
      setChatMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]))
        for (const m of msgs) {
          const mapped = cloudMessageToUi(m)
          byId.set(mapped.id, mapped)
        }
        return Array.from(byId.values()).sort(
          (a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0) || a.id.localeCompare(b.id),
        )
      })
    },
  })
  const messageLikes = useLiveMatchMessageLikesSync({
    matchId: match?.id ?? '',
    enabled: Boolean(match?.id),
    userId: selfUserId,
    actorDisplayName: authUser?.displayName,
    matchLabel: match ? `${homeHeaderLabel} vs ${awayHeaderLabel}` : null,
  })
  const filteredChatMessages = useMemo(
    () => chatMessages.filter((m) => liveChatVisibleInTribune(m, selectedTribune)),
    [chatMessages, selectedTribune],
  )

  const chatAuthorKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const m of chatMessages) {
      if (m.userId) keys.add(m.userId)
      if (m.clerkActorKey) keys.add(m.clerkActorKey)
    }
    return [...keys]
  }, [chatMessages])
  const { avatars: modularByAuthor, profilePhotos: profilePhotoByAuthor, displayNames: cloudAuthorNames, subscriptionTiers: subscriptionTiersByAuthor } = useChatAuthorModularAvatars(
    chatAuthorKeys,
    selfChatUserId,
    {
      selfModularAvatar: selfProfile.modularAvatar,
      selfSubscriptionTier: tier,
      selfUserKeys: selfAvatarKeys,
    },
  )
  const chatUsersByIdRef = useRef<Record<string, User>>({})
  const chatUsersById = useMemo(() => {
    const map: Record<string, User> = {}
    for (const m of chatMessages) {
      if (map[m.userId]) continue
      map[m.userId] = {
        id: m.userId,
        username: m.username,
        avatarSeed: m.avatarSeed,
        accent: m.avatarAccent ?? 'violet',
      }
    }
    if (authUser) {
      const seed =
        authUser.displayName.trim().slice(0, 12).replace(/\s+/g, '-') || 'you'
      const meEntry: User = {
        id: authUser.id,
        username: authUser.displayName,
        avatarSeed: seed,
        accent: 'emerald',
        modularAvatar: selfProfile.modularAvatar,
        subscriptionTier: tier,
      }
      map[authUser.id] = {
        ...map[authUser.id],
        ...meEntry,
        username: resolveChatDisplayLabel(map[authUser.id]?.username, meEntry.username),
      }
      if (chatActorId && chatActorId !== authUser.id) {
        map[chatActorId] = {
          ...map[chatActorId],
          ...meEntry,
          id: chatActorId,
          username: resolveChatDisplayLabel(map[chatActorId]?.username, meEntry.username),
        }
      }
      map.me = {
        ...map.me,
        ...meEntry,
        id: 'me',
        username: resolveChatDisplayLabel(map.me?.username, meEntry.username),
      }
    }
    for (const [id, modularAvatar] of Object.entries(modularByAuthor)) {
      const label = resolveChatDisplayLabel(map[id]?.username, cloudAuthorNames[id])
      const subscriptionTier = subscriptionTiersByAuthor[id]
      const profilePhotoDataUrl = profilePhotoByAuthor[id]
      if (map[id]) {
        map[id] = {
          ...map[id],
          username: label,
          modularAvatar,
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          ...(subscriptionTier ? { subscriptionTier } : {}),
        }
      } else {
        map[id] = {
          id,
          username: label || id.replace(/-/g, '').slice(0, 12),
          avatarSeed: id.replace(/-/g, '').slice(0, 12),
          accent: 'violet',
          modularAvatar,
          ...(profilePhotoDataUrl ? { profilePhotoDataUrl } : {}),
          ...(subscriptionTier ? { subscriptionTier } : {}),
        }
      }
    }
    for (const [id, profilePhotoDataUrl] of Object.entries(profilePhotoByAuthor)) {
      if (!map[id] || map[id].profilePhotoDataUrl) continue
      map[id] = { ...map[id], profilePhotoDataUrl }
    }
    for (const m of chatMessages) {
      const clerkKey = m.clerkActorKey
      if (!clerkKey || !map[m.userId]) continue
      const modularAvatar = modularByAuthor[clerkKey]
      const profilePhotoDataUrl = profilePhotoByAuthor[clerkKey]
      const subscriptionTier = subscriptionTiersByAuthor[clerkKey]
      const label = cloudAuthorNames[clerkKey]
      if (!modularAvatar && !profilePhotoDataUrl && !subscriptionTier && !label) continue
      map[m.userId] = {
        ...map[m.userId],
        ...(label
          ? { username: resolveChatDisplayLabel(map[m.userId]?.username, label) }
          : {}),
        ...(modularAvatar && !map[m.userId].modularAvatar ? { modularAvatar } : {}),
        ...(profilePhotoDataUrl && !map[m.userId].profilePhotoDataUrl
          ? { profilePhotoDataUrl }
          : {}),
        ...(subscriptionTier && !map[m.userId].subscriptionTier ? { subscriptionTier } : {}),
      }
    }
    for (const id of chatAuthorKeys) {
      const subscriptionTier = subscriptionTiersByAuthor[id]
      if (!subscriptionTier || !map[id]) continue
      map[id] = { ...map[id], subscriptionTier }
    }
    for (const id of chatAuthorKeys) {
      if (!map[id] || !cloudAuthorNames[id]) continue
      map[id] = {
        ...map[id],
        username: resolveChatDisplayLabel(map[id].username, cloudAuthorNames[id]),
      }
    }
    const merged = retainStickyChatUserAvatars(map, chatUsersByIdRef.current)
    chatUsersByIdRef.current = merged
    return merged
  }, [
    chatMessages,
    chatAuthorKeys,
    modularByAuthor,
    profilePhotoByAuthor,
    cloudAuthorNames,
    subscriptionTiersByAuthor,
    authUser,
    chatActorId,
    selfProfile.modularAvatar,
    tier,
  ])
  const { publishReaction } = useLiveMatchReactionsSync({
    matchId: match?.id ?? '',
    enabled: Boolean(match?.id),
    onHydrate: (events) => {
      for (const e of events) seenReactionIdsRef.current.add(e.id)
      setStadiumFxTotal((prev) => Math.max(prev, events.length))
    },
    onLiveInsert: (event) => {
      const isOwnFxEcho =
        Boolean(event.userId) &&
        (event.userId === authUser?.id || event.userId === chatActorId) &&
        Date.now() - lastLocalFxAtRef.current < 4500
      if (isOwnFxEcho) {
        seenReactionIdsRef.current.add(event.id)
        return
      }
      if (seenReactionIdsRef.current.has(event.id)) return
      seenReactionIdsRef.current.add(event.id)
      pushPaidFxLayer(
        reactionTypeToPaidFx(event.type, {
          tifoSide: event.tifoSide,
          flareColor: event.flareColor,
        }),
        Date.now() + Math.random(),
      )
    },
  })
  const chatScrollRef = useAutoScroll<HTMLDivElement>(
    [filteredChatMessages.length],
    [match?.id, status],
  )
  const pageScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (searchParams.get('paris') !== '1' || !match) return
    setMobilePanel('paris')
    const scrollTimer = window.setTimeout(() => {
      betCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('paris')
        return next
      },
      { replace: true },
    )
    return () => window.clearTimeout(scrollTimer)
  }, [searchParams, match?.id, setSearchParams])

  useEffect(() => {
    pageScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [match?.id, status])
  useEffect(() => {
    setChatMessages([])
    seenReactionIdsRef.current = new Set()
    setStadiumFxTotal(0)
  }, [match?.id])
  const onSend = async (e: FormEvent) => {
    e.preventDefault()
    if (chatClosedAfterMatch) return
    if (chatLocked) return
    if (!match?.id) return
    const text = chatDraftRef.current.trim()
    if (!text) return
    const precheck = moderateChatText(text)
    if (!precheck.ok) {
      setAnimationNotice(precheck.message)
      window.setTimeout(() => setAnimationNotice(null), 2800)
      return
    }
    const chatGate = checkChatSend()
    if (!chatGate.ok) {
      setAnimationNotice(chatGate.reason ?? 'Envoi de message limité pour ta formule.')
      window.setTimeout(() => setAnimationNotice(null), 3200)
      return
    }
    const sb = getSupabaseBrowserClient()
    if (sb && authUser?.id && chatActorId) {
      try {
        await syncClerkProfileToChatActor(
          sb,
          authUser.id,
          chatActorId,
          authUser.displayName ?? '',
        )
        invalidateChatAuthorAvatars([chatActorId, authUser.id])
      } catch {
        /* sync best-effort */
      }
    }
    const res = await publishMessage({
      matchId: match.id,
      text,
      matchTribune: selectedTribune,
      displayName: authUser?.displayName,
      clerkActorKey: authUser?.id,
    })
    if (!res.ok) {
      setAnimationNotice(
        res.error === 'moderation'
          ? MODERATION_REFUSED_MESSAGE_FR
          : "Impossible d'envoyer le message (sync cloud indisponible).",
      )
      window.setTimeout(() => setAnimationNotice(null), 2800)
      return
    }
    recordChatSend()
    chatDraftRef.current = ''
    if (chatInputRef.current) chatInputRef.current.value = ''
    if (channelTifoGroupId) requestTifoEngagementSync(channelTifoGroupId, match.id)
    if (res.message) {
      const mapped = cloudMessageToUi(res.message)
      setChatMessages((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]))
        byId.set(mapped.id, mapped)
        return Array.from(byId.values()).sort(
          (a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0) || a.id.localeCompare(b.id),
        )
      })
    }
  }
  const onToggleLikeMessage = (id: string) => {
    if (messageLikes.isConfigured) {
      void messageLikes.toggleLike(id).then(() => {
        if (channelTifoGroupId && match?.id) requestTifoEngagementSync(channelTifoGroupId, match.id)
      })
      return
    }
    setChatMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const liked = Boolean(m.likedByMe)
        return {
          ...m,
          likedByMe: !liked,
          likes: Math.max(0, (m.likes ?? 0) + (liked ? -1 : 1)),
        }
      }),
    )
  }

  const latestHighlight = useMemo(
    () => (smTimelineHighlights.length ? smTimelineHighlights[smTimelineHighlights.length - 1] : null),
    [smTimelineHighlights],
  )
  const latestHighlightText = useMemo(() => {
    const raw = latestHighlight?.title || latestHighlight?.detail || ''
    return translateSportMonksLiveTextToFr(raw)
  }, [latestHighlight])
  const [fullscreenEvent, setFullscreenEvent] = useState<{
    kind: 'goal' | 'card' | 'var' | 'kickoff'
    title: string
    subtitle?: string
    side?: 'home' | 'away'
  } | null>(null)
  const channelLiveMatchIdRef = useRef<string | undefined>(undefined)
  const fullscreenDedupePrimedRef = useRef(false)
  const fullscreenDedupeKeysRef = useRef<Set<string>>(new Set())
  const fullscreenShownHighlightIdsRef = useRef<Set<string>>(new Set())
  const lastGoalFullscreenAtRef = useRef(0)
  const infoHighlightPrimedRef = useRef(false)
  const infoHighlightIdsRef = useRef<Set<string>>(new Set())
  const infoToastKeysRef = useRef<Set<string>>(new Set())
  const infoToastTimeoutRef = useRef<number | null>(null)

  const detectHighlightSide = useCallback(
    (raw: string): 'home' | 'away' | undefined => {
      const s = raw.toLowerCase()
      const homeTokens = [match?.home.name, match?.home.shortName, homeName]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
      const awayTokens = [match?.away.name, match?.away.shortName, awayName]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
      if (homeTokens.some((t) => t.length >= 2 && s.includes(t))) return 'home'
      if (awayTokens.some((t) => t.length >= 2 && s.includes(t))) return 'away'
      return undefined
    },
    [match?.home.name, match?.home.shortName, match?.away.name, match?.away.shortName, homeName, awayName],
  )

  const fullscreenBusyRef = useRef(false)
  const fullscreenQueueRef = useRef<
    {
      kind: 'goal' | 'card' | 'var' | 'kickoff'
      title: string
      subtitle?: string
      durationMs: number
      side?: 'home' | 'away'
    }[]
  >([])

  const drainFullscreenQueue = useCallback(() => {
    if (fullscreenBusyRef.current) return
    const next = fullscreenQueueRef.current.shift()
    if (!next) return
    fullscreenBusyRef.current = true
    setFullscreenEvent({
      kind: next.kind,
      title: next.title,
      subtitle: next.subtitle,
      side: next.side,
    })
    window.setTimeout(() => {
      setFullscreenEvent(null)
      fullscreenBusyRef.current = false
      drainFullscreenQueue()
    }, next.durationMs)
  }, [])

  const launchFullscreenEvent = useCallback(
    (
      kind: 'goal' | 'card' | 'var' | 'kickoff',
      title: string,
      subtitle?: string,
      durationMs = 3200,
      side?: 'home' | 'away',
    ) => {
      fullscreenQueueRef.current.push({ kind, title, subtitle, durationMs, side })
      drainFullscreenQueue()
    },
    [drainFullscreenQueue],
  )
  const kickoffFxMatchIdRef = useRef<string | undefined>(undefined)
  /** Coup d’envoi plein écran : une fois par tribune + pas si on rejoint le live tard (évite F5 / navigation). */
  useEffect(() => {
    if (!match?.id) return
    if (status !== 'live') return
    if (typeof window === 'undefined') return

    const ssKey = `tf-fs-kickoff-${match.id}`
    const flag = localStorage.getItem(ssKey)
    if (flag === 'shown' || flag === 'skip') {
      kickoffFxMatchIdRef.current = match.id
      return
    }

    const apiMinute = Math.max(
      Math.round(Number(match?.minute) || 0),
      liveBundleFixture ? extractLiveMinuteFromSmFixture(liveBundleFixture) ?? 0 : 0,
    )
    const effectiveMinute = Math.max(apiMinute, liveDisplayedMinute)
    const totalGoals = (match?.score?.home ?? 0) + (match?.score?.away ?? 0)

    if (effectiveMinute > 3 || totalGoals > 0) {
      try {
        localStorage.setItem(ssKey, 'skip')
      } catch {
        /* private mode */
      }
      kickoffFxMatchIdRef.current = match.id
      return
    }

    if (kickoffFxMatchIdRef.current === match.id) return
    kickoffFxMatchIdRef.current = match.id
    try {
      localStorage.setItem(ssKey, 'shown')
    } catch {
      /* private mode */
    }
    launchFullscreenEvent('kickoff', 'COUP D’ENVOI', `${homeName} vs ${awayName}`, 4200)
  }, [
    status,
    match?.id,
    match?.minute,
    match?.score?.home,
    match?.score?.away,
    liveDisplayedMinute,
    liveBundleFixture,
    homeName,
    awayName,
    launchFullscreenEvent,
  ])

  useEffect(() => {
    if (channelLiveMatchIdRef.current !== match?.id) {
      channelLiveMatchIdRef.current = match?.id
      fullscreenDedupePrimedRef.current = false
      fullscreenDedupeKeysRef.current = match?.id ? loadFullscreenSeenKeys(match.id) : new Set()
      fullscreenShownHighlightIdsRef.current = new Set()
      infoHighlightPrimedRef.current = false
      infoHighlightIdsRef.current = new Set()
      infoToastKeysRef.current = new Set()
    }
    if (status !== 'live') return

    if (!fullscreenDedupePrimedRef.current) {
      if (liveStatsLoading) return
      for (const h of smTimelineHighlights) {
        const kind = fullscreenKindFromHighlight(h)
        if (!kind) continue
        const enriched = highlightWithDetectedSide(h, detectHighlightSide)
        rememberFullscreenSeenKey(
          match?.id,
          fullscreenDedupeKeysRef.current,
          fullscreenEventDedupeKey(enriched, kind),
        )
        fullscreenShownHighlightIdsRef.current.add(h.id)
      }
      fullscreenDedupePrimedRef.current = true
      return
    }

    if (!smTimelineHighlights.length) return

    const historyCutoff = Math.max(0, liveDisplayedMinute - 2)
    const pendingByKey = new Map<string, Highlight>()
    for (const h of smTimelineHighlights) {
      const kind = fullscreenKindFromHighlight(h)
      if (!kind) continue
      if (fullscreenShownHighlightIdsRef.current.has(h.id)) continue
      if (h.minute > 0 && h.minute < historyCutoff) {
        fullscreenShownHighlightIdsRef.current.add(h.id)
        continue
      }
      const enriched = highlightWithDetectedSide(h, detectHighlightSide)
      const key = fullscreenEventDedupeKey(enriched, kind)
      if (fullscreenDedupeKeysRef.current.has(key)) {
        fullscreenShownHighlightIdsRef.current.add(h.id)
        continue
      }
      const prev = pendingByKey.get(key)
      if (prev) {
        pendingByKey.set(key, preferFullscreenHighlight(prev, enriched))
        fullscreenShownHighlightIdsRef.current.add(h.id)
        continue
      }
      pendingByKey.set(key, enriched)
    }

    const pending = Array.from(pendingByKey.values())

    pending.forEach((h, index) => {
      const enriched = highlightWithDetectedSide(h, detectHighlightSide)
      const kind = fullscreenKindFromHighlight(enriched)!
      const key = fullscreenEventDedupeKey(enriched, kind)
      const side = enriched.side
      if ((kind === 'goal' || kind === 'card') && !side) {
        fullscreenShownHighlightIdsRef.current.add(h.id)
        rememberFullscreenSeenKey(match?.id, fullscreenDedupeKeysRef.current, key)
        return
      }

      rememberFullscreenSeenKey(match?.id, fullscreenDedupeKeysRef.current, key)
      fullscreenShownHighlightIdsRef.current.add(h.id)
      const teamLabel = side === 'home' ? homeName : awayName
      const hlText = translateSportMonksLiveTextToFr(String(h.title || h.detail || '').trim())
      const goalRow =
        goalTeamHints
          ? parseLiveGoalRowsFromHighlights([enriched], goalTeamHints.home, goalTeamHints.away, {
              home: homeScore,
              away: awayScore,
            })[0]
          : undefined
      const scorer = enriched.scorerName?.trim() || goalRow?.name
      const assist = enriched.assistName?.trim() || goalRow?.assistName
      const delayMs = index * 900

      if (kind === 'goal') {
        if (h.id.startsWith('sm-comment-') || !scorer || !isPlausibleGoalScorerName(scorer)) {
          fullscreenShownHighlightIdsRef.current.add(h.id)
          rememberFullscreenSeenKey(match?.id, fullscreenDedupeKeysRef.current, key)
          return
        }
      }

      window.setTimeout(() => {
        if (kind === 'goal') {
          lastGoalFullscreenAtRef.current = Date.now()
          const scorerLabel = formatGoalScorerLabel(scorer!, assist, { ownGoal: enriched.ownGoal })
          launchFullscreenEvent(
            'goal',
            'BUT',
            `${highlightMinuteLabel(enriched)} · ${scorerLabel}`,
            6200,
            side,
          )
        } else if (kind === 'card') {
          launchFullscreenEvent(
            'card',
            'CARTON',
            `${highlightMinuteLabel(enriched)} · Carton${teamLabel ? ` · ${teamLabel}` : ''}`,
            4600,
            side,
          )
        } else {
          launchFullscreenEvent('var', 'VAR', `${highlightMinuteLabel(enriched)} ${hlText}`, 5200, side)
        }
      }, delayMs)
    })
  }, [
    smTimelineHighlights,
    liveStatsLoading,
    status,
    match?.id,
    launchFullscreenEvent,
    detectHighlightSide,
    homeName,
    awayName,
    goalTeamHints,
    homeScore,
    awayScore,
    liveDisplayedMinute,
  ])

  /** Moments forts API (hors but/carton/VAR) → micro-signal visuel lisible sans envahir l’écran. */
  useEffect(() => {
    if (!match?.id || status !== 'live') return

    if (!infoHighlightPrimedRef.current) {
      if (liveStatsLoading) return
      for (const h of smTimelineHighlights) {
        infoHighlightIdsRef.current.add(h.id)
        const t = String(h.type || '').toLowerCase()
        if (t.includes('but') || t.includes('carton') || t.includes('var')) continue
        const raw = String(h.title || h.detail || '').trim().toLowerCase().slice(0, 80)
        infoToastKeysRef.current.add(`${h.minute}|${t}|${raw}`)
      }
      infoHighlightPrimedRef.current = true
      return
    }

    if (smTimelineHighlights.length === 0) return

    const historyCutoff = Math.max(0, liveDisplayedMinute - 2)
    const unseen = smTimelineHighlights.filter((h) => {
      if (infoHighlightIdsRef.current.has(h.id)) return false
      if (h.minute > 0 && h.minute < historyCutoff) {
        infoHighlightIdsRef.current.add(h.id)
        return false
      }
      return true
    })
    if (unseen.length === 0) return
    for (const h of unseen) infoHighlightIdsRef.current.add(h.id)

    const latest = unseen[unseen.length - 1]
    const t = String(latest.type || '').toLowerCase()
    if (t.includes('but') || t.includes('carton') || t.includes('var')) return
    if (Date.now() - lastGoalFullscreenAtRef.current < 12_000) return
    const rawLower = String(latest.title || latest.detail || '').toLowerCase()
    if (rawLower.includes('penalty') || rawLower.includes('peno')) return

    const raw = String(latest.title || latest.detail || '').trim()
    const translated = translateSportMonksLiveTextToFr(raw)
    const compact = translated.length > 72 ? `${translated.slice(0, 69)}…` : translated
    const infoKey = `${latest.minute}|${t}|${raw.toLowerCase().slice(0, 80)}`
    if (infoToastKeysRef.current.has(infoKey)) return
    infoToastKeysRef.current.add(infoKey)
    const side = detectHighlightSide(`${latest.title ?? ''} ${latest.detail ?? ''}`)
    const teamLabel = side === 'home' ? homeName : side === 'away' ? awayName : ''
    const label =
      t.includes('arrêt') || t.includes('arret') || t.includes('save')
        ? '🧤 Arrêt'
        : t.includes('occasion') || t.includes('shot') || t.includes('chance')
          ? '⚡ Occasion'
          : t.includes('penalty')
            ? '🎯 Penalty'
            : t.includes('hors') || t.includes('offside')
              ? '🚫 Hors-jeu'
              : '📣 Live'

    setAnimationNotice(
      `${label}${latest.minute ? ` ${highlightMinuteLabel(latest)}` : ''}${teamLabel ? ` · ${teamLabel}` : ''}${compact ? ` — ${compact}` : ''}`,
    )
    if (infoToastTimeoutRef.current != null) window.clearTimeout(infoToastTimeoutRef.current)
    infoToastTimeoutRef.current = window.setTimeout(() => setAnimationNotice(null), 3600)
  }, [smTimelineHighlights, liveStatsLoading, status, match?.id, detectHighlightSide, homeName, awayName, liveDisplayedMinute])

  useEffect(
    () => () => {
      if (infoToastTimeoutRef.current != null) window.clearTimeout(infoToastTimeoutRef.current)
    },
    [],
  )

  const kickoffLabel = match?.kickoffAt
    ? new Date(match.kickoffAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '21:00'
  const homeLineupNames = useMemo(() => {
    const home = starters?.home?.slice(0, 11) ?? []
    return home.map((p) => (typeof p === 'string' ? p : p.label))
  }, [starters])
  const awayLineupNames = useMemo(() => {
    const away = starters?.away?.slice(0, 11) ?? []
    return away.map((p) => (typeof p === 'string' ? p : p.label))
  }, [starters])

  const scoredButeurSlugs = useMemo(
    () =>
      goalTeamHints
        ? extractScorerEventsFromHighlights(smTimelineHighlights, goalTeamHints.home, goalTeamHints.away)
        : [],
    [smTimelineHighlights, goalTeamHints],
  )

  const liveGoalDisplayRows = useMemo(() => {
    if (!match || !goalTeamHints || (status !== 'live' && status !== 'finished')) return []
    const scoreHint = { home: homeScore, away: awayScore }

    const fromEvents = extractLiveGoalDisplayRowsFromSmFixture(
      liveBundleFixture,
      goalTeamHints.home,
      goalTeamHints.away,
      scoreHint,
    )
    if (fromEvents.length > 0) {
      return clampLiveGoalRowsToScore(fromEvents, homeScore, awayScore)
    }

    const structuredTimeline = smTimelineHighlights.filter(
      (h) => h.type === 'But' && h.id.startsWith('sm-event-'),
    )
    const fromStructured = parseLiveGoalRowsFromHighlights(
      structuredTimeline,
      goalTeamHints.home,
      goalTeamHints.away,
      scoreHint,
    )
    return clampLiveGoalRowsToScore(fromStructured, homeScore, awayScore)
  }, [
    smTimelineHighlights,
    status,
    match,
    goalTeamHints,
    homeScore,
    awayScore,
    liveBundleFixture,
  ])
  const headerHomeScorers = useMemo(
    () =>
      liveGoalDisplayRows
        .filter((r) => r.side === 'home')
        .map(({ name, minute, inSecondHalf, ownGoal }) => ({ name, minute, inSecondHalf, ownGoal })),
    [liveGoalDisplayRows],
  )
  const headerAwayScorers = useMemo(
    () =>
      liveGoalDisplayRows
        .filter((r) => r.side === 'away')
        .map(({ name, minute, inSecondHalf, ownGoal }) => ({ name, minute, inSecondHalf, ownGoal })),
    [liveGoalDisplayRows],
  )

  const liveCardDisplayRows = useMemo(() => {
    if (!match || !goalTeamHints || (status !== 'live' && status !== 'finished')) return []
    const fromEvents = extractLiveCardDisplayRowsFromSmFixture(
      liveBundleFixture,
      goalTeamHints.home,
      goalTeamHints.away,
    )
    if (fromEvents.length > 0) return fromEvents

    const structuredTimeline = smTimelineHighlights.filter(
      (h) => h.type === 'Carton' && h.id.startsWith('sm-event-'),
    )
    return parseLiveCardRowsFromHighlights(
      structuredTimeline,
      goalTeamHints.home,
      goalTeamHints.away,
    )
  }, [smTimelineHighlights, status, match, goalTeamHints, liveBundleFixture])

  const headerHomeCards = useMemo(
    () =>
      liveCardDisplayRows
        .filter((r) => r.side === 'home')
        .map(({ name, minute, inSecondHalf, color }) => ({ name, minute, inSecondHalf, color })),
    [liveCardDisplayRows],
  )
  const headerAwayCards = useMemo(
    () =>
      liveCardDisplayRows
        .filter((r) => r.side === 'away')
        .map(({ name, minute, inSecondHalf, color }) => ({ name, minute, inSecondHalf, color })),
    [liveCardDisplayRows],
  )

  const settledFinishedMatchRef = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'finished' || !match) return
    const mid = match.id
    if (settledFinishedMatchRef.current === mid) return
    const fh = match.score?.home ?? homeScore
    const fa = match.score?.away ?? awayScore
    const hs = match.home.shortName ?? homeName
    const aw = match.away.shortName ?? awayName
    const runSettle = () => {
      if (settledFinishedMatchRef.current === mid) return
      settledFinishedMatchRef.current = mid
      const scorerEvents = goalTeamHints
        ? extractScorerEventsFromHighlights(
            timelineHighlightsRef.current,
            goalTeamHints.home,
            goalTeamHints.away,
          ).map((e) => ({ side: e.side, slug: e.slug }))
        : extractScorerEventsFromHighlights(
            timelineHighlightsRef.current,
            { shortName: hs, name: hs },
            { shortName: aw, name: aw },
          ).map((e) => ({ side: e.side, slug: e.slug }))
      betting.settleMatchResult(
        { home: fh, away: fa },
        { scorerEvents, forMatchId: mid },
      )
    }
    const t = window.setTimeout(runSettle, 2000)
    return () => {
      window.clearTimeout(t)
      runSettle()
    }
  }, [
    status,
    match?.id,
    match?.score?.home,
    match?.score?.away,
    homeScore,
    awayScore,
    homeName,
    awayName,
    goalTeamHints,
    betting.settleMatchResult,
  ])
  const [lineupSide, setLineupSide] = useState<'home' | 'away'>('home')
  const [lineupSubsFallbackFixture, setLineupSubsFallbackFixture] = useState<SmFixture | null>(null)

  useEffect(() => {
    if (!match?.sportMonksFixtureId || (status !== 'live' && status !== 'finished')) {
      setLineupSubsFallbackFixture(null)
      return
    }

    const fromBundle = extractSubstitutesFromSmFixture(liveBundleFixture)
    if (fromBundle.home.length + fromBundle.away.length > 0) {
      setLineupSubsFallbackFixture(null)
      return
    }

    const token = getSportMonksToken()
    if (!token) {
      setLineupSubsFallbackFixture(null)
      return
    }

    let cancelled = false
    fetchSportMonksFixtureEventsWeather(token, match.sportMonksFixtureId)
      .then((fx) => {
        if (cancelled) return
        setLineupSubsFallbackFixture(fx)
      })
      .catch(() => {
        if (!cancelled) setLineupSubsFallbackFixture(null)
      })

    return () => {
      cancelled = true
    }
  }, [match?.sportMonksFixtureId, status, liveBundleFixture])

  const fixtureForLineupSubs = useMemo((): SmFixture | null => {
    if (!liveBundleFixture && !lineupSubsFallbackFixture) return null
    if (!liveBundleFixture) return lineupSubsFallbackFixture
    if (!lineupSubsFallbackFixture) return liveBundleFixture
    return {
      ...liveBundleFixture,
      events: liveBundleFixture.events?.length ? liveBundleFixture.events : lineupSubsFallbackFixture.events,
      comments: liveBundleFixture.comments?.length ? liveBundleFixture.comments : lineupSubsFallbackFixture.comments,
      lineups: liveBundleFixture.lineups?.length ? liveBundleFixture.lineups : lineupSubsFallbackFixture.lineups,
      participants: liveBundleFixture.participants?.length
        ? liveBundleFixture.participants
        : lineupSubsFallbackFixture.participants,
    }
  }, [liveBundleFixture, lineupSubsFallbackFixture])

  const lineupSubstitutes = useMemo(() => {
    if (status !== 'live' && status !== 'finished') return { home: [], away: [] }
    return extractSubstitutesFromSmFixture(fixtureForLineupSubs)
  }, [fixtureForLineupSubs, status])

  const lineupScorerPicks = useMemo(() => {
    const out: {
      side: 'home' | 'away'
      name: string
      formationPosition?: number
      formationField?: string
      isStarter: boolean
      substitutedOff?: boolean
    }[] = []
    const seen = new Set<string>()
    const subbedOffKeys =
      status === 'live' || status === 'finished'
        ? extractSubbedOffPlayerKeys(fixtureForLineupSubs)
        : new Set<string>()

    const pushPlayer = (
      side: 'home' | 'away',
      p: { label: string; formationPosition?: number; formationField?: string },
      isStarter: boolean,
    ) => {
      const slug = p.label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)
      const key = `${side}:${slug}`
      if (!slug || seen.has(key)) return
      seen.add(key)
      out.push({
        side,
        name: p.label,
        formationPosition: p.formationPosition,
        formationField: p.formationField,
        isStarter,
        substitutedOff: subbedOffKeys.has(key),
      })
    }

    const pushSide = (
      side: 'home' | 'away',
      players: SmStartingXiPlayer[] | undefined,
      isStarter: boolean,
    ) => {
      for (const p of players ?? []) {
        pushPlayer(side, p, isStarter)
      }
    }

    pushSide('home', starters?.home, true)
    pushSide('away', starters?.away, true)
    pushSide('home', bench?.home, false)
    pushSide('away', bench?.away, false)

    for (const p of lineupSubstitutes.home) {
      pushPlayer('home', { label: p.label }, false)
    }
    for (const p of lineupSubstitutes.away) {
      pushPlayer('away', { label: p.label }, false)
    }

    return out
  }, [starters, bench, lineupSubstitutes, fixtureForLineupSubs, status])

  const displayedLineupPlayers = useMemo(
    () => (lineupSide === 'home' ? starters?.home ?? [] : starters?.away ?? []),
    [lineupSide, starters],
  )
  const lineupOverlayRoster = useMemo(
    () => [
      ...(starters?.home ?? []).map((p) => ({
        label: p.label,
        playerId: p.playerId,
        side: 'home' as const,
      })),
      ...(starters?.away ?? []).map((p) => ({
        label: p.label,
        playerId: p.playerId,
        side: 'away' as const,
      })),
      ...lineupSubstitutes.home.map((p) => ({
        label: p.label,
        playerId: p.playerId,
        side: 'home' as const,
      })),
      ...lineupSubstitutes.away.map((p) => ({
        label: p.label,
        playerId: p.playerId,
        side: 'away' as const,
      })),
    ],
    [starters, lineupSubstitutes],
  )
  const lineupOverlays = useMemo(() => {
    const base = extractPlayerMatchOverlaysFromSmFixture(liveBundleFixture)
    if (status !== 'live' && status !== 'finished') return base
    return enrichLineupOverlaysFromMatchFeed(base, {
      cards: liveCardDisplayRows,
      goals: liveGoalDisplayRows,
      players: lineupOverlayRoster,
    })
  }, [
    liveBundleFixture,
    liveCardDisplayRows,
    liveGoalDisplayRows,
    lineupOverlayRoster,
    status,
  ])
  const displayedLineupSubstitutes = useMemo((): LineupSubstituteWithOverlay[] => {
    const pool = lineupSide === 'home' ? lineupSubstitutes.home : lineupSubstitutes.away
    return pool.map((p) => ({
      ...p,
      overlay: resolveLineupPlayerOverlay(lineupOverlays, {
        playerId: p.playerId,
        name: p.label,
      }),
    }))
  }, [lineupSide, lineupSubstitutes, lineupOverlays])
  const displayedLineupLayout = useMemo(() => {
    const formation = lineupSide === 'home' ? formations.home : formations.away
    const layout = computeLineupPitchLayout(displayedLineupPlayers, formation)
    if (status !== 'live' && status !== 'finished') return layout
    return attachLineupOverlaysToLayout(layout, (p) =>
      resolveLineupPlayerOverlay(lineupOverlays, { playerId: p.playerId, name: p.fullName }),
    )
  }, [displayedLineupPlayers, lineupSide, formations.home, formations.away, lineupOverlays, status])
  const lineupAutoTimerRef = useRef<number | null>(null)
  const lineupAutoPausedUntilRef = useRef<number>(0)
  const pauseLineupAutoFor3Min = () => {
    lineupAutoPausedUntilRef.current = Date.now() + 3 * 60 * 1000
  }
  useEffect(() => {
    if (!homeLineupNames.length || !awayLineupNames.length) return
    const scheduleNext = () => {
      lineupAutoTimerRef.current = window.setTimeout(() => {
        if (lineupAutoPausedUntilRef.current > Date.now()) {
          scheduleNext()
          return
        }
        setLineupSide((prev) => (prev === 'home' ? 'away' : 'home'))
        scheduleNext()
      }, 10000)
    }
    scheduleNext()
    return () => {
      if (lineupAutoTimerRef.current != null) {
        window.clearTimeout(lineupAutoTimerRef.current)
        lineupAutoTimerRef.current = null
      }
    }
  }, [homeLineupNames.length, awayLineupNames.length])
  const homeColor = match?.home.colors.primary ?? '#2f8fff'
  const awayColor = match?.away.colors.primary ?? '#ff3b3b'
  const homeSecondaryColor = match?.home.colors.secondary ?? homeColor
  const awaySecondaryColor = match?.away.colors.secondary ?? awayColor
  const homeToneColor = `color-mix(in srgb, ${homeColor} 72%, ${homeSecondaryColor} 28%)`
  const awayToneColor = `color-mix(in srgb, ${awayColor} 72%, ${awaySecondaryColor} 28%)`
  const fullscreenAccentColor =
    fullscreenEvent?.side === 'home'
      ? homeColor
      : fullscreenEvent?.side === 'away'
        ? awayColor
        : null
  const tribuneOptions = useMemo(
    () => [
      { id: 'home-ultras' as const, label: `Ultras ${homeName}`, vibe: 'Chants et ambiance chaude' },
      { id: 'away-ultras' as const, label: `Parcage ${awayName}`, vibe: 'Bloc visiteurs' },
      { id: 'analystes' as const, label: 'Analystes', vibe: 'Debat tactique en direct' },
      { id: 'neutres' as const, label: 'Neutres', vibe: 'Discussion chill' },
    ],
    [homeName, awayName],
  )
  const channelTifoGroupId = useMemo(
    () => (match ? tifoGroupIdForMatchChannel(match, selectedTribune) : null),
    [match, selectedTribune],
  )
  const showChannelTifo = match != null && (status === 'live' || status === 'upcoming')
  const possessionRow = useMemo(
    () => liveStatRows.find((r) => r.key === 'ball_possession' || r.key === 'possession') ?? null,
    [liveStatRows],
  )
  const tacticalRows = useMemo(() => {
    const pick = (keys: string[]) => liveStatRows.find((r) => keys.includes(r.key))
    const dangerous = pick(['dangerous_attacks'])
    const shotsOnTarget = pick(['shots_on_target', 'shotsontarget'])
    const shotsTotal = pick(['shots_total', 'shots'])
    const corners = pick(['corners'])
    const fouls = pick(['fouls'])
    const offsides = pick(['offsides'])
    const yellow = pick(['yellowcards', 'yellow_cards'])
    const red = pick(['redcards', 'red_cards'])
    const saves = pick(['saves'])
    return [
      possessionRow ? { key: 'possession', label: 'Possession %', home: possessionRow.home, away: possessionRow.away } : null,
      shotsTotal ? { key: 'shots', label: 'Tirs', home: shotsTotal.home, away: shotsTotal.away } : null,
      shotsOnTarget ? { key: 'shots_on_target', label: 'Tirs cadrés', home: shotsOnTarget.home, away: shotsOnTarget.away } : null,
      dangerous ? { key: 'dangerous_attacks', label: 'Att. dangereuses', home: dangerous.home, away: dangerous.away } : null,
      corners ? { key: 'corners', label: 'Corners', home: corners.home, away: corners.away } : null,
      fouls ? { key: 'fouls', label: 'Fautes', home: fouls.home, away: fouls.away } : null,
      offsides ? { key: 'offsides', label: 'Hors-jeu', home: offsides.home, away: offsides.away } : null,
      yellow ? { key: 'yellow_cards', label: 'Cartons jaunes', home: yellow.home, away: yellow.away } : null,
      red ? { key: 'red_cards', label: 'Cartons rouges', home: red.home, away: red.away } : null,
      saves ? { key: 'saves', label: 'Arrêts', home: saves.home, away: saves.away } : null,
    ].filter(Boolean) as Array<{ key: string; label: string; home: number; away: number }>
  }, [liveStatRows, possessionRow])
  const dangerousRow = useMemo(
    () => liveStatRows.find((r) => r.key === 'dangerous_attacks') ?? null,
    [liveStatRows],
  )
  const dangerousDelta = (dangerousRow?.home ?? 0) - (dangerousRow?.away ?? 0)
  const dangerousLeader = dangerousDelta === 0 ? 'equal' : dangerousDelta > 0 ? 'home' : 'away'
  /** Stats sous le terrain (sans « attaques dangereuses », déjà dans la barre de pression). */
  const pitchStatPills = useMemo(
    () => tacticalRows.filter((r) => r.label !== 'Att. dangereuses').slice(0, 6),
    [tacticalRows],
  )
  const mobileStatRows = useMemo(() => {
    if (tacticalRows.length > 0) return tacticalRows.slice(0, 10)
    return liveStatRows.slice(0, 10).map((r) => ({
      key: r.key,
      label: r.label,
      home: r.home,
      away: r.away,
    }))
  }, [tacticalRows, liveStatRows])
  const livePitchPressure = useMemo(() => {
    const dh = dangerousRow?.home ?? 0
    const da = dangerousRow?.away ?? 0
    const tot = dh + da
    const homeRatio = tot > 0 ? dh / tot : 0.5
    return { dh, da, homeRatio, tot }
  }, [dangerousRow])
  const possessionRatioHome = useMemo(() => {
    const row = possessionRow
    if (!row) return null
    const h = Number(row.home)
    const a = Number(row.away)
    if (!Number.isFinite(h) || !Number.isFinite(a) || h + a < 5) return null
    return h / (h + a)
  }, [possessionRow])
  const pitchPressureTint = useMemo(() => {
    const { homeRatio } = livePitchPressure
    const homeTint = Math.round(Math.min(44, homeRatio * 58))
    const awayTint = Math.round(Math.min(44, (1 - homeRatio) * 58))
    return { homeTint, awayTint }
  }, [livePitchPressure])
  const paidAnimations = useMemo<PaidAnimation[]>(
    () => [
      { id: 'fumigene', label: 'Fumigène', cost: 20, emoji: '💨' },
      { id: 'ola', label: 'Confettis', cost: 12, emoji: '🎊' },
      { id: 'tifo-geant', label: 'Tifo géant', cost: 35, emoji: '🏴' },
      { id: 'stroboscope', label: 'Flash téléphones', cost: 18, emoji: '📱' },
    ],
    [],
  )
  const fxActiveCount = stadiumFxTotal
  const stadiumAmbiancePct = useMemo(
    () => stadiumAmbiancePercentFromFxCount(stadiumFxTotal),
    [stadiumFxTotal],
  )
  const stadiumAmbianceLabel = useMemo(
    () => stadiumAmbianceTierLabel(stadiumAmbiancePct),
    [stadiumAmbiancePct],
  )
  const liveSalonStats = useLiveMatchSalonStats(match?.id)
  const viewersDisplay =
    liveSalonStats != null
      ? liveSalonStats.participantsCount.toLocaleString('fr-FR')
      : '0'

  const triggerPaidAnimation = async (
    anim: PaidAnimation,
    opts?: { tifoSide?: 'home' | 'away'; flareColor?: FlareColor },
  ) => {
    setAnimationsOpen(false)
    setLivePanelOpen(false)
    lastLocalFxAtRef.current = Date.now()
    const res = betting.spendTokens(anim.cost, `chat_animation:${anim.id}`)
    if (!res.ok) {
      setAnimationNotice('Pas assez de jetons pour lancer cette animation.')
      window.setTimeout(() => setAnimationNotice(null), 2200)
      return
    }
    const tifoSide = anim.id === 'tifo-geant' ? opts?.tifoSide ?? tifoCheerSide : undefined
    const flareColorChosen =
      anim.id === 'fumigene' ? opts?.flareColor ?? flareColor : undefined
    const fxSeed = Date.now() + Math.random()
    pushPaidFxLayer(
      {
        id: anim.id,
        label:
          anim.id === 'fumigene' && flareColorChosen
            ? `Fumigène ${FLARE_COLOR_LABELS[flareColorChosen]}`
            : anim.label,
        ...(anim.id === 'tifo-geant' && tifoSide ? { tifoSide } : {}),
        ...(flareColorChosen ? { flareColor: flareColorChosen } : {}),
      },
      fxSeed,
    )
    setAnimationNotice(`${anim.emoji} ${anim.label} activee`)
    window.setTimeout(() => setAnimationNotice(null), 1600)

    if (!match?.id) return

    const tifoSideForSync =
      anim.id === 'tifo-geant' ? opts?.tifoSide ?? tifoCheerSide : undefined
    const flareColorForSync =
      anim.id === 'fumigene' ? opts?.flareColor ?? flareColor : undefined
    const sent = await publishReaction(
      paidAnimationToReactionType(anim.id),
      tifoSideForSync || flareColorForSync
        ? { ...(tifoSideForSync ? { tifoSide: tifoSideForSync } : {}), ...(flareColorForSync ? { flareColor: flareColorForSync } : {}) }
        : undefined,
    )
    if (sent.ok && sent.event) {
      seenReactionIdsRef.current.add(sent.event.id)
    } else if (!sent.ok) {
      setAnimationNotice('Animation locale OK · synchro tribune indisponible.')
      window.setTimeout(() => setAnimationNotice(null), 2200)
    }
  }

  const startLiveBroadcast = async () => {
    if (!mayStreamSalon) {
      setAnimationNotice('Stream tribune réservé aux Ambassadeurs — voir /formules.')
      window.setTimeout(() => setAnimationNotice(null), 3200)
      return
    }
    if (match?.id) {
      await publishMessage({
        matchId: match.id,
        text: `🔴 Live lancé (${liveMicEnabled ? 'micro ON' : 'micro OFF'} · ${liveCamEnabled ? 'camera ON' : 'camera OFF'})`,
        matchTribune: selectedTribune,
        displayName: authUser?.displayName,
      })
    }
    setLiveBroadcastActive(true)
    setAnimationNotice(`Live demarre (${liveMicEnabled ? 'micro ON' : 'micro OFF'} · ${liveCamEnabled ? 'cam ON' : 'cam OFF'})`)
    window.setTimeout(() => setAnimationNotice(null), 1800)
    setLivePanelOpen(false)
  }

  const channelStandingsContent = (scrollMaxClassName?: string) => {
    if (matchWcGroup) {
      if (cdm?.loading) {
        return (
          <p className={cn('text-xs font-semibold', L ? 'text-[#3d5670]' : 'text-sky-200/80')}>
            Chargement du classement de poule…
          </p>
        )
      }
      if (cdm?.error && !displayedWcStandings.length) {
        return (
          <p className={cn('text-xs font-semibold', L ? 'text-rose-700' : 'text-rose-200/90')}>
            Classement indisponible ({cdm.error})
          </p>
        )
      }
      return (
        <div className={cn('space-y-2', scrollMaxClassName)}>
          <WcGroupCard group={matchWcGroup} standing={displayedWcStandings} compact />
          {status === 'live' ? (
            <p className={cn('text-[9px] font-medium', L ? 'text-[#5a7088]' : 'text-sky-300/70')}>
              Projection live · +3 si mène, +1 chacun si nul
            </p>
          ) : null}
        </div>
      )
    }
    if (standingsLeagueId) {
      return (
        <LiveMatchStandingsPanel
          leagueId={standingsLeagueId}
          rows={displayedStandingsRows}
          homeTeamId={match?.home.id}
          awayTeamId={match?.away.id}
          loading={standingsLoading}
          error={standingsError}
          dataSourceLabel={standingsSourceLabel}
          projectedLive={status === 'live'}
          light={L}
          scrollMaxClassName={scrollMaxClassName}
        />
      )
    }
    return (
      <p className={cn('text-xs font-semibold', L ? 'text-[#3d5670]' : 'text-sky-200/80')}>
        Pas de classement pour cette compétition.
      </p>
    )
  }

  const openStandingsPopup = () => setStandingsModalOpen(true)

  const kickoffHeaderChipClass = cn(
    'inline-flex shrink-0 items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold tabular-nums',
    L ? 'border-sky-300/70 bg-sky-50 text-[#023458]' : 'border-sky-300/40 bg-[#102f4d]/80 text-sky-100',
  )

  if (waitingRouteResolution) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#03172a] p-4">
        <div className="rounded-xl border border-[#2f5f8f] bg-[#0b2440] px-4 py-3 text-center text-sm font-semibold text-sky-100">
          Chargement du live…
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#03172a] p-4">
        <div className="max-w-sm rounded-xl border border-[#2f5f8f] bg-[#0b2440] px-4 py-3 text-center text-sm font-semibold text-sky-100">
          {routeNotFound && hasRouteMatchId
            ? 'Ce match est introuvable ou plus disponible dans le calendrier.'
            : 'Aucun match disponible pour le moment.'}
          <Link to="/pronostic" className="mt-2 block text-cyan-300 hover:underline">
            Retour à mes paris
          </Link>
          <Link to="/" className="mt-2 block text-sky-300/80 hover:underline">
            Accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={pageScrollRef}
      className={cn(
        'tf-channel-live relative flex min-h-0 w-full flex-1 flex-col bg-[#03172a]',
        L && 'tf-channel-live-light',
        isUpcoming
          ? 'tf-channel-upcoming max-md:overflow-y-auto p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:h-full md:overflow-hidden md:pb-3'
          : 'max-md:overflow-y-auto p-3 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:h-full md:overflow-hidden md:pb-4 md:p-3 lg:p-4',
      )}
      style={
        {
          '--tf-home-color': homeToneColor,
          '--tf-away-color': awayToneColor,
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-28"
        style={{
          background: `radial-gradient(55% 90% at 18% 0%, color-mix(in srgb, ${homeToneColor} 34%, transparent), transparent 72%), radial-gradient(52% 88% at 82% 0%, color-mix(in srgb, ${awayToneColor} 30%, transparent), transparent 74%)`,
        }}
      />
      <div className="pointer-events-none absolute left-4 top-3 z-0 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: `color-mix(in srgb, ${homeToneColor} 28%, transparent)` }} />
      <div className="pointer-events-none absolute right-6 top-4 z-0 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: `color-mix(in srgb, ${awayToneColor} 28%, transparent)` }} />
      <header
        className={cn(
          'relative z-10 shrink-0 overflow-hidden rounded-xl border shadow-[0_14px_30px_rgba(2,8,18,0.33),inset_0_1px_0_rgba(125,211,252,0.16)]',
          isUpcoming ? 'p-2.5' : 'p-3',
          isLight ? 'border-[#8fb2d3] bg-[#f6fbff]' : 'border-[#2f5f8f] bg-[#0b2440]',
        )}
        style={
          L
            ? status === 'live'
              ? {
                  boxShadow: `0 0 0 1px ${homeColor}33, 0 0 20px ${awayColor}20`,
                  background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 14%, #f6fbff) 0%, #eef4fc 44%, color-mix(in srgb, ${awayToneColor} 11%, #f8fbff) 100%)`,
                }
              : {
                  background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 11%, #f6fbff) 0%, #eef4fc 42%, color-mix(in srgb, ${awayToneColor} 9%, #f8fbff) 100%)`,
                }
            : status === 'live'
              ? {
                  boxShadow: `0 0 0 1px ${homeColor}44, 0 0 24px ${awayColor}30`,
                  background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 22%, #0b2440) 0%, #0b2440 42%, color-mix(in srgb, ${awayToneColor} 20%, #0b2440) 100%)`,
                }
              : {
                  background: `linear-gradient(115deg, color-mix(in srgb, ${homeToneColor} 20%, #0b2440) 0%, #0b2440 40%, color-mix(in srgb, ${awayToneColor} 18%, #0b2440) 100%)`,
                }
        }
      >
        {status === 'live' ? (
          <div className="pointer-events-none absolute inset-0 rounded-xl border border-rose-400/80 animate-pulse" />
        ) : null}
        {status === 'live' ? (
          <div
            className={`mb-2 h-1.5 overflow-hidden rounded-full ${L ? 'bg-slate-200' : 'bg-[#0a1a2d]'}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stadiumAmbiancePct}
            aria-label={`Ambiance stade ${stadiumAmbiancePct}% · ${fxActiveCount} FX tribune · ${stadiumAmbianceLabel}`}
          >
            <div
              className={cn(
                'h-full transition-[width] duration-700 ease-out',
                stadiumAmbiancePct >= 65 && 'tf-hype-glow',
              )}
              style={{
                width: `${stadiumAmbiancePct <= 0 ? 0 : Math.max(4, stadiumAmbiancePct)}%`,
                background: `linear-gradient(90deg, ${homeColor}, ${awayColor})`,
              }}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-1 md:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <TeamLogoLink
                to={homeTeamPath}
                clubId={match?.home.id}
                label={homeHeaderLabel}
                logoUrl={match?.home.logoUrl}
                sportMonksTeamId={match?.home.sportMonksTeamId}
                nationFlagSrc={homeFlagSrc}
              />
              <Link
                to={homeTeamPath ?? '#'}
                title={homeName}
                className={`min-w-0 truncate text-sm font-semibold leading-tight hover:underline ${
                  L ? 'text-[#052032]' : 'text-white'
                }`}
              >
                {homeHeaderLabel}
              </Link>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-0.5 px-1">
              {isUpcoming ? (
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    L ? 'border-sky-300/70 bg-sky-50 text-[#023458]' : 'border-sky-300/35 bg-[#102f4d]/75 text-sky-100'
                  }`}
                >
                  VS
                </span>
              ) : null}
              <p className={`text-3xl font-bold tabular-nums ${L ? 'text-[#023458]' : 'text-white'}`}>
                {homeScore} - {awayScore}
              </p>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-1.5">
              <Link
                to={awayTeamPath ?? '#'}
                title={awayName}
                className={`min-w-0 truncate text-right text-sm font-semibold leading-tight hover:underline ${
                  L ? 'text-[#052032]' : 'text-white'
                }`}
              >
                {awayHeaderLabel}
              </Link>
              <TeamLogoLink
                to={awayTeamPath}
                clubId={match?.away.id}
                label={awayHeaderLabel}
                logoUrl={match?.away.logoUrl}
                sportMonksTeamId={match?.away.sportMonksTeamId}
                nationFlagSrc={awayFlagSrc}
              />
            </div>
          </div>
          {isUpcoming && (homeFullName !== homeHeaderLabel || awayFullName !== awayHeaderLabel) ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2">
              {homeFullName !== homeHeaderLabel ? (
                homeTeamPath ? (
                  <Link
                    to={homeTeamPath}
                    title={homeFullName}
                    className={`min-w-0 truncate pl-11 text-[10px] font-bold leading-tight hover:underline ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                  >
                    {homeFullName}
                  </Link>
                ) : (
                  <p
                    className={`min-w-0 truncate pl-11 text-[10px] font-bold leading-tight ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={homeFullName}
                  >
                    {homeFullName}
                  </p>
                )
              ) : (
                <span aria-hidden />
              )}
              <span className="w-12 shrink-0" aria-hidden />
              {awayFullName !== awayHeaderLabel ? (
                awayTeamPath ? (
                  <Link
                    to={awayTeamPath}
                    title={awayFullName}
                    className={`min-w-0 truncate pr-11 text-right text-[10px] font-bold leading-tight hover:underline ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                  >
                    {awayFullName}
                  </Link>
                ) : (
                  <p
                    className={`min-w-0 truncate pr-11 text-right text-[10px] font-bold leading-tight ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={awayFullName}
                  >
                    {awayFullName}
                  </p>
                )
              ) : (
                <span aria-hidden />
              )}
            </div>
          ) : null}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_auto] gap-x-2 gap-y-0.5">
            <div className="col-start-2 row-start-1 flex flex-col items-center gap-1">
              <p className={`text-center text-sm ${L ? 'text-[#3d5670]' : 'text-sky-200/80'}`}>
                {status === 'live' ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <span className="tf-live-badge-dot inline-block h-2 w-2 rounded-full bg-rose-400" />
                    {timerText}
                  </span>
                ) : (
                  timerText
                )}
              </p>
              {isUpcoming ? (
                <span className={kickoffHeaderChipClass} title={`Coup d'envoi ${kickoffLabel}`}>
                  Coup d&apos;envoi · {kickoffLabel}
                </span>
              ) : null}
            </div>
            {status === 'live' || status === 'finished' ? (
              <>
                <div className="col-start-1 row-start-2 min-w-0 justify-self-start self-start">
                  <LiveHeaderTeamEvents goals={headerHomeScorers} cards={headerHomeCards} align="left" light={L} />
                </div>
                <div className="col-start-3 row-start-2 min-w-0 justify-self-end self-start">
                  <LiveHeaderTeamEvents goals={headerAwayScorers} cards={headerAwayCards} align="right" light={L} />
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            'hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 sm:gap-4 md:grid',
            isUpcoming ? 'grid-rows-[auto_auto]' : 'grid-rows-[auto_auto_auto]',
          )}
        >
          <div className="col-start-1 row-start-1 flex min-w-0 flex-col gap-0.5 justify-self-start self-start">
            <div className="flex min-w-0 items-center gap-3">
              <TeamLogoLink
                to={homeTeamPath}
                clubId={match?.home.id}
                label={homeHeaderLabel}
                logoUrl={match?.home.logoUrl}
                sportMonksTeamId={match?.home.sportMonksTeamId}
                nationFlagSrc={homeFlagSrc}
              />
              <Link
                to={homeTeamPath ?? '#'}
                title={homeName}
                className={`truncate text-lg font-semibold hover:underline ${L ? 'text-[#052032]' : 'text-white'}`}
              >
                {homeHeaderLabel}
              </Link>
            </div>
          </div>
          <div className="col-start-2 row-start-1 flex flex-col items-center justify-self-center self-start gap-1 pt-0.5 text-center">
            {isUpcoming ? (
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                  L ? 'border-sky-300/70 bg-sky-50 text-[#023458]' : 'border-sky-300/35 bg-[#102f4d]/75 text-sky-100'
                }`}
              >
                VS
              </span>
            ) : null}
            <p className={`text-3xl font-bold tabular-nums ${L ? 'text-[#023458]' : 'text-white'}`}>
              {homeScore} - {awayScore}
            </p>
          </div>
          <div className="col-start-3 row-start-1 flex min-w-0 flex-col items-end gap-0.5 justify-self-end self-start">
            <div className="flex min-w-0 items-center justify-end gap-3">
              <Link
                to={awayTeamPath ?? '#'}
                title={awayName}
                className={`truncate text-right text-lg font-semibold hover:underline ${L ? 'text-[#052032]' : 'text-white'}`}
              >
                {awayHeaderLabel}
              </Link>
              <TeamLogoLink
                to={awayTeamPath}
                clubId={match?.away.id}
                label={awayHeaderLabel}
                logoUrl={match?.away.logoUrl}
                sportMonksTeamId={match?.away.sportMonksTeamId}
                nationFlagSrc={awayFlagSrc}
              />
            </div>
          </div>
          {isUpcoming && (homeFullName !== homeHeaderLabel || awayFullName !== awayHeaderLabel) ? (
            <>
              {homeFullName !== homeHeaderLabel ? (
                homeTeamPath ? (
                  <Link
                    to={homeTeamPath}
                    className={`col-start-1 row-start-2 min-w-0 max-w-full truncate pl-[3.25rem] text-[11px] font-bold leading-tight hover:underline sm:max-w-[min(100%,11rem)] ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={homeFullName}
                  >
                    {homeFullName}
                  </Link>
                ) : (
                  <p
                    className={`col-start-1 row-start-2 min-w-0 max-w-full truncate pl-[3.25rem] text-[11px] font-bold leading-tight sm:max-w-[min(100%,11rem)] ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={homeFullName}
                  >
                    {homeFullName}
                  </p>
                )
              ) : null}
              {awayFullName !== awayHeaderLabel ? (
                awayTeamPath ? (
                  <Link
                    to={awayTeamPath}
                    className={`col-start-3 row-start-2 min-w-0 max-w-full truncate pr-[3.25rem] text-right text-[11px] font-bold leading-tight sm:max-w-[min(100%,11rem)] ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={awayFullName}
                  >
                    {awayFullName}
                  </Link>
                ) : (
                  <p
                    className={`col-start-3 row-start-2 min-w-0 max-w-full truncate pr-[3.25rem] text-right text-[11px] font-bold leading-tight sm:max-w-[min(100%,11rem)] ${
                      L ? 'text-[#3d5670]' : 'text-sky-200/85'
                    }`}
                    title={awayFullName}
                  >
                    {awayFullName}
                  </p>
                )
              ) : null}
            </>
          ) : null}
          <div className="col-start-2 row-start-2 flex flex-col items-center gap-1">
            <p className={`text-sm ${L ? 'text-[#3d5670]' : 'text-sky-200/80'}`}>
              {status === 'live' ? (
                <span className="inline-flex items-center gap-1">
                  <span className="tf-live-badge-dot inline-block h-2 w-2 rounded-full bg-rose-400" />
                  {timerText}
                </span>
              ) : (
                timerText
              )}
            </p>
            {isUpcoming ? (
              <span className={kickoffHeaderChipClass} title={`Coup d'envoi ${kickoffLabel}`}>
                Coup d&apos;envoi · {kickoffLabel}
              </span>
            ) : null}
          </div>
          {status === 'live' || status === 'finished' ? (
            <>
              <div className="col-start-1 row-start-3 justify-self-start">
                <LiveHeaderTeamEvents goals={headerHomeScorers} cards={headerHomeCards} align="left" light={L} />
              </div>
              <div className="col-start-3 row-start-3 justify-self-end">
                <LiveHeaderTeamEvents goals={headerAwayScorers} cards={headerAwayCards} align="right" light={L} />
              </div>
            </>
          ) : null}
        </div>
      </header>

      <main
        className={cn(
          'relative z-10 mt-2 grid min-h-0 flex-1 grid-cols-1 md:items-stretch md:overflow-hidden',
          channelDesktopGrid,
        )}
      >
        <div
          className={cn(
            'tf-live-col tf-live-col-side hidden min-w-0 rounded-xl border border-[#2b5d87]/35 bg-[#071c31]/90 shadow-[0_12px_24px_rgba(2,8,18,0.26),inset_0_1px_0_rgba(255,255,255,0.05)] md:flex md:h-full md:min-h-0 md:flex-col md:[scrollbar-width:thin]',
            isUpcoming ? 'space-y-2 p-2 md:overflow-y-auto' : 'space-y-3 p-2 md:overflow-y-auto',
          )}
        >
          {isUpcoming ? (
            <>
              <Card className="tf-card-prematch shrink-0 !p-2.5">
                <SectionTitle>Avant-match</SectionTitle>
                <div className="mt-2 space-y-1.5">
                  <SideEncartRow
                    label="Ouverture tchat"
                    value={
                      chatLocked
                        ? chatCountdownText
                          ? `dans ${chatCountdownText}`
                          : '—'
                        : 'ouverte'
                    }
                  />
                  <SideEncartRow
                    label="Cotes 1N2"
                    value={
                      oddsReady
                        ? oddsMeta.source === 'talkfoot'
                          ? 'Talk Foot'
                          : 'disponibles'
                        : oddsLoading
                          ? 'chargement…'
                          : 'calcul…'
                    }
                  />
                </div>
                {hasChannelStandings ? (
                  <button
                    type="button"
                    onClick={openStandingsPopup}
                    className="mt-2 w-full rounded-lg border border-cyan-300/45 bg-cyan-500/12 px-2.5 py-2 text-xs font-bold text-cyan-50 transition hover:bg-cyan-500/22"
                  >
                    {matchWcGroup ? `Voir la poule ${matchWcGroup.id}` : 'Voir le classement'}
                  </button>
                ) : null}
              </Card>

              <Card className="tf-card-info shrink-0 !p-2.5 border border-[#3d78aa]/55 bg-[#10263f]">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }}
                />
                <SectionTitle>Infos générales</SectionTitle>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <SideInfoCell label="Compétition">
                    {match?.competition.shortName ?? match?.competition.name ?? '—'}
                  </SideInfoCell>
                  <SideInfoCell label="Coup d’envoi">{kickoffLabel}</SideInfoCell>
                  <SideInfoCell label="Statut">À venir</SideInfoCell>
                  <SideInfoCell label="Composition">
                    {hasAnyLineup ? 'Publiée' : '—'}
                  </SideInfoCell>
                </div>
              </Card>

              <Card className="tf-card-community shrink-0 !p-2.5">
                <SectionTitle>En direct · Matchs</SectionTitle>
                {liveMatches.length > 0 ? (
                  <div className="mt-2">
                    <select
                      value={selectedLiveMatchId}
                      onChange={(e) => setSelectedLiveMatchId(e.target.value)}
                      className={chSideSelect}
                    >
                      {liveMatches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.home.shortName} vs {m.away.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="mt-2">
                  {selectedLiveMatch ? (
                    <MatchRow
                      home={selectedLiveMatch.home.shortName}
                      away={selectedLiveMatch.away.shortName}
                      homeScore={selectedLiveMatch.score?.home ?? 0}
                      awayScore={selectedLiveMatch.score?.away ?? 0}
                    />
                  ) : (
                    <div className={cn(chSideInset, 'px-2.5 py-2.5')}>
                      Aucun autre match en direct
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLiveMatch) navigate(`/channel/${selectedLiveMatch.id}`)
                  }}
                  disabled={!selectedLiveMatch}
                  className={chSideActionBtn}
                >
                  Rejoindre le live
                </button>
              </Card>

              <Card className="tf-card-tribune shrink-0 !p-2.5">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <SectionTitle>Tribune</SectionTitle>
                    <p className="mt-1 truncate text-xs font-bold text-white">
                      {tribuneOptions.find((t) => t.id === selectedTribune)?.label ?? 'Neutres'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTribuneModalOpen(true)}
                    className="shrink-0 rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2 text-xs font-extrabold text-[#06242a] transition hover:bg-[#2be0c6]"
                  >
                    Carte du stade
                  </button>
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="tf-card-prematch !p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <SectionTitle>Avant-match</SectionTitle>
                  {status === 'live' ? (
                    <span className="shrink-0 rounded-lg border border-rose-400/60 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-100">
                      En direct
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 space-y-2">
                  {status === 'live' && tacticalRows.length > 0 ? (
                    tacticalRows.slice(0, 4).map((row) => (
                      <div
                        key={`prematch-live-${row.label}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#4a7faa]/55 bg-[#0c2d4a] px-3 py-2 text-xs"
                      >
                        <span className="font-bold text-white">{row.home}</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-sky-100/90">
                          {row.label}
                        </span>
                        <span className="font-bold text-white">{row.away}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-[#4a7faa]/55 bg-[#0c2d4a] px-3 py-2.5 text-center text-xs font-semibold text-sky-100">
                      Aucune stat exploitable pour le moment.
                    </div>
                  )}
                </div>
              </Card>

              <Card className="tf-card-info !p-3.5 border border-[#3d78aa]/55 bg-[#10263f]">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }}
                />
                <SectionTitle>Infos générales</SectionTitle>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <SideInfoCell label="Compétition">
                    {match?.competition.shortName ?? match?.competition.name ?? 'Ligue 1'}
                  </SideInfoCell>
                  <SideInfoCell label="Coup d’envoi">{kickoffLabel}</SideInfoCell>
                  <SideInfoCell label="Statut">
                    {status === 'live' ? 'Live' : status === 'finished' ? 'Terminé' : 'À venir'}
                  </SideInfoCell>
                  <SideInfoCell label="Minute">{status === 'live' ? liveClockLabel || '—' : '—'}</SideInfoCell>
                </div>
              </Card>

              <Card className="tf-card-community shrink-0 !p-3.5">
                <SectionTitle>En direct · Matchs</SectionTitle>
                {liveMatches.length > 1 ? (
                  <div className="mt-2.5">
                    <select
                      value={selectedLiveMatchId}
                      onChange={(e) => setSelectedLiveMatchId(e.target.value)}
                      className={chSideSelect}
                    >
                      {liveMatches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.home.shortName} vs {m.away.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="mt-2">
                  {selectedLiveMatch ? (
                    <MatchRow
                      home={selectedLiveMatch.home.shortName}
                      away={selectedLiveMatch.away.shortName}
                      homeScore={selectedLiveMatch.score?.home ?? 0}
                      awayScore={selectedLiveMatch.score?.away ?? 0}
                    />
                  ) : (
                    <div className={cn(chSideInset, 'px-3 py-3')}>
                      Aucun autre match en direct
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLiveMatch) navigate(`/channel/${selectedLiveMatch.id}`)
                  }}
                  disabled={!selectedLiveMatch}
                  className={cn(chSideActionBtn, 'px-3')}
                >
                  Rejoindre le live
                </button>
              </Card>

              <Card className="tf-card-tribune shrink-0 md:flex md:flex-1 md:flex-col !p-3.5">
                <SectionTitle>Tribune supporters</SectionTitle>
                <div className="tf-tribune-canvas relative mt-1.5 h-[68px] overflow-hidden rounded-lg border border-[#3b7fb1]/45 bg-[#050d17] md:h-auto md:min-h-[88px] md:flex-1">
                  <div
                    className="tf-tribune-canvas-bg absolute inset-0"
                    style={{
                      background: `
                    radial-gradient(ellipse 120% 70% at 50% -10%, rgba(255,255,255,0.14), transparent 46%),
                    radial-gradient(circle at 12% 32%, ${homeColor}55, transparent 35%),
                    radial-gradient(circle at 88% 32%, ${awayColor}55, transparent 35%),
                    linear-gradient(180deg, #0c1a2a 0%, #07111c 55%, #040911 100%)
                  `,
                    }}
                  />
                  <div className="tf-tribune-overlay absolute inset-[4%] rounded-[16px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent" />
                  <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[58px] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/12" />
                  <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[44px] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/10" />
                  <div
                    className="absolute left-1/2 top-[52%] h-[30px] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-cyan-200/35"
                    style={{
                      background: `linear-gradient(125deg, color-mix(in srgb, ${homeColor} 26%, #0a3b5e) 0%, #0b4b73 45%, color-mix(in srgb, ${awayColor} 24%, #0a3b5e) 100%)`,
                    }}
                  />
                  <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[30px] w-px -translate-x-1/2 -translate-y-1/2 bg-white/25" />
                  <div className="tf-tribune-ring absolute left-1/2 top-[52%] h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
                  <div className="tf-tribune-label absolute left-[7%] top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wide text-white/90">
                    Virage
                  </div>
                  <div className="tf-tribune-label absolute right-[7%] top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wide text-white/90">
                    Parcage
                  </div>
                  <div className="tf-tribune-footer absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pb-1 pt-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/85">
                    Plan stade
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTribuneModalOpen(true)}
                  className="mt-2 w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2.5 text-xs font-extrabold text-[#06242a] shadow-sm transition hover:bg-[#2be0c6]"
                >
                  Ouvrir la carte du stade
                </button>
                <p className="mt-1.5 text-[11px] font-semibold leading-snug text-sky-100/90">
                  Tribune actuelle · {tribuneOptions.find((t) => t.id === selectedTribune)?.label ?? 'Aucune'}
                  {status === 'live' ? ' · messages filtrés par zone' : ''}
                </p>
              </Card>
            </>
          )}
        </div>

        <div
          className={cn(
            'tf-live-col tf-live-col-center min-w-0 rounded-xl border border-[#3470a0]/35 bg-[#082038]/92 p-2.5 shadow-[0_14px_30px_rgba(2,8,18,0.34),inset_0_1px_0_rgba(125,211,252,0.06)] md:flex md:h-full md:min-h-0 md:flex-1 md:flex-col',
            isUpcoming
              ? 'space-y-2 md:min-h-0 md:overflow-hidden'
              : 'space-y-2 md:overflow-y-auto md:[scrollbar-width:thin]',
          )}
        >
          {showLiveChat ? (
          <Card
            className={cn(
              'tf-card-chat relative',
              animationsOpen || livePanelOpen ? '!overflow-visible' : 'overflow-hidden',
              isUpcoming ? 'min-h-0 md:flex md:min-h-0 md:flex-1 md:flex-col' : 'shrink-0 min-h-[280px] md:min-h-[360px]',
            )}
            style={
              status === 'live'
                ? {
                    borderColor: `${homeColor}88`,
                    boxShadow: `0 0 0 1px ${awayColor}26, 0 0 34px ${homeColor}28`,
                  }
                : undefined
            }
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 left-1/2 h-24 w-[78%] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-2xl" />
              <div className="absolute -left-10 top-[32%] h-24 w-24 rounded-full bg-violet-400/12 blur-2xl" />
              <div className="absolute -right-8 bottom-[20%] h-20 w-20 rounded-full bg-cyan-300/10 blur-2xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
            </div>
            <div className="relative z-10">
            <div className="pointer-events-none absolute -left-4 -right-4 -top-4 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <SectionTitle>Chat live</SectionTitle>
            {chatDebriefOpen ? (
              <p className="mt-1 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-100">
                Match terminé — débrief ouvert encore ~{debriefMinutesLeft} min (30 min max).
              </p>
            ) : null}
            <div className="mt-0.5 flex items-start justify-end gap-1.5 md:items-center md:justify-between md:gap-2">
              <div className="hidden min-w-0 flex-wrap gap-1 md:flex">
                {['Général', 'Virage', 'Analyse', 'Chill'].map((t, i) => (
                  <span
                    key={t}
                    className={`tf-chat-tab rounded-md border px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide leading-none ${
                      i === 0
                        ? 'border-[#8b7bff]/80 bg-[#8b7bff]/18 text-[#ece8ff]'
                        : i === 1
                          ? 'border-[#c17a67]/70 bg-[#c17a67]/18 text-[#ffd8cf]'
                          : i === 2
                            ? 'border-[#8ea5d6]/70 bg-[#8ea5d6]/16 text-[#dbe8ff]'
                            : 'border-[#74bba0]/70 bg-[#74bba0]/16 text-[#d8fff0]'
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="hidden grid-cols-2 gap-1 md:grid">
                <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-2 py-1">
                  <p className="text-[10px] font-semibold leading-none text-sky-100/75">
                    Viewers <span className="ml-1 text-xs font-bold text-white">{viewersDisplay}</span>
                  </p>
                </div>
                <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-2 py-1">
                  <p className="text-[10px] font-semibold leading-none text-sky-100/75">
                    FX tribune <span className="ml-1 text-xs font-bold text-white">{fxActiveCount}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 md:hidden">
              <span className="rounded-md border border-[#8b7bff]/80 bg-[#8b7bff]/18 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#ece8ff]">
                Général
              </span>
              <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-1.5 py-0.5">
                <p className="text-[9px] font-semibold leading-none text-sky-100/75">
                  Viewers <span className="ml-1 text-[10px] font-bold text-white">{viewersDisplay}</span>
                </p>
              </div>
              <div className="tf-live-soft-surface rounded-md bg-[#12273d]/80 px-1.5 py-0.5">
                <p className="text-[9px] font-semibold leading-none text-sky-100/75">
                  FX <span className="ml-1 text-[10px] font-bold text-white">{fxActiveCount}</span>
                </p>
              </div>
            </div>
            <ChannelSubscriptionExtras
              matchId={match?.id}
              isLive={status === 'live'}
              light={L}
            />
            <ChannelPrivateSalonGate matchId={match?.id} light={L}>
            <div
              ref={chatScrollRef}
              className={cn(
                'tf-chat-scroll space-y-1.5 overflow-y-auto rounded-lg bg-[#071525] p-1.5 shadow-[inset_0_0_0_1px_rgba(148,184,214,0.18)]',
                isUpcoming
                  ? 'h-[min(28dvh,190px)] sm:h-[min(32dvh,210px)] md:min-h-0 md:flex-1 md:h-auto md:max-h-none'
                  : 'h-[200px] sm:h-[240px] md:h-[min(52vh,480px)]',
              )}
            >
              {chatLocked ? (
                <div
                  className={cn(
                    'flex h-full items-center justify-center rounded-lg border p-3 text-center',
                    isUpcoming ? 'min-h-[88px]' : 'min-h-[150px]',
                    L ? 'border-slate-200 bg-white/95 shadow-sm' : 'border-[#3a6690]/60 bg-[#0c2339]/80',
                  )}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-sky-100">
                      Tchat verrouillé
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-sky-200/80">
                      Ouverture 1 h avant le coup d&apos;envoi
                    </p>
                    <p className="mt-2 text-2xl font-black text-cyan-200">{chatCountdownText ?? '00:00'}</p>
                  </div>
                </div>
              ) : (
                <>
                  {filteredChatMessages.map((msg) => (
                    <LiveMatchChatMessage
                      key={msg.id}
                      message={msg}
                      user={chatUsersById[msg.userId]}
                      selfProfile={selfProfile}
                      selfUserId={selfChatUserId}
                      selfChatActorId={chatActorId}
                      selfClerkUserId={authUser?.id}
                      socialEnabled={chatSocialEnabled}
                      light={L}
                      likeState={messageLikes.getLikeState(msg.id)}
                      onToggleLike={onToggleLikeMessage}
                      onOpenPeerMenu={() =>
                        chatPeerMenu.openPeerMenu(
                          buildChatPeerMenuTarget(
                            msg.userId,
                            msg.username,
                            chatUsersById[msg.userId],
                          ),
                        )
                      }
                      showVerifiedBadge={
                        hasVerifiedBadge &&
                        (msg.userId === selfChatUserId || msg.userId === authUser?.id)
                      }
                    />
                  ))}
                  <ChatPeerMenuHost
                    peerMenu={chatPeerMenu.peerMenu}
                    menuOpen={chatPeerMenu.menuOpen}
                    dark={!L}
                    onClose={chatPeerMenu.closePeerMenu}
                  />
                  {filteredChatMessages.length === 0 ? (
                    <div
                      className={`rounded-lg border p-3 text-center text-[11px] font-semibold text-sky-200/80 ${
                        L ? 'border-slate-200 bg-white/95 shadow-sm' : 'border-[#3a6690]/60 bg-[#0c2339]/80'
                      }`}
                    >
                      {chatMessages.length === 0
                        ? 'Aucun message réel pour le moment.'
                        : 'Aucun message dans cette tribune pour le moment — change de zone ou attends les autres supporters.'}
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {animationNotice ? (
              <div
                className="pointer-events-none mt-1.5 rounded-lg border border-[#8b7bff]/45 bg-[#0a1f35]/92 px-2 py-1.5 text-center text-[11px] font-semibold leading-snug text-[#ece8ff] shadow-[0_8px_24px_rgba(2,12,28,0.35)] backdrop-blur-sm motion-safe:animate-[tf-fx-toast-in_220ms_ease-out]"
                role="status"
                aria-live="polite"
              >
                {animationNotice}
              </div>
            ) : null}
            <form
              onSubmit={onSend}
              className="tf-channel-chat-form relative z-[20] mt-2 flex min-w-0 items-center gap-1.5 md:gap-2"
            >
              {livePanelOpen ? (
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-[240px] rounded-lg bg-[#102945] p-1.5 shadow-xl">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-100/85">Live</p>
                    <button
                      type="button"
                      onClick={() => setLivePanelOpen(false)}
                      className="rounded border border-[#5f81a1] px-1.5 py-0.5 text-[10px] font-bold text-sky-100"
                    >
                      X
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      type="button"
                      disabled={!canJoinVoiceSalons}
                      onClick={() => {
                        if (!canJoinVoiceSalons) return
                        setLiveMicEnabled((v) => !v)
                      }}
                      className={`rounded-md border px-2 py-1 text-left text-[11px] font-bold ${
                        !canJoinVoiceSalons
                          ? 'cursor-not-allowed border-[#4b6f90]/60 bg-[#0b2741]/60 text-sky-100/45'
                          : liveMicEnabled
                            ? 'border-cyan-300/75 bg-cyan-300/16 text-cyan-100'
                            : 'border-[#4b6f90] bg-[#0b2741] text-sky-100'
                      }`}
                      title={
                        canJoinVoiceSalons
                          ? 'Micro tribune'
                          : 'Salons vocaux — formule Ambassadeur'
                      }
                    >
                      🎤 {liveMicEnabled ? 'Micro ON' : 'Micro OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveCamEnabled((v) => !v)}
                      className={`rounded-md border px-2 py-1 text-left text-[11px] font-bold ${
                        liveCamEnabled
                          ? 'border-cyan-300/75 bg-cyan-300/16 text-cyan-100'
                          : 'border-[#4b6f90] bg-[#0b2741] text-sky-100'
                      }`}
                    >
                      📷 {liveCamEnabled ? 'Cam ON' : 'Cam OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={startLiveBroadcast}
                      className="rounded-md border border-rose-300/80 bg-rose-500/90 px-2 py-1.5 text-xs font-bold text-white hover:bg-rose-500 active:scale-[0.99]"
                    >
                      Demarrer le live
                    </button>
                  </div>
                </div>
              ) : null}
              {mayStreamSalon ? (
              <button
                type="button"
                onClick={() => setLivePanelOpen((v) => !v)}
                className={`tf-live-control rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  livePanelOpen || liveBroadcastActive
                    ? 'border-rose-300/70 bg-rose-500/80 text-white'
                    : 'border-[#3a6690] bg-[#0a1f35] text-sky-100 hover:border-sky-300/70'
                }`}
                title="Stream tribune (Ambassadeur)"
              >
                {liveBroadcastActive ? 'LIVE ON' : 'LIVE'}
              </button>
              ) : null}
              {animationsOpen ? (
                <div
                  className={`z-[100] flex max-h-[min(70dvh,30rem)] flex-col overflow-y-auto overflow-x-hidden overscroll-contain p-2 shadow-2xl max-md:fixed max-md:inset-x-3 max-md:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] max-md:max-h-[min(72dvh,32rem)] max-md:rounded-xl md:absolute md:bottom-[calc(100%+8px)] md:left-1/2 md:max-h-[min(calc(100dvh-8rem),34rem)] md:w-[min(22rem,calc(100vw-1rem))] md:-translate-x-1/2 ${chFxPanelShell}`}
                >
                  <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2 px-0.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${chFxTitle}`}>Animations</p>
                    <button type="button" onClick={() => setAnimationsOpen(false)} className={chFxCloseBtn}>
                      X
                    </button>
                  </div>
                  <p className={`mb-1.5 shrink-0 px-0.5 text-[10px] font-semibold ${chFxMuted}`}>
                    Jetons:{' '}
                    <span className={L ? 'font-bold text-violet-700' : 'font-bold text-violet-200'}>
                      {betting.wallet.tokens}
                    </span>
                  </p>
                  <p className={`mb-0.5 shrink-0 px-0.5 text-[9px] font-bold uppercase tracking-wide ${chFxSectionLabel}`}>
                    Pyro · fumigènes
                  </p>
                  <div className="grid shrink-0 grid-cols-4 gap-1">
                    {FLARE_COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        title={`Fumigène ${opt.label}`}
                        onClick={() => {
                          setFlareColor(opt.id)
                          void triggerPaidAnimation(paidAnimations[0], { flareColor: opt.id })
                        }}
                        className={cn(
                          'flex min-h-[2.75rem] flex-col items-center justify-center rounded-md border px-1 py-1.5 text-center transition',
                          flareColor === opt.id
                            ? L
                              ? 'border-orange-500/70 bg-orange-50 text-orange-950'
                              : 'border-orange-400/70 bg-orange-500/20 text-orange-50'
                            : L
                              ? 'border-slate-200 bg-slate-50 text-[#1a3a52] hover:border-orange-300'
                              : 'border-[#4b6f90] bg-[#0b2741] text-sky-200 hover:border-orange-400/50',
                        )}
                      >
                        <span
                          className="mb-0.5 block size-3.5 rounded-full border border-white/25 shadow-sm"
                          style={{ backgroundColor: opt.swatch }}
                          aria-hidden
                        />
                        <span className="text-[9px] font-bold leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className={`mt-1 shrink-0 px-0.5 text-[10px] ${chFxSectionLabel}`}>
                    {paidAnimations[0].emoji} {paidAnimations[0].label} · {paidAnimations[0].cost} jetons
                  </p>
                  <p className={`mb-0.5 mt-2 shrink-0 px-0.5 text-[9px] font-bold uppercase tracking-wide ${chFxSectionLabel}`}>
                    Confettis
                  </p>
                  <button
                    type="button"
                    onClick={() => void triggerPaidAnimation(paidAnimations[1])}
                    className={`${chFxPanelBtn} w-full shrink-0`}
                  >
                    <p className="text-[11px] font-bold text-sky-50">
                      {paidAnimations[1].emoji} {paidAnimations[1].label}
                    </p>
                    <p className={`mt-0.5 text-[10px] ${chFxSectionLabel}`}>{paidAnimations[1].cost} jetons</p>
                  </button>
                  <p className={`mb-0.5 mt-2 shrink-0 px-0.5 text-[9px] font-bold uppercase tracking-wide ${chFxSectionLabel}`}>
                    Tifo géant
                  </p>
                  <div className="mt-1 flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      title={homeFullName}
                      onClick={() => {
                        setTifoCheerSide('home')
                        void triggerPaidAnimation(paidAnimations[2], { tifoSide: 'home' })
                      }}
                      className={`min-h-[2.75rem] min-w-0 flex-1 rounded-md border px-1.5 py-1.5 text-center text-[10px] font-bold leading-snug ${
                        tifoCheerSide === 'home'
                          ? L
                            ? 'border-emerald-600/50 bg-emerald-100 text-emerald-950'
                            : 'border-emerald-300/80 bg-emerald-500/25 text-emerald-50'
                          : L
                            ? 'border-slate-200 bg-slate-50 text-[#1a3a52]'
                            : 'border-[#4b6f90] bg-[#0b2741] text-sky-200'
                      }`}
                    >
                      <span className="block break-words">Tifo · {tifoFxHomeLabel}</span>
                    </button>
                    <button
                      type="button"
                      title={awayFullName}
                      onClick={() => {
                        setTifoCheerSide('away')
                        void triggerPaidAnimation(paidAnimations[2], { tifoSide: 'away' })
                      }}
                      className={`min-h-[2.75rem] min-w-0 flex-1 rounded-md border px-1.5 py-1.5 text-center text-[10px] font-bold leading-snug ${
                        tifoCheerSide === 'away'
                          ? L
                            ? 'border-rose-600/50 bg-rose-100 text-rose-950'
                            : 'border-rose-300/80 bg-rose-500/25 text-rose-50'
                          : L
                            ? 'border-slate-200 bg-slate-50 text-[#1a3a52]'
                            : 'border-[#4b6f90] bg-[#0b2741] text-sky-200'
                      }`}
                    >
                      <span className="block break-words">Tifo · {tifoFxAwayLabel}</span>
                    </button>
                  </div>
                  <p className={`mb-0.5 mt-2 shrink-0 px-0.5 text-[9px] font-bold uppercase tracking-wide ${chFxSectionLabel}`}>
                    Flashs tribune
                  </p>
                  <button
                    type="button"
                    onClick={() => void triggerPaidAnimation(paidAnimations[3])}
                    className={`${chFxPanelBtn} shrink-0`}
                  >
                    <p className="text-[11px] font-bold text-sky-50">
                      {paidAnimations[3].emoji} {paidAnimations[3].label}
                    </p>
                    <p className={`mt-0.5 text-[10px] ${chFxSectionLabel}`}>{paidAnimations[3].cost} jetons</p>
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setAnimationsOpen((v) => !v)}
                className={`tf-live-control rounded-lg border px-2 py-2 text-xs font-bold transition ${
                  animationsOpen
                    ? 'border-[#8b7bff] bg-[#8b7bff]/18 text-[#ece8ff]'
                    : 'border-[#3a6690] bg-[#0a1f35] text-sky-100 hover:border-sky-300/70'
                }`}
                title="Animations payantes"
              >
                FX
              </button>
              <input
                ref={chatInputRef}
                defaultValue=""
                onChange={(e) => {
                  chatDraftRef.current = e.target.value
                }}
                placeholder={
                  chatLocked
                    ? 'Tchat ouvert 1 h avant le match'
                    : !isCloudChatConfigured
                      ? 'Chat cloud indisponible'
                      : 'Écrire un message…'
                }
                disabled={chatLocked || !isCloudChatConfigured}
                className={`min-w-0 flex-1 rounded-lg border border-[#3a6690] bg-white px-2.5 py-2 text-base text-[#0a223a] outline-none transition focus:border-[#5a86af] md:px-3 ${
                  L
                    ? 'placeholder:text-[#4a6682] disabled:placeholder:text-[#3d5670]'
                    : 'placeholder:text-slate-400 disabled:placeholder:text-slate-500'
                }`}
              />
              <button
                type="submit"
                disabled={chatLocked || !isCloudChatConfigured}
                className="shrink-0 rounded-lg border border-[#3a6690] bg-white px-2.5 py-2 text-xs font-semibold text-[#0a223a] transition hover:bg-sky-50 md:px-4 md:text-sm"
              >
                {chatLocked ? 'Bientôt' : !isCloudChatConfigured ? 'Cloud off' : 'Envoyer'}
              </button>
            </form>
            </ChannelPrivateSalonGate>
            </div>
          </Card>
          ) : null}

          {!isUpcoming ? (
          <Card className="tf-card-live shrink-0 md:min-h-[140px] md:max-h-[min(260px,34vh)] md:overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <div className="flex flex-col items-start gap-1.5 md:flex-row md:items-center md:justify-between md:gap-2">
              <SectionTitle>Live</SectionTitle>
              <div className="tf-live-soft-surface min-w-0 w-full rounded-md bg-[#122940] px-2 py-1 text-[10px] text-sky-100/90 md:w-[90%]">
                {latestHighlight ? (
                  <span className="block truncate font-semibold">
                    {highlightMinuteLabel(latestHighlight)} {latestHighlightText}
                  </span>
                ) : (
                  <span className="block truncate font-semibold text-sky-200/70">Moments forts en attente...</span>
                )}
              </div>
            </div>
            {status === 'live' ? (
              <div className="tf-live-pitch-shell mt-2 flex max-h-[min(260px,36vh)] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg bg-[#101c2a] p-2">
                <div className="tf-live-tactical-strip mb-1.5 shrink-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-sky-200/90">
                      {dangerousLeader === 'home'
                        ? 'Pression · domicile'
                        : dangerousLeader === 'away'
                          ? 'Pression · extérieur'
                          : 'Équilibre offensif'}
                    </p>
                    <span className="shrink-0 text-[9px] font-black tabular-nums text-sky-50">
                      {livePitchPressure.dh} – {livePitchPressure.da}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/35">
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-emerald-500/95 to-emerald-400/75 transition-[width] duration-700 ease-out"
                      style={{ width: `${livePitchPressure.homeRatio * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-l from-rose-500/95 to-rose-400/75 transition-[width] duration-700 ease-out"
                      style={{ width: `${(1 - livePitchPressure.homeRatio) * 100}%` }}
                    />
                  </div>
                  {possessionRow && possessionRatioHome != null ? (
                    <div className="space-y-0.5 px-0.5">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wide text-sky-100">
                        <span>Possession</span>
                        <span className="tabular-nums text-sky-50">
                          {Math.round(possessionRow.home)}% – {Math.round(possessionRow.away)}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10">
                        <div
                          className="absolute inset-y-0 left-0 rounded-l-full bg-sky-400/90 transition-[width] duration-700"
                          style={{ width: `${possessionRatioHome * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                  {pitchStatPills.length > 0 ? (
                    <div className="-mx-0.5 flex max-w-full gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                      {pitchStatPills.map((row) => (
                        <span
                          key={row.label}
                          className="tf-live-stat-pill shrink-0 rounded-md border border-white/18 bg-[#0a1828]/95 px-2.5 py-1 text-[10px] font-black text-sky-50 shadow-sm"
                        >
                          <span className="text-sky-200">{row.label}</span>{' '}
                          <span className="tabular-nums text-white">{row.home}</span>
                          <span className="text-sky-400/75">-</span>
                          <span className="tabular-nums text-white">{row.away}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <LivePitchActionBanner
                  highlight={latestHighlight}
                  highlightText={latestHighlightText}
                  detectSide={detectHighlightSide}
                  dangerousLeader={dangerousLeader}
                  dangerousDelta={dangerousDelta}
                  homeLabel={homeHeaderLabel}
                  awayLabel={awayHeaderLabel}
                  homeColor={homeColor}
                  awayColor={awayColor}
                  pitchPressureTint={pitchPressureTint}
                  liveClockPaused={matchForClock?.liveClockPaused}
                  liveInSecondHalf={matchForClock?.liveInSecondHalf}
                />
              </div>
            ) : isFinished ? (
              <div className="tf-live-pitch-shell mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-lg bg-[#101c2a] p-3">
                <div className="tf-live-soft-surface rounded-lg border border-[#3a6690]/55 bg-[#0f2740]/85 px-3 py-3 text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-200/80">Match terminé</p>
                  <p className="mt-1 text-sm font-bold text-sky-50">
                    Score final: {homeScore} - {awayScore}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-200/75">
                    Statistiques finales disponibles dans les panneaux du match.
                  </p>
                </div>
              </div>
            ) : (
              <div className="tf-live-pitch-shell mt-2 flex min-h-0 flex-1 flex-col justify-center rounded-lg bg-[#101c2a] p-3">
                <div className="tf-live-soft-surface rounded-lg border border-[#3a6690]/55 bg-[#0f2740]/85 px-3 py-3 text-center">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-200/80">Match en attente</p>
                  <p className="mt-1 text-sm font-bold text-sky-50">
                    Coup d&apos;envoi prévu à {kickoffLabel}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-200/75">
                    Les stats live et la dynamique terrain arrivent au démarrage du match.
                  </p>
                </div>
              </div>
            )}
          </Card>
          ) : null}

          {!isUpcoming ? (
            <Card className="tf-card-feed hidden shrink-0 md:block md:max-h-[min(380px,42vh)] md:overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }}
              />
              <div className="mb-2 flex items-center justify-between gap-2">
                <SectionTitle>Match</SectionTitle>
                <div className="inline-flex rounded-md bg-[#0a1f35]/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDesktopFeedTab('actions')}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                      desktopFeedTab === 'actions'
                        ? 'bg-sky-300/25 text-sky-50'
                        : 'text-sky-200/70 hover:text-sky-50'
                    }`}
                  >
                    Actions
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopFeedTab('classement')}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                      desktopFeedTab === 'classement'
                        ? 'bg-sky-300/25 text-sky-50'
                        : 'text-sky-200/70 hover:text-sky-50'
                    }`}
                  >
                    Classement
                  </button>
                </div>
              </div>
              <div className="max-h-[min(320px,36vh)] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                {desktopFeedTab === 'actions' ? (
                  <MatchHighlights
                    items={smTimelineHighlights}
                    activeId={latestHighlight?.id}
                    variant="channel"
                    teamLabels={highlightTeamLabels}
                  />
                ) : (
                  channelStandingsContent()
                )}
              </div>
            </Card>
          ) : null}
        </div>

        <div
          className={cn(
            'tf-live-col tf-live-col-side hidden min-w-0 rounded-xl border border-[#2b5d87]/35 bg-[#071c31]/90 p-1.5 shadow-[0_12px_24px_rgba(2,8,18,0.26),inset_0_1px_0_rgba(255,255,255,0.05)] md:h-full md:min-h-0 md:flex-col md:overflow-y-auto md:[scrollbar-width:thin]',
            showMobileChannelChrome ? 'lg:flex' : 'md:flex',
            'space-y-2',
          )}
        >
          <Card className="tf-card-lineup min-w-0 shrink-0 overflow-hidden border-fuchsia-400/45 bg-[#1e2336] md:min-h-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${homeToneColor}, ${awayToneColor})` }} />
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Compositions</SectionTitle>
              <div className="inline-flex items-center gap-1 rounded-md bg-[#0a1f35]/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    pauseLineupAutoFor3Min()
                    setLineupSide('home')
                  }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                    lineupSide === 'home' ? 'text-white' : 'text-sky-100/80'
                  }`}
                  style={
                    lineupSide === 'home'
                      ? {
                          backgroundColor: homeToneColor,
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${homeToneColor} 74%, white)`,
                        }
                      : undefined
                  }
                >
                  {match?.home.shortName ?? teamShortChip(homeName)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pauseLineupAutoFor3Min()
                    setLineupSide('away')
                  }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                    lineupSide === 'away' ? 'text-white' : 'text-sky-100/80'
                  }`}
                  style={
                    lineupSide === 'away'
                      ? {
                          backgroundColor: awayToneColor,
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${awayToneColor} 74%, white)`,
                        }
                      : undefined
                  }
                >
                  {match?.away.shortName ?? teamShortChip(awayName)}
                </button>
              </div>
            </div>
            <MatchLineupPitch
              className="mt-2"
              layout={displayedLineupLayout}
              homeToneColor={homeToneColor}
              awayToneColor={awayToneColor}
              isUpcoming={isUpcoming}
              light={L}
              compact
            />
            <MatchLineupSubstitutes
              home={lineupSide === 'home' ? displayedLineupSubstitutes : []}
              away={lineupSide === 'away' ? displayedLineupSubstitutes : []}
              showWhenEmpty={status === 'live' || status === 'finished'}
              light={L}
            />
            {displayedLineupLayout.roster.length === 0 ? (
              <p className="mt-2 text-center text-[10px] font-semibold text-sky-200/70">
                Composition non disponible.
              </p>
            ) : null}
          </Card>

          <div ref={betCardRef} id="tf-channel-paris" className="scroll-mt-4">
          <Card
            className={cn(
              'tf-card-bet-shell shrink-0 !p-0 bg-transparent shadow-none md:flex md:flex-col',
              isUpcoming ? 'md:min-h-[200px]' : 'md:min-h-[180px] md:flex-1',
            )}
          >
            <div className={isUpcoming ? '' : 'md:flex-1'}>
              {isFinished ? (
                <div className="rounded-lg border border-[#3a6690]/55 bg-[#0a1f35]/85 px-3 py-3 text-sm font-semibold text-sky-100">
                  Paris fermés: le match est terminé.
                </div>
              ) : match ? (
                <BetWidget
                  match={match}
                  betting={betting}
                  bookOdds1x2={odds1x2}
                  bookOddsOverUnder25={oddsOverUnder25}
                  bookOddsLoading={oddsLoading}
                  oddsSource={oddsMeta.source}
                  oddsAlreadyLiveAdjusted
                  bettingSuspended={bettingSuspension.suspended}
                  bettingSuspendReason={bettingSuspension.reason}
                  teamAttackIndices={attackIndices}
                  compact
                  liveScore={{ home: homeScore, away: awayScore }}
                  liveMinute={liveDisplayedMinute}
                  liveStatRows={liveStatRows}
                  lineupScorers={lineupScorerPicks}
                  scoredButeurs={scoredButeurSlugs}
                />
              ) : (
                <div className="rounded-lg bg-[#0a1f35]/80 px-3 py-2 text-sm font-semibold text-sky-100">
                  Match indisponible pour les paris.
                </div>
              )}
            </div>
          </Card>
          </div>

          {showChannelTifo && channelTifoGroupId ? (
            <div id="tf-channel-tifo" className="scroll-mt-4 shrink-0">
              <Card className="tf-card-tribune !p-2.5">
                <GroupTifoPanel
                  embedded
                  groupId={channelTifoGroupId}
                  matches={matches}
                  fixedMatchId={match.id}
                  isGroupAdmin={false}
                />
              </Card>
            </div>
          ) : null}
        </div>
      </main>

      {showMobileChannelChrome && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div
                className={cn('tf-channel-mobile-dock-shell', chDockShell)}
                role="toolbar"
                aria-label="Navigation match mobile"
                data-tf-channel-dock="true"
              >
                <button
                  type="button"
                  className={chDockBtn(mobilePanel === 'match' && mobileMatchTab === 'stats')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setMobilePanel('match')
                    setMobileMatchTab('stats')
                  }}
                >
                  Match
                </button>
                <button
                  type="button"
                  className={chDockBtn(mobilePanel === 'match' && mobileMatchTab === 'compo')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setMobilePanel('match')
                    setMobileMatchTab('compo')
                  }}
                >
                  Compo
                </button>
                <button
                  type="button"
                  className={chDockBtn(mobilePanel === 'paris', 'paris')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setMobilePanel('paris')}
                >
                  Paris
                </button>
                <button
                  type="button"
                  className={chDockBtn(mobilePanel === 'tribune')}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setMobilePanel('tribune')}
                >
                  Tribune
                </button>
              </div>

              {mobilePanel ? (
                <div
                  className={cn('tf-channel-mobile-sheet-layer', chSheetBackdrop)}
                  data-tf-modal="true"
                  data-no-swipe="true"
                  role="dialog"
                  aria-modal="true"
                >
                  <button
                    type="button"
                    className="absolute inset-0"
                    aria-label="Fermer le panneau"
                    onClick={() => setMobilePanel(null)}
                  />
                  <div
                    className={cn(
                      'relative z-10 w-full max-h-[min(88dvh,calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px)))] overflow-y-auto rounded-2xl border p-3 shadow-2xl',
                      chSheetPanel,
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
            <div className="mb-2 flex items-center justify-between">
              <p className={cn('text-xs font-black uppercase tracking-wider', chSheetTitle)}>
                {mobilePanel === 'match'
                  ? mobileMatchTab === 'compo'
                    ? 'Composition'
                    : 'Match'
                  : mobilePanel === 'paris'
                    ? 'Paris'
                    : 'Tribune'}
              </p>
              <button type="button" onClick={() => setMobilePanel(null)} className={chSheetGhostBtn}>
                Fermer
              </button>
            </div>
            {mobilePanel === 'match' ? (
              <div className="mb-2 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                {(
                  [
                    ['stats', 'Stats'],
                    ['infos', 'Infos'],
                    ['compo', 'Compo'],
                    ['actions', 'Actions'],
                    ['classement', 'Class.'],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMobileMatchTab(tab)}
                    className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${
                      mobileMatchTab === tab ? chSheetTabActive : chSheetTabIdle
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'stats' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-white/10 bg-[#0a1f35]/70 px-2.5 py-2 text-center">
                  <span className="truncate text-xs font-black text-white">{homeName}</span>
                  <span className="text-lg font-black tabular-nums text-sky-50">
                    {homeScore} – {awayScore}
                  </span>
                  <span className="truncate text-xs font-black text-white">{awayName}</span>
                </div>
                {liveStatsLoading && !isUpcoming && mobileStatRows.length === 0 ? (
                  <p className="rounded-lg border border-white/10 bg-[#0a1f35]/70 px-3 py-2 text-center text-[11px] font-semibold text-sky-200/80">
                    Chargement des stats…
                  </p>
                ) : null}
                {mobileStatRows.map((row, i) => (
                  <ChannelLiveStatBar key={`mobile-stat-${row.key ?? i}`} row={row} />
                ))}
                {isUpcoming && mobileStatRows.length === 0 ? (
                  <p className="rounded-lg border border-white/10 bg-[#0a1f35]/70 px-3 py-2 text-center text-[11px] font-semibold text-sky-200/75">
                    Les stats live (possession, tirs…) seront disponibles au coup d&apos;envoi.
                  </p>
                ) : null}
                {!isUpcoming && !liveStatsLoading && mobileStatRows.length === 0 ? (
                  <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-[11px] font-semibold text-amber-100/90">
                    Stats SportMonks indisponibles pour ce match (tirs, possession, etc.).
                  </p>
                ) : null}
                {smTimelineHighlights.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-sky-200/80">
                      Fil du match
                    </p>
                    <div className="max-h-[38vh] overflow-y-auto pr-0.5">
                      <MatchHighlights
                        items={smTimelineHighlights}
                        activeId={latestHighlight?.id}
                        variant="channel"
                        teamLabels={highlightTeamLabels}
                      />
                    </div>
                  </div>
                ) : !isUpcoming && !liveStatsLoading && mobileStatRows.length === 0 ? (
                  <p className="text-center text-[11px] font-semibold text-sky-200/70">
                    Les actions (buts, cartons, remplacements) apparaissent dans l’onglet Actions.
                  </p>
                ) : null}
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'infos' ? (
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={chInfoCell}>Compétition: {match?.competition.shortName ?? 'Ligue 1'}</div>
                <div className={chInfoCell}>Coup d’envoi: {kickoffLabel}</div>
                <div className={chInfoCell}>
                  Statut: {status === 'live' ? 'Live' : status === 'finished' ? 'Terminé' : 'À venir'}
                </div>
                <div className={chInfoCell}>Minute: {status === 'live' ? liveClockLabel || '—' : '—'}</div>
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'actions' ? (
              <div className="max-h-[58vh] overflow-y-auto pr-0.5">
                <MatchHighlights
                  items={smTimelineHighlights}
                  activeId={latestHighlight?.id}
                  variant="channel"
                  teamLabels={highlightTeamLabels}
                />
              </div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'classement' ? (
              <div className="max-h-[58vh] overflow-y-auto pr-0.5">{channelStandingsContent()}</div>
            ) : null}
            {mobilePanel === 'match' && mobileMatchTab === 'compo' ? (
              <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-0.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      pauseLineupAutoFor3Min()
                      setLineupSide('home')
                    }}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] font-bold ${
                      lineupSide === 'home' ? chLineupTabActive : chLineupTabIdle
                    }`}
                  >
                    {match?.home.shortName ?? teamShortChip(homeName)} · {homeName}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      pauseLineupAutoFor3Min()
                      setLineupSide('away')
                    }}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] font-bold ${
                      lineupSide === 'away' ? chLineupTabActive : chLineupTabIdle
                    }`}
                  >
                    {match?.away.shortName ?? teamShortChip(awayName)} · {awayName}
                  </button>
                </div>
                <MatchLineupPitch
                  layout={displayedLineupLayout}
                  homeToneColor={homeToneColor}
                  awayToneColor={awayToneColor}
                  isUpcoming={isUpcoming}
                  light={L}
                  compact
                  className="w-full min-w-0"
                />
                <MatchLineupSubstitutes
                  home={lineupSide === 'home' ? displayedLineupSubstitutes : []}
                  away={lineupSide === 'away' ? displayedLineupSubstitutes : []}
                  showWhenEmpty={status === 'live' || status === 'finished'}
                  light={L}
                />
                {displayedLineupLayout.roster.length === 0 ? (
                  <p className="text-center text-[11px] font-semibold text-sky-200/75">Composition non disponible.</p>
                ) : null}
              </div>
            ) : null}
            {mobilePanel === 'paris' ? (
              <div className="max-h-[min(88dvh,calc(100dvh-6rem-env(safe-area-inset-bottom,0px)))] overflow-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                {isFinished ? (
                  <div className={chAlertBox}>Paris fermés: le match est terminé.</div>
                ) : match ? (
                  <BetWidget
                    match={match}
                    betting={betting}
                    bookOdds1x2={odds1x2}
                    bookOddsOverUnder25={oddsOverUnder25}
                    bookOddsLoading={oddsLoading}
                    oddsSource={oddsMeta.source}
                    oddsAlreadyLiveAdjusted
                    bettingSuspended={bettingSuspension.suspended}
                    bettingSuspendReason={bettingSuspension.reason}
                    teamAttackIndices={attackIndices}
                    compact
                    autoOpenSheet
                    liveScore={{ home: homeScore, away: awayScore }}
                    liveMinute={liveDisplayedMinute}
                    liveStatRows={liveStatRows}
                    lineupScorers={lineupScorerPicks}
                    scoredButeurs={scoredButeurSlugs}
                  />
                ) : (
                  <div className={chAlertBoxPlain}>Match indisponible pour les paris.</div>
                )}
              </div>
            ) : null}
            {mobilePanel === 'tribune' ? (
              <div className="space-y-2">
                <p className="text-xs text-sky-200/80">Tribune actuelle: {tribuneOptions.find((t) => t.id === selectedTribune)?.label}</p>
                {isFinished ? (
                  <p className="text-[11px] font-semibold text-sky-200/75">Match terminé — changement de tribune indisponible.</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setMobilePanel(null)
                    setTribuneModalOpen(true)
                  }}
                  className="w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2 text-xs font-bold text-[#06242a]"
                >
                  Ouvrir la carte du stade
                </button>
                {showChannelTifo && channelTifoGroupId && match ? (
                  <div className="max-h-[min(42dvh,16rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                    <GroupTifoPanel
                      embedded
                      groupId={channelTifoGroupId}
                      matches={matches}
                      fixedMatchId={match.id}
                      isGroupAdmin={false}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
                  </div>
                </div>
              ) : null}
            </>,
            document.body,
          )
        : null}

      {standingsModalOpen ? (
        <div
          className="fixed inset-0 z-[91] flex items-center justify-center p-3 sm:p-4"
          data-no-swipe="true"
          data-tf-modal="true"
          role="dialog"
          aria-modal="true"
          aria-label="Classement avant-match"
        >
          <button
            type="button"
            className={L ? 'absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]' : 'absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]'}
            onClick={() => setStandingsModalOpen(false)}
            aria-label="Fermer le classement"
          />
          <div
            className={cn(
              'relative z-10 flex w-full max-w-lg flex-col rounded-2xl border p-4 shadow-2xl',
              L ? 'border-slate-200 bg-white' : 'border-[#5d7cff]/45 bg-[#0c2b48]',
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h3 className={cn('text-sm font-bold', L ? 'text-[#023458]' : 'text-sky-100')}>
                Classement · {match?.competition.shortName ?? match?.competition.name ?? 'Compétition'}
              </h3>
              <button type="button" onClick={() => setStandingsModalOpen(false)} className={chSheetGhostBtn}>
                Fermer
              </button>
            </div>
            <p className={cn('mt-1 shrink-0 text-[11px]', L ? 'text-[#3d5670]' : 'text-sky-200/80')}>
              Contexte avant le coup d&apos;envoi — défilement dans cette fenêtre uniquement.
            </p>
            <div className="mt-3 min-h-0">
              {channelStandingsContent('max-h-[min(62dvh,440px)]')}
            </div>
          </div>
        </div>
      ) : null}

      {tribuneModalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4"
          data-no-swipe="true"
          data-tf-modal="true"
          role="dialog"
          aria-modal="true"
          aria-label="Choix de tribune"
        >
          <button
            type="button"
            className={L ? 'absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]' : 'absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]'}
            onClick={() => setTribuneModalOpen(false)}
            aria-label="Fermer la carte du stade"
          />
          <div
            className={`relative z-10 w-full max-w-xl rounded-2xl border p-4 shadow-2xl ${
              L ? 'border-slate-200 bg-white' : 'border-[#5d7cff]/45 bg-[#0c2b48]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className={cn('text-sm font-bold', L ? 'text-[#023458]' : 'text-sky-100')}>
                Carte des tribunes
              </h3>
              <button
                type="button"
                onClick={() => setTribuneModalOpen(false)}
                className={chSheetGhostBtn}
              >
                Fermer
              </button>
            </div>
            <p className={cn('mt-1 text-[11px]', L ? 'text-[#3d5670]' : 'text-sky-200/80')}>
              Sélectionne ta zone pour vivre le match dans le groupe qui te correspond.
              {chatClosedAfterMatch
                ? ' Le match est terminé : consultation seule, sans changement de tribune.'
                : chatDebriefOpen
                  ? ` Débrief : le tchat reste ouvert encore ~${debriefMinutesLeft} min (30 min max).`
                  : ''}
            </p>

            <div className="relative mt-3 h-[220px] overflow-hidden rounded-xl border border-[#2a5a84] bg-[#061524]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(125,211,252,0.1),transparent_55%)]" />
              <div className="absolute left-1/2 top-1/2 h-[196px] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/20 bg-gradient-to-b from-[#12324f] to-[#0a2238]" />
              <div className="absolute left-1/2 top-1/2 h-[168px] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/15 bg-gradient-to-b from-[#0f2e49] to-[#0a2136]" />
              <div className="absolute left-1/2 top-1/2 h-[142px] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-sky-200/20 bg-[#0c2740]" />
              <div className="absolute left-1/2 top-1/2 h-[112px] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-emerald-200/30 bg-gradient-to-b from-[#0f5b3d] to-[#0a3f2b]" />

              <div className="absolute left-1/2 top-[11%] h-[124px] w-px -translate-x-1/2 bg-sky-100/15" />
              <div className="absolute bottom-[11%] left-1/2 h-[124px] w-px -translate-x-1/2 bg-sky-100/15" />
              <div className="absolute left-[11%] top-1/2 h-px w-[124px] -translate-y-1/2 bg-sky-100/15" />
              <div className="absolute right-[11%] top-1/2 h-px w-[124px] -translate-y-1/2 bg-sky-100/15" />

              <div className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
              <div className="absolute left-1/2 top-1/2 h-[70px] w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />
              <div className="absolute left-1/2 top-1/2 h-px w-[98px] -translate-x-1/2 -translate-y-1/2 bg-white/20" />

              {tribuneOptions.map((opt, i) => (
                <button
                  key={`stadium-${opt.id}`}
                  type="button"
                  onClick={() => {
                    if (!chatClosedAfterMatch) setSelectedTribune(opt.id)
                  }}
                  disabled={chatClosedAfterMatch}
                  className={cn(
                    'absolute border text-[10px] font-black transition-all duration-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]',
                    i === 0
                      ? 'left-[14%] right-[14%] top-[5%] h-[17%] rounded-b-[1.2rem] rounded-t-md'
                      : i === 1
                        ? 'left-[14%] right-[14%] bottom-[5%] h-[17%] rounded-t-[1.2rem] rounded-b-md'
                        : i === 2
                          ? 'left-[4%] top-[24%] bottom-[24%] w-[13%] rounded-r-[1.2rem] rounded-l-md'
                          : 'right-[4%] top-[24%] bottom-[24%] w-[13%] rounded-l-[1.2rem] rounded-r-md',
                    selectedTribune === opt.id
                      ? 'border-sky-100 bg-sky-500/45 text-white shadow-[0_0_18px_rgba(125,211,252,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-sky-200/55'
                      : 'border-white/40 bg-black/40 text-white hover:border-sky-200/80 hover:bg-sky-900/50',
                    chatClosedAfterMatch && 'cursor-not-allowed opacity-55',
                  )}
                >
                  <span className="flex h-full w-full items-center justify-center px-1 text-center leading-tight tracking-tight">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            <div
              className={cn(
                'mt-3 rounded-lg border px-3 py-2',
                L ? 'border-slate-200/90 bg-slate-50' : 'border-[#3a6690]/50 bg-[#0e253d]/85',
              )}
            >
              <p className={cn('text-xs font-bold', L ? 'text-[#023458]' : 'text-sky-100')}>
                {tribuneOptions.find((t) => t.id === selectedTribune)?.label}
              </p>
              <p className={cn('mt-0.5 text-[11px]', L ? 'text-[#3d5670]' : 'text-sky-200/75')}>
                {tribuneOptions.find((t) => t.id === selectedTribune)?.vibe}
              </p>
            </div>

            {isFinished ? (
              <p
                className={`mt-3 rounded-lg border px-3 py-2 text-center text-xs font-semibold ${
                  L ? 'border-slate-200 bg-slate-100 text-[#2a4f68]' : 'border-[#3a6690]/60 bg-[#0a1f35]/90 text-sky-200/90'
                }`}
              >
                Match terminé — tu ne peux plus changer de tribune pour ce live.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setTribuneModalOpen(false)}
                className="mt-3 w-full rounded-lg border border-[#00d1b6]/55 bg-[#18d3b8] px-3 py-2 text-xs font-bold text-[#06242a] transition hover:bg-[#2be0c6]"
              >
                Rejoindre cette tribune
              </button>
            )}
          </div>
        </div>
      ) : null}
      {typeof document !== 'undefined' && showLiveChat && paidFxLayers.length > 0
        ? createPortal(
            <div className="tf-paid-fx-portal-layer tf-paid-fx-portal" aria-hidden>
              {paidFxLayers.map((layer) => (
                <div key={layer.layerId} className="pointer-events-none absolute inset-0 overflow-hidden">
                  {layer.fx.id === 'stroboscope' ? <PaidPhoneFlashBurst seed={layer.seed} /> : null}
                  {layer.fx.id === 'fumigene' ? (
                    <PaidFlareBurst seed={layer.seed} color={layer.fx.flareColor ?? 'red'} />
                  ) : null}
                  {layer.fx.id === 'ola' ? <PaidConfettiBurst seed={layer.seed} /> : null}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pb-28 sm:pt-16"
                  >
                    {layer.fx.id === 'tifo-geant' ? (
                      <div
                        className="w-[min(92vw,20rem)] max-w-full rounded-xl border-2 px-3 py-2.5 text-center shadow-2xl backdrop-blur-sm sm:w-[min(90vw,24rem)] sm:px-4 sm:py-3"
                        style={{
                          borderColor:
                            layer.fx.tifoSide === 'away'
                              ? `color-mix(in srgb, ${awayColor} 85%, white)`
                              : `color-mix(in srgb, ${homeColor} 85%, white)`,
                          background:
                            layer.fx.tifoSide === 'away'
                              ? `linear-gradient(125deg, color-mix(in srgb, ${awayColor} 55%, #041a2d), #0a2540 55%, #061a2e)`
                              : `linear-gradient(125deg, color-mix(in srgb, ${homeColor} 55%, #041a2d), #0a2540 55%, #061a2e)`,
                          boxShadow: L
                            ? '0 0 0 2px rgba(255,255,255,0.95), 0 18px 48px rgba(2,12,28,0.45)'
                            : '0 14px 40px rgba(0,0,0,0.45)',
                        }}
                      >
                        <p
                          className="text-xs font-black leading-snug tracking-wide sm:text-base sm:tracking-wide"
                          style={{
                            color: '#ffffff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 18px rgba(0,0,0,0.5)',
                          }}
                        >
                          ALLEZ {(layer.fx.tifoSide === 'away' ? awayName : homeName).toUpperCase()}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
      {!isFinished && fullscreenEvent ? (
        <div className="tf-live-fullscreen-fx pointer-events-none fixed inset-0 z-[2147482400] overflow-hidden">
          <div className="absolute inset-0 bg-black/28" />
          <div
            className={`absolute inset-[-16%] animate-[tf-goal-bg_1100ms_ease-out_forwards] ${
              fullscreenEvent.kind === 'goal'
                ? ''
                : fullscreenEvent.kind === 'card'
                  ? ''
                  : fullscreenEvent.kind === 'kickoff'
                    ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.44),rgba(6,17,30,0.12)_55%,transparent_78%)]'
                    : 'bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.44),rgba(6,17,30,0.12)_55%,transparent_78%)]'
            }`}
            style={
              (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                ? {
                    background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, ${fullscreenAccentColor} 52%, transparent), rgba(6,17,30,0.12) 55%, transparent 78%)`,
                  }
                : undefined
            }
          />
          <div
            className={`absolute inset-0 border-[5px] animate-[tf-live-rim-pulse_850ms_ease-in-out_1] ${
              fullscreenEvent.kind === 'goal'
                ? ''
                : fullscreenEvent.kind === 'card'
                  ? ''
                  : fullscreenEvent.kind === 'kickoff'
                    ? 'border-sky-300/85'
                    : 'border-violet-300/85'
            }`}
            style={
              (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                ? { borderColor: `color-mix(in srgb, ${fullscreenAccentColor} 72%, white)` }
                : undefined
            }
          />

          {fullscreenEvent.kind === 'goal'
            ? [
                ['10%', '18%', 'text-2xl', 0],
                ['26%', '66%', 'text-4xl', 120],
                ['48%', '14%', 'text-6xl', 60],
                ['66%', '62%', 'text-3xl', 180],
                ['80%', '28%', 'text-5xl', 90],
              ].map(([l, t, size, d], i) => (
                <span
                  key={`goal-word-${i}`}
                  className={`absolute font-black uppercase tracking-widest ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{
                    left: l,
                    top: t,
                    animationDelay: `${d}ms`,
                    color: fullscreenAccentColor
                      ? `color-mix(in srgb, ${fullscreenAccentColor} 62%, white)`
                      : undefined,
                  }}
                >
                  GOAL
                </span>
              ))
            : null}

          {fullscreenEvent.kind === 'card'
            ? [
                ['12%', '22%', '🟨', 'text-5xl', 0],
                ['24%', '70%', '🟥', 'text-4xl', 120],
                ['44%', '18%', '🟨', 'text-6xl', 70],
                ['68%', '64%', '🟥', 'text-5xl', 180],
                ['82%', '30%', '🟨', 'text-4xl', 90],
              ].map(([l, t, emoji, size, d], i) => (
                <span
                  key={`card-emoji-${i}`}
                  className={`absolute ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{ left: l, top: t, animationDelay: `${d}ms` }}
                >
                  {emoji}
                </span>
              ))
            : null}
          {fullscreenEvent.kind === 'kickoff'
            ? [
                ['12%', '22%', '🔔', 'text-5xl', 0],
                ['28%', '70%', '📣', 'text-4xl', 120],
                ['48%', '16%', '🎺', 'text-6xl', 70],
                ['70%', '64%', '🔔', 'text-5xl', 180],
                ['84%', '30%', '📣', 'text-4xl', 90],
              ].map(([l, t, emoji, size, d], i) => (
                <span
                  key={`kickoff-emoji-${i}`}
                  className={`absolute ${size} animate-[tf-goal-pop_1100ms_ease-out_forwards]`}
                  style={{ left: l, top: t, animationDelay: `${d}ms` }}
                >
                  {emoji}
                </span>
              ))
            : null}

          <div
            className={`absolute inset-0 flex justify-center px-4 ${
              fullscreenEvent.kind === 'var' ? 'items-start pt-20' : 'items-center'
            }`}
          >
            <div
              className={`w-full max-w-xl rounded-2xl border px-7 py-5 text-center shadow-2xl backdrop-blur-md [transform:translateZ(0)] ${
                fullscreenEvent.kind === 'goal'
                  ? ''
                  : fullscreenEvent.kind === 'card'
                    ? ''
                    : fullscreenEvent.kind === 'kickoff'
                      ? 'border-sky-300/85 bg-[#0b1f35]/84'
                      : 'border-violet-300/85 bg-[#1a1333]/82'
              }`}
              style={{
                borderColor:
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? `color-mix(in srgb, ${fullscreenAccentColor} 72%, white)`
                    : undefined,
                background:
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? `color-mix(in srgb, ${fullscreenAccentColor} 22%, #091425)`
                    : undefined,
                animation:
                  fullscreenEvent.kind === 'var'
                    ? 'tf-commentary-in 380ms ease-out forwards'
                    : 'tf-commentary-in 260ms ease-out forwards',
              }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/75">Ambiance stade</p>
              <p
                className={`mt-1 text-5xl font-black tracking-wider ${
                  fullscreenEvent.kind === 'goal'
                    ? 'animate-[tf-goal-shake_760ms_ease-out_1]'
                    : fullscreenEvent.kind === 'card'
                      ? 'animate-[tf-goal-shake_760ms_ease-out_1]'
                      : fullscreenEvent.kind === 'kickoff'
                        ? 'text-sky-200 animate-[tf-goal-shake_760ms_ease-out_1]'
                        : 'text-violet-200'
                }`}
                style={
                  (fullscreenEvent.kind === 'goal' || fullscreenEvent.kind === 'card') && fullscreenAccentColor
                    ? { color: `color-mix(in srgb, ${fullscreenAccentColor} 75%, white)` }
                    : undefined
                }
              >
                {fullscreenEvent.kind === 'goal'
                  ? '⚽'
                  : fullscreenEvent.kind === 'card'
                    ? '🟨'
                    : fullscreenEvent.kind === 'kickoff'
                      ? '🎺'
                      : '📺'}{' '}
                {fullscreenEvent.title}
              </p>
              {fullscreenEvent.subtitle ? (
                <p className="mt-2 text-base font-semibold text-sky-50">{fullscreenEvent.subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
