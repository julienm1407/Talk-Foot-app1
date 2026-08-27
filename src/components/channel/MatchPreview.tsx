import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../../types/match'
import { formatKickoff } from '../../utils/time'
import { themeForCompetition } from '../../data/competitionThemes'
import { cn } from '../../utils/cn'
import { useSportMonksFixtureLineups } from '../../hooks/useSportMonksFixtureLineups'
import { useSportMonksTeamLatestFormPair } from '../../hooks/useSportMonksTeamLatestFormPair'
import type { SmLineupSource } from '../../api/sportMonks'
import type { FormResult } from '../../types/standings'

function useCountdown(kickoffAt: string) {
  const [diff, setDiff] = useState(() => {
    const ms = new Date(kickoffAt).getTime() - Date.now()
    return Math.max(0, ms)
  })
  useEffect(() => {
    const id = setInterval(() => {
      const ms = new Date(kickoffAt).getTime() - Date.now()
      setDiff(Math.max(0, ms))
    }, 1000)
    return () => clearInterval(id)
  }, [kickoffAt])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s, totalMs: diff }
}

function formFor(teamId: string): string[] {
  const seed = teamId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const out: string[] = []
  for (let i = 0; i < 5; i++) {
    const r = ((seed * (i + 1) * 7919) >>> 0) % 3
    out.push(r === 0 ? 'W' : r === 1 ? 'D' : 'L')
  }
  return out.reverse()
}

const MOCK_LINEUP = [
  ['M. Neuer', 'J. Kimmich', 'L. Hernández', 'D. Upamecano'],
  ['J. Rodri', 'K. De Bruyne', 'B. Silva', 'Phil Foden'],
  ['Courtois', 'Carvajal', 'Rüdiger', 'Alaba'],
  ['Donnarumma', 'Hakimi', 'Marquinhos', 'Ramos'],
  ['Ramsdale', 'Saliba', 'Gabriel', 'Zinchenko'],
]
function lineupFor(teamId: string): string[] {
  const idx =
    Math.abs(
      teamId.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
    ) % MOCK_LINEUP.length
  return MOCK_LINEUP[idx]
}

const STADIUMS: Record<string, string> = {
  psg: 'Parc des Princes',
  om: 'Orange Vélodrome',
  monaco: 'Stade Louis-II',
  rma: 'Santiago Bernabéu',
  fcb: 'Spotify Camp Nou',
  bay: 'Allianz Arena',
  bvb: 'Signal Iduna Park',
  mci: 'Etihad Stadium',
  liv: 'Anfield',
  lyon: 'Groupama Stadium',
  lille: 'Decathlon Arena',
  rennes: 'Roazhon Park',
}

function lineupSourceLabel(source: SmLineupSource): string {
  switch (source) {
    case 'confirmed':
      return 'Compos officielles'
    case 'probable':
      return 'Compos probables'
    case 'estimated':
      return 'Projection (données partielles)'
    default:
      return 'Composition'
  }
}

export function MatchPreview({
  match,
  trendRecentForm: trendRecentFormProp,
  trendsLoading: trendsHookLoading,
}: {
  match: Match
  /** Même source que le bandeau « Tendances » de la tribune (`extractSmRecentFormFromFixture` sur trends fixture). */
  trendRecentForm?: { home: FormResult[]; away: FormResult[] } | null
  trendsLoading?: boolean
}) {
  const countdown = useCountdown(match.kickoffAt)
  const theme = themeForCompetition(match.competition.id)
  const homeForm = formFor(match.home.id ?? match.home.shortName)
  const awayForm = formFor(match.away.id ?? match.away.shortName)
  const smId = match.sportMonksFixtureId
  const { starters: smStarters, formations, lineupSource, recentForm: lineupRecentForm, lineupsLoading } =
    useSportMonksFixtureLineups(smId, match.status)

  const useSmApi = Boolean(smId)
  const trendsWaiting = Boolean(trendsHookLoading)

  const trendRecent = trendRecentFormProp ?? null

  const hasPrimaryForm = Boolean(
    (trendRecent?.home?.length || trendRecent?.away?.length) ||
      (lineupRecentForm?.home?.length || lineupRecentForm?.away?.length),
  )

  const useTeamFormFallback = Boolean(
    useSmApi &&
      match.home.sportMonksTeamId != null &&
      match.away.sportMonksTeamId != null &&
      !lineupsLoading &&
      !trendsWaiting &&
      !hasPrimaryForm,
  )

  const { teamPairForm, teamPairFormLoading } = useSportMonksTeamLatestFormPair(match, useTeamFormFallback)

  const resolvedRecent = useMemo(() => {
    if (trendRecent?.home?.length || trendRecent?.away?.length) return trendRecent
    if (lineupRecentForm?.home?.length || lineupRecentForm?.away?.length) return lineupRecentForm
    if (teamPairForm?.home?.length || teamPairForm?.away?.length) return teamPairForm
    return null
  }, [trendRecent, lineupRecentForm, teamPairForm])

  const formSource = useMemo(() => {
    if (trendRecent?.home?.length || trendRecent?.away?.length) return 'trends' as const
    if (lineupRecentForm?.home?.length || lineupRecentForm?.away?.length) return 'lineups' as const
    if (teamPairForm?.home?.length || teamPairForm?.away?.length) return 'teams' as const
    return null
  }, [trendRecent, lineupRecentForm, teamPairForm])

  const homeFormChips = useMemo((): FormResult[] => {
    if (resolvedRecent?.home?.length) return resolvedRecent.home
    if (!useSmApi) return homeForm as FormResult[]
    return []
  }, [resolvedRecent, useSmApi, homeForm])

  const awayFormChips = useMemo((): FormResult[] => {
    if (resolvedRecent?.away?.length) return resolvedRecent.away
    if (!useSmApi) return awayForm as FormResult[]
    return []
  }, [resolvedRecent, useSmApi, awayForm])

  const hasSmForm = Boolean(resolvedRecent?.home?.length || resolvedRecent?.away?.length)

  const formBlockLoading = lineupsLoading || trendsWaiting || teamPairFormLoading

  const homeLineup = useMemo(() => {
    if (smStarters?.home?.length) return smStarters.home
    return null
  }, [smStarters])

  const awayLineup = useMemo(() => {
    if (smStarters?.away?.length) return smStarters.away
    return null
  }, [smStarters])

  const hasLineups = Boolean(homeLineup?.length || awayLineup?.length)
  const hasFormations = Boolean(formations.home || formations.away)

  const homeFallbackNames = lineupFor(match.home.id ?? match.home.shortName)
  const awayFallbackNames = lineupFor(match.away.id ?? match.away.shortName)

  const homeDisplay = hasLineups
    ? homeLineup!
    : useSmApi
      ? []
      : homeFallbackNames.slice(0, 4)
  const awayDisplay = hasLineups
    ? awayLineup!
    : useSmApi
      ? []
      : awayFallbackNames.slice(0, 4)

  const formColor = (r: FormResult) =>
    r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Coup d'envoi
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tabular-nums text-slate-900">
            {formatKickoff(match.kickoffAt)}
          </span>
          <span className="text-sm font-semibold text-slate-600">
            {new Date(match.kickoffAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>
        {countdown.totalMs > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Dans</span>
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-black tabular-nums text-slate-900">
              {String(countdown.h).padStart(2, '0')}:
              {String(countdown.m).padStart(2, '0')}:
              {String(countdown.s).padStart(2, '0')}
            </span>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Forme (récente)
          </h3>
          {formBlockLoading ? (
            <span className="text-[10px] font-semibold text-slate-400">Chargement…</span>
          ) : hasSmForm ? (
            <span className="text-[10px] font-bold text-emerald-600">
              SportMonks
              {formSource === 'trends' ? ' · tendances' : formSource === 'lineups' ? ' · compos' : ' · derniers matchs'}
            </span>
          ) : useSmApi ? (
            <span className="text-[10px] font-medium text-slate-400">Pas de forme disponible</span>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] font-medium text-slate-400">
          {hasSmForm
            ? formSource === 'teams'
              ? 'Séquence comme sur la fiche club (derniers matchs terminés via API équipe).'
              : formSource === 'trends'
                ? 'Séquence issue des tendances fixture (même flux que le bandeau Tendances de la tribune).'
                : 'Séquence issue des tendances embarquées avec les compos SportMonks.'
            : useSmApi
              ? 'Aucune donnée « forme » sur ce match pour l’instant — le bandeau Tendances de la tribune peut quand même afficher d’autres signaux.'
              : 'Illustration locale — branche SportMonks pour la vraie forme.'}
        </p>
        <div className="mt-3 flex justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800">
              {match.home.shortName}
            </div>
            <div className="mt-1.5 flex min-h-[1.5rem] flex-wrap gap-1">
              {formBlockLoading ? (
                <span className="inline-flex gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
                  ))}
                </span>
              ) : homeFormChips.length ? (
                homeFormChips.map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white',
                      formColor(r),
                    )}
                    title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-xs font-semibold text-slate-400">—</span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="text-xs font-bold text-slate-800">
              {match.away.shortName}
            </div>
            <div className="mt-1.5 flex min-h-[1.5rem] justify-end gap-1">
              {formBlockLoading ? (
                <span className="inline-flex gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
                  ))}
                </span>
              ) : awayFormChips.length ? (
                awayFormChips.map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white',
                      formColor(r),
                    )}
                    title={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
                  >
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-xs font-semibold text-slate-400">—</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasFormations ? (
        <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Systèmes (SportMonks)
            </h3>
            {lineupsLoading ? (
              <span className="text-[10px] font-semibold text-slate-400">Mise à jour…</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {match.home.shortName}
              </div>
              <p className="mt-1 font-display text-xl font-black tabular-nums text-slate-900">
                {formations.home ?? '—'}
              </p>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {match.away.shortName}
              </div>
              <p className="mt-1 font-display text-xl font-black tabular-nums text-slate-900">
                {formations.away ?? '—'}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            {useSmApi ? lineupSourceLabel(lineupSource) : 'Compos probables'}
          </h3>
          {lineupsLoading ? (
            <span className="text-[10px] font-semibold text-slate-400">Chargement…</span>
          ) : useSmApi && (hasLineups || hasFormations) ? (
            <span className="text-[10px] font-bold text-emerald-600">SportMonks</span>
          ) : null}
        </div>
        {useSmApi && !lineupsLoading && !hasLineups ? (
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500">
            Aucune ligne de compos publiée pour ce match pour l’instant (officiel ~1 h avant le coup d’envoi, ou
            option « expected lineups » selon ton plan SportMonks).
          </p>
        ) : null}
        {homeDisplay.length > 0 || awayDisplay.length > 0 ? (
          <div className="mt-3 space-y-2">
            {homeDisplay.map((item, i) => {
              const label = typeof item === 'string' ? item : item.label
              const num = typeof item === 'string' ? undefined : item.number
              return (
                <div key={`h-${i}`} className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: `${match.home.colors.primary}50` }}
                  />
                  {num ? (
                    <span className="w-6 shrink-0 text-xs font-black tabular-nums text-slate-500">{num}</span>
                  ) : null}
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                </div>
              )
            })}
            <div className="my-2 border-t border-dashed border-slate-200/70" />
            {awayDisplay.map((item, i) => {
              const label = typeof item === 'string' ? item : item.label
              const num = typeof item === 'string' ? undefined : item.number
              return (
                <div key={`a-${i}`} className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: `${match.away.colors.primary}50` }}
                  />
                  {num ? (
                    <span className="w-6 shrink-0 text-xs font-black tabular-nums text-slate-500">{num}</span>
                  ) : null}
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                </div>
              )
            })}
          </div>
        ) : null}
        {!useSmApi ? (
          <p className="mt-2 text-[10px] font-medium text-slate-400">Démo locale — branche une clé SportMonks pour les vrais effectifs.</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Infos
        </h3>
        <div className="mt-2 space-y-1.5 text-sm font-medium text-slate-700">
          <p>
            Stade :{' '}
            {STADIUMS[match.home.id ?? ''] ?? 'Stade du match'}
          </p>
          <p>Diffusion : Canal+ Sport, beIN Sports</p>
          {theme && (
            <div
              className="mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
              style={{
                backgroundColor: `${theme.accent}18`,
                color: theme.accent,
              }}
            >
              {match.competition.name}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
