import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TF_FOCUS_VISIBLE } from '../../theme/designSystem'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import type { Team } from '../../types/match'
import type { SupporterGroup } from '../../types/group'
import type { ClubDebateItem, ClubPageMock, ClubSquadNode, ClubShopItem } from '../../data/clubPageMock'
import type { TeamSeasonStatRow } from '../../api/sportMonks'
import { Card } from '../ui/Card'
import { TribuneShowcaseCard } from '../tribune/TribuneShowcaseCard'

function encartClass(
  key:
    | 'pitch'
    | 'debate'
    | 'shop'
    | 'season'
    | 'tribune'
    | 'stats'
    | 'podium'
    | 'pulse',
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

function PitchNode({
  p,
  selected,
  onSelect,
  hot,
  primary,
  secondary,
}: {
  p: ClubSquadNode
  selected: boolean
  onSelect: () => void
  hot: boolean
  primary: string
  secondary: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'tf-interactive-press absolute -translate-x-1/2 -translate-y-1/2',
        'flex size-10 sm:size-12 flex-col items-center justify-center rounded-full border-2 text-[9px] font-black text-white shadow-lg sm:text-[10px]',
        selected ? 'ring-2 ring-sky-400' : 'ring-1 ring-white/20',
        hot && 'ring-2 ring-amber-400/80',
      )}
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
      }}
    >
      <span className="text-[7px] font-bold opacity-90 sm:text-[8px]">#{p.number}</span>
      <span className="max-w-[2.4rem] truncate sm:max-w-[2.8rem]">{p.label.split('.')[0]}.</span>
    </button>
  )
}

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
          subtitle="Les pourcentages agrègent les avis (démo)."
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
                  Rejoindre le salon
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
          subtitle="Skins, badges, effets — aperçu sur ton avatar (démo)."
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
            Choisis un article pour simuler l’équipement visuel en tribune.
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

function ClubSeasonSnapshotBlock({
  data,
  team,
  matchMode,
  scheduleHint,
  clubLastMatch,
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
  } | null
  seasonStatsRows?: TeamSeasonStatRow[] | null
  seasonStatsHint?: string | null
}) {
  const { upcoming, formStrip, formStripFromApi, tableSnapshot, trophies } = data
  return (
    <Card
      className={cn('p-0 shadow-tf-elev-2', encartClass('season'), matchMode && 'ring-1 ring-rose-500/15')}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-sky-500/15 bg-black/15 p-3 sm:p-4">
        <ClubEncartTitle kicker="Calendrier" kickerClass="text-sky-200/90" subtitle="Aperçu compétition (démo).">
          Saison &amp; calendrier
        </ClubEncartTitle>
        <Link
          to="/match"
          className={cn(
            'shrink-0 rounded-lg border border-sky-400/25 bg-sky-500/15 px-2.5 py-1.5 text-xs font-black text-sky-100/95 transition hover:border-sky-400/40',
            TF_FOCUS_VISIBLE,
          )}
        >
          Agenda match
        </Link>
      </div>
      <div className="p-3 sm:p-4 sm:pt-3">
        <div
        className={cn(
          'grid gap-3 sm:grid-cols-2',
          'rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/12 to-slate-950/40 p-3 ring-1 ring-sky-500/10',
        )}
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Prochain match</p>
          <p className="mt-0.5 text-sm font-black text-tf-app-fg">
            {upcoming.league} · {upcoming.matchday}
          </p>
          <p className="mt-0.5 text-xs font-bold text-sky-100/85">
            {upcoming.venue === 'dom' ? (
              <span>
                {team.shortName} reçoit {upcoming.opponent}
              </span>
            ) : (
              <span>
                {upcoming.opponent} · {team.shortName} à l’extérieur
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-amber-200/90">Coup d’envoi {upcoming.kickoff}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/90">Forme (5 j.)</p>
          <ul
            className="mt-1.5 flex flex-wrap gap-1.5"
            aria-label={
              formStripFromApi
                ? 'Cinq derniers matchs terminés (SportMonks)'
                : 'Cinq derniers matchs, démo'
            }
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
          <p className="mt-2 text-[10px] font-bold text-sky-200/80">
            {formStripFromApi
              ? 'Résultats issus du calendrier équipe (SportMonks).'
              : 'Données génériques · hub Talk Foot'}
          </p>
        </div>
      </div>
      {clubLastMatch ? (
        <div className="mt-3 rounded-2xl border border-violet-500/25 bg-violet-500/10 p-3 ring-1 ring-violet-500/10">
          <p className="text-[9px] font-black uppercase tracking-wider text-violet-200/95">
            Dernier match (SportMonks)
          </p>
          <p className="mt-0.5 text-sm font-black text-tf-app-fg">
            {clubLastMatch.league}
          </p>
          <p className="mt-0.5 text-xs font-bold text-violet-100/90">
            {clubLastMatch.venue === 'dom' ? (
              <span>
                {team.shortName} {clubLastMatch.scoreLine} {clubLastMatch.opponent}
              </span>
            ) : (
              <span>
                {clubLastMatch.opponent} {clubLastMatch.scoreLine} {team.shortName}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-amber-200/90">{clubLastMatch.kickoff}</p>
        </div>
      ) : null}
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
      <div className="mt-3 flex flex-wrap gap-2">
        {trophies.map((t) => (
          <div
            key={t.label}
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-black/35 px-2.5 py-2 ring-1 ring-white/5 sm:min-w-[7rem] sm:flex-initial"
          >
            <p className="text-[8px] font-bold uppercase text-sky-200/80">{t.label}</p>
            <p className="text-sm font-black text-amber-100/95 [text-shadow:0_1px_0_rgba(0,0,0,0.5)]">{t.count}</p>
          </div>
        ))}
        <div className="min-w-full rounded-xl border border-amber-400/30 bg-amber-500/12 px-2.5 py-2 sm:min-w-0 sm:flex-1 sm:pl-3">
          <p className="text-[8px] font-bold uppercase text-amber-200/90">Championnat (démo)</p>
          <p className="text-sm font-black text-white [text-shadow:0_1px_0_rgba(0,0,0,0.45)]">
            {tableSnapshot.position} · {tableSnapshot.points}
          </p>
          <p className="text-[10px] font-semibold text-sky-200/80">{tableSnapshot.line}</p>
        </div>
      </div>
      {seasonStatsRows?.length ? (
        <div className="mt-3 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-3 ring-1 ring-sky-500/10">
          <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/95">
            Stats saison (SportMonks)
          </p>
          <ul className="mt-2 max-h-[min(200px,38vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
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
        </div>
      ) : null}
      {seasonStatsHint ? (
        <p className="mt-2 text-[10px] font-semibold leading-snug text-amber-200/90 [text-wrap:pretty]">
          {seasonStatsHint}
        </p>
      ) : null}
      </div>
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
  squadFromSportMonks,
  clubSeasonStats,
  clubSeasonStatsHint,
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
  } | null
  /** Noms sur le terrain alignés sur `squads/teams` (filtre stats saison optionnel). */
  squadFromSportMonks?: boolean
  clubSeasonStats?: TeamSeasonStatRow[] | null
  clubSeasonStatsHint?: string | null
}) {
  const [selId, setSelId] = useState(data.hotPlayerId)
  const [shopPreview, setShopPreview] = useState<string | null>(null)
  const selected = data.squad.find((p) => p.id === selId) ?? data.squad[0]

  return (
    <div
      className={cn(
        'grid min-w-0 max-w-tf-wide grid-cols-1 gap-4 px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-4 lg:grid-cols-10 lg:items-start',
        'lg:gap-5',
      )}
    >
      <div className="min-w-0 space-y-4 lg:col-span-7">
        <Card
          className={cn(
            'overflow-hidden p-0 shadow-tf-elev-2',
            encartClass('pitch'),
            matchMode && 'ring-1 ring-rose-500/20',
          )}
        >
          <div className="border-b border-emerald-500/20 bg-black/20 p-3 sm:p-4">
            <ClubEncartTitle
              kicker={squadFromSportMonks ? '11 titulaires (SportMonks)' : '11 titulaires (démo)'}
              kickerClass="text-emerald-200/90"
              subtitle={
                squadFromSportMonks
                  ? 'Noms et numéros depuis l’effectif API (ordre maillot sur la formation 4-3-3) — tape un nœud.'
                  : 'Formation 4-3-3 + gardien : onze joueurs — tape un nœud sur le terrain.'
              }
            >
              Effectif (interactif)
            </ClubEncartTitle>
          </div>
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4">
            <div
              className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl sm:min-h-[280px] lg:min-h-[320px]"
              style={{
                background: `
                radial-gradient(ellipse 80% 100% at 50% 100%, color-mix(in srgb, ${team.colors.primary} 18%, #064e1a) 0%, #052e1a 55%),
                linear-gradient(180deg, #0d4a2c 0%, #052a18 100%)
              `,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="pointer-events-none absolute left-[8%] right-[8%] top-[8%] bottom-[8%] opacity-30"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 14%)',
                }}
                aria-hidden
              />
              <p className="sr-only">Onze joueurs en 4-3-3 avec gardien, positions fictives, données communauté.</p>
              {data.squad.map((p) => (
                <PitchNode
                  key={p.id}
                  p={p}
                  selected={selId === p.id}
                  onSelect={() => setSelId(p.id)}
                  hot={p.id === data.hotPlayerId}
                  primary={team.colors.primary}
                  secondary={team.colors.secondary}
                />
              ))}
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-[14rem] sm:shrink-0">
              {selected ? (
                <div className="rounded-2xl border-2 border-emerald-400/35 bg-gradient-to-b from-emerald-500/20 to-slate-950/60 p-3.5 shadow-lg ring-1 ring-white/5">
                  <p className="text-[10px] font-black uppercase text-emerald-200/90">
                    #{selected.number} {selected.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-black text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                    Note {selected.rating}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-sky-100/90">
                    Débats, vocaux, réactions (mock) sur le joueur sélectionné.
                  </p>
                </div>
              ) : null}
              {selected ? (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-2.5 text-[10px]">
                  <p className="font-black uppercase tracking-wide text-sky-200/80">Aperçu social (démo)</p>
                  <dl className="mt-1.5 space-y-1 text-sky-100/90">
                    <div className="flex justify-between gap-2">
                      <dt className="text-sky-200/75">Réactions 7j</dt>
                      <dd className="font-black text-white">1,2K</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-sky-200/75">Citations</dt>
                      <dd className="font-black text-white">86</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-sky-200/75">Débats</dt>
                      <dd className="font-black text-white">14</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
              {data.hotPlayerId === selected?.id ? (
                <p className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[9px] font-black uppercase text-amber-200 [text-shadow:none]">
                  <span aria-hidden>🔥</span> Joueur le + débattu
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <ClubDebatesBlock debates={data.debates} matchMode={matchMode} totalDebates={data.debates.length} />
        <ClubShopBlock
          items={data.shop}
          onPreview={setShopPreview}
          previewId={shopPreview}
          wallet={data.shopWallet}
        />
        <ClubSeasonSnapshotBlock
          data={data}
          team={team}
          matchMode={matchMode}
          scheduleHint={clubScheduleHint}
          clubLastMatch={clubLastMatch}
          seasonStatsRows={clubSeasonStats}
          seasonStatsHint={clubSeasonStatsHint}
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
              kicker="Salon supporters"
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
              subtitle="Engagement Talk Foot (agrégat démo, pas en temps réel)."
            >
              Stats communauté
            </ClubEncartTitle>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {data.stats.map((s, i) => (
                <div
                  key={s.label}
                  className={cn('rounded-2xl border p-2.5 pl-3 text-balance', statTileClass(i))}
                >
                  <p className="text-[8px] font-black uppercase leading-tight tracking-wider text-sky-200/80">{s.label}</p>
                  <p className="mt-0.5 text-lg font-black leading-none text-white [text-shadow:0_1px_0_rgba(0,0,0,0.4)] sm:text-xl">
                    {s.value}
                  </p>
                  {s.sub ? <p className="mt-1 text-[9px] font-bold text-sky-200/75">{s.sub}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className={cn('p-0 shadow-tf-elev-2', encartClass('podium'))}>
          <div className="p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Podium hebdo"
              kickerClass="text-amber-200/90"
              subtitle={data.mvpTitle}
            >
              Top fans
            </ClubEncartTitle>
            <ul className="mt-3 space-y-2">
              {data.topFans.map((f) => (
                <li
                  key={f.rank}
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
          </div>
        </Card>

        <Card className={cn('p-0 shadow-tf-elev-2', encartClass('pulse'))}>
          <div className="p-3 sm:p-4">
            <ClubEncartTitle
              kicker="Activité 24h"
              kickerClass="text-rose-200/90"
              subtitle={`Focal ${team.shortName} · rafraîchissement démo.`}
            >
              Pulse hub
            </ClubEncartTitle>
            <ul className="mt-3 space-y-2">
              {data.hubPulse.map((h) => (
                <li
                  key={h.label}
                  className="flex items-baseline justify-between gap-2 rounded-2xl border border-tf-cta/25 bg-red-950/20 px-2.5 py-2.5 ring-1 ring-tf-cta/15"
                >
                  <span className="min-w-0 text-[10px] font-black uppercase text-sky-200/80">{h.label}</span>
                  <span className="shrink-0 text-right">
                    <span className="text-sm font-black text-sky-50">{h.value}</span>
                    {h.sub ? <span className="ml-1.5 text-[10px] font-bold text-rose-200/90">{h.sub}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[9px] font-bold leading-relaxed text-tf-app-subtle/95">
              Indicateurs de démonstration, non en temps réel.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
