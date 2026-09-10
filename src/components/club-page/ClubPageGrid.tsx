import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import type { Team } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import type { ClubDebateItem, ClubPageMock, ClubShopItem } from '../../data/clubPageMock'
import type { ClubScheduleListItem, SmSquadPlayerRow, TeamSeasonStatRow } from '../../api/sportMonks'
import type { LeagueStandingRow } from '../../data/leagueStandings'
import { Card } from '../ui/Card'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'
import { ClubCrest } from '../brand/ClubCrest'
import { LeagueStandingsTable } from '../rankings/LeagueStandingsTable'
import { UltraAvatarFrame } from '../subscription/UltraAvatarFrame'
import { formatKickoff } from '../../utils/time'

type ClubReadingLink = {
  id: string
  title: string
  excerpt: string
  url: string
  source: string
  internal: boolean
}

function encartClass(
  key:
    | 'pitch'
    | 'debate'
    | 'shop'
    | 'season'
    | 'tribune'
    | 'stats'
    | 'podium'
    | 'pulse'
    | 'reading',
) {
  const c = {
    pitch:
      'border border-white/10 border-l-4 border-l-emerald-400/85 bg-gradient-to-b from-emerald-950/45 via-[#0a1118] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(16,185,129,0.06)]',
    debate:
      'border border-white/10 border-l-4 border-l-rose-500/90 bg-gradient-to-b from-rose-950/40 via-[#140a0f] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(244,63,94,0.08)]',
    shop:
      'border border-white/10 border-l-4 border-l-amber-500/80 bg-gradient-to-b from-amber-950/30 via-[#0f0d0a] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(245,158,11,0.08)]',
    season:
      'border border-white/10 border-l-4 border-l-sky-500/80 bg-gradient-to-b from-sky-950/40 via-[#0a0f16] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(14,165,233,0.1)]',
    tribune:
      'border border-white/10 border-l-4 border-l-violet-500/80 bg-gradient-to-b from-violet-950/25 via-[#0c0a12] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(139,92,246,0.1)]',
    stats:
      'border border-white/10 border-l-4 border-l-teal-500/70 bg-gradient-to-b from-teal-950/30 via-[#0a1012] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(20,184,166,0.08)]',
    podium:
      'border border-white/10 border-l-4 border-l-amber-300/80 bg-gradient-to-b from-amber-950/30 via-[#0f0c08] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(251,191,36,0.1)]',
    pulse:
      'border border-white/10 border-l-4 border-l-tf-cta/85 bg-gradient-to-b from-red-950/25 via-[#120a0a] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(255,59,59,0.1)]',
    reading:
      'border border-white/10 border-l-4 border-l-sky-300/80 bg-gradient-to-b from-sky-950/25 via-[#090f16] to-tf-c30-surface/98 shadow-[0_1px_0_rgba(255,255,255,0.05),inset_0_0_0_1px_rgba(125,211,252,0.1)]',
  } as const
  return c[key]
}

function ClubEncartTitle({
  kicker,
  kickerClass,
  children,
  subtitle,
}: {
  kicker: string
  kickerClass: string
  children: ReactNode
  subtitle?: string
}) {
  return (
    <div>
      <p
        className={cn('text-[9px] font-black uppercase tracking-[0.2em] sm:text-[10px] sm:tracking-[0.22em]', kickerClass)}
      >
        {kicker}
      </p>
      <h2 className="mt-0.5 font-display text-base font-black leading-tight tracking-tight text-tf-app-fg sm:text-lg">
        {children}
      </h2>
      {subtitle ? <p className="mt-1.5 text-xs leading-relaxed text-sky-100/85">{subtitle}</p> : null}
    </div>
  )
}

/** Pastille joueur : tête nette ; numéro en pastille lisible (hors visage). */
function SquadPlayerThumb({
  number,
  photoUrl,
  primary,
  secondary,
  active,
  size = 'sm',
}: {
  number: string
  photoUrl?: string
  primary: string
  secondary: string
  active?: boolean
  size?: 'sm' | 'lg'
}) {
  const dim = size === 'lg' ? 'size-16 sm:size-20' : 'size-10'
  const numClass = size === 'lg' ? 'text-[11px] sm:text-xs' : 'text-[10px]'
  return (
    <span className="relative flex shrink-0 flex-col items-center gap-0.5">
      <span
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full border-2 text-white',
          dim,
          active
            ? 'border-amber-300/95 shadow-[0_0_14px_rgba(251,191,36,0.5)]'
            : 'border-white/20',
        )}
        style={
          photoUrl
            ? undefined
            : { background: `linear-gradient(135deg, ${primary}, ${secondary})` }
        }
        aria-hidden
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover object-[50%_18%]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={cn('relative z-[1] font-black tabular-nums', size === 'lg' ? 'text-lg' : 'text-xs')}>
            #{number}
          </span>
        )}
        {active ? <UltraAvatarFrame size={size === 'lg' ? 'salon' : 'compact'} /> : null}
      </span>
      {photoUrl ? (
        <span
          className={cn(
            'rounded-md bg-black/85 px-1.5 py-0.5 font-black tabular-nums leading-none text-amber-50 ring-1 ring-amber-300/40',
            numClass,
            active && 'bg-amber-500/90 text-amber-950 ring-amber-200/70',
          )}
        >
          #{number}
        </span>
      ) : null}
    </span>
  )
}

function statTileClass(i: number) {
  const t = [
    'border-tf-pitch/40 bg-gradient-to-br from-teal-500/22 to-black/40 ring-1 ring-teal-500/20',
    'border-sky-500/40 bg-gradient-to-br from-sky-500/18 to-black/40 ring-1 ring-sky-400/18',
    'border-amber-500/35 bg-gradient-to-br from-amber-500/16 to-black/40 ring-1 ring-amber-500/12',
    'border-violet-500/30 bg-gradient-to-br from-violet-500/12 to-black/40 ring-1 ring-violet-500/10',
  ]
  return t[i % 4] ?? t[0]
}

const debateFilters = [
  { id: 'trending' as const, label: 'Tendance' },
  { id: 'recent' as const, label: 'Récent' },
  { id: 'live' as const, label: 'Live' },
]

function ClubDebatesBlock({
  debates,
  matchMode,
  totalDebates,
}: {
  debates: ClubDebateItem[]
  matchMode: boolean
  totalDebates: number
}) {
  const [f, setF] = useState<'trending' | 'recent' | 'live'>('trending')
  const list = useMemo(() => {
    if (f === 'live') return debates.filter((d) => d.isLive)
    if (f === 'trending') return [...debates].sort((a, b) => b.comments - a.comments)
    return [...debates].reverse()
  }, [debates, f])

  return (
    <Card
      className={cn(
        'overflow-hidden p-0 shadow-tf-elev-2',
        encartClass('debate'),
        matchMode && 'ring-1 ring-rose-500/20',
      )}
    >
      <div className="border-b border-rose-500/15 bg-black/20 p-3 sm:p-4">
        <ClubEncartTitle
          kicker="Opinions & sondages"
          kickerClass="text-rose-200/90"
          subtitle="Les pourcentages agrègent les avis."
        >
          Actu &amp; débats
        </ClubEncartTitle>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {debateFilters.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setF(x.id)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide transition',
                f === x.id
                  ? 'bg-rose-600 text-white shadow-[0_4px_20px_rgba(225,29,72,0.35)] ring-1 ring-rose-300/30'
                  : 'border border-white/15 bg-black/30 text-sky-100/90 hover:border-rose-500/25',
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="max-h-[min(50vh,22rem)] space-y-2.5 overflow-y-auto p-3 sm:p-4 sm:pt-0">
        {list.map((d) => {
          const yes = d.yesPct
          const no = 100 - yes
          return (
            <li
              key={d.id}
              className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-3 ring-1 ring-rose-500/10 text-pretty"
            >
              <p className="text-sm font-black leading-snug text-sky-50 [text-shadow:0_1px_1px_rgba(0,0,0,0.45)]">
                {d.title}
              </p>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full border border-white/5 bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400/95 shadow-[0_0_12px_rgba(244,63,94,0.45)] transition-[width]"
                  style={{ width: `${yes}%` }}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-sky-200/90">
                <span className="text-sky-100/95">
                  {yes}% · {no}%
                </span>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-sky-100/95">{d.comments} avis</span>
              </div>
              {d.isLive ? (
                <a
                  href="/groups"
                  className="mt-2 inline-flex min-h-tf-touch items-center text-xs font-black text-rose-200/95 underline-offset-2 hover:underline"
                >
                  Rejoindre la tribune
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>
      <div className="flex flex-col gap-2 border-t border-rose-500/20 bg-black/20 p-3 sm:flex-row sm:items-stretch sm:gap-2">
        <Link
          to="/debates"
          className={cn(
            'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05] px-3 text-center text-xs font-bold text-sky-100/90 transition hover:bg-white/[0.1] sm:min-w-0 sm:text-left',
            TF_FOCUS_VISIBLE,
          )}
        >
          Voir tous les débats
          <span className="ml-1.5 text-[10px] font-black text-rose-200/80">({totalDebates})</span>
        </Link>
        <Link
          to="/debates"
          className={cn(
            'inline-flex min-h-tf-touch flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-bold text-tf-app-fg transition hover:bg-white/[0.15]',
            TF_FOCUS_VISIBLE,
          )}
        >
          + Lancer un débat
        </Link>
      </div>
    </Card>
  )
}

function ClubShopBlock({
  items,
  onPreview,
  previewId,
  wallet,
}: {
  items: ClubShopItem[]
  onPreview: (id: string | null) => void
  previewId: string | null
  wallet: { balance: string; owned: string }
}) {
  return (
    <Card className={cn('p-0 shadow-tf-elev-2', encartClass('shop'))}>
      <div className="p-3 sm:p-4">
        <ClubEncartTitle
          kicker="Cosmétiques & tribune"
          kickerClass="text-amber-200/90"
          subtitle="Skins, badges, effets — aperçu sur ton avatar."
        >
          Boutique club (déco)
        </ClubEncartTitle>
      </div>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 sm:pt-0">
      <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              seed={previewId ? `shop-${previewId}` : 'TF'}
              accent="rose"
              className="!size-16 border-2 border-amber-400/40"
            />
            {previewId ? (
              <span className="absolute -bottom-1 -right-1 rounded-full border border-amber-400/50 bg-amber-500/30 px-1.5 text-[8px] font-black text-amber-100">
                aperçu
              </span>
            ) : null}
          </div>
          <p className="min-w-0 flex-1 text-xs text-sky-100/80">
            Choisis un article pour l’équiper visuellement en tribune.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-44 sm:shrink-0">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 text-center sm:text-left">
            <p className="text-[8px] font-black uppercase tracking-wider text-amber-200/80">Étoiles</p>
            <p className="mt-0.5 text-sm font-black text-amber-50">
              {wallet.balance} <span className="text-amber-200/90">⭐</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-2 text-center sm:text-left">
            <p className="text-[8px] font-black uppercase tracking-wider text-sky-200/75">Déco possédée</p>
            <p className="mt-0.5 text-sm font-black text-white">{wallet.owned}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {items.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPreview(s.id === previewId ? null : s.id)}
            className={cn(
              'tf-interactive-press flex w-[7.5rem] shrink-0 flex-col items-start gap-1 rounded-2xl border p-2.5 text-left',
              previewId === s.id ? 'border-amber-400/50 bg-amber-500/15' : 'border-white/10 bg-white/[0.04]',
            )}
          >
            <span className="text-xl">{s.emoji}</span>
            <span className="line-clamp-2 text-xs font-bold text-tf-app-fg">{s.label}</span>
            <span className="text-xs font-black text-amber-200/90">{s.price} ⭐</span>
          </button>
        ))}
      </div>
      </div>
      <div className="flex justify-end border-t border-amber-500/20 bg-black/20 px-3 py-2.5 sm:px-4">
        <Link
          to="/boutique"
          className={cn(
            'text-xs font-black text-amber-200/95 underline-offset-2 transition hover:text-amber-100 hover:underline',
            TF_FOCUS_VISIBLE,
          )}
        >
          Toute la boutique →
        </Link>
      </div>
    </Card>
  )
}

function formColor(r: 'V' | 'N' | 'D') {
  if (r === 'V') return 'bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/30'
  if (r === 'N') return 'bg-slate-500/30 text-slate-100 ring-1 ring-slate-400/25'
  return 'bg-rose-500/30 text-rose-100 ring-1 ring-rose-400/30'
}

function fmtSeasonStat(n: number) {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1).replace('.', ',')
}

function normalizeStatToken(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function pickStatValue(
  rows: TeamSeasonStatRow[] | null | undefined,
  matchers: string[],
): number | null {
  if (!rows?.length) return null
  const hit = rows.find((r) => {
    const key = normalizeStatToken(r.key)
    const label = normalizeStatToken(r.label)
    return matchers.some((m) => key.includes(m) || label.includes(m))
  })
  return hit?.value ?? null
}

function roleBucketLabel(pos: string | undefined): 'Gardien' | 'Défense' | 'Milieu' | 'Attaque' | 'Effectif' {
  const s = (pos ?? '').toLowerCase()
  if (/goal|gardien|keeper|^gk\b/.test(s)) return 'Gardien'
  if (/defen|arrière|back|centre.?back|^cb\b|^lb\b|^rb\b/.test(s)) return 'Défense'
  if (/mid|milieu|wing.?back|^cm\b|^dm\b|^am\b/.test(s)) return 'Milieu'
  if (/attack|forward|striker|ailier|winger|^st\b|^cf\b|^lw\b|^rw\b/.test(s)) return 'Attaque'
  return 'Effectif'
}

function ClubScheduleMatchRow({ item }: { item: ClubScheduleListItem }) {
  const inner = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <ClubCrest
          id={item.homeCrest.id}
          shortName={item.homeCrest.shortName}
          colors={item.homeCrest.colors}
          logoUrl={item.homeLogoUrl}
          sportMonksTeamId={item.homeCrest.sportMonksTeamId}
          size={26}
          clickable={false}
          className="shrink-0 !rounded-full"
        />
        <p className="truncate text-[11px] font-bold text-sky-50">{item.homeName}</p>
      </div>
      <div className="text-center">
        {item.scoreLine ? (
          <p className="text-sm font-black tabular-nums text-amber-200">{item.scoreLine}</p>
        ) : (
          <p className="text-[10px] font-black uppercase text-sky-200/85">{item.venue === 'dom' ? 'DOM' : 'EXT'}</p>
        )}
        {item.result ? (
          <p
            className={cn(
              'mt-0.5 text-[9px] font-black',
              item.result === 'V' && 'text-emerald-300',
              item.result === 'N' && 'text-slate-300',
              item.result === 'D' && 'text-rose-300',
            )}
          >
            {item.result}
          </p>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <p className="truncate text-right text-[11px] font-bold text-sky-50">{item.awayName}</p>
        <ClubCrest
          id={item.awayCrest.id}
          shortName={item.awayCrest.shortName}
          colors={item.awayCrest.colors}
          logoUrl={item.awayLogoUrl}
          sportMonksTeamId={item.awayCrest.sportMonksTeamId}
          size={26}
          clickable={false}
          className="shrink-0 !rounded-full"
        />
      </div>
    </div>
  )
  if (!item.matchId) return inner
  return (
    <Link to={`/channel/${item.matchId}`} className={cn('block transition hover:brightness-110', TF_FOCUS_VISIBLE)}>
      {inner}
    </Link>
  )
}

function ClubSeasonSnapshotBlock({
  data,
  team,
  matchMode,
  scheduleHint,
  clubLastMatch,
  recentResults,
  calendarFixtures,
  standingsRows,
  standingsLeagueId,
  standingsLoading,
  standingsHint,
  seasonStatsRows,
  seasonStatsHint,
}: {
  data: ClubPageMock
  team: Team
  matchMode: boolean
  scheduleHint?: string | null
  clubLastMatch?: {
    opponent: string
    league: string
    kickoff: string
    venue: 'dom' | 'ext'
    scoreLine: string
    homeName: string
    awayName: string
    homeLogoUrl?: string
    awayLogoUrl?: string
    homeCrest: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
    awayCrest: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
  } | null
  recentResults: ClubScheduleListItem[]
  calendarFixtures: ClubScheduleListItem[]
  standingsRows: LeagueStandingRow[]
  standingsLeagueId: string
  standingsLoading?: boolean
  standingsHint?: string | null
  seasonStatsRows?: TeamSeasonStatRow[] | null
  seasonStatsHint?: string | null
}) {
  const { upcoming, formStrip, formStripFromApi } = data
  const apiPosition = pickStatValue(seasonStatsRows, ['position', 'rank', 'standing'])
  const apiPoints = pickStatValue(seasonStatsRows, ['points', 'point'])
  const ourStanding = standingsRows.find((r) => r.teamId === team.id)

  return (
    <Card
      id="club-hub"
      className={cn(
        'scroll-mt-24 p-0 shadow-tf-elev-2',
        encartClass('season'),
        matchMode && 'ring-1 ring-rose-500/15',
      )}
    >
      <div className="border-b border-sky-500/15 bg-black/15 p-3 sm:p-4">
        <ClubEncartTitle
          kicker="Sport"
          kickerClass="text-sky-200/90"
          subtitle="Résultats, classement, calendrier — données live quand disponibles."
        >
          Hub compétition
        </ClubEncartTitle>
      </div>
      <div className="space-y-4 p-3 sm:p-4">
        <section id="club-results" className="scroll-mt-24">
          <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Derniers résultats</p>
          <ul
            className="mt-1.5 flex flex-wrap gap-1.5"
            aria-label={formStripFromApi ? 'Cinq derniers matchs terminés' : 'Forme récente'}
          >
            {formStrip.map((r, i) => (
              <li
                key={`${r}-${i}`}
                className={cn('flex h-7 min-w-7 items-center justify-center rounded-lg text-[10px] font-black', formColor(r))}
              >
                {r}
              </li>
            ))}
          </ul>
          {recentResults.length > 0 ? (
            <ul className="mt-2 max-h-[min(280px,42vh)] space-y-1.5 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {recentResults.map((item) => (
                <li key={`res-${item.matchId}-${item.kickoffIso}`}>
                  <p className="mb-0.5 text-[10px] font-semibold text-sky-200/75">
                    {item.league} · {item.matchday} · {formatKickoff(item.kickoffIso)}
                  </p>
                  <ClubScheduleMatchRow item={item} />
                </li>
              ))}
            </ul>
          ) : clubLastMatch ? (
            <div className="mt-2">
              <p className="mb-0.5 text-[10px] font-semibold text-sky-200/75">
                {clubLastMatch.league} · {clubLastMatch.kickoff}
              </p>
              <ClubScheduleMatchRow
                item={{
                  matchId: '',
                  opponent: clubLastMatch.opponent,
                  kickoffIso: '',
                  league: clubLastMatch.league,
                  matchday: '—',
                  venue: clubLastMatch.venue,
                  scoreLine: clubLastMatch.scoreLine,
                  homeName: clubLastMatch.homeName,
                  awayName: clubLastMatch.awayName,
                  homeLogoUrl: clubLastMatch.homeLogoUrl,
                  awayLogoUrl: clubLastMatch.awayLogoUrl,
                  homeCrest: clubLastMatch.homeCrest,
                  awayCrest: clubLastMatch.awayCrest,
                }}
              />
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-sky-100/75">Aucun résultat récent disponible.</p>
          )}
        </section>

        <section id="club-standings" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Classement</p>
            {ourStanding || apiPosition != null || apiPoints != null ? (
              <p className="text-[11px] font-black text-white">
                {ourStanding
                  ? `${ourStanding.rank}e · ${ourStanding.points} pts`
                  : `${apiPosition != null ? `${Math.round(apiPosition)}e` : '—'} · ${
                      apiPoints != null ? `${Math.round(apiPoints)} pts` : '—'
                    }`}
              </p>
            ) : null}
          </div>
          {standingsLoading ? (
            <p className="mt-2 text-xs font-semibold text-sky-100/80">Chargement du classement…</p>
          ) : standingsRows.length > 0 ? (
            <div className="mt-2">
              <LeagueStandingsTable
                leagueId={standingsLeagueId}
                rows={standingsRows}
                highlightTeamId={team.id}
                compact
                dataSourceLabel="SportMonks"
              />
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-sky-100/75">
              {standingsHint ?? 'Classement indisponible pour ce championnat.'}
            </p>
          )}
        </section>

        <section id="club-calendar" className="scroll-mt-24">
          <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Calendrier</p>
          {upcoming?.opponent ? (
            <p className="mt-1 text-xs font-bold text-sky-100/90">
              Prochain : {upcoming.league} · {upcoming.matchday} —{' '}
              {upcoming.venue === 'dom' ? `reçoit ${upcoming.opponent}` : `@ ${upcoming.opponent}`} ·{' '}
              {upcoming.kickoff}
            </p>
          ) : null}
          {calendarFixtures.length > 0 ? (
            <ul className="mt-2 max-h-[min(280px,42vh)] space-y-1.5 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {calendarFixtures.map((item) => (
                <li key={`cal-${item.matchId}-${item.kickoffIso}`}>
                  <p className="mb-0.5 text-[10px] font-semibold text-sky-200/75">
                    {item.league} · {item.matchday} · {formatKickoff(item.kickoffIso)} ·{' '}
                    {item.venue === 'dom' ? 'Domicile' : 'Extérieur'}
                  </p>
                  <ClubScheduleMatchRow item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs font-semibold text-sky-100/75">Aucune rencontre à venir listée.</p>
          )}
          {scheduleHint ? (
            <p className="mt-2 text-[10px] font-semibold leading-snug text-amber-200/95 [text-wrap:pretty]">
              {scheduleHint}{' '}
              <Link
                to="/settings/donnees"
                className={cn('font-black text-amber-100 underline underline-offset-2', TF_FOCUS_VISIBLE)}
              >
                Réglages → Données
              </Link>
            </p>
          ) : null}
        </section>

        {seasonStatsRows?.length ? (
          <section>
            <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Stats saison</p>
            <ul className="mt-2 max-h-[min(180px,32vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
              {seasonStatsRows.slice(0, 14).map((r) => (
                <li
                  key={r.key}
                  className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1.5 text-[11px] last:border-0 last:pb-0"
                >
                  <span className="min-w-0 font-semibold leading-snug text-sky-100/90">{r.label}</span>
                  <span className="shrink-0 font-black tabular-nums text-white">{fmtSeasonStat(r.value)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {seasonStatsHint ? (
          <p className="text-[10px] font-semibold leading-snug text-amber-200/90 [text-wrap:pretty]">{seasonStatsHint}</p>
        ) : null}
      </div>
    </Card>
  )
}

function ClubReadingBlock({ links }: { links: ClubReadingLink[] }) {
  return (
    <Card className={cn('p-0 shadow-tf-elev-2', encartClass('reading'))}>
      <div className="border-b border-sky-400/20 bg-black/20 p-3 sm:p-4">
        <ClubEncartTitle
          kicker="Sources & contenus"
          kickerClass="text-sky-200/90"
          subtitle="Articles Talk Foot + liens externes reputes (sans copie integrale)."
        >
          A lire sur le club
        </ClubEncartTitle>
      </div>
      <ul className="space-y-2 p-3 sm:p-4">
        {links.length === 0 ? (
          <li className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-semibold text-sky-100/80">
            Aucun lien dedie pour ce club pour le moment.
          </li>
        ) : (
          links.map((item) => (
            <li key={item.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              {item.internal ? (
                <Link to={item.url} className="block">
                  <span className="inline-flex items-center rounded-md border border-sky-300/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-100/95">
                    {item.source}
                  </span>
                  <p className="mt-1.5 text-sm font-black leading-snug text-tf-app-fg hover:text-sky-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-sky-100/80">{item.excerpt}</p>
                </Link>
              ) : (
                <a href={item.url} target="_blank" rel="noreferrer noopener" className="block">
                  <span className="inline-flex items-center rounded-md border border-sky-300/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-sky-100/95">
                    {item.source}
                  </span>
                  <p className="mt-1.5 text-sm font-black leading-snug text-tf-app-fg hover:text-sky-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-sky-100/80">{item.excerpt}</p>
                </a>
              )}
            </li>
          ))
        )}
      </ul>
    </Card>
  )
}

export function ClubPageGrid({
  team,
  data,
  matchMode,
  clubGroups,
  clubScheduleHint,
  clubLastMatch,
  clubRecentResults = [],
  clubCalendarFixtures = [],
  clubStandingsRows = [],
  clubStandingsLeagueId = 'ligue-1',
  clubStandingsLoading = false,
  clubStandingsHint = null,
  squadFromSportMonks = false,
  smSquadPlayers = null,
  clubSeasonStats,
  clubSeasonStatsHint,
  clubReadingLinks,
}: {
  team: Team
  data: ClubPageMock
  matchMode: boolean
  clubGroups: SupporterGroup[]
  clubScheduleHint?: string | null
  clubLastMatch?: {
    opponent: string
    league: string
    kickoff: string
    venue: 'dom' | 'ext'
    scoreLine: string
    homeName: string
    awayName: string
    homeLogoUrl?: string
    awayLogoUrl?: string
    homeCrest: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
    awayCrest: {
      id: string
      shortName: string
      colors: { primary: string; secondary: string }
      sportMonksTeamId?: number
    }
  } | null
  clubRecentResults?: ClubScheduleListItem[]
  clubCalendarFixtures?: ClubScheduleListItem[]
  clubStandingsRows?: LeagueStandingRow[]
  clubStandingsLeagueId?: string
  clubStandingsLoading?: boolean
  clubStandingsHint?: string | null
  /** Noms sur le terrain alignés sur l’effectif API. */
  squadFromSportMonks?: boolean
  smSquadPlayers?: SmSquadPlayerRow[] | null
  clubSeasonStats?: TeamSeasonStatRow[] | null
  clubSeasonStatsHint?: string | null
  clubReadingLinks: ClubReadingLink[]
}) {
  const [shopPreview, setShopPreview] = useState<string | null>(null)

  const squadByRole = useMemo(() => {
    const players = smSquadPlayers?.length ? smSquadPlayers : []
    const order: Array<'Gardien' | 'Défense' | 'Milieu' | 'Attaque' | 'Effectif'> = [
      'Gardien',
      'Défense',
      'Milieu',
      'Attaque',
      'Effectif',
    ]
    const buckets = new Map<string, SmSquadPlayerRow[]>()
    for (const p of players) {
      const key = roleBucketLabel(p.position)
      const list = buckets.get(key) ?? []
      list.push(p)
      buckets.set(key, list)
    }
    for (const list of buckets.values()) {
      list.sort((a, b) => {
        const na = parseInt(a.number, 10)
        const nb = parseInt(b.number, 10)
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
        return a.label.localeCompare(b.label, 'fr')
      })
    }
    return order
      .map((label) => ({ label, players: buckets.get(label) ?? [] }))
      .filter((g) => g.players.length > 0)
  }, [smSquadPlayers])

  const flatSquad = useMemo(
    () => squadByRole.flatMap((g) => g.players.map((p) => ({ ...p, role: g.label }))),
    [squadByRole],
  )
  const [selPlayerId, setSelPlayerId] = useState<number | null>(null)
  const selectedPlayer =
    flatSquad.find((p) => p.playerSmId === selPlayerId) ?? flatSquad[0] ?? null

  useEffect(() => {
    if (!flatSquad.length) {
      setSelPlayerId(null)
      return
    }
    if (selPlayerId == null || !flatSquad.some((p) => p.playerSmId === selPlayerId)) {
      setSelPlayerId(flatSquad[0]!.playerSmId)
    }
  }, [flatSquad, selPlayerId])

  return (
    <div
      className={cn(
        'grid min-w-0 max-w-tf-wide grid-cols-1 gap-4 px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-4 lg:grid-cols-10 lg:items-start',
        'lg:gap-5',
      )}
    >
      <div className="min-w-0 space-y-4 lg:col-span-7">
        <ClubSeasonSnapshotBlock
          data={data}
          team={team}
          matchMode={matchMode}
          scheduleHint={clubScheduleHint}
          clubLastMatch={clubLastMatch}
          recentResults={clubRecentResults}
          calendarFixtures={clubCalendarFixtures}
          standingsRows={clubStandingsRows}
          standingsLeagueId={clubStandingsLeagueId}
          standingsLoading={clubStandingsLoading}
          standingsHint={clubStandingsHint}
          seasonStatsRows={clubSeasonStats}
          seasonStatsHint={clubSeasonStatsHint}
        />
        <Card
          id="club-squad"
          className={cn(
            'scroll-mt-24 overflow-hidden p-0 shadow-tf-elev-2',
            encartClass('pitch'),
            matchMode && 'ring-1 ring-rose-500/20',
          )}
        >
          <div className="border-b border-emerald-500/20 bg-black/20 p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Effectif SportMonks"
              kickerClass="text-emerald-200/90"
              subtitle={
                squadFromSportMonks
                  ? `Tous les joueurs du club, classés par poste — pas une compo de match. Tape un joueur pour l’agrandir.`
                  : `Effectif indisponible pour le moment.`
              }
            >
              Effectif {team.shortName}
            </ClubEncartTitle>
          </div>

          {selectedPlayer ? (
            <div className="border-b border-amber-400/20 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent px-3 py-3 sm:px-4">
              <div className="flex items-center gap-3">
                <SquadPlayerThumb
                  number={selectedPlayer.number}
                  photoUrl={selectedPlayer.photoUrl}
                  primary={team.colors.primary}
                  secondary={team.colors.secondary}
                  active
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-200/90">
                    {selectedPlayer.role}
                    {selectedPlayer.position ? ` · ${selectedPlayer.position}` : ''}
                  </p>
                  <p className="truncate text-lg font-black text-white sm:text-xl">{selectedPlayer.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-sky-100/75">
                    N°{selectedPlayer.number} · sélectionné
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {squadByRole.length > 0 ? (
            <div className="max-h-[min(520px,62vh)] space-y-4 overflow-y-auto overscroll-contain p-3 [scrollbar-width:thin] sm:p-4">
              {squadByRole.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200/90">
                      {group.label}
                    </p>
                    <p className="text-[10px] font-bold tabular-nums text-sky-200/70">
                      {group.players.length}
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
                    {group.players.map((p) => {
                      const active = selectedPlayer?.playerSmId === p.playerSmId
                      return (
                        <li key={p.playerSmId}>
                          <button
                            type="button"
                            onClick={() => setSelPlayerId(p.playerSmId)}
                            aria-pressed={active}
                            className={cn(
                              'tf-interactive-press flex w-full min-h-tf-touch items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
                              active
                                ? 'border-amber-400/60 bg-amber-500/15 shadow-[0_0_16px_rgba(251,191,36,0.18)] ring-1 ring-amber-300/35'
                                : 'border-white/10 bg-black/30 hover:border-emerald-400/30 hover:bg-white/[0.05]',
                              TF_FOCUS_VISIBLE,
                            )}
                          >
                            <SquadPlayerThumb
                              number={p.number}
                              photoUrl={p.photoUrl}
                              primary={team.colors.primary}
                              secondary={team.colors.secondary}
                              active={active}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-sky-50">{p.label}</span>
                              {p.position ? (
                                <span className="block truncate text-[10px] font-semibold text-sky-200/70">
                                  {p.position}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-6 sm:px-4">
              <p className="text-sm font-semibold text-sky-100/75">
                Effectif indisponible — les compos officielles de match restent sur la page live du match.
              </p>
            </div>
          )}
        </Card>

        <ClubDebatesBlock debates={data.debates} matchMode={matchMode} totalDebates={data.debates.length} />
        <ClubShopBlock
          items={data.shop}
          onPreview={setShopPreview}
          previewId={shopPreview}
          wallet={data.shopWallet}
        />
      </div>

      <div className="min-w-0 space-y-4 lg:col-span-3">
        <Card
          className={cn('overflow-hidden p-0 shadow-tf-elev-2', encartClass('tribune'), matchMode && 'ring-1 ring-rose-500/15')}
        >
          <div
            className="border-b border-violet-500/30 p-3"
            style={{
              background: `linear-gradient(125deg, color-mix(in srgb, ${team.colors.primary} 24%, rgba(8,10,30,0.95)) 0%, color-mix(in srgb, var(--tf-nav-groups) 28%, #05050f) 50%, color-mix(in srgb, ${team.colors.secondary} 14%, #06080f) 100%)`,
            }}
          >
            <ClubEncartTitle
              kicker="Tribune supporters"
              kickerClass="text-violet-200/90"
              subtitle={`Mêmes cartes qu’au hub — ancrées sur ${team.shortName}.`}
            >
              Tribunes &amp; groupes
            </ClubEncartTitle>
          </div>
          <ul className="max-h-[min(50vh,26rem)] space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
            {clubGroups.length === 0 ? (
              <li
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-semibold text-tf-app-muted"
              >
                Aucune tribune listée pour ce club — crée la tienne ou parcours les groupes.
              </li>
            ) : (
              clubGroups.map((g) => (
                <li key={g.id} className="min-w-0">
                  <TribuneShowcaseCard group={g} variant="rail" dense className="min-w-0" />
                </li>
              ))
            )}
          </ul>
          <div
            className={cn(
              'space-y-2 border-t p-3',
              'border-white/10 bg-[color:color-mix(in_srgb,#030712_88%,var(--tf-nav-groups)_4%)]',
            )}
          >
            <Link
              to="/groups"
              className={cn(
                'inline-flex w-full min-h-tf-touch items-center justify-center rounded-2xl border-2 font-display font-black',
                'border-tf-nav-groups/45 bg-tf-nav-groups/15 text-violet-100 transition hover:border-tf-nav-groups/60 hover:bg-tf-nav-groups/25',
                TF_FOCUS_VISIBLE,
              )}
            >
              Toutes les tribunes
            </Link>
            <Link
              to="/groups"
              className={cn(
                'inline-flex w-full min-h-tf-touch items-center justify-center rounded-2xl border border-white/15 text-sm font-bold text-tf-app-fg transition hover:bg-white/[0.08]',
                TF_FOCUS_VISIBLE,
              )}
            >
              + Créer un groupe
            </Link>
          </div>
        </Card>

        <Card className={cn('p-0 shadow-tf-elev-2', encartClass('stats'))}>
          <div className="p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Chiffres clés"
              kickerClass="text-teal-200/90"
              subtitle={`Engagement ${team.shortName} sur Talk Foot.`}
            >
              Stats communauté
            </ClubEncartTitle>
            {data.stats.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-sky-100/75">
                Pas encore d’activité mesurée — ouvre une tribune pour lancer le compteur.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {data.stats.map((s, i) => (
                  <div
                    key={`${s.label}-${i}`}
                    className={cn('rounded-2xl border p-2.5 pl-3 text-balance', statTileClass(i))}
                  >
                    <p className="text-[8px] font-black uppercase leading-tight tracking-wider text-sky-200/80">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-lg font-black leading-none text-white [text-shadow:0_1px_0_rgba(0,0,0,0.4)] sm:text-xl">
                      {s.value}
                    </p>
                    {s.sub ? <p className="mt-1 text-[9px] font-bold text-sky-200/75">{s.sub}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className={cn('p-0 shadow-tf-elev-2', encartClass('podium'))}>
          <div className="p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Podium tribunes"
              kickerClass="text-amber-200/90"
              subtitle={data.mvpTitle}
            >
              Top fans
            </ClubEncartTitle>
            {data.topFans.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-sky-100/75">
                Personne actif sur les tribunes {team.shortName} pour l’instant — sois le premier.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.topFans.map((f) => (
                  <li
                    key={`${f.rank}-${f.seed}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-amber-500/20 bg-amber-950/15 px-2.5 py-2.5 ring-1 ring-amber-500/10"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-amber-500/25 text-[10px] font-black text-amber-100">
                        {f.rank}
                      </span>
                      <Avatar seed={f.seed} className="!size-8 ring-1 ring-amber-400/25" />
                      <span className="truncate text-sm font-bold text-sky-50">{f.name}</span>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/[0.08] px-1.5 py-0.5 text-xs font-black text-sky-100/95">
                      {f.pts}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className={cn('p-0 shadow-tf-elev-2', encartClass('pulse'))}>
          <div className="p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Activité 24h"
              kickerClass="text-rose-200/90"
              subtitle={`Pulse ${team.shortName} · tribunes.`}
            >
              Pulse hub
            </ClubEncartTitle>
            {data.hubPulse.length === 0 ? (
              <p className="mt-3 text-xs font-semibold text-sky-100/75">Pulse en attente de messages.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.hubPulse.map((h) => (
                  <li
                    key={h.label}
                    className="flex items-baseline justify-between gap-2 rounded-2xl border border-tf-cta/25 bg-red-950/20 px-2.5 py-2.5 ring-1 ring-tf-cta/15"
                  >
                    <span className="min-w-0 text-[10px] font-black uppercase text-sky-200/80">{h.label}</span>
                    <span className="shrink-0 text-right">
                      <span className="text-sm font-black text-sky-50">{h.value}</span>
                      {h.sub ? (
                        <span className="ml-1.5 text-[10px] font-bold text-rose-200/90">{h.sub}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <ClubReadingBlock links={clubReadingLinks} />
      </div>
    </div>
  )
}
